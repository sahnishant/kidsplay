import { describe, expect, it } from 'vitest';
import type { SingleChoiceQuestion } from '../src/contracts/question';
import type { EvaluationResult } from '../src/contracts/runtime';
import { getFreeAnimalsQuestions } from '../src/content';
import { getEngineComponent, getEngineRetryCapability } from '../src/runtime/engineRegistry';
import { resolveRetryPolicy } from '../src/runtime/retryPolicy';
import {
  advanceSession,
  createSessionCheckpoint,
  createSessionState,
  prepareRetry,
  replaySession,
  restoreSessionState,
  submitResponse,
  summarizeSectionResults
} from '../src/runtime/session';

function testQuestion(): SingleChoiceQuestion {
  return {
    id: 'test.animals.dog.choice.001',
    revision: 1,
    schemaVersion: 1,
    conceptIds: ['test.animals.domestic'],
    knowledgeRefs: ['kr.test.animals.dog.domestic'],
    difficulty: 1,
    language: 'en',
    prompt: { text: 'Which animal is a common pet?' },
    feedback: {
      correct: 'Yes, a dog is a common pet.',
      incorrect: 'Try the animal that often lives with people.'
    },
    authoring: { status: 'reviewed', source: 'behavior-test' },
    interaction: {
      type: 'single_choice',
      version: 1,
      shuffleOptions: false,
      options: [
        { id: 'dog', label: 'Dog' },
        { id: 'whale', label: 'Whale' }
      ]
    },
    solution: { type: 'exact_option', correctOptionIds: ['dog'] }
  };
}

function result(correct: boolean): EvaluationResult {
  return {
    correct,
    score: correct ? 1 : 0,
    maxScore: 1,
    feedbackKey: correct ? 'correct' : 'incorrect',
    masteryEvidence: [],
    knowledgeEvidence: []
  };
}

