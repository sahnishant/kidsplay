import { describe, expect, it } from 'vitest';
import {
  resolveVisualMeaningPresentation,
  resolveVisualMeaningPresentationSlice
} from '../src/presentation/vocabularyPresentation';
import { resolveVisualRecipeForSemantic } from '../src/presentation/visualRecipeRegistry';

describe('#76 semantic visual stack integration', () => {
  it('keeps exact-sense presentation identity stable while recipe grammar resolves other semantic content', () => {
    const before = resolveVisualMeaningPresentation('enormous#very-large-size');
    const recipe = resolveVisualRecipeForSemantic('earth-revolution', 'feedback');
    const after = resolveVisualMeaningPresentation('enormous#very-large-size');

    expect(recipe).toMatchObject({
      id: 'recipe.orbit.earth-revolution',
      semanticRef: 'earth-revolution',
      template: 'orbit',
      exposure: 'full_relation'
    });
    expect(after).toEqual(before);
    expect(after).toMatchObject({
      presentationKey: 'visual-meaning:v1:enormous#very-large-size',
      senseKey: 'enormous#very-large-size',
      visualAllowed: true,
      runtimeUsage: 'knowledge_reinforcement'
    });
  });

  it('keeps recipe identity-only answer exposure subordinate to exact-sense pre-answer suppression', () => {
    const optionRecipe = resolveVisualRecipeForSemantic('earth-revolution', 'option');
    expect(optionRecipe).toMatchObject({ exposure: 'identity_only' });
    expect(optionRecipe?.slots.every((slot) => slot.exposure === 'identity')).toBe(true);

    const preAnswer = resolveVisualMeaningPresentation('enormous#very-large-size', {
      phase: 'assessment_pre_answer'
    });
    expect(preAnswer).toMatchObject({
      deliveryMode: 'text',
      visualAllowed: false,
      fallbackReason: 'answer_safety'
    });
  });

  it('keeps bounded exact-sense slice projection independent from the recipe registry size', () => {
    const slice = resolveVisualMeaningPresentationSlice([
      'enormous#very-large-size',
      'village#settlement',
      'pull#move-toward-by-force'
    ]);
    expect(slice.summary.requested).toBe(3);
    expect(slice.plans.map((plan) => plan.senseKey)).toEqual([
      'enormous#very-large-size',
      'pull#move-toward-by-force',
      'village#settlement'
    ]);
  });
});
