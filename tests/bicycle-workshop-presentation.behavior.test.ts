import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { getBicycleWorkshopPresentation } from '../src/experience/curriculumChapterCatalog';

function validate(): Record<string, unknown> {
  const output = execFileSync(process.execPath, [
    'scripts/learning-graph/validate-bicycle-workshop-presentation.mjs',
    '--json'
  ], { cwd: process.cwd(), encoding: 'utf8' });
  return JSON.parse(output.trim()) as Record<string, unknown>;
}

describe('Bicycle Workshop guided curriculum presentation', () => {
  it('provides six graph-traced teaching beats before practice and chapter check', () => {
    expect(validate()).toMatchObject({
      presentationId: 'curriculum-presentation.bicycle-workshop.v1',
      beatCount: 6,
      practicePackRef: 'free.english.bicycle-workshop.1',
      chapterCheckPackRef: 'free.english.bicycle-workshop.chapter-check.1',
      browsingMasteryEvidence: 'none'
    });
  });

  it('returns defensive copies of the chapter projection', () => {
    const first = getBicycleWorkshopPresentation();
    const second = getBicycleWorkshopPresentation();
    expect(first).not.toBe(second);
    expect(first.beats).not.toBe(second.beats);
    expect(first.beats).toHaveLength(6);
    first.beats[0].claimRefs.push('mutation.test');
    expect(second.beats[0].claimRefs).not.toContain('mutation.test');
  });
});
