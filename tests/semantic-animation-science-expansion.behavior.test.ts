import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { SingleChoiceQuestion } from '../src/contracts/question';
import {
  resolveAnimationComposition,
  resolveAnimationForState
} from '../src/presentation/animationRegistry';
import { resolveQuestionSceneId } from '../src/presentation/questionScene';

interface SceneRow {
  id: string;
  theme: string;
  ariaLabel: string;
  animationRef?: string;
  entities?: unknown[];
}

interface ProcessRow {
  rowId: string;
  stages: Array<{ id: string; label: string; semanticRef: string }>;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function germinationQuestion(overrides: Partial<SingleChoiceQuestion> = {}): SingleChoiceQuestion {
  return {
    id: 'test.animation.germination.001',
    revision: 1,
    schemaVersion: 1,
    conceptIds: ['sof3.plants.germination'],
    knowledgeRefs: ['kr.science.process.germination.seed-to-young-plant'],
    difficulty: 2,
    language: 'en',
    prompt: { text: 'Which order shows a seed beginning to grow?' },
    interaction: {
      type: 'single_choice',
      version: 1,
      shuffleOptions: false,
      options: [
        { id: 'grow', label: 'Seed, sprout, young plant' },
        { id: 'reverse', label: 'Young plant, sprout, seed' }
      ]
    },
    solution: { type: 'exact_option', correctOptionIds: ['grow'] },
    feedback: { correct: 'Correct.', incorrect: 'Try again.' },
    authoring: { status: 'reviewed', source: 'behavior-test' },
    ...overrides
  };
}

describe('semantic animation science and process expansion', () => {
  it('migrates the existing science scene ids onto semantic compositions', () => {
    const scenes = readJson<SceneRow[]>('content/scenes/animals.json');
    const migratedSceneIds = [
      'scene.air.balloon-candle',
      'scene.air.windmill',
      'scene.air.kite-wind',
      'scene.air.sailboat-wind',
      'scene.plants.air-fresh',
      'scene.human.lungs-breathing',
      'scene.universe.earth-rotation',
      'scene.water.sea-salty',
      'scene.rocks.pumice-water'
    ];

    for (const sceneId of migratedSceneIds) {
      const scene = scenes.find((candidate) => candidate.id === sceneId);
      expect(scene, `${sceneId} should remain registered`).toBeTruthy();
      expect(scene?.animationRef, `${sceneId} should use semantic animation`).toBeTruthy();
      expect(scene?.entities, `${sceneId} should no longer use legacy animated entities`).toBeUndefined();
      expect(resolveAnimationComposition(scene?.animationRef ?? ''), `${sceneId} animation should resolve`).toBeTruthy();
    }
  });

  it('selects wind teaching scenes by reusable semantic parts rather than question-specific ids', () => {
    expect(resolveAnimationForState({
      semanticRef: 'wind',
      partVisualRefs: { prop: ['entity.object.windmill'] }
    })?.id).toBe('animation.wind.windmill');

    expect(resolveAnimationForState({
      semanticRef: 'wind',
      partVisualRefs: { prop: ['entity.object.kite'] }
    })?.id).toBe('animation.wind.kite');

    expect(resolveAnimationForState({
      semanticRef: 'wind',
      partVisualRefs: { prop: ['entity.object.sailboat'] }
    })?.id).toBe('animation.wind.sailboat');
  });

  it('sizes semantic composition parts against the embedding surface when supported', () => {
    const source = readFileSync('src/presentation/SemanticAnimation.svelte', 'utf8');
    expect(source).toContain('container-type: inline-size');
    expect(source).toContain('@supports (width: 1cqw)');
    expect(source).toContain('24cqw');
  });

  it('keeps germination aligned to reviewed process order and understandable without motion', () => {
    const processes = readJson<ProcessRow[]>('content/knowledge/vocabulary-processes.json');
    const process = processes.find((candidate) =>
      candidate.rowId === 'kr.science.process.germination.seed-to-young-plant'
    );
    expect(process?.stages.map((stage) => stage.semanticRef)).toEqual([
      'seed',
      'sprout',
      'young-plant'
    ]);

    const composition = resolveAnimationComposition('animation.germination.seed-to-young-plant');
    expect(composition?.semanticRef).toBe('germination');
    expect(composition?.ariaLabel).toContain('seed');
    expect(composition?.ariaLabel).toContain('sprout');
    expect(composition?.ariaLabel).toContain('young plant');
    expect(composition?.parts.filter((part) => part.text === '→')).toHaveLength(2);
    expect(composition?.parts.filter((part) => part.visualRef).map((part) => part.visualRef)).toEqual([
      'entity.plant.sprout',
      'entity.plant.sapling'
    ]);

    const question = germinationQuestion();
    expect(resolveQuestionSceneId(question)).toBe('scene.plants.germination');
    expect(resolveQuestionSceneId(question, false)).toBeNull();
  });
});
