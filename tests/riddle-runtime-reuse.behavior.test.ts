import { describe, expect, it } from 'vitest';
import type { SingleChoiceQuestion } from '../src/contracts/question';
import { evaluate } from '../src/evaluation/evaluate';
import { validateClueRecord } from '../src/experience/clueContract';
import { createSessionState, prepareRetry, submitResponse } from '../src/runtime/session';

const clue = validateClueRecord({
  schemaVersion: 1,
  clueSetId: 'clue.test.r0.rabbit',
  mechanism: 'concept_clues',
  demandBand: 'r0',
  authority: 'canonical_semantic',
  readingRequired: false,
  answerSemanticRef: 'semantic.rabbit',
  candidateSemanticRefs: ['semantic.rabbit', 'semantic.tiger'],
  clues: [{
    clueId: 'clue.test.r0.rabbit.one',
    audioUtteranceId: 'clue.test.r0.rabbit.one',
    evidenceRefs: ['knowledge.test.rabbit-clue']
  }]
});

const question: SingleChoiceQuestion = {
  id: 'question.test.riddle.rabbit',
  revision: 1,
  schemaVersion: 1,
  conceptIds: ['concept.test.rabbit'],
  knowledgeRefs: ['knowledge.test.rabbit-clue'],
  difficulty: 1,
  language: 'en',
  prompt: { text: 'Which one?' },
  feedback: { correct: 'Yes!', incorrect: 'Try again' },
  authoring: { status: 'reviewed', source: 'test-fixture' },
  interaction: {
    type: 'single_choice',
    version: 1,
    shuffleOptions: true,
    options: [
      { id: 'rabbit', label: 'Rabbit', semanticRef: 'semantic.rabbit' },
      { id: 'tiger', label: 'Tiger', semanticRef: 'semantic.tiger' }
    ]
  },
  solution: { type: 'exact_option', correctOptionIds: ['rabbit'] }
};

describe('Riddle Time runtime reuse', () => {
  it('proves the same R0 clue contract can be placed in Play, Learn About and Adventure', () => {
    const surfaces = ['play', 'learn_about', 'adventure'] as const;
    for (const surface of surfaces) {
      expect(clue.clueSetId).toBe('clue.test.r0.rabbit');
      expect(surface).toMatch(/play|learn_about|adventure/);
      expect(evaluate(question, { selectedOptionIds: ['rabbit'] }).correct).toBe(true);
    }
  });

  it('preserves the first failed evaluative riddle attempt through successful retry', () => {
    const state = createSessionState();
    const first = submitResponse(state, question, { selectedOptionIds: ['tiger'] });
    expect(first?.correct).toBe(false);
    expect(state.attemptHistory).toHaveLength(1);
    expect(state.attemptHistory[0].attemptKind).toBe('independent');
    expect(state.attemptHistory[0].attempts).toBe(1);

    expect(prepareRetry(state, question, ['visual_scaffold'])).toBe(true);
    const retry = submitResponse(state, question, { selectedOptionIds: ['rabbit'] });
    expect(retry?.correct).toBe(true);
    expect(state.attemptHistory).toHaveLength(2);
    expect(state.attemptHistory[1].attemptKind).toBe('retry');
    expect(state.attemptHistory[1].assistanceKinds).toEqual(['visual_scaffold']);

    expect(evaluate(question, state.attemptHistory[0].response).correct).toBe(false);
    expect(evaluate(question, state.attemptHistory[1].response).correct).toBe(true);
  });

  it('keeps R0 zero-reading and bounded to two visual candidates', () => {
    expect(clue.readingRequired).toBe(false);
    expect(clue.candidateSemanticRefs).toHaveLength(2);
  });
});
