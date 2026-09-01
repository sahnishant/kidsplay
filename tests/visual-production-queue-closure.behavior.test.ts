import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { recommendVisualRecipeTemplate } from '../scripts/visual-opportunity-semantics.mjs';

describe('visual production queue closure', () => {
  it('keeps the final ambiguous or low-reuse semantics out of automatic production', () => {
    expect(recommendVisualRecipeTemplate({ semanticRef: 'exercise-body', category: 'concrete_or_authored' })).toMatchObject({
      automaticEligible: false,
      familyKey: null,
      template: 'review_required'
    });
    expect(recommendVisualRecipeTemplate({ semanticRef: 'si-length', category: 'concrete_or_authored' })).toMatchObject({
      automaticEligible: false,
      familyKey: null,
      template: 'review_required'
    });
    expect(recommendVisualRecipeTemplate({ semanticRef: 'pollution-source', category: 'concrete_or_authored' })).toMatchObject({
      automaticEligible: false,
      familyKey: null,
      template: 'review_required'
    });
  });

  it('leaves zero automatic production candidates after the reviewed high-ROI families land', () => {
    const report = JSON.parse(execFileSync(process.execPath, ['scripts/report-visual-recipe-roi.mjs', '--json', '--limit=100'], {
      cwd: process.cwd(),
      encoding: 'utf8'
    })) as {
      productionCandidates: number;
      queue: Array<{ semanticRef: string | null }>;
      familyQueue: Array<{ familyKey: string }>;
      reviewCandidates: number;
    };

    expect(report.productionCandidates).toBe(0);
    expect(report.queue).toEqual([]);
    expect(report.familyQueue).toEqual([]);
    expect(report.reviewCandidates).toBeGreaterThan(0);
  });
});
