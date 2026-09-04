export type FirstPlayStage =
  | 'fp0_touch_discover'
  | 'fp1_listen_find'
  | 'fp2_match_relation'
  | 'fp3_put_sort_build'
  | 'fp4_concrete_concept'
  | 'fp5_sound_letter_exposure';

export type FirstPlayEvidenceClass = 'exploration' | 'guided_practice' | 'evaluative';

export type FirstPlayAction =
  | 'tap'
  | 'find'
  | 'match'
  | 'place'
  | 'sort'
  | 'assemble'
  | 'trace'
  | 'reveal'
  | 'observe_change';

export interface FirstPlayStagePolicy {
  schemaVersion: 1;
  stage: FirstPlayStage;
  /** Printed text may be exposure, but never required to understand the task. */
  readingRequired: false;
  /** One child intent at a time: tap, find, match, place, etc. */
  maximumInstructionSteps: 1;
  /** FP0 is discovery-only; later First Play V1 stages begin with at most two choices. */
  maximumInitialChoices: 0 | 2;
  primaryTargetScale: 'oversized';
  repeatAffordance: 'required_when_audio_prompted';
  wrongActionRecovery: 'in_place';
  failureModalAllowed: false;
  separateSubmitAfterCommittedAction: false;
  allowedEvidenceClasses: readonly FirstPlayEvidenceClass[];
  allowedActions: readonly FirstPlayAction[];
}

export interface FirstPlayRecipePolicyInput {
  stage: FirstPlayStage;
  evidenceClass: FirstPlayEvidenceClass;
  readingRequired: boolean;
  instructionSteps: number;
  initialChoiceCount: number;
  primaryTargetScale: 'normal' | 'oversized';
  wrongActionRecovery: 'in_place' | 'blocking_modal';
  requiresSeparateSubmitAfterCommittedAction: boolean;
  action: FirstPlayAction;
}

const POLICIES: Readonly<Record<FirstPlayStage, FirstPlayStagePolicy>> = {
  fp0_touch_discover: {
    schemaVersion: 1,
    stage: 'fp0_touch_discover',
    readingRequired: false,
    maximumInstructionSteps: 1,
    maximumInitialChoices: 0,
    primaryTargetScale: 'oversized',
    repeatAffordance: 'required_when_audio_prompted',
    wrongActionRecovery: 'in_place',
    failureModalAllowed: false,
    separateSubmitAfterCommittedAction: false,
    allowedEvidenceClasses: ['exploration'],
    allowedActions: ['tap', 'reveal', 'observe_change']
  },
  fp1_listen_find: {
    schemaVersion: 1,
    stage: 'fp1_listen_find',
    readingRequired: false,
    maximumInstructionSteps: 1,
    maximumInitialChoices: 2,
    primaryTargetScale: 'oversized',
    repeatAffordance: 'required_when_audio_prompted',
    wrongActionRecovery: 'in_place',
    failureModalAllowed: false,
    separateSubmitAfterCommittedAction: false,
    allowedEvidenceClasses: ['guided_practice', 'evaluative'],
    allowedActions: ['tap', 'find']
  },
  fp2_match_relation: {
    schemaVersion: 1,
    stage: 'fp2_match_relation',
    readingRequired: false,
    maximumInstructionSteps: 1,
    maximumInitialChoices: 2,
    primaryTargetScale: 'oversized',
    repeatAffordance: 'required_when_audio_prompted',
    wrongActionRecovery: 'in_place',
    failureModalAllowed: false,
    separateSubmitAfterCommittedAction: false,
    allowedEvidenceClasses: ['guided_practice', 'evaluative'],
    allowedActions: ['match', 'place']
  },
  fp3_put_sort_build: {
    schemaVersion: 1,
    stage: 'fp3_put_sort_build',
    readingRequired: false,
    maximumInstructionSteps: 1,
    maximumInitialChoices: 2,
    primaryTargetScale: 'oversized',
    repeatAffordance: 'required_when_audio_prompted',
    wrongActionRecovery: 'in_place',
    failureModalAllowed: false,
    separateSubmitAfterCommittedAction: false,
    allowedEvidenceClasses: ['exploration', 'guided_practice', 'evaluative'],
    allowedActions: ['place', 'sort', 'assemble', 'observe_change']
  },
  fp4_concrete_concept: {
    schemaVersion: 1,
    stage: 'fp4_concrete_concept',
    readingRequired: false,
    maximumInstructionSteps: 1,
    maximumInitialChoices: 2,
    primaryTargetScale: 'oversized',
    repeatAffordance: 'required_when_audio_prompted',
    wrongActionRecovery: 'in_place',
    failureModalAllowed: false,
    separateSubmitAfterCommittedAction: false,
    allowedEvidenceClasses: ['exploration', 'guided_practice', 'evaluative'],
    allowedActions: ['tap', 'find', 'match', 'place', 'sort', 'observe_change']
  },
  fp5_sound_letter_exposure: {
    schemaVersion: 1,
    stage: 'fp5_sound_letter_exposure',
    readingRequired: false,
    maximumInstructionSteps: 1,
    maximumInitialChoices: 2,
    primaryTargetScale: 'oversized',
    repeatAffordance: 'required_when_audio_prompted',
    wrongActionRecovery: 'in_place',
    failureModalAllowed: false,
    separateSubmitAfterCommittedAction: false,
    // Explicit phonics mastery belongs to #199; First Play only exposes/practises it.
    allowedEvidenceClasses: ['exploration', 'guided_practice'],
    allowedActions: ['tap', 'find', 'match', 'place', 'trace']
  }
};

