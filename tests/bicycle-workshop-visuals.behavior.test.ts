import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

function validate(): Record<string, unknown> {
  const output = execFileSync(process.execPath, [
    'scripts/learning-graph/validate-bicycle-workshop-visuals.mjs',
    '--json'
  ], { cwd: process.cwd(), encoding: 'utf8' });
  return JSON.parse(output.trim()) as Record<string, unknown>;
}

describe('Bicycle Workshop visual boundary', () => {
  it('reuses the canonical semantic presenter without source-image input or a parallel renderer', () => {
    const result = validate();
    expect(result).toMatchObject({
      customRendererUsed: false,
      sourceImageInputsUsed: false,
      guidedVisualCount: 4,
      guidedAnimationCount: 3,
      humanSimilarityReview: 'required_before_commercial_release'
    });
    expect(Number(result.registeredWorkshopVisualCount)).toBeGreaterThanOrEqual(16);
    expect(Number(result.explicitQuestionReferenceCount)).toBeGreaterThanOrEqual(10);
  });
});
