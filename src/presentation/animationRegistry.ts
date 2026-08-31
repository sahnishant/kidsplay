import type {
  AnimationComposition,
  AnimationStateQuery
} from './animationTypes';

const animationModules = import.meta.glob('../../content/animations/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, unknown>;

const compositions = Object.values(animationModules)
  .flatMap((value) => (Array.isArray(value) ? (value as AnimationComposition[]) : []));

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
  // Expression is the strongest authored state signal, then pose, then backdrop/context.
  if (query.expression !== undefined && composition.subject.expression === query.expression) score += 4;
  if (query.pose !== undefined && composition.subject.pose === query.pose) score += 2;
  if (query.theme !== undefined && composition.theme === query.theme) score += 1;
  return score;
}

/**
 * Resolve a semantic state without exposing renderer/art-source details to
 * questions or engines. Exact state matches win; otherwise the closest authored
 * state for the same identity wins. Authoring order is only the final tie-breaker.
 */
export function resolveAnimationForState(query: AnimationStateQuery): AnimationComposition | null {
  const candidates = bySemanticRef.get(query.semanticRef) ?? [];
  if (!candidates.length) return null;

  const exact = candidates.find((composition) =>
    (query.expression === undefined || composition.subject.expression === query.expression) &&
    (query.pose === undefined || composition.subject.pose === query.pose) &&
    (query.theme === undefined || composition.theme === query.theme)
  );
  if (exact) return exact;

  const ranked = candidates
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
