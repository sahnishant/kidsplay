import { describe, expect, it } from 'vitest';
import {
  firstPlayEvidenceMayAffectMastery,
  getFirstPlayStagePolicy,
  getFirstPlayStages,
  validateFirstPlayRecipePolicy,
  type FirstPlayRecipePolicyInput
} from '../src/experience/firstPlayPolicy';

function validInput(overrides: Partial<FirstPlayRecipePolicyInput> = {}): FirstPlayRecipePolicyInput {
  return {
    stage: 'fp1_listen_find',
    evidenceClass: 'evaluative',
    readingRequired: false,
    instructionSteps: 1,
    initialChoiceCount: 2,
    primaryTargetScale: 'oversized',
    wrongActionRecovery: 'in_place',
    requiresSeparateSubmitAfterCommittedAction: false,
    action: 'find',
    ...overrides
  };
}

describe('First Play demand and evidence contract', () => {
  it('defines all six First Play stages as no-reading, one-step and oversized-target policies', () => {
    expect(getFirstPlayStages()).toEqual([
      'fp0_touch_discover',
      'fp1_listen_find',
      'fp2_match_relation',
      'fp3_put_sort_build',
      'fp4_concrete_concept',
      'fp5_sound_letter_exposure'
    ]);

    for (const stage of getFirstPlayStages()) {
      const policy = getFirstPlayStagePolicy(stage);
      expect(policy.schemaVersion).toBe(1);
      expect(policy.readingRequired).toBe(false);
      expect(policy.maximumInstructionSteps).toBe(1);
      expect(policy.maximumInitialChoices).toBe(stage === 'fp0_touch_discover' ? 0 : 2);
      expect(policy.primaryTargetScale).toBe('oversized');
      expect(policy.wrongActionRecovery).toBe('in_place');
      expect(policy.failureModalAllowed).toBe(false);
      expect(policy.separateSubmitAfterCommittedAction).toBe(false);
    }
  });

  it('allows normal mastery evidence only for explicitly evaluative First Play interactions', () => {
    expect(firstPlayEvidenceMayAffectMastery('exploration')).toBe(false);
    expect(firstPlayEvidenceMayAffectMastery('guided_practice')).toBe(false);
    expect(firstPlayEvidenceMayAffectMastery('evaluative')).toBe(true);
  });

  it('keeps FP0 discovery choice-free/non-evaluative and FP5 sound/letter exposure below explicit phonics mastery', () => {
    expect(getFirstPlayStagePolicy('fp0_touch_discover').maximumInitialChoices).toBe(0);
    expect(getFirstPlayStagePolicy('fp0_touch_discover').allowedEvidenceClasses).toEqual(['exploration']);
    expect(getFirstPlayStagePolicy('fp5_sound_letter_exposure').allowedEvidenceClasses).toEqual([
      'exploration',
      'guided_practice'
    ]);

    expect(() => validateFirstPlayRecipePolicy(validInput({
      stage: 'fp0_touch_discover',
      evidenceClass: 'exploration',
      initialChoiceCount: 1,
      action: 'tap'
    }))).toThrow(/First Play limit of 0/);

    expect(() => validateFirstPlayRecipePolicy(validInput({
      stage: 'fp0_touch_discover',
      evidenceClass: 'evaluative',
      initialChoiceCount: 0,
      action: 'tap'
    }))).toThrow(/evidence class evaluative is not allowed/);

    expect(() => validateFirstPlayRecipePolicy(validInput({
      stage: 'fp5_sound_letter_exposure',
      evidenceClass: 'evaluative',
      action: 'find'
    }))).toThrow(/evidence class evaluative is not allowed/);
  });

  it('fails closed on reading, multi-step instructions, conventional choice grids and blocking recovery', () => {
    expect(() => validateFirstPlayRecipePolicy(validInput({ readingRequired: true }))).toThrow(/may not require reading/);
    expect(() => validateFirstPlayRecipePolicy(validInput({ instructionSteps: 2 }))).toThrow(/at most one/);
    expect(() => validateFirstPlayRecipePolicy(validInput({ initialChoiceCount: 3 }))).toThrow(/exceed/);
    expect(() => validateFirstPlayRecipePolicy(validInput({ primaryTargetScale: 'normal' }))).toThrow(/oversized/);
    expect(() => validateFirstPlayRecipePolicy(validInput({ wrongActionRecovery: 'blocking_modal' }))).toThrow(/recover in place/);
    expect(() => validateFirstPlayRecipePolicy(validInput({ requiresSeparateSubmitAfterCommittedAction: true }))).toThrow(/second submit/);
  });

  it('restricts each stage to its intended one-step action vocabulary', () => {
    expect(() => validateFirstPlayRecipePolicy(validInput({
      stage: 'fp1_listen_find',
      action: 'assemble'
    }))).toThrow(/action assemble is not allowed/);

    expect(() => validateFirstPlayRecipePolicy(validInput({
      stage: 'fp3_put_sort_build',
      evidenceClass: 'guided_practice',
      initialChoiceCount: 0,
      action: 'assemble'
    }))).not.toThrow();
  });
});
