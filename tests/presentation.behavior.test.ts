import { describe, expect, it } from 'vitest';
import type { SingleChoiceQuestion } from '../src/contracts/question';
import {
  getReferencedPresentationSceneIds,
  resolveDashboardSceneId,
  resolveQuestionSceneId
} from '../src/presentation/questionScene';

const sceneModules = import.meta.glob('../content/scenes/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, unknown>;
const registeredSceneIds = new Set(
  Object.values(sceneModules)
    .flatMap((value) => (Array.isArray(value) ? value : []))
    .map((scene) => (scene as { id?: string }).id)
    .filter((id): id is string => typeof id === 'string')
);

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
        question({ conceptIds: ['human.organs.lungs'], knowledgeRefs: ['kr.human.lungs.function.breathe'] })
      )
    ).toBe('scene.human.lungs-breathing');
    expect(
      resolveQuestionSceneId(
        question({ conceptIds: ['air.properties.windmill'], knowledgeRefs: ['kr.air.windmill.turned-by.wind'] })
      )
    ).toBe('scene.air.windmill');
    expect(
      resolveQuestionSceneId(
        question({ conceptIds: ['air.properties.kite'], knowledgeRefs: ['kr.air.kite.moved-by.wind'] })
      )
    ).toBe('scene.air.kite-wind');
    expect(
      resolveQuestionSceneId(
        question({ conceptIds: ['air.properties.sailboat'], knowledgeRefs: ['kr.air.sailboat.moved-by.wind'] })
      )
    ).toBe('scene.air.sailboat-wind');
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
    expect(
      resolveQuestionSceneId(
        question({ conceptIds: ['universe.earth.rotation'], knowledgeRefs: ['kr.universe.earth.rotation.day-night'] })
      )
    ).toBe('scene.universe.earth-rotation');
  });

  it('reuses the lungs visual for breathing-air reinforcement', () => {
    expect(
      resolveQuestionSceneId(
        question({ conceptIds: ['air.properties.breathing'], knowledgeRefs: ['kr.air.breathing.need.air'] })
      )
    ).toBe('scene.human.lungs-breathing');
  });

  it('can suppress inferred learning cues for assessment surfaces', () => {
    expect(resolveQuestionSceneId(question(), false)).toBeNull();
  });

  it('keeps an explicit authored stimulus authoritative even when inference is disabled', () => {
    expect(
      resolveQuestionSceneId(
        question({ stimulus: { type: 'scene', sceneId: 'scene.dog.wrong-water' } }),
        false
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
    expect(resolveDashboardSceneId('human')).toBe('scene.human.lungs-breathing');
    expect(resolveDashboardSceneId('universe')).toBe('scene.universe.earth-rotation');
    expect(resolveDashboardSceneId('food')).toBeNull();
  });

  it('keeps every inferred/dashboard mapping attached to a registered scene definition across all scene packs', () => {
    expect(registeredSceneIds.size).toBeGreaterThan(0);
    expect(getReferencedPresentationSceneIds().length).toBeGreaterThan(0);
    for (const sceneId of getReferencedPresentationSceneIds()) {
      expect(registeredSceneIds.has(sceneId), `missing scene definition for ${sceneId}`).toBe(true);
    }
  });
});
