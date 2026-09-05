import townWorldDepthJson from '../../content/town/world-depth.json';
import {
  validateWorldActionDefinition,
  type WorldActionDefinition
} from '../experience/worldActionContract';
import {
  validateAssemblyDefinition,
  type AssemblyDefinition
} from '../mechanics/assembly';
import type { ProgressSnapshot, StoredAttempt } from '../runtime/localProgress';

export type TownWorldDepthLevel = 2;
export type TownInteractionFamily = 'assemble_repair' | 'guided_sequence' | 'practical_life' | 'cause_effect';
export type TownSemanticDomain = 'crossing_safety' | 'community_sorting' | 'community_help' | 'town_infrastructure';

export interface TownAdventureStep {
  id: string;
  interactionFamily: TownInteractionFamily;
  semanticDomain: TownSemanticDomain;
  icon: string;
  title: string;
  actionLabel: string;
  prompt: string;
  instruction: string;
  consequence: string;
  scaffold: string;
  worldObjectBefore: string;
  worldObjectAfter: string;
  guidedStages?: readonly string[];
  worldAction: WorldActionDefinition;
  assembly?: AssemblyDefinition;
}

export interface TownAdaptiveReviewCandidate {
  knowledgeRef: string;
  cue: string;
  scaffold: string;
}

export interface TownAdaptiveReviewPlan {
  stepId: string;
  candidates: readonly TownAdaptiveReviewCandidate[];
}

export type TownAdaptiveReviewReason = 'recovery' | 'assisted' | 'lower_confidence' | 'first_visit';

export interface TownAdaptiveReviewSelection extends TownAdaptiveReviewCandidate {
  reason: TownAdaptiveReviewReason;
}

export interface TownWorldDepthAdventure {
  schemaVersion: 1;
  adventureRef: string;
  level: TownWorldDepthLevel;
  title: string;
  worldProblem: string;
  characterSetup: string;
  ending: string;
  nextStateLabel: string;
  persistentChangeId: string;
  sourceEventRefs: readonly string[];
  adaptiveReviewPlan: TownAdaptiveReviewPlan;
  steps: readonly TownAdventureStep[];
}

interface TownWorldDepthDocument {
  schemaVersion: 1;
  adventures: TownWorldDepthAdventure[];
}

function validateAdventure(adventure: TownWorldDepthAdventure): TownWorldDepthAdventure {
  if (adventure.schemaVersion !== 1 || adventure.level !== 2 || adventure.steps.length < 3) {
    throw new Error(`Invalid Town world-depth adventure ${adventure.adventureRef}`);
  }
  if (new Set(adventure.steps.map((step) => step.interactionFamily)).size < 3) {
    throw new Error(`${adventure.adventureRef}: Town transfer requires at least three interaction families`);
  }
  if (!adventure.adaptiveReviewPlan?.stepId || adventure.adaptiveReviewPlan.candidates.length < 2) {
    throw new Error(`${adventure.adventureRef}: Town transfer requires a bounded adaptive review plan`);
  }
  if (!adventure.steps.some((step) => step.id === adventure.adaptiveReviewPlan.stepId)) {
    throw new Error(`${adventure.adventureRef}: adaptive review step does not exist`);
  }
  for (const step of adventure.steps) {
    step.worldAction = validateWorldActionDefinition(step.worldAction);
    if (step.interactionFamily === 'guided_sequence' && (!step.guidedStages || step.guidedStages.length < 2)) {
      throw new Error(`${step.id}: guided sequence requires at least two child actions`);
    }
    if (step.guidedStages && step.guidedStages.some((stage) => !stage.trim())) {
      throw new Error(`${step.id}: guided action labels must be non-empty`);
    }
    if (step.assembly) step.assembly = validateAssemblyDefinition(step.assembly);
  }
  return adventure;
}

const source = townWorldDepthJson as unknown as TownWorldDepthDocument;
if (source.schemaVersion !== 1) throw new Error('Invalid Town world-depth document');
const adventures = source.adventures.map(validateAdventure);

export function getTownWorldDepthAdventures(): TownWorldDepthAdventure[] {
  return adventures;
}

export function getTownWorldDepthAdventure(adventureRef: string): TownWorldDepthAdventure {
  const adventure = adventures.find((item) => item.adventureRef === adventureRef);
  if (!adventure) throw new Error(`Unknown Town world-depth adventure ${adventureRef}`);
  return adventure;
}

export function getTownAssemblyProof(): Array<{
  adventureRef: string;
  stepId: string;
  semanticDomain: TownSemanticDomain;
  definition: AssemblyDefinition;
}> {
  return adventures.flatMap((adventure) =>
    adventure.steps.flatMap((step) => step.assembly
      ? [{ adventureRef: adventure.adventureRef, stepId: step.id, semanticDomain: step.semanticDomain, definition: step.assembly }]
      : [])
  );
}

function attemptsForKnowledge(progress: ProgressSnapshot | undefined, knowledgeRef: string): StoredAttempt[] {
  if (!progress) return [];
  return progress.attempts
    .filter((attempt) => attempt.knowledgeRefs.includes(knowledgeRef))
    .sort((left, right) => Date.parse(right.submittedAt) - Date.parse(left.submittedAt));
}

function candidateRank(
  candidate: TownAdaptiveReviewCandidate,
  progress: ProgressSnapshot | undefined
): { priority: number; confidence: number; lastSeen: number; reason: TownAdaptiveReviewReason } {
  const attempts = attemptsForKnowledge(progress, candidate.knowledgeRef);
  if (!attempts.length) {
    return { priority: 3, confidence: -1, lastSeen: Number.NEGATIVE_INFINITY, reason: 'first_visit' };
  }

  const latest = attempts[0];
  if (!latest.correct) {
    return { priority: 0, confidence: 0, lastSeen: Date.parse(latest.submittedAt), reason: 'recovery' };
  }
  if (latest.assistanceKinds.length > 0) {
    return { priority: 1, confidence: 0.25, lastSeen: Date.parse(latest.submittedAt), reason: 'assisted' };
  }

  const mastery = progress?.knowledge[candidate.knowledgeRef];
  const confidence = mastery && mastery.totalWeight > 0 ? mastery.correctWeight / mastery.totalWeight : 1;
  return {
    priority: 2,
    confidence,
    lastSeen: Date.parse(latest.submittedAt),
    reason: 'lower_confidence'
  };
}

/**
 * Town review uses the existing canonical attempt/mastery evidence only. Failed or
 * assisted evidence returns before independent evidence; otherwise the lower-confidence,
 * older candidate is preferred. No Town-specific progress store or child-facing mastery label is created.
 */
export function selectTownAdaptiveReview(
  adventureRef: string,
  progress?: ProgressSnapshot
): TownAdaptiveReviewSelection {
  const adventure = getTownWorldDepthAdventure(adventureRef);
  const ranked = adventure.adaptiveReviewPlan.candidates
    .map((candidate) => ({ candidate, rank: candidateRank(candidate, progress) }))
    .sort((left, right) =>
      left.rank.priority - right.rank.priority
      || left.rank.confidence - right.rank.confidence
      || left.rank.lastSeen - right.rank.lastSeen
      || left.candidate.knowledgeRef.localeCompare(right.candidate.knowledgeRef)
    )[0];

  return { ...ranked.candidate, reason: ranked.rank.reason };
}
