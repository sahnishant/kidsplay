import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildPresentationStressMatrix } from '../scripts/vocabulary-visuals/presentation-stress-matrix.mjs';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
const contract = readJson('content/vocabulary-visuals/presentation-modes.json');
const runtime = readJson('content/vocabulary-visuals/__generated-runtime-plans.json');
const sourceItems = readdirSync(resolve(process.cwd(), 'content/vocabulary-visuals/batches'))
  .filter((name) => name.endsWith('.json'))
  .sort()
  .flatMap((name) => readJson(`content/vocabulary-visuals/batches/${name}`).items ?? []);

const matrix = buildPresentationStressMatrix({
  items: sourceItems,
  runtimePlans: runtime.plans,
  contract,
  cycles: 24
});

describe('24 x 5 scalable visual meaning stress matrix', () => {
  it('runs more than the #76 twenty-cycle minimum with five invariant disciplines each', () => {
    expect(matrix.sourceItems).toBeGreaterThanOrEqual(24);
    expect(matrix.cycles).toBe(24);
    expect(matrix.disciplinesPerCycle).toBe(5);
    expect(matrix.totalChecks).toBe(120);
    expect(matrix.passedChecks).toBe(120);
    expect(matrix.failedChecks).toBe(0);
    expect(matrix.allPassed).toBe(true);
  });

  for (const result of matrix.results) {
    it(`cycle ${result.cycle} keeps sense, mode, authority, reuse and scale invariants`, () => {
      expect(result.checks).toEqual({
        sense: true,
        mode: true,
        authority: true,
        reuse: true,
        scale: true
      });
      expect(result.payloadBytes).toBeLessThanOrEqual(contract.slicePolicy.maxPayloadBytes);
    });
  }
});
