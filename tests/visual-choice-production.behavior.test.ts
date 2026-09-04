import { describe, expect, it } from 'vitest';
import {
  ODD_ONE_OUT_ACTIVITIES,
  VISUAL_REASONING_ACTIVITIES,
  VISUAL_SCENE_CHOICE_ACTIVITIES,
  validateVisualReasoningActivity,
  visualCorrectPositionsAcrossSeeds
} from '../src/experience/firstPlayProduction';

describe('visual scene choice + Which Does Not Belong production', () => {
  it('ships six scene choices and six odd-one-out activities across at least four semantic families', () => {
    expect(VISUAL_SCENE_CHOICE_ACTIVITIES).toHaveLength(6);
    expect(ODD_ONE_OUT_ACTIVITIES).toHaveLength(6);
    expect(VISUAL_REASONING_ACTIVITIES).toHaveLength(12);
    expect(new Set(VISUAL_REASONING_ACTIVITIES.map((activity) => activity.semanticFamily)).size).toBeGreaterThanOrEqual(4);
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

  it('requires semantically controlled distractor evidence for every scene-choice candidate', () => {
    for (const activity of VISUAL_SCENE_CHOICE_ACTIVITIES) {
      expect(activity.kind).toBe('visual_scene_choice');
      expect(activity.semanticPlan).toBeDefined();
      if (!activity.semanticPlan) throw new Error(`${activity.id}: semantic plan missing`);
      expect(activity.semanticPlan.comparisonDimensionRef).toMatch(/^dimension\./);
      expect(activity.semanticPlan.candidates.every((candidate) => candidate.contrastBasisRef.startsWith('kr.'))).toBe(true);
      expect(new Set(activity.semanticPlan.candidates.map((candidate) => candidate.semanticRef))).toEqual(
        new Set(activity.question.interaction.options.map((option) => option.id))
      );
    }
  });

  it('declares exactly one defensible odd item with explicit candidate-level canonical evidence', () => {
    for (const activity of ODD_ONE_OUT_ACTIVITIES) {
      expect(activity.kind).toBe('odd_one_out');
      expect(activity.oddOneOutPlan).toBeDefined();
      if (!activity.oddOneOutPlan) throw new Error(`${activity.id}: odd-one-out plan missing`);
      expect(activity.oddOneOutPlan.comparisonDimensionRef).toMatch(/^dimension\./);
      const outliers = activity.oddOneOutPlan.candidates.filter((candidate) => !candidate.satisfiesRule);
      expect(outliers).toHaveLength(1);
      expect(activity.question.solution.correctOptionIds).toEqual([outliers[0].semanticRef]);
      expect(activity.oddOneOutPlan.candidates.every((candidate) => candidate.comparisonEvidenceRef.startsWith('kr.'))).toBe(true);
      expect(new Set(activity.oddOneOutPlan.candidates.map((candidate) => candidate.semanticRef))).toEqual(
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
