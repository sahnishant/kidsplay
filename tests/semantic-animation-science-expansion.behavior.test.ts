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

interface ProcessVisualRow {
  id: string;
  renderer: string;
  glyph: string;
  label: string;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function processQuestion(
  knowledgeRef: string,
  conceptId: string,
  overrides: Partial<SingleChoiceQuestion> = {}
): SingleChoiceQuestion {
  return {
    id: `test.animation.process.${conceptId}`,
    revision: 1,
    schemaVersion: 1,
    conceptIds: [conceptId],
    knowledgeRefs: [knowledgeRef],
    difficulty: 2,
    language: 'en',
    prompt: { text: 'Which option shows the process in the correct order?' },
    interaction: {
      type: 'single_choice',
      version: 1,
      shuffleOptions: false,
      options: [
        { id: 'correct', label: 'Correct order' },
        { id: 'reverse', label: 'Reverse order' }
      ]
    },
    solution: { type: 'exact_option', correctOptionIds: ['correct'] },
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

  it('selects reusable teaching scenes by semantic parts rather than question-specific ids', () => {
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

    expect(resolveAnimationForState({
      semanticRef: 'water-state-change',
      partVisualRefs: { prop: ['entity.matter.liquid-water'] }
    })?.id).toBe('animation.water-state.melt');

    expect(resolveAnimationForState({
      semanticRef: 'water-state-change',
      partVisualRefs: { prop: ['entity.matter.ice'] }
    })?.id).toBe('animation.water-state.freeze');
  });

  it('sizes semantic composition parts against the embedding surface when supported', () => {
    const source = readFileSync('src/presentation/SemanticAnimation.svelte', 'utf8');
    expect(source).toContain('container-type: inline-size');
    expect(source).toContain('@supports (width: 1cqw)');
    expect(source).toContain('24cqw');
  });

  it('renders every new process state through the existing generic process-icon renderer', () => {
    const visuals = readJson<ProcessVisualRow[]>('content/visuals/processes.json');
    const rendererSource = readFileSync('src/presentation/ProcessIcon.svelte', 'utf8');
    const expectedIds = [
      'entity.matter.ice',
      'entity.matter.liquid-water',
      'entity.state.container-closed',
      'entity.state.container-open',
      'entity.state.container-empty',
      'entity.state.container-partly-full',
      'entity.state.container-full'
    ];

    for (const visualId of expectedIds) {
      const visual = visuals.find((candidate) => candidate.id === visualId);
      expect(visual?.renderer, `${visualId} should reuse process-icon`).toBe('process-icon');
      expect(rendererSource, `${visualId} glyph should be implemented`).toContain(`icon === '${visual?.glyph}'`);
    }
  });

  it('keeps all reviewed process rows aligned to canonical stage order and post-answer scenes', () => {
    const processes = readJson<ProcessRow[]>('content/knowledge/vocabulary-processes.json');
    const expectations = [
      {
        rowId: 'kr.science.process.germination.seed-to-young-plant',
        conceptId: 'sof3.plants.germination',
        stages: ['seed', 'sprout', 'young-plant'],
        animationId: 'animation.germination.seed-to-young-plant',
        sceneId: 'scene.plants.germination'
      },
      {
        rowId: 'kr.science.process.melt.ice-to-liquid-water',
        conceptId: 'sof5.matter.melting',
        stages: ['ice', 'water'],
        animationId: 'animation.water-state.melt',
        sceneId: 'scene.process.melt-ice'
      },
      {
        rowId: 'kr.science.process.freeze.water-to-ice',
        conceptId: 'science.matter.freezing',
        stages: ['water', 'ice'],
        animationId: 'animation.water-state.freeze',
        sceneId: 'scene.process.freeze-water'
      },
      {
        rowId: 'kr.vocab.process.open.closed-to-open',
        conceptId: 'vocabulary.action.open',
        stages: ['closed', 'open'],
        animationId: 'animation.opening.closed-to-open',
        sceneId: 'scene.vocabulary.opening'
      },
      {
        rowId: 'kr.vocab.process.fill.empty-to-full',
        conceptId: 'vocabulary.action.fill',
        stages: ['empty', 'partly-full', 'full'],
        animationId: 'animation.filling.empty-to-full',
        sceneId: 'scene.vocabulary.filling'
      }
    ];

    for (const expected of expectations) {
      const process = processes.find((candidate) => candidate.rowId === expected.rowId);
      expect(process?.stages.map((stage) => stage.semanticRef), expected.rowId).toEqual(expected.stages);

      const composition = resolveAnimationComposition(expected.animationId);
      expect(composition, `${expected.animationId} should resolve`).toBeTruthy();
      expect(composition?.ariaLabel.trim().length).toBeGreaterThan(0);

      const question = processQuestion(expected.rowId, expected.conceptId);
      expect(resolveQuestionSceneId(question)).toBe(expected.sceneId);
      expect(resolveQuestionSceneId(question, false)).toBeNull();
    }
  });

  it('keeps every new process understandable without motion by drawing the full endpoint sequence', () => {
    const melt = resolveAnimationComposition('animation.water-state.melt');
    const freeze = resolveAnimationComposition('animation.water-state.freeze');
    const opening = resolveAnimationComposition('animation.opening.closed-to-open');
    const filling = resolveAnimationComposition('animation.filling.empty-to-full');

    expect(melt?.parts.some((part) => part.visualRef === 'entity.matter.liquid-water')).toBe(true);
    expect(freeze?.parts.some((part) => part.visualRef === 'entity.matter.ice')).toBe(true);
    expect(opening?.parts.some((part) => part.visualRef === 'entity.state.container-open')).toBe(true);
    expect(filling?.parts.filter((part) => part.text === '→')).toHaveLength(2);
    expect(filling?.parts.filter((part) => part.visualRef).map((part) => part.visualRef)).toEqual([
      'entity.state.container-partly-full',
      'entity.state.container-full'
    ]);
  });
});
