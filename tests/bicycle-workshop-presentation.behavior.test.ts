import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

function validate(): Record<string, unknown> {
  const output = execFileSync(process.execPath, [
    'scripts/learning-graph/validate-bicycle-workshop-presentation.mjs',
    '--json'
  ], { cwd: process.cwd(), encoding: 'utf8' });
  return JSON.parse(output.trim()) as Record<string, unknown>;
}

describe('Bicycle Workshop guided curriculum presentation', () => {
  it('provides seven graph-traced teaching sections before practice and chapter check', () => {
    expect(validate()).toMatchObject({
      experienceId: 'experience.bicycle-workshop.guided.v1',
      sectionCount: 7,
      practicePackRef: 'free.english.bicycle-workshop.1',
      chapterCheckPackRef: 'free.english.bicycle-workshop.chapter-check.1',
      browsingMasteryEvidence: 'none'
    });
  });
});