export function getFirstPlayStagePolicy(stage: FirstPlayStage): FirstPlayStagePolicy {
  const policy = POLICIES[stage];
  return {
    ...policy,
    allowedEvidenceClasses: [...policy.allowedEvidenceClasses],
    allowedActions: [...policy.allowedActions]
  };
}

export function firstPlayEvidenceMayAffectMastery(evidenceClass: FirstPlayEvidenceClass): boolean {
  return evidenceClass === 'evaluative';
}

/**
 * Validates presentation/evidence policy only. It deliberately does not own
 * canonical knowledge, answer keys, evaluator behavior or progress storage.
 */
export function validateFirstPlayRecipePolicy(input: FirstPlayRecipePolicyInput): void {
  const policy = POLICIES[input.stage];

  if (input.readingRequired) {
    throw new Error(`${input.stage}: First Play may not require reading`);
  }
  if (!Number.isInteger(input.instructionSteps) || input.instructionSteps < 0 || input.instructionSteps > policy.maximumInstructionSteps) {
    throw new Error(`${input.stage}: First Play must express at most one child instruction step`);
  }
  if (!Number.isInteger(input.initialChoiceCount) || input.initialChoiceCount < 0 || input.initialChoiceCount > policy.maximumInitialChoices) {
    throw new Error(`${input.stage}: initial choices exceed the First Play limit of ${policy.maximumInitialChoices}`);
  }
  if (input.primaryTargetScale !== policy.primaryTargetScale) {
    throw new Error(`${input.stage}: primary targets must use the oversized First Play scale`);
  }
  if (input.wrongActionRecovery !== policy.wrongActionRecovery) {
    throw new Error(`${input.stage}: wrong actions must recover in place`);
  }
  if (input.requiresSeparateSubmitAfterCommittedAction) {
    throw new Error(`${input.stage}: committed child actions may not require a second submit step`);
  }
  if (!policy.allowedEvidenceClasses.includes(input.evidenceClass)) {
    throw new Error(`${input.stage}: evidence class ${input.evidenceClass} is not allowed`);
  }
  if (!policy.allowedActions.includes(input.action)) {
    throw new Error(`${input.stage}: action ${input.action} is not allowed`);
  }
}

export function getFirstPlayStages(): FirstPlayStage[] {
  return Object.keys(POLICIES) as FirstPlayStage[];
}
