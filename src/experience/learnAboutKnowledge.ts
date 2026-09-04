import animalHomesUrl from '../../content/knowledge/animal-homes.json?url';
import animalYoungOnesUrl from '../../content/knowledge/animal-young-ones.json?url';
import earthUniverseUrl from '../../content/knowledge/class2-earth-universe.json?url';

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

const BOUNDED_LEARN_ABOUT_KNOWLEDGE_URLS = [earthUniverseUrl, animalHomesUrl, animalYoungOnesUrl] as const;

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

/** Pure extractor shared by production loading and contract tests. */
export function extractReviewedLearnAboutKnowledge(sources: readonly unknown[]): LearnAboutKnowledgeRow[] {
  const rows = new Map<string, LearnAboutKnowledgeRow>();
  for (const source of sources) {
    for (const set of asKnowledgeSets(source)) {
      if (set.authoring?.status !== 'reviewed') continue;
      for (const rawRow of set.entries) {
        const row = parseRow(rawRow, set.id);
        if (row && !rows.has(row.rowId)) rows.set(row.rowId, row);
      }
    }
  }
  return [...rows.values()];
}

let knowledgePromise: Promise<readonly LearnAboutKnowledgeRow[]> | null = null;

/** Loads the reviewed source files from packaged/local Vite assets; no network service is required. */
export function loadReviewedLearnAboutKnowledge(): Promise<readonly LearnAboutKnowledgeRow[]> {
  knowledgePromise ??= Promise.all(BOUNDED_LEARN_ABOUT_KNOWLEDGE_URLS.map(async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Learn About canonical knowledge could not be loaded (${response.status})`);
    return response.json() as Promise<unknown>;
  })).then((sources) => extractReviewedLearnAboutKnowledge(sources));
  return knowledgePromise;
}

export function indexLearnAboutKnowledge(rows: readonly LearnAboutKnowledgeRow[]): ReadonlyMap<string, LearnAboutKnowledgeRow> {
  return new Map(rows.map((row) => [row.rowId, row]));
}

const RELATION_LABELS: Readonly<Record<string, string>> = {
  is_a: 'is a',
  lives_in: 'lives in',
  comes_from: 'comes from',
  causes: 'causes',
  known_as: 'is known as',
  also_called: 'is also called',
  has_feature: 'has',
  has_property: 'is'
};

export function learnAboutRelationLabel(relation: string): string {
  return RELATION_LABELS[relation] ?? relation.replaceAll('_', ' ');
}
