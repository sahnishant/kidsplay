import { execFileSync } from 'node:child_process';
import { expect, it } from 'vitest';
it('keeps one canonical dialect and rejects invalid graph mutations', () => {
  const report = JSON.parse(execFileSync(process.execPath, ['scripts/test-canonical-graph.mjs'], { cwd: process.cwd(), encoding: 'utf8' }));
  expect(report).toMatchObject({ canonicalGraph: 'PASS', preservedNodes: 93, preservedClaims: 88, rejectedMutations: 18 });
});
