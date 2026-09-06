import { execFileSync } from 'node:child_process';
import { expect, it } from 'vitest';
it('changes subject and grade placement without rewriting shared knowledge or capabilities', () => {
  const report = JSON.parse(execFileSync(process.execPath, ['scripts/test-graph-context-separation.mjs'], { cwd: process.cwd(), encoding: 'utf8' }));
  expect(report).toMatchObject({ contextSeparation: 'PASS', contextsTested: ['English', 'Science', 'EVS'], createsCurriculumAlignment: false, canonicalTruthUnchanged: true });
});
