import type {
  AnimationComposition,
  AnimationPartRole,
  AnimationPartVisualQuery,
  AnimationStateQuery
} from './animationTypes';

const animationModules = import.meta.glob('../../content/animations/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, unknown>;

// Make cross-file state order an explicit content contract rather than relying
// on bundler/object enumeration. Authored order inside each file is preserved.
const compositions = Object.entries(animationModules)
  .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
  .flatMap(([, value]) => (Array.isArray(value) ? (value as AnimationComposition[]) : []));

const byId = new Map(compositions.map((composition) => [composition.id, composition]));
const bySemanticRef = new Map<string, AnimationComposition[]>();

for (const composition of compositions) {
  const existing = bySemanticRef.get(composition.semanticRef) ?? [];
  existing.push(composition);
  bySemanticRef.set(composition.semanticRef, existing);
}

export function resolveAnimationComposition(animationId: string): AnimationComposition | null {
  return byId.get(animationId) ?? null;
}

function stateMatchScore(composition: AnimationComposition, query: AnimationStateQuery): number {
  let score = 0;
  // Stronger semantic state signals dominate weaker presentation context signals.
  if (query.expression !== undefined && composition.subject.expression === query.expression) score += 8;
  if (query.pose !== undefined && composition.subject.pose === query.pose) score += 4;
  if (query.orientation !== undefined && composition.subject.orientation === query.orientation) score += 2;
  if (query.theme !== undefined && composition.theme === query.theme) score += 1;
  return score;
}

function roleHasAllVisualRefs(
  composition: AnimationComposition,
  role: AnimationPartRole,
  visualRefs: string[]
): boolean {
  return visualRefs.every((visualRef) =>
    composition.parts.some((part) => part.role === role && part.visualRef === visualRef)
  );
}

function matchesRequestedParts(
  composition: AnimationComposition,
  partVisualRefs?: AnimationPartVisualQuery
): boolean {
  if (!partVisualRefs) return true;
  return (Object.entries(partVisualRefs) as Array<[AnimationPartRole, string[] | undefined]>)
    .every(([role, visualRefs]) => !visualRefs?.length || roleHasAllVisualRefs(composition, role, visualRefs));
}

/**
 * Resolve a semantic state without exposing renderer/art-source details to
 * questions or engines. Exact state matches win. Requested semantic part refs
 * constrain fallback when that authored combination exists; if it does not,
 * fallback remains inside the same identity and ranks the remaining state cues.
 */
export function resolveAnimationForState(query: AnimationStateQuery): AnimationComposition | null {
  const candidates = bySemanticRef.get(query.semanticRef) ?? [];
  if (!candidates.length) return null;

  const exact = candidates.find((composition) =>
    (query.expression === undefined || composition.subject.expression === query.expression) &&
    (query.pose === undefined || composition.subject.pose === query.pose) &&
    (query.orientation === undefined || composition.subject.orientation === query.orientation) &&
    (query.theme === undefined || composition.theme === query.theme) &&
    matchesRequestedParts(composition, query.partVisualRefs)
  );
  if (exact) return exact;

  const partCompatible = query.partVisualRefs
    ? candidates.filter((composition) => matchesRequestedParts(composition, query.partVisualRefs))
    : candidates;
  const fallbackPool = partCompatible.length ? partCompatible : candidates;
  const ranked = fallbackPool
    .map((composition, index) => ({ composition, index, score: stateMatchScore(composition, query) }))
    .sort((left, right) => right.score - left.score || left.index - right.index);

  return ranked[0]?.composition ?? null;
}

export function getAnimationCompositions(): AnimationComposition[] {
  return compositions.map((composition) => ({
    ...composition,
    subject: { ...composition.subject },
    parts: composition.parts.map((part) => ({ ...part }))
  }));
}
