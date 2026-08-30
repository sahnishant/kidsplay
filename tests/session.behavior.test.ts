import { describe, expect, it } from 'vitest';
import type { SingleChoiceQuestion } from '../src/contracts/question';
import type { EvaluationResult } from '../src/contracts/runtime';
import { getFreeAnimalsQuestions } from '../src/content';
import { getEngineComponent } from '../src/runtime/engineRegistry';
import {
  advanceSession,
  createSessionState,
  replaySession,
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
  it('allows one answer per question, advances cleanly and resets on replay', () => {
    const question = testQuestion();
    const state = createSessionState();

    const first = submitResponse(state, question, { selectedOptionIds: ['dog'] });
    expect(first?.correct).toBe(true);
    expect(state.responses).toHaveLength(1);
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
    expect(state.index).toBe(0);
    expect(state.responses).toHaveLength(0);
    expect(state.results).toHaveLength(0);
  });

  it('keeps every shipped interactive question connected to a runtime engine', () => {
    const questions = getFreeAnimalsQuestions();
    const interactionTypes = new Set(questions.map((question) => question.interaction.type));

    expect(interactionTypes.size).toBe(9);
    for (const question of questions) expect(() => getEngineComponent(question)).not.toThrow();
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
