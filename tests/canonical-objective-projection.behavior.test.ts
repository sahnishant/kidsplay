import { execFileSync } from 'node:child_process';
import { expect, it } from 'vitest';
it('derives legacy learning records only from canonical objectives and capabilities', () => {
  const report = JSON.parse(execFileSync(process.execPath, ['scripts/test-objective-projection.mjs'], { cwd: process.cwd(), encoding: 'utf8' }));
  expect(report).toMatchObject({ objectiveAuthority: 'PASS', objectiveCount: 34, capabilityCount: 11, legacyProgressIdCount: 34, rejectedMutations: 14, progressIdsPreserved: true });
});
