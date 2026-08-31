import { describe, expect, it } from 'vitest';
import sceneJson from '../content/scenes/animals.json';
import missionJson from '../content/story/missions.json';
import type { SingleChoiceQuestion } from '../src/contracts/question';
import { resolveAnimationComposition } from '../src/presentation/animationRegistry';
import { resolveQuestionSceneId } from '../src/presentation/questionScene';

function question(overrides: Partial<SingleChoiceQuestion> = {}): SingleChoiceQuestion {
  return {
    id: 'test.semantic.reaction.001',
    revision: 1,
    schemaVersion: 1,
    conceptIds: ['unknown.concept'],
    knowledgeRefs: [],
    difficulty: 2,
    language: 'en',
    prompt: { text: 'Choose the best answer.' },
    interaction: {
      type: 'single_choice',
      version: 1,
      shuffleOptions: false,
      options: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' }
      ]
    },
    solution: { type: 'exact_option', correctOptionIds: ['a'] },
    feedback: { correct: 'Correct.', incorrect: 'Try again.' },
    authoring: { status: 'reviewed', source: 'behavior-test' },
    ...overrides
  };
}

const scenes = new Map(sceneJson.map((scene) => [scene.id, scene]));

describe('semantic learning and Story World reaction composition', () => {
  it('routes reusable animal scene ids through authored semantic compositions', () => {
    const expected = new Map([
      ['scene.dog.play-ball', 'animation.dog.excited-ball'],
      ['scene.dog.resting-mat', 'animation.dog.resting-mat'],
      ['scene.whale.swimming', 'animation.whale.ocean-swim'],
      ['scene.bird.branch', 'animation.bird.branch-flap'],
      ['scene.cow.grazing', 'animation.cow.grass-chew']
    ]);

    for (const [sceneId, animationId] of expected) {
      const scene = scenes.get(sceneId);
      expect(scene, `${sceneId} should be registered`).toBeTruthy();
      expect('animationRef' in (scene ?? {}) ? scene?.animationRef : undefined).toBe(animationId);
      expect(resolveAnimationComposition(animationId), `${animationId} should resolve`).toBeTruthy();
    }
  });

  it('adds bird reinforcement for exact canonical Class 2 and Class 3 semantics', () => {
    expect(resolveQuestionSceneId(question({
      conceptIds: ['animals.body-coverings.feathers'],
      knowledgeRefs: ['kr.animals.bird.covering.feathers']
    }))).toBe('scene.bird.branch');

    expect(resolveQuestionSceneId(question({
      conceptIds: ['sof3.birds.beaks', 'sof3.birds.wings'],
      knowledgeRefs: ['kr.sof3.birds.beak.eating', 'kr.sof3.birds.wings.flight'],
      difficulty: 3
    }))).toBe('scene.bird.branch');
  });

  it('uses cow grazing only for the exact herbivore semantic row', () => {
    expect(resolveQuestionSceneId(question({
      conceptIds: ['sof3.animals.feeding.herbivore'],
      knowledgeRefs: ['kr.sof3.animals.feeding.herbivore']
    }))).toBe('scene.cow.grazing');

    expect(resolveQuestionSceneId(question({
      conceptIds: ['sof3.animals.feeding.carnivore'],
      knowledgeRefs: ['kr.sof3.animals.feeding.carnivore']
    }))).toBeNull();
  });

  it('keeps inferred animal reinforcement out of assessment presentation', () => {
    const birdQuestion = question({
      conceptIds: ['sof3.birds.beaks', 'sof3.birds.wings'],
      knowledgeRefs: ['kr.sof3.birds.beak.eating', 'kr.sof3.birds.wings.flight'],
      difficulty: 3
    });
    const herbivoreQuestion = question({
      conceptIds: ['sof3.animals.feeding.herbivore'],
      knowledgeRefs: ['kr.sof3.animals.feeding.herbivore']
    });

    expect(resolveQuestionSceneId(birdQuestion, false)).toBeNull();
    expect(resolveQuestionSceneId(herbivoreQuestion, false)).toBeNull();
  });

  it('uses the playful dog state only after the Puppy mission is solved', () => {
    const puppyMission = missionJson.missions.find((mission) => mission.id === 'mission.puppy-by-pond');
    expect(puppyMission?.openingSceneRef).toBe('scene.dog.wrong-water');
    expect(puppyMission?.successSceneRef).toBe('scene.dog.play-ball');
    expect(puppyMission?.successBeat.text).toMatch(/safe and ready to play on land/i);
  });
});
