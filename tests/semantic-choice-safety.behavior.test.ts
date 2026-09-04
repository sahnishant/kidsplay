import { describe, expect, it } from 'vitest';
import {
  resolveOddOneOutPlan,
  semanticChoiceMaximumChoices,
  validateSemanticChoicePlan
} from '../src/experience/semanticChoiceSafety';

describe('semantic visual-choice safety', () => {
  it('keeps First Play at two choices while allowing bounded 2-4 choice later presentations', () => {
    expect(semanticChoiceMaximumChoices('first_play')).toBe(2);
    expect(semanticChoiceMaximumChoices('preschool')).toBe(4);
    expect(semanticChoiceMaximumChoices('early_primary')).toBe(4);

    expect(() => validateSemanticChoicePlan({
      schemaVersion: 1,
      presentationTier: 'first_play',
      targetSemanticRef: 'semantic.dog',
      candidates: [
        { semanticRef: 'semantic.dog', contrastBasisRef: 'kr.category.animal' },
        { semanticRef: 'semantic.cow', contrastBasisRef: 'kr.category.animal' },
        { semanticRef: 'semantic.bus', contrastBasisRef: 'kr.category.transport' }
      ]
    })).toThrow(/requires 2-2 candidates/);
  });

  it('requires every visible candidate to carry an explicit semantic contrast basis', () => {
    expect(() => validateSemanticChoicePlan({
      schemaVersion: 1,
      presentationTier: 'preschool',
      targetSemanticRef: 'semantic.open',
      candidates: [
        { semanticRef: 'semantic.open', contrastBasisRef: 'kr.state.open' },
        { semanticRef: 'semantic.closed', contrastBasisRef: '' }
      ]
    })).toThrow(/contrastBasisRef/);
  });

  it('requires the target to be present and all semantic refs to be unique', () => {
    expect(() => validateSemanticChoicePlan({
      schemaVersion: 1,
      presentationTier: 'preschool',
      targetSemanticRef: 'semantic.under',
      candidates: [
        { semanticRef: 'semantic.on', contrastBasisRef: 'kr.spatial.position' },
        { semanticRef: 'semantic.beside', contrastBasisRef: 'kr.spatial.position' }
      ]
    })).toThrow(/contain the target/);

    expect(() => validateSemanticChoicePlan({
      schemaVersion: 1,
      presentationTier: 'preschool',
      targetSemanticRef: 'semantic.under',
      candidates: [
        { semanticRef: 'semantic.under', contrastBasisRef: 'kr.spatial.position' },
        { semanticRef: 'semantic.under', contrastBasisRef: 'kr.spatial.position' }
      ]
    })).toThrow(/duplicate semantic ref/);
  });

  it('accepts exactly three inliers plus one outlier for a declared comparison dimension', () => {
    expect(resolveOddOneOutPlan({
      schemaVersion: 1,
      comparisonDimensionRef: 'kr.category.transport',
      candidates: [
        { semanticRef: 'semantic.bus', satisfiesRule: true },
        { semanticRef: 'semantic.train', satisfiesRule: true },
        { semanticRef: 'semantic.boat', satisfiesRule: true },
        { semanticRef: 'semantic.apple', satisfiesRule: false }
      ]
    })).toEqual({
      comparisonDimensionRef: 'kr.category.transport',
      inlierSemanticRefs: ['semantic.bus', 'semantic.train', 'semantic.boat'],
      oddSemanticRef: 'semantic.apple'
    });
  });

  it('rejects ambiguous odd-one-out sets with zero or multiple rule-failing candidates', () => {
    expect(() => resolveOddOneOutPlan({
      schemaVersion: 1,
      comparisonDimensionRef: 'kr.category.transport',
      candidates: [
        { semanticRef: 'semantic.bus', satisfiesRule: true },
        { semanticRef: 'semantic.train', satisfiesRule: true },
        { semanticRef: 'semantic.apple', satisfiesRule: false },
        { semanticRef: 'semantic.banana', satisfiesRule: false }
      ]
    })).toThrow(/exactly three/);

    expect(() => resolveOddOneOutPlan({
      schemaVersion: 1,
      comparisonDimensionRef: 'kr.category.transport',
      candidates: [
        { semanticRef: 'semantic.bus', satisfiesRule: true },
        { semanticRef: 'semantic.train', satisfiesRule: true },
        { semanticRef: 'semantic.boat', satisfiesRule: true },
        { semanticRef: 'semantic.bicycle', satisfiesRule: true }
      ]
    })).toThrow(/exactly three/);
  });
});
