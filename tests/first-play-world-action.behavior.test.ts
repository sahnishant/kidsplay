import { describe, expect, it } from 'vitest';
import { getFirstPlayStagePolicy, validateFirstPlayRecipePolicy } from '../src/experience/firstPlayPolicy';
import { validateWorldActionDefinition } from '../src/experience/worldActionContract';

describe('First Play cause/effect proof', () => {
  it('admits one zero-reading observe-change action with an explicit visible state transition', () => {
    validateFirstPlayRecipePolicy({
      stage: 'fp3_put_sort_build',
      evidenceClass: 'exploration',
      readingRequired: false,
      instructionSteps: 1,
      initialChoiceCount: 0,
      primaryTargetScale: 'oversized',
      wrongActionRecovery: 'in_place',
      requiresSeparateSubmitAfterCommittedAction: false,
      action: 'observe_change'
    });

    const action = validateWorldActionDefinition({
      schemaVersion: 1,
      actionId: 'action.test.fill-cup',
      family: 'cause_effect',
      action: 'fill',
      canonicalGoalRefs: ['goal.test.observe-fill'],
      subjectSemanticRefs: ['semantic.test.water'],
      targetSemanticRefs: ['semantic.test.cup'],
      stateTransition: {
        beforeStateRef: 'state.test.cup.empty',
        afterStateRef: 'state.test.cup.full',
        causalKnowledgeRef: 'knowledge.test.fill-transition'
      },
      evidenceClass: 'exploration',
      retryPolicy: 'not_applicable'
    });

    expect(action.stateTransition?.beforeStateRef).not.toBe(action.stateTransition?.afterStateRef);
    expect(action.evidenceClass).toBe('exploration');
    expect(action.retryPolicy).toBe('not_applicable');
  });

  it('keeps FP3 at one child intent with no separate submit', () => {
    const policy = getFirstPlayStagePolicy('fp3_put_sort_build');
    expect(policy.maximumInstructionSteps).toBe(1);
    expect(policy.separateSubmitAfterCommittedAction).toBe(false);
    expect(policy.failureModalAllowed).toBe(false);
  });
});
