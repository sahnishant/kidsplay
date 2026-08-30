import { describe, expect, it } from 'vitest';
import type { SingleChoiceQuestion } from '../src/contracts/question';
import {
  resolveDashboardSceneId,
  resolveQuestionSceneId
} from '../src/presentation/questionScene';

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

  it('maps additional exact canonical facts to reusable motion scenes', () => {
    expect(
      resolveQuestionSceneId(
        question({ conceptIds: ['air.properties.windmill'], knowledgeRefs: ['kr.air.windmill.turned-by.wind'] })
      )
    ).toBe('scene.air.windmill');
    expect(
      resolveQuestionSceneId(
        question({ conceptIds: ['water.sources.sea'], knowledgeRefs: ['kr.water.sea.feature.salty'] })
      )
    ).toBe('scene.water.sea-salty');
    expect(
      resolveQuestionSceneId(
        question({ conceptIds: ['plants.importance.air'], knowledgeRefs: ['kr.plants.general.air.cool-fresh'] })
      )
    ).toBe('scene.plants.air-fresh');
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

  it('only exposes dashboard scenes for topics with a meaningful reusable visual', () => {
    expect(resolveDashboardSceneId('animals')).toBe('scene.dog.happy-bone');
    expect(resolveDashboardSceneId('air')).toBe('scene.air.windmill');
    expect(resolveDashboardSceneId('human')).toBeNull();
  });
});
