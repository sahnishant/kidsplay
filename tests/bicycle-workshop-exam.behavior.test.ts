import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { createSessionForCatalogEntry, getCatalogEntries } from '../src/content';

const packId = 'free.english.bicycle-workshop.chapter-check.1';

function validate(): Record<string, unknown> {
  const output = execFileSync(process.execPath, [
    'scripts/learning-graph/validate-bicycle-workshop-exam.mjs',
    '--json'
  ], { cwd: process.cwd(), encoding: 'utf8' });
  return JSON.parse(output.trim()) as Record<string, unknown>;
}

describe('Bicycle Workshop exam-oriented chapter check', () => {
  it('keeps three equivalent eight-mark forms within the admitted chapter scope', () => {
    expect(validate()).toMatchObject({
      blueprintId: 'assessment.bicycle-workshop.class2-english.v1',
      formCount: 3,
      questionsPerForm: 8,
      totalMarks: 8,
      livePackId: packId,
      chapterContextRuntimeEnabled: false,
      semanticCoverage: {
        partsAndJobs: 6,
        words: 6,
        soundsAndSentences: 4,
        applyAndSafety: 6
      }
    });
  });

  it('is visible as a prototype practice check rather than an official paper', () => {
    const entry = getCatalogEntries().find((item) => item.id === packId);
    expect(entry).toMatchObject({
      id: packId,
      kind: 'free_explore',
      status: 'prototype',
      title: 'Bicycle Workshop — Chapter Check',
      actionLabel: 'Try chapter check'
    });

    const session = createSessionForCatalogEntry(packId);
    expect(session.questions).toHaveLength(8);
    expect(new Set(session.questions.map((question) => question.id)).size).toBe(8);
  });
});
