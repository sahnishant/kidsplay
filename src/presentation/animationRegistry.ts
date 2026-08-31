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

/**
 * Resolve a semantic state without exposing renderer/art-source details to
 * questions or engines. Exact state matches win; missing state dimensions
 * gracefully fall back to the closest composition for the same identity.
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

  if (query.expression !== undefined) {
    const expressionMatch = candidates.find(
      (composition) => composition.subject.expression === query.expression
    );
    if (expressionMatch) return expressionMatch;
  }

  if (query.pose !== undefined) {
    const poseMatch = candidates.find((composition) => composition.subject.pose === query.pose);
    if (poseMatch) return poseMatch;
  }

  return candidates[0] ?? null;
}

export function getAnimationCompositions(): AnimationComposition[] {
  return compositions.map((composition) => ({
    ...composition,
    subject: { ...composition.subject },
    parts: composition.parts.map((part) => ({ ...part }))
  }));
}
