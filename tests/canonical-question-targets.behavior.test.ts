import { execFileSync } from 'node:child_process';
import { expect, it } from 'vitest';
it('rejects membership-only evidence, lost conditions and inconsistent answers', () => {
  const result = JSON.parse(execFileSync(process.execPath, ['scripts/test-question-semantic-targets.mjs'], { cwd: process.cwd(), encoding: 'utf8' }));
  expect(result).toMatchObject({ semanticTraceability: 'PASS', semanticTargets: 8, rejectedMutations: 16, preservedOriginalNodes: 79, preservedOriginalClaims: 64, humanApproval: false });
});
