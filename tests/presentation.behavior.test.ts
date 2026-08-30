import { describe, expect, it } from 'vitest';
import type { SingleChoiceQuestion } from '../src/contracts/question';
import { resolveQuestionSceneId } from '../src/presentation/questionScene';

function question(overrides: Partial<SingleChoiceQuestion> = {}): SingleChoiceQuestion {
  return {
    id: 'test.presentation.scene.001',
    revision: 1,
    schemaVersion: 1,
    conceptIds: ['animals.dog.domestic-classification'],
    knowledgeRefs: ['kr.animals.dog.domestic'],
    difficulty: 1,
    language: 'en',
    prompt: { text: 'Which animal can live with people?' },
    interaction: {
      type: 'single_choice',
      version: 1,
      shuffleOptions: false,
      options: [
        { id: 'dog', label: 'Dog' },
        { id: 'whale', label: 'Whale' }
      ]
    },
    solution: { type: 'exact_option', correctOptionIds: ['dog'] },
    feedback: { correct: 'Correct.', incorrect: 'Try again.' },
    authoring: { status: 'reviewed', source: 'behavior-test' },
    ...overrides
  };
}

describe('lightweight question presentation', () => {
  it('reuses a compatible animated scene for a knowledge-backed generated question', () => {
    expect(resolveQuestionSceneId(question())).toBe('scene.dog.happy-bone');
  });

  it('keeps an explicit authored stimulus authoritative', () => {
    expect(
      resolveQuestionSceneId(
        question({ stimulus: { type: 'scene', sceneId: 'scene.dog.wrong-water' } })
      )
    ).toBe('scene.dog.wrong-water');
  });

  it('does not invent a visual when no exact presentation mapping exists', () => {
    expect(
      resolveQuestionSceneId(
        question({ conceptIds: ['unknown.concept'], knowledgeRefs: ['kr.unknown.row'] })
      )
    ).toBeNull();
  });
});
