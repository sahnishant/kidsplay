import { describe, expect, it } from 'vitest';
import {
  ODD_ONE_OUT_ACTIVITIES,
  VISUAL_REASONING_ACTIVITIES,
  VISUAL_SCENE_CHOICE_ACTIVITIES
} from '../src/experience/firstPlayProduction';
import {
  VISUAL_REASONING_PROOFS,
  validateVisualReasoningActivity,
  visualCorrectPositionsAcrossSeeds
} from '../src/experience/firstPlayProductionValidation';

describe('visual scene choice + Which Does Not Belong production', () => {
  it('ships six scene choices and six odd-one-out activities across at least four semantic families', () => {
    expect(VISUAL_SCENE_CHOICE_ACTIVITIES).toHaveLength(6);
    expect(ODD_ONE_OUT_ACTIVITIES).toHaveLength(6);
    expect(VISUAL_REASONING_ACTIVITIES).toHaveLength(12);
    expect(new Set(Object.values(VISUAL_REASONING_PROOFS).map((proof) => proof.semanticFamily)).size).toBeGreaterThanOrEqual(4);
  });

  it('keeps every visual activity on existing single-choice evaluation and visual-dominant presentation', () => {
    for (const activity of VISUAL_REASONING_ACTIVITIES) {
      expect(() => validateVisualReasoningActivity(activity)).not.toThrow();
      expect(activity.question.interaction.type).toBe('single_choice');
      expect(activity.question.solution.type).toBe('exact_option');
      expect(activity.question.interaction.shuffleOptions).toBe(true);
      expect(activity.question.interaction.presentation?.mode).toBe('visual_dominant');
      expect(activity.question.interaction.presentation?.tier).toBe('preschool');
      expect(activity.question.interaction.options.length).toBeGreaterThanOrEqual(3);
      expect(activity.question.interaction.options.length).toBeLessThanOrEqual(4);
    }
  });

  it('hides option labels on named-target scene choices so the prompt cannot disclose the answer', () => {
    for (const activity of VISUAL_SCENE_CHOICE_ACTIVITIES) {
      expect(activity.question.interaction.presentation?.labels, `${activity.id} should hide option labels`).toBe('hidden');
    }
  });

  it('keeps secondary labels on odd-one-out reasoning activities', () => {
    for (const activity of ODD_ONE_OUT_ACTIVITIES) {
      expect(activity.question.interaction.presentation?.labels, `${activity.id} should retain supporting labels`).toBe('secondary');
    }
  });

  it('requires semantically controlled distractor evidence for every scene-choice candidate', () => {
    for (const activity of VISUAL_SCENE_CHOICE_ACTIVITIES) {
      const proof = VISUAL_REASONING_PROOFS[activity.id];
      expect(activity.kind).toBe('visual_scene_choice');
      expect(proof?.semanticPlan).toBeDefined();
      if (!proof?.semanticPlan) throw new Error(`${activity.id}: semantic plan missing`);
      expect(proof.semanticPlan.comparisonDimensionRef).toMatch(/^dimension\./);
      expect(proof.semanticPlan.candidates.every((candidate) => candidate.contrastBasisRef.startsWith('kr.'))).toBe(true);
      expect(new Set(proof.semanticPlan.candidates.map((candidate) => candidate.semanticRef))).toEqual(
        new Set(activity.question.interaction.options.map((option) => option.id))
      );
    }
  });

  it('declares exactly one defensible odd item with explicit candidate-level canonical evidence', () => {
    for (const activity of ODD_ONE_OUT_ACTIVITIES) {
      const proof = VISUAL_REASONING_PROOFS[activity.id];
      expect(activity.kind).toBe('odd_one_out');
      expect(proof?.oddOneOutPlan).toBeDefined();
      if (!proof?.oddOneOutPlan) throw new Error(`${activity.id}: odd-one-out plan missing`);
      expect(proof.oddOneOutPlan.comparisonDimensionRef).toMatch(/^dimension\./);
      const outliers = proof.oddOneOutPlan.candidates.filter((candidate) => !candidate.satisfiesRule);
      expect(outliers).toHaveLength(1);
      expect(activity.question.solution.correctOptionIds).toEqual([outliers[0].semanticRef]);
      expect(proof.oddOneOutPlan.candidates.every((candidate) => candidate.comparisonEvidenceRef.startsWith('kr.'))).toBe(true);
      expect(new Set(proof.oddOneOutPlan.candidates.map((candidate) => candidate.semanticRef))).toEqual(
        new Set(activity.question.interaction.options.map((option) => option.id))
      );
    }
  });

  it('does not leave any production correct answer in a stable visible position', () => {
    const seeds = Array.from({ length: 96 }, (_, index) => index + 1);
    for (const activity of VISUAL_REASONING_ACTIVITIES) {
      const positions = new Set(visualCorrectPositionsAcrossSeeds(activity, seeds));
      expect(positions.size, `${activity.id} should move its answer`).toBeGreaterThan(1);
      expect([...positions].every((position) => position >= 0 && position < activity.question.interaction.options.length)).toBe(true);
    }
  });
});