describe('session state and engine hosting', () => {
  it('allows one answer per question, advances cleanly and resets with fresh identity on replay', () => {
    const question = testQuestion();
    const state = createSessionState();
    const originalSessionId = state.sessionId;

    const first = submitResponse(state, question, { selectedOptionIds: ['dog'] });
    expect(first?.correct).toBe(true);
    expect(state.responses).toHaveLength(1);
    expect(state.attemptHistory).toHaveLength(1);
    expect(state.results).toHaveLength(1);
    expect(state.submitted).toBe(true);

    const duplicate = submitResponse(state, question, { selectedOptionIds: ['whale'] });
    expect(duplicate).toBeNull();
    expect(state.responses).toHaveLength(1);

    advanceSession(state);
    expect(state.index).toBe(1);
    expect(state.submitted).toBe(false);
    expect(state.lastResult).toBeNull();

    replaySession(state);
    expect(state.sessionId).not.toBe(originalSessionId);
    expect(state.index).toBe(0);
    expect(state.responses).toHaveLength(0);
    expect(state.attemptHistory).toHaveLength(0);
    expect(state.results).toHaveLength(0);
  });

  it('keeps the first independent response immutable while a later retry completes the item', () => {
    const question = testQuestion();
    const state = createSessionState();

    const firstResult = submitResponse(state, question, { selectedOptionIds: ['whale'] });
    const firstResponse = state.attemptHistory[0];
    expect(firstResult?.correct).toBe(false);
    expect(firstResponse).toMatchObject({ attempts: 1, attemptKind: 'independent', assistanceKinds: [] });

    expect(prepareRetry(state, question)).toBe(true);
    expect(state.submitted).toBe(false);
    expect(state.retryState).toMatchObject({ attemptNumber: 2, assistanceKinds: [] });

    const retryResult = submitResponse(state, question, { selectedOptionIds: ['dog'] });
    expect(retryResult?.correct).toBe(true);
    expect(state.responses).toHaveLength(1);
    expect(state.results).toHaveLength(1);
    expect(state.results[0].correct).toBe(true);
    expect(state.responses[0]).toMatchObject({ attempts: 2, attemptKind: 'retry', assistanceKinds: [] });
    expect(state.attemptHistory).toHaveLength(2);
    expect(state.attemptHistory[0]).toEqual(firstResponse);
    expect(state.attemptHistory[0].response).toEqual({ selectedOptionIds: ['whale'] });
  });

  it('persists an open assisted retry and its original wrong evidence through checkpoint restore', () => {
    const question = testQuestion();
    const state = createSessionState();
    submitResponse(state, question, { selectedOptionIds: ['whale'] });

    expect(prepareRetry(state, question)).toBe(true);
    submitResponse(state, question, { selectedOptionIds: ['whale'] });
    expect(prepareRetry(state, question, ['explanation', 'visual_scaffold'])).toBe(true);

    const checkpoint = createSessionCheckpoint(state);
    const restored = restoreSessionState([question], checkpoint);

    expect(restored.submitted).toBe(false);
    expect(restored.responses).toHaveLength(1);
    expect(restored.attemptHistory).toHaveLength(2);
    expect(restored.attemptHistory[0]).toMatchObject({ attempts: 1, attemptKind: 'independent' });
    expect(restored.attemptHistory[1]).toMatchObject({ attempts: 2, attemptKind: 'retry' });
    expect(restored.retryState).toEqual({
      questionId: question.id,
      attemptNumber: 3,
      assistanceKinds: ['explanation', 'visual_scaffold']
    });

    const recovered = submitResponse(restored, question, { selectedOptionIds: ['dog'] });
    expect(recovered?.correct).toBe(true);
    expect(restored.responses[0]).toMatchObject({
      attempts: 3,
      attemptKind: 'retry',
      assistanceKinds: ['explanation', 'visual_scaffold']
    });
    expect(restored.attemptHistory).toHaveLength(3);
    expect(restored.attemptHistory[0].response).toEqual({ selectedOptionIds: ['whale'] });
  });

  it('restores submitted feedback from a compact checkpoint without trusting stored scores', () => {
    const question = testQuestion();
    const state = createSessionState();
    submitResponse(state, question, { selectedOptionIds: ['dog'] });

    const checkpoint = createSessionCheckpoint(state);
    const restored = restoreSessionState([question], checkpoint);

    expect(restored.sessionId).toBe(state.sessionId);
    expect(restored.index).toBe(0);
    expect(restored.submitted).toBe(true);
    expect(restored.responses).toEqual(state.responses);
    expect(restored.attemptHistory).toEqual(state.attemptHistory);
    expect(restored.results).toHaveLength(1);
    expect(restored.results[0].correct).toBe(true);
    expect(restored.lastResult?.correct).toBe(true);
    expect(restored.startedAtEpoch).toBeGreaterThan(0);
  });

  it('rejects checkpoints whose position or response contract does not match the question set', () => {
    const question = testQuestion();
    const state = createSessionState();
    submitResponse(state, question, { selectedOptionIds: ['dog'] });
    const checkpoint = createSessionCheckpoint(state);

    expect(() => restoreSessionState([question], {
      ...checkpoint,
      index: 1,
      submitted: true
    })).toThrow(/completed session checkpoint/i);

    expect(() => restoreSessionState([question], {
      ...checkpoint,
      responses: [{ ...checkpoint.responses[0], questionRevision: 999 }]
    })).toThrow(/does not match the current question contract/i);
  });

  it('keeps every shipped interactive question connected to a runtime engine', () => {
    const questions = getFreeAnimalsQuestions();
    const interactionTypes = new Set(questions.map((question) => question.interaction.type));

    expect(interactionTypes.size).toBe(9);
    for (const question of questions) expect(() => getEngineComponent(question)).not.toThrow();
  });

  it('declares shared safe retry support for SingleChoice plus two non-trivial engines', () => {
    const questions = getFreeAnimalsQuestions();
    for (const interactionType of ['single_choice', 'drag_to_target', 'word_bank_fill'] as const) {
      const question = questions.find((candidate) => candidate.interaction.type === interactionType);
      expect(question, `${interactionType} fixture should exist`).toBeDefined();
      expect(getEngineRetryCapability(question!)).toBe('reset_for_retry');
    }
  });

  it('keeps retry and scaffolding out of structured assessment modes', () => {
    const question = testQuestion();
    expect(resolveRetryPolicy(question, 'free_explore')).toMatchObject({
      capability: 'reset_for_retry',
      retryAllowed: true,
      scaffoldAllowed: true
    });
    expect(resolveRetryPolicy(question, 'goal_mock')).toMatchObject({
      retryAllowed: false,
      scaffoldAllowed: false
    });
    expect(resolveRetryPolicy(question, 'goal_pattern_mock')).toMatchObject({
      retryAllowed: false,
      scaffoldAllowed: false
    });
  });

  it('summarizes structured mock performance without mixing section boundaries or marks', () => {
    const summary = summarizeSectionResults(
      [
        { id: 'logical_reasoning', title: 'Logical Reasoning', startIndex: 0, count: 2, marksPerQuestion: 1 },
        { id: 'science', title: 'Science', startIndex: 2, count: 3, marksPerQuestion: 1 },
        { id: 'achievers', title: 'Achievers', startIndex: 5, count: 1, marksPerQuestion: 2 }
      ],
      [result(true), result(false), result(true), result(true), result(false), result(true)]
    );

    expect(summary).toEqual([
      {
        id: 'logical_reasoning',
        title: 'Logical Reasoning',
        correct: 1,
        answered: 2,
        total: 2,
        accuracy: 0.5,
        earnedMarks: 1,
        maxMarks: 2
      },
      {
        id: 'science',
        title: 'Science',
        correct: 2,
        answered: 3,
        total: 3,
        accuracy: 2 / 3,
        earnedMarks: 2,
        maxMarks: 3
      },
      {
        id: 'achievers',
        title: 'Achievers',
        correct: 1,
        answered: 1,
        total: 1,
        accuracy: 1,
        earnedMarks: 2,
        maxMarks: 2
      }
    ]);
  });
});
