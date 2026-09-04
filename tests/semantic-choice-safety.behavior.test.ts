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
      comparisonDimensionRef: 'kr.category.animal',
      candidates: [
        { semanticRef: 'semantic.dog', contrastBasisRef: 'kr.category.animal.dog' },
        { semanticRef: 'semantic.cow', contrastBasisRef: 'kr.category.animal.cow' },
        { semanticRef: 'semantic.bus', contrastBasisRef: 'kr.category.transport.bus' }
      ]
    })).toThrow(/requires 2-2 candidates/);
  });

  it('requires one common comparison dimension and explicit semantic evidence per visible candidate', () => {
    expect(() => validateSemanticChoicePlan({
      schemaVersion: 1,
      presentationTier: 'preschool',
      targetSemanticRef: 'semantic.open',
      comparisonDimensionRef: '',
      candidates: [
        { semanticRef: 'semantic.open', contrastBasisRef: 'kr.state.open' },
        { semanticRef: 'semantic.closed', contrastBasisRef: 'kr.state.closed' }
      ]
    })).toThrow(/comparisonDimensionRef/);

    expect(() => validateSemanticChoicePlan({
      schemaVersion: 1,
      presentationTier: 'preschool',
      targetSemanticRef: 'semantic.open',
      comparisonDimensionRef: 'kr.dimension.open-closed-state',
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
      comparisonDimensionRef: 'kr.dimension.spatial-position',
      candidates: [
        { semanticRef: 'semantic.on', contrastBasisRef: 'kr.spatial.on' },
        { semanticRef: 'semantic.beside', contrastBasisRef: 'kr.spatial.beside' }
      ]
    })).toThrow(/contain the target/);

    expect(() => validateSemanticChoicePlan({
      schemaVersion: 1,
      presentationTier: 'preschool',
      targetSemanticRef: 'semantic.under',
      comparisonDimensionRef: 'kr.dimension.spatial-position',
      candidates: [
        { semanticRef: 'semantic.under', contrastBasisRef: 'kr.spatial.under' },
        { semanticRef: 'semantic.under', contrastBasisRef: 'kr.spatial.under' }
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
