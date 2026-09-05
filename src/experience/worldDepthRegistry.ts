import {
  getForestWorldDepthAdventure,
  type ForestAdventureStep
} from '../forest/forestWorldDepth';
import type { ProgressSnapshot } from '../runtime/localProgress';
import {
  getTownWorldDepthAdventure,
  selectTownAdaptiveReview,
  type TownAdaptiveReviewSelection,
  type TownAdventureStep
} from '../town/townWorldDepth';

export type WorldDepthAdventureStep = ForestAdventureStep | TownAdventureStep;

export interface ResolvedWorldDepthAdventure {
  schemaVersion: 1;
  adventureRef: string;
  level: number;
  title: string;
  worldProblem: string;
  characterSetup: string;
  ending: string;
  nextStateLabel: string;
  persistentChangeId: string;
  sourceEventRefs: readonly string[];
  steps: readonly WorldDepthAdventureStep[];
  worldLabel: string;
  locationRef: string;
  adaptiveReviewStepId?: string;
  adaptiveReview?: TownAdaptiveReviewSelection;
}

/**
 * One bounded resolver feeds the existing world-action viewport. Adding a location
 * here does not create a location-specific evaluator or progress store.
 */
export function getWorldDepthAdventure(
  adventureRef: string,
  progress?: ProgressSnapshot
): ResolvedWorldDepthAdventure {
  if (adventureRef.startsWith('forest.')) {
    return {
      ...getForestWorldDepthAdventure(adventureRef),
      worldLabel: 'Forest',
      locationRef: 'forest'
    };
  }
  if (adventureRef.startsWith('town.')) {
    const adventure = getTownWorldDepthAdventure(adventureRef);
    return {
      ...adventure,
      worldLabel: 'Town Square',
      locationRef: 'town-square',
      adaptiveReviewStepId: adventure.adaptiveReviewPlan.stepId,
      adaptiveReview: selectTownAdaptiveReview(adventureRef, progress)
    };
  }
  throw new Error(`Unknown world-depth adventure ${adventureRef}`);
}
