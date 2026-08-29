import { beforeEach, describe, expect, it } from 'vitest';
import type { SingleChoiceQuestion } from '../src/contracts/question';
import {
  loadChildSettings,
  loadProgress,
  recordAttempt,
  saveChildSettings,
  summarizeProgress
} from '../src/runtime/localProgress';
import { createSessionState, submitResponse } from '../src/runtime/session';

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

beforeEach(() => {
  window.localStorage.clear();
});

describe('offline progress persistence', () => {
  it('persists player settings on the device', () => {
    const saved = saveChildSettings({ name: 'Dheu', avatar: 'owl' });
    expect(saved).toEqual({ name: 'Dheu', avatar: 'owl' });
    expect(loadChildSettings()).toEqual(saved);
  });

  it('persists attempts and aggregates row and concept mastery', () => {
    const question = testQuestion();

    for (let index = 0; index < 2; index += 1) {
      const state = createSessionState();
      const result = submitResponse(state, question, { selectedOptionIds: ['dog'] });
      expect(result).not.toBeNull();
      recordAttempt({
        question,
        response: state.responses[0],
        result: result!
      });
    }

    const progress = loadProgress();
    const knowledge = progress.knowledge['kr.test.animals.dog.domestic'];
    const concept = progress.concepts['test.animals.domestic'];
    const summary = summarizeProgress(progress);

    expect(progress.attempts).toHaveLength(2);
    expect(knowledge.attempts).toBe(2);
    expect(knowledge.correct).toBe(2);
    expect(concept.attempts).toBe(2);
    expect(summary.totalAttempts).toBe(2);
    expect(summary.accuracy).toBe(1);
    expect(summary.practicedKnowledge).toBe(1);
    expect(summary.masteredKnowledge).toBe(1);
  });
});
