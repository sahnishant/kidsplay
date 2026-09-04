export interface LearnAboutKnowledgeRow {
  rowId: string;
  subjectLabel: string;
  subjectSymbol?: string;
  relation: string;
  objectLabel: string;
  conceptIds: readonly string[];
  sourceSetId: string;
}

interface RawKnowledgeSet {
  id: string;
  entries: unknown[];
  authoring?: { status?: string };
}

const knowledgeModules = import.meta.glob('../../content/knowledge/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asKnowledgeSets(value: unknown): RawKnowledgeSet[] {
  const candidates = Array.isArray(value) ? value : [value];
  return candidates.flatMap((candidate) => {
    if (!isRecord(candidate) || typeof candidate.id !== 'string' || !Array.isArray(candidate.entries)) return [];
    const authoring = isRecord(candidate.authoring)
      ? { status: typeof candidate.authoring.status === 'string' ? candidate.authoring.status : undefined }
      : undefined;
    return [{ id: candidate.id, entries: candidate.entries, ...(authoring ? { authoring } : {}) }];
  });
}

function parseRow(value: unknown, sourceSetId: string): LearnAboutKnowledgeRow | null {
  if (!isRecord(value) || typeof value.rowId !== 'string' || !value.rowId.trim()) return null;
  if (!isRecord(value.subject) || typeof value.subject.label !== 'string') return null;
  if (!isRecord(value.object) || typeof value.object.label !== 'string') return null;
  if (typeof value.relation !== 'string' || !value.relation.trim()) return null;

  const conceptIds = Array.isArray(value.conceptIds)
    ? value.conceptIds.filter((conceptId): conceptId is string => typeof conceptId === 'string')
    : [];
  const subjectSymbol = typeof value.subject.symbol === 'string' ? value.subject.symbol : undefined;

  return {
    rowId: value.rowId,
    subjectLabel: value.subject.label,
    ...(subjectSymbol ? { subjectSymbol } : {}),
    relation: value.relation,
    objectLabel: value.object.label,
    conceptIds,
    sourceSetId
  };
}

const authoritativeRows = new Map<string, LearnAboutKnowledgeRow>();
for (const moduleValue of Object.values(knowledgeModules)) {
  for (const set of asKnowledgeSets(moduleValue)) {
    if (set.authoring?.status !== 'reviewed') continue;
    for (const rawRow of set.entries) {
      const row = parseRow(rawRow, set.id);
      if (!row || authoritativeRows.has(row.rowId)) continue;
      authoritativeRows.set(row.rowId, row);
    }
  }
}

export function isAuthoritativeLearnAboutKnowledgeRef(rowId: string): boolean {
  return authoritativeRows.has(rowId);
}

export function getAuthoritativeLearnAboutKnowledgeRow(rowId: string): LearnAboutKnowledgeRow | undefined {
  return authoritativeRows.get(rowId);
}

export function resolveAuthoritativeLearnAboutKnowledgeRows(
  rowIds: readonly string[]
): LearnAboutKnowledgeRow[] {
  return rowIds.flatMap((rowId) => {
    const row = authoritativeRows.get(rowId);
    return row ? [row] : [];
  });
}

export function getAuthoritativeLearnAboutKnowledgeRefs(): ReadonlySet<string> {
  return new Set(authoritativeRows.keys());
}

const RELATION_LABELS: Readonly<Record<string, string>> = {
  is_a: 'is a',
  lives_in: 'lives in',
  has_property: 'is',
  has_feature: 'has',
  comes_from: 'comes from',
  causes: 'causes',
  known_as: 'is known as',
  also_called: 'is also called',
  water_source: '—',
  need: 'need',
  needs: 'needs',
  characteristic: 'can',
  function: '—',
  role: '—'
};

/** Grammar only. The subject/object labels and relationship remain owned by the canonical row. */
export function learnAboutRelationLabel(relation: string): string {
  return RELATION_LABELS[relation] ?? relation.replaceAll('_', ' ');
}
