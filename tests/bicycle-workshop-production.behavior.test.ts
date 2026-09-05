import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createSessionForCatalogEntry, getCatalogEntries } from '../src/content';
import { evaluate } from '../src/evaluation/evaluate';
import type { Question } from '../src/contracts/question';

const packId = 'free.english.bicycle-workshop.1';
const readQuestions = (name: string): Question[] => JSON.parse(
  readFileSync(resolve(process.cwd(), `content/questions/${name}`), 'utf8')
) as Question[];
const questions = [
  ...readQuestions('bicycle-workshop-core.json'),
  ...readQuestions('bicycle-workshop-play.json')
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
  it('validates a substantial graph-traced, independently authored production slice', () => {
    expect(validate()).toMatchObject({
      moduleId: 'curriculum-companion.ncert-class2-english.bicycle-workshop.v1',
      graphNodeCount: 79,
      graphClaimCount: 64,
      admittedClaimCount: 29,
      projectionRowCount: 29,
      questionCount: 28,
      sceneCount: 3,
      sourceImagesUsedForGeneration: false
    });
  });

  it('appears in the existing child catalogue and launches through the canonical session path', () => {
    const entry = getCatalogEntries().find((item) => item.id === packId);
    expect(entry).toMatchObject({
      id: packId,
      kind: 'free_explore',
      title: 'Bicycle Workshop — Class 2 English',
      access: { type: 'free' },
      status: 'ready',
      actionLabel: 'Enter workshop'
    });

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

  it('keeps capability-only phonics evidence separate from bicycle fact mastery', () => {
    const question = byId.get('bicycle.workshop.phonics.short-a.001');
    expect(question).toBeTruthy();
    expect(question!.knowledgeRefs).toBeUndefined();
    const result = evaluate(question!, { selectedOptionIds: ['cat'] });
    expect(result.correct).toBe(true);
    expect(result.knowledgeEvidence).toEqual([]);
    expect(result.masteryEvidence.map((item) => item.conceptId)).toEqual([
      'capability.english.phonics.short-a-recognition'
    ]);
  });

  it('uses no chapter-local poem claim as a runtime mastery target', () => {
    for (const question of questions) {
      expect((question.knowledgeRefs ?? []).some((ref) => ref.startsWith('claim.chapter.'))).toBe(false);
    }
  });
});
