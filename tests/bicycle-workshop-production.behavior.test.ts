import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { getCatalogEntries } from '../src/content';
import type { Question } from '../src/contracts/question';
import { evaluate } from '../src/evaluation/evaluate';
import {
  createBicycleWorkshopSession,
  getBicycleWorkshopPackQuestions,
  getBicycleWorkshopQuestionBank
} from '../src/experience/bicycleWorkshopRuntime';

const practicePackId = 'free.english.bicycle-workshop.1';
const questions = getBicycleWorkshopQuestionBank();
const byId = new Map(questions.map((question) => [question.id, question] as const));
const innerMechanicsQuestionIds = new Set([
  'bicycle.workshop.sequence.motion.001',
  'bicycle.workshop.sequence.braking.001'
]);
const pedalDriveClaimIds = new Set([
  'claim.push-pedals.contributes-to.crank-turns',
  'claim.crank-turns.contributes-to.chain-moves',
  'claim.chain-moves.contributes-to.rear-wheel-turns',
  'claim.rear-wheel-turns.contributes-to.bicycle-movement'
]);

function validate(): Record<string, unknown> {
  const output = execFileSync(process.execPath, [
    'scripts/learning-graph/validate-bicycle-workshop-production.mjs',
    '--json'
  ], { cwd: process.cwd(), encoding: 'utf8' });
  return JSON.parse(output.trim()) as Record<string, unknown>;
}

function requireQuestion(id: string): Question {
  const question = byId.get(id);
  if (!question) throw new Error(`Missing Bicycle Workshop question ${id}`);
  return question;
}

describe('Bicycle Workshop end-to-end chapter companion', () => {
  it('validates the complete graph-traced, independently authored production slice', () => {
    expect(validate()).toMatchObject({
      moduleId: 'curriculum-companion.ncert-class2-english.bicycle-workshop.v1',
      sectionCount: 7,
      graphNodeCount: 93,
      graphClaimCount: 88,
      admittedClaimCount: 40,
      projectionRowCount: 40,
      questionCount: 32,
      practiceQuestionCount: 30,
      chapterCheckQuestionCount: 8,
      sceneCount: 3,
      aiArtBriefCount: 6,
      sourceImagesUsedForGeneration: false,
      finalAiArtStatus: 'prompt_specification_ready_final_assets_not_yet_generated',
      eagerGlobalQuestionCount: 0,
      eagerGlobalPackCount: 0
    });
  });

  it('keeps the chapter bank out of the eager global catalogue and loads it through its own runtime', () => {
    expect(getCatalogEntries().some((entry) => entry.id.startsWith('free.english.bicycle-workshop'))).toBe(false);

    const bank = getBicycleWorkshopPackQuestions('practice');
    expect(bank).toHaveLength(30);
    expect(bank.every((question) => byId.has(question.id))).toBe(true);
    expect(bank.filter((question) => question.id.startsWith('bicycle.workshop.reading.'))).toHaveLength(4);

    const session = createBicycleWorkshopSession('practice');
    expect(session).toMatchObject({
      id: 'session.bicycle-workshop.practice',
      mode: 'free_explore',
      title: 'Bicycle Workshop — Class 2 English'
    });
    expect(session.questions).toHaveLength(8);
    expect(session.questions.every((question) => byId.has(question.id))).toBe(true);
    expect(new Set(session.questions.map((question) => question.interaction.type)).size).toBeGreaterThanOrEqual(4);
  });

  it('keeps inner pedal-drive and braking chains available for explanation but out of scored packs', () => {
    for (const mode of ['practice', 'chapter_check'] as const) {
      const pack = getBicycleWorkshopPackQuestions(mode);
      expect(pack.some((question) => innerMechanicsQuestionIds.has(question.id))).toBe(false);
      expect(pack.some((question) => (question.knowledgeRefs ?? []).some((ref) => pedalDriveClaimIds.has(ref)))).toBe(false);
    }
    expect(byId.has('bicycle.workshop.sequence.motion.001')).toBe(true);
    expect(byId.has('bicycle.workshop.sequence.braking.001')).toBe(true);
  });

  it('uses exact graph-claim weakness to choose the practice item inside an activity lane', () => {
    const session = createBicycleWorkshopSession('practice', {
      'claim.bicycle.has-property.two-wheels': { attempts: 3, correct: 3, totalWeight: 3, correctWeight: 3, lastResult: 'correct', lastSeenAt: '2026-09-05T00:00:00.000Z' },
      'claim.bicycle.has-property.human-power': { attempts: 3, correct: 3, totalWeight: 3, correctWeight: 3, lastResult: 'correct', lastSeenAt: '2026-09-05T00:00:00.000Z' },
      'claim.bicycle.is-a.wheeled-vehicle': {
        attempts: 3,
        correct: 3,
        totalWeight: 3,
        correctWeight: 3,
        lastResult: 'correct',
        lastSeenAt: '2026-09-05T00:00:00.000Z'
      }
    });
    expect(session.questions).toHaveLength(8);
    expect(session.questions.some((question) => question.id === 'bicycle.workshop.identity.001')).toBe(false);
    expect(session.questions.some((question) => (question.knowledgeRefs ?? []).some(
      (rowId) => rowId !== 'claim.bicycle.is-a.wheeled-vehicle'
    ))).toBe(true);
  });

  it('keeps the revised unapproved functional target practice-only through the existing evaluator', () => {
    const question = requireQuestion('bicycle.workshop.control.brake.001');
    const result = evaluate(question, { selectedOptionIds: ['brake'] });
    expect(result.correct).toBe(true);
    expect(question.evidencePolicy).toBe('practice_only');
    expect(question.authoring.status).toBe('draft');
    expect(result.knowledgeEvidence).toEqual([]);
    expect(result.masteryEvidence).toEqual([]);
  });

  it('does not treat old classification evidence as evidence for the new identity claims', () => {
    const session = createBicycleWorkshopSession('practice', {
      'claim.bicycle.is-a.wheeled-vehicle': { attempts: 3, correct: 3, totalWeight: 3, correctWeight: 3, lastResult: 'correct', lastSeenAt: '2026-09-05T00:00:00.000Z' }
    });
    expect(session.questions.some((item) => item.id === 'bicycle.workshop.identity.001')).toBe(true);
    const identity = requireQuestion('bicycle.workshop.identity.001');
    expect(identity.knowledgeRefs).toContain('claim.bicycle.has-property.two-wheels');
    expect(identity.knowledgeRefs).toContain('claim.bicycle.has-property.human-power');
    expect(evaluate(identity, { selectedOptionIds: ['bicycle'] }).masteryEvidence).toEqual([]);
  });

  it('keeps capability-only phonics and reading evidence separate from bicycle fact mastery', () => {
    const phonics = requireQuestion('bicycle.workshop.phonics.short-a.001');
    expect(phonics.knowledgeRefs).toBeUndefined();
    const phonicsResult = evaluate(phonics, { selectedOptionIds: ['cat'] });
    expect(phonicsResult.correct).toBe(true);
    expect(phonicsResult.knowledgeEvidence).toEqual([]);
    expect(phonicsResult.masteryEvidence.map((item) => item.conceptId)).toEqual([
      'capability.english.phonics.short-a-recognition'
    ]);

    const reading = requireQuestion('bicycle.workshop.reading.detail.001');
    expect(reading.knowledgeRefs).toBeUndefined();
    const readingResult = evaluate(reading, { selectedOptionIds: ['helmet'] });
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

  it('retains the independent pack identity inside the lazy runtime', () => {
    expect(practicePackId).toBe('free.english.bicycle-workshop.1');
  });
});
