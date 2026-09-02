type SemanticDepthPack = {
  reasoningPatterns?: Array<{
    id?: string;
    type?: string;
  }>;
};

const modules = import.meta.glob('../../content/semantic-knowledge/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, SemanticDepthPack>;

const patternTypeById = new Map<string, string>();

for (const [path, pack] of Object.entries(modules).sort(([left], [right]) => left.localeCompare(right))) {
  for (const pattern of pack.reasoningPatterns ?? []) {
    const id = String(pattern?.id ?? '').trim();
    const type = String(pattern?.type ?? '').trim();
    if (!id || !type) continue;
    if (patternTypeById.has(id)) throw new Error(`${path}: duplicate semantic depth pattern id ${id}`);
    patternTypeById.set(id, type);
  }
}

export function resolveSemanticDepthMode(patternRefs: string[]): string | null {
  for (const patternRef of patternRefs) {
    const type = patternTypeById.get(patternRef);
    if (type) return type;
  }
  return null;
}

export function getSemanticDepthPatternTypes(): ReadonlyMap<string, string> {
  return patternTypeById;
}
