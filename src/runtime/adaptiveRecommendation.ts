import type { AdaptiveRouteKind, AdaptiveRoutingContext } from './adaptiveRouting';
import { decideAdaptiveExperience } from './adaptiveRouting';

export type AdaptiveRecommendationSurface = 'play' | 'learn_about';

export interface AdaptiveRecommendationProjection {
  surface: AdaptiveRecommendationSurface;
  reason: Exclude<AdaptiveRouteKind, 'continue_world' | 'new_frontier'>;
  questionId: string;
  conceptId: string | null;
}

/**
 * Read-only cross-surface projection. Play and Learn About consume the same
 * routing inputs/reasons; this does not create surface-specific mastery state.
 */
export function projectAdaptiveRecommendation(
  surface: AdaptiveRecommendationSurface,
  context: AdaptiveRoutingContext
): AdaptiveRecommendationProjection | null {
  const decision = decideAdaptiveExperience(context);
  const questionId = decision.questionIds[0];
  if (!questionId || decision.kind === 'continue_world' || decision.kind === 'new_frontier') return null;
  return {
    surface,
    reason: decision.kind,
    questionId,
    conceptId: decision.conceptId
  };
}
