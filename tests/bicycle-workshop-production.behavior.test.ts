import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createSessionForCatalogEntry, getCatalogEntries, getFreePackQuestions } from '../src/content';
import { evaluate } from '../src/evaluation/evaluate';
import type { Question } from '../src/contracts/question';

const packId = 'free.english.bicycle-workshop.1';
const readQuestions = (name: string): Question[] => JSON.parse(
  readFileSync(resolve(process.cwd(), `content/questions/${name}`), 'utf8')
) as Question[];
const questions = [
  ...readQuestions('bicycle-workshop-core.json'),
  ...readQuestions('bicycle-workshop-play.json'),
  ...readQuestions('bicycle-workshop-reading.json')
];
const byId = new Map(questions.map((question) => [question.id, question]));

function validate(): Record<string, unknown> {
  const output = execFileSync(process.execPath, [
    'scripts/learning-graph/validate-bicycle-workshop-production.mjs',
    '--json'
  ], { cwd: process.cwd(), encoding: 'utf8' });
  return JSON.parse(output.trim()) as Record<string, unknown>;
}

describe('Bicycle Workshop end-to-end chapter companion', () => {
  it('validates the complete graph-traced, independently authored production slice', () => {
    expect(validate()).toMatchObject({
      moduleId: 'curriculum-companion.ncert-class2-english.bicycle-workshop.v1',
      sectionCount: 7,
      graphNodeCount: 79,
      graphClaimCount: 64,
      admittedClaimCount: 29,
      projectionRowCount: 29,
      questionCount: 32,
      practiceQuestionCount: 32,
      chapterCheckQuestionCount: 8,
      sceneCount: 3,
      aiArtBriefCount: 6,
      sourceImagesUsedForGeneration: false,
      finalAiArtStatus: 'prompt_specification_ready_final_assets_not_yet_generated'
    });
  });

  it('appears in the existing child catalogue with the composed 32-question chapter bank', () => {
    const entry = getCatalogEntries().find((item) => item.id === packId);
    expect(entry).toMatchObject({
      id: packId,
      kind: 'free_explore',
      title: 'Bicycle Workshop — Class 2 English',
      access: { type: 'free' },
      status: 'ready',
      actionLabel: 'Enter workshop'
    });

    const bank = getFreePackQuestions(packId);
    expect(bank).toHaveLength(32);
    expect(bank.every((question) => byId.has(question.id))).toBe(true);
    expect(bank.filter((question) => question.id.startsWith('bicycle.workshop.reading.'))).toHaveLength(4);

    const session = createSessionForCatalogEntry(packId);
    expect(session.mode).toBe('free_explore');
    expect(session.questions).toHaveLength(8);
    expect(session.questions.every((question) => byId.has(question.id))).toBe(true);
    expect(new Set(session.questions.map((question) => question.interaction.type)).size).toBeGreaterThanOrEqual(4);
  });

  it('records exact graph-claim evidence through the existing evaluator', () => {
    const question = byId.get('bicycle.workshop.control.brake.001');
    expect(question).toBeTruthy();
    const result = evaluate(question!, { selectedOptionIds: ['brake'] });
    expect(result.correct).toBe(true);
    expect(result.knowledgeEvidence.map((item) => item.rowId)).toEqual(question!.knowledgeRefs);
    expect(result.masteryEvidence.some((item) => item.conceptId === 'bicycle.braking.chain')).toBe(true);
  });

  it('keeps capability-only phonics and reading evidence separate from bicycle fact mastery', () => {
    const phonics = byId.get('bicycle.workshop.phonics.short-a.001');
    expect(phonics).toBeTruthy();
    expect(phonics!.knowledgeRefs).toBeUndefined();
    const phonicsResult = evaluate(phonics!, { selectedOptionIds: ['cat'] });
    expect(phonicsResult.correct).toBe(true);
    expect(phonicsResult.knowledgeEvidence).toEqual([]);
    expect(phonicsResult.masteryEvidence.map((item) => item.conceptId)).toEqual([
      'capability.english.phonics.short-a-recognition'
    ]);

    const reading = byId.get('bicycle.workshop.reading.detail.001');
    expect(reading?.knowledgeRefs).toBeUndefined();
    const readingResult = evaluate(reading!, { selectedOptionIds: ['helmet'] });
    expect(readingResult.correct).toBe(true);
    expect(readingResult.knowledgeEvidence).toEqual([]);
    expect(readingResult.masteryEvidence.map((item) => item.conceptId)).toEqual([
      'capability.english.reading.literal-retrieval'
    ]);
  });

  it('uses no chapter-local poem claim as a runtime mastery target', () => {
    for (const question of questions) {
      expect((question.knowledgeRefs ?? []).some((ref) => ref.startsWith('claim.chapter.'))).toBe(false);
    }
  });
});
