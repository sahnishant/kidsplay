import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildProductionFamilyQueue } from '../scripts/visual-family-roi-core.mjs';
import { recommendVisualRecipeTemplate } from '../scripts/visual-opportunity-semantics.mjs';
import { resolveVisualRecipeForSemantic } from '../src/presentation/visualRecipeRegistry';
import { resolveItemVisualRefs, resolveLabelVisualRefs, resolveSemanticVisualRefs, resolveVisualDefinition } from '../src/presentation/visualRegistry';

const actions = [
  ['reduce', 'entity.environment.reduce-sample'],
  ['reuse', 'entity.environment.reuse-sample'],
  ['recycle', 'entity.environment.recycle-sample']
] as const;

describe('family-level visual ROI and environmental actions', () => {
  it('assigns conservative reusable family keys only to automatic production candidates', () => {
    for (const semanticRef of ['temperature', 'length', 'mass', 'capacity']) {
      expect(recommendVisualRecipeTemplate({ semanticRef, category: 'concrete_or_authored' }).familyKey).toBe('measurement');
    }
    for (const semanticRef of ['transparent', 'opaque']) {
      expect(recommendVisualRecipeTemplate({ semanticRef, category: 'concrete_or_authored' }).familyKey).toBe('material-contrast');
    }
    for (const semanticRef of ['reduce', 'reuse', 'recycle']) {
      const recommendation = recommendVisualRecipeTemplate({ semanticRef, category: 'concrete_or_authored' });
      expect(recommendation.familyKey).toBe('environmental-actions');
      expect(recommendation.automaticEligible).toBe(true);
    }
    expect(recommendVisualRecipeTemplate({ semanticRef: 'ancient-object', category: 'vocabulary_review' }).familyKey).toBeNull();
    expect(recommendVisualRecipeTemplate({ semanticRef: 'ask', category: 'concrete_or_authored' }).familyKey).toBeNull();
  });

  it('does not group unrelated relation semantics merely because they share a template', () => {
    expect(recommendVisualRecipeTemplate({ semanticRef: 'shadow', category: 'concrete_or_authored' }).familyKey).toBe('shadow-formation');
    expect(recommendVisualRecipeTemplate({ semanticRef: 'exercise-body', category: 'concrete_or_authored' })).toMatchObject({
      automaticEligible: false,
      familyKey: null,
      template: 'review_required'
    });
    expect(recommendVisualRecipeTemplate({ semanticRef: 'reflect', category: 'concrete_or_authored' }).familyKey).toBe('light-behavior');
    expect(recommendVisualRecipeTemplate({ semanticRef: 'flow', category: 'concrete_or_authored' }).familyKey).toBe('flow-process');

    const queue = buildProductionFamilyQueue([
      { semanticRef: 'shadow', familyKey: 'shadow-formation', automaticEligible: true, occurrenceCount: 10, roiScore: 10, engines: ['memory_pairs', 'single_choice'], profiles: ['SOF_INDIA_CLASS3'], suggestedTemplate: 'relation.source-target', costClass: 'medium' },
      { semanticRef: 'exercise-body', familyKey: null, automaticEligible: false, occurrenceCount: 4, roiScore: 4, engines: ['memory_pairs', 'single_choice'], profiles: ['SOF_INDIA_CLASS3'], suggestedTemplate: 'review_required', costClass: 'high' }
    ]);
    expect(queue.map((family) => family.familyKey)).toEqual(['shadow-formation']);
    expect(queue.some((family) => family.familyKey === 'relation-actions')).toBe(false);
  });

  it('aggregates a family only from already-authorized production entries', () => {
    const familyQueue = buildProductionFamilyQueue([
      { semanticRef: 'reduce', familyKey: 'environmental-actions', automaticEligible: true, occurrenceCount: 10, roiScore: 10, engines: ['memory_pairs', 'single_choice'], profiles: ['SOF_INDIA_CLASS3'], suggestedTemplate: 'process.sequence', costClass: 'medium' },
      { semanticRef: 'reuse', familyKey: 'environmental-actions', automaticEligible: true, occurrenceCount: 10, roiScore: 10, engines: ['memory_pairs', 'single_choice'], profiles: ['SOF_INDIA_CLASS3'], suggestedTemplate: 'process.sequence', costClass: 'medium' },
      { semanticRef: 'recycle', familyKey: 'environmental-actions', automaticEligible: true, occurrenceCount: 10, roiScore: 10, engines: ['memory_pairs', 'single_choice'], profiles: ['SOF_INDIA_CLASS3'], suggestedTemplate: 'process.sequence', costClass: 'medium' },
      { semanticRef: 'ancient-object', familyKey: 'environmental-actions', automaticEligible: false, occurrenceCount: 100, roiScore: 999, engines: ['single_choice'], profiles: ['SOF_INDIA_CLASS3'], suggestedTemplate: 'review_required', costClass: 'high' }
    ]);
    expect(familyQueue).toHaveLength(1);
    expect(familyQueue[0]).toMatchObject({ familyKey: 'environmental-actions', occurrenceCount: 30, roiScore: 30, engineBreadth: 2 });
    expect(familyQueue[0].semanticRefs).toEqual(['recycle', 'reduce', 'reuse']);
  });

  it('resolves the three environmental actions through recipes, not direct concept aliases', () => {
    for (const [semanticRef, visualRef] of actions) {
      expect(resolveSemanticVisualRefs(semanticRef)).toEqual([]);
      expect(resolveItemVisualRefs({ label: semanticRef, semanticRef }, true, 'option')).toEqual([visualRef]);
      expect(resolveVisualRecipeForSemantic(semanticRef, 'option')?.exposure).toBe('identity_only');
      expect(resolveVisualDefinition(visualRef)?.renderer).toBe('environmental-action-icon');
    }
  });

  it('keeps the three action meanings visually distinct without semantic branches in the renderer', () => {
    const source = readFileSync('src/presentation/EnvironmentalActionIcon.svelte', 'utf8');
    expect(source).toContain("icon === 'reduce-sample'");
    expect(source).toContain("icon === 'reuse-sample'");
    expect(source).toContain("icon === 'recycle-sample'");
    expect(source).toContain('M72 43h18');
    expect(source).toContain('a31 31 0 0 1');
    expect(source).toContain('58 15 75 42');
    expect(source).not.toContain("semanticRef === 'reduce'");
  });

  it('does not infer action visuals from longer explanatory sentences', () => {
    for (const label of ['Reduce the amount of waste', 'Reuse the same bottle again', 'Recycle suitable materials']) {
      expect(resolveLabelVisualRefs(label)).toEqual([]);
    }
  });

  it('keeps the authored environmental family out of the live production queue as later families are added', () => {
    const report = JSON.parse(execFileSync(process.execPath, ['scripts/report-visual-recipe-roi.mjs', '--json', '--limit=50'], { encoding: 'utf8' })) as {
      queue: Array<{ semanticRef: string | null }>;
      familyQueue: Array<{ familyKey: string }>;
      reviewQueue: Array<{ automaticEligible: boolean }>;
    };
    const refs = new Set(report.queue.map((entry) => entry.semanticRef));
    for (const [semanticRef] of actions) expect(refs.has(semanticRef)).toBe(false);
    expect(report.familyQueue.some((family) => family.familyKey === 'environmental-actions')).toBe(false);
    expect(report.reviewQueue.every((entry) => !entry.automaticEligible)).toBe(true);
  });

  it('preserves at least the certified environmental-family coverage contribution as the system grows', () => {
    const report = JSON.parse(execFileSync(process.execPath, ['scripts/report-visual-coverage.mjs', '--json'], { encoding: 'utf8' })) as {
      library: { entities: number; recipes: number };
      visualFriendly: { visual: number; total: number; percent: number; recipe: number };
    };
    expect(report.library.entities).toBeGreaterThanOrEqual(299);
    expect(report.library.recipes).toBeGreaterThanOrEqual(14);
    expect(report.visualFriendly.total).toBeGreaterThanOrEqual(1459);
    expect(report.visualFriendly.visual).toBeGreaterThanOrEqual(744);
    expect(report.visualFriendly.percent).toBeGreaterThanOrEqual(40);
    expect(report.visualFriendly.recipe).toBeGreaterThanOrEqual(135);
  });
});
