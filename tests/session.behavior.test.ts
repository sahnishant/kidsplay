import { describe, expect, it } from 'vitest';
import type { SingleChoiceQuestion } from '../src/contracts/question';
import { getFreeAnimalsQuestions } from '../src/content';
import { getEngineComponent } from '../src/runtime/engineRegistry';
import { advanceSession, createSessionState, replaySession, submitResponse } from '../src/runtime/session';

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
});
