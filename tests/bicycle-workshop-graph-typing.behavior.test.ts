import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

function validate(): Record<string, unknown> {
  const output = execFileSync(process.execPath, [
    'scripts/learning-graph/validate-bicycle-workshop-graph.mjs',
    '--json'
  ], { cwd: process.cwd(), encoding: 'utf8' });
  return JSON.parse(output.trim()) as Record<string, unknown>;
}

describe('Bicycle Workshop Learning Graph typing', () => {
  it('resolves every node, claim, concept, qualifier, depth, process and misconception repair', () => {
    expect(validate()).toMatchObject({
      graphId: 'learning-graph.bicycle-workshop.v1',
      nodeCount: 79,
      claimCount: 64,
      depthBandCount: 4,
      processCount: 3,
      misconceptionCount: 4,
      openWorldAssumption: true
    });
    expect(Number(validate().registeredConceptCount)).toBeGreaterThanOrEqual(15);
  });
});
