import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

function validate(): Record<string, unknown> {
  const output = execFileSync(process.execPath, [
    'scripts/learning-graph/validate-bicycle-workshop-visuals.mjs',
    '--json'
  ], { cwd: process.cwd(), encoding: 'utf8' });
  return JSON.parse(output.trim()) as Record<string, unknown>;
}

describe('Bicycle Workshop original visual boundary', () => {
  it('uses graph-only original visuals broadly without source-image input', () => {
    const result = validate();
    expect(result).toMatchObject({
      dedicatedVisualCount: 12,
      sourceImageInputsUsed: false,
      humanSimilarityReview: 'required_before_commercial_release'
    });
    expect(Number(result.dedicatedReferenceCount)).toBeGreaterThanOrEqual(40);
    expect(Number(result.distinctDedicatedVisualsUsed)).toBeGreaterThanOrEqual(10);
  });
});
