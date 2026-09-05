import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { getCatalogEntries } from '../src/content';
import {
  createBicycleWorkshopSession,
  getBicycleWorkshopPackQuestions
} from '../src/experience/bicycleWorkshopRuntime';

const packId = 'free.english.bicycle-workshop.chapter-check.1';

function validate(): Record<string, unknown> {
  const output = execFileSync(process.execPath, [
    'scripts/learning-graph/validate-bicycle-workshop-exam.mjs',
    '--json'
  ], { cwd: process.cwd(), encoding: 'utf8' });
  return JSON.parse(output.trim()) as Record<string, unknown>;
}

describe('Bicycle Workshop exam-oriented chapter check', () => {
  it('keeps three equivalent eight-mark forms within the explicit chapter scope overlay', () => {
    expect(validate()).toMatchObject({
      blueprintId: 'assessment.bicycle-workshop.class2-english.v1',
      formCount: 3,
      questionsPerForm: 8,
      totalMarks: 8,
      livePackId: packId,
      livePackQuestionCount: 8,
      chapterContextRuntimeEnabled: false,
      explicitScopeCount: 29,
      scopeCounts: {
        chapter_core: 23,
        chapter_supporting: 6
      },
      semanticCoverage: {
        partsAndJobs: 6,
        words: 6,
        soundsAndSentences: 4,
        applyAndSafety: 6
      }
    });
  });

  it('keeps the live formative check in the lazy chapter runtime', () => {
    expect(getCatalogEntries().some((item) => item.id === packId)).toBe(false);

    const questions = getBicycleWorkshopPackQuestions('chapter_check');
    expect(questions).toHaveLength(8);
    expect(new Set(questions.map((question) => question.id)).size).toBe(8);

    const session = createBicycleWorkshopSession('chapter_check');
    expect(session).toMatchObject({
      id: 'session.bicycle-workshop.chapter-check',
      mode: 'free_explore',
      title: 'Bicycle Workshop — Chapter Check'
    });
    expect(session.questions).toHaveLength(8);
  });
});
