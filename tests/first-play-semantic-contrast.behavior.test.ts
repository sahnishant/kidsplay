import { describe, expect, it } from 'vitest';
import { validateFirstPlayRecipePolicy } from '../src/experience/firstPlayPolicy';
import { validateSemanticChoicePlan } from '../src/experience/semanticChoiceSafety';

describe('First Play concrete semantic contrast', () => {
  it('supports a two-choice full/empty contrast on one canonical comparison dimension', () => {
    validateFirstPlayRecipePolicy({
      stage: 'fp4_concrete_concept',
      evidenceClass: 'guided_practice',
      readingRequired: false,
      instructionSteps: 1,
      initialChoiceCount: 2,
      primaryTargetScale: 'oversized',
      wrongActionRecovery: 'in_place',
      requiresSeparateSubmitAfterCommittedAction: false,
      action: 'find'
    });

    const plan = validateSemanticChoicePlan({
      schemaVersion: 1,
      presentationTier: 'first_play',
      targetSemanticRef: 'semantic.test.container.full',
      comparisonDimensionRef: 'dimension.test.container-fill-state',
      candidates: [
        {
          semanticRef: 'semantic.test.container.full',
          contrastBasisRef: 'knowledge.test.container.full-state'
        },
        {
          semanticRef: 'semantic.test.container.empty',
          contrastBasisRef: 'knowledge.test.container.empty-state'
        }
      ]
    });

    expect(plan.candidates).toHaveLength(2);
    expect(plan.comparisonDimensionRef).toBe('dimension.test.container-fill-state');
  });

  it('rejects a third First Play choice instead of increasing toddler demand', () => {
    expect(() => validateSemanticChoicePlan({
      schemaVersion: 1,
      presentationTier: 'first_play',
      targetSemanticRef: 'semantic.test.big',
      comparisonDimensionRef: 'dimension.test.size',
      candidates: [
        { semanticRef: 'semantic.test.big', contrastBasisRef: 'knowledge.test.big' },
        { semanticRef: 'semantic.test.small', contrastBasisRef: 'knowledge.test.small' },
        { semanticRef: 'semantic.test.medium', contrastBasisRef: 'knowledge.test.medium' }
      ]
    })).toThrow(/2 candidates/);
  });
});
