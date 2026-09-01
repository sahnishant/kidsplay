import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { SingleChoiceQuestion } from '../src/contracts/question';
import { resolveAnimationComposition } from '../src/presentation/animationRegistry';
import { resolveQuestionSceneId } from '../src/presentation/questionScene';

interface AssociationEntry {
  rowId: string;
  conceptIds: string[];
  subject: { label: string };
  object: { label: string };
}

interface AssociationSet {
  entries: AssociationEntry[];
  authoring?: { status?: string };
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function questionFor(rowId: string, conceptId: string): SingleChoiceQuestion {
  return {
    id: `test.reviewed-animation.${conceptId}`,
    revision: 1,
    schemaVersion: 1,
    conceptIds: [conceptId],
    knowledgeRefs: [rowId],
    difficulty: 2,
    language: 'en',
    prompt: { text: 'Choose the statement that matches the science idea.' },
    interaction: {
      type: 'single_choice',
      version: 1,
      shuffleOptions: false,
      options: [
        { id: 'correct', label: 'Correct statement' },
        { id: 'other', label: 'Other statement' }
      ]
    },
    solution: { type: 'exact_option', correctOptionIds: ['correct'] },
    feedback: { correct: 'Correct.', incorrect: 'Try again.' },
    authoring: { status: 'reviewed', source: 'behavior-test' }
  };
}

function flattenSets(value: AssociationSet | AssociationSet[]): AssociationSet[] {
  return Array.isArray(value) ? value : [value];
}

function findEntry(path: string, rowId: string): { entry?: AssociationEntry; reviewed: boolean } {
  const sets = flattenSets(readJson<AssociationSet | AssociationSet[]>(path));
  const set = sets.find((candidate) => candidate.entries.some((entry) => entry.rowId === rowId));
  return {
    entry: set?.entries.find((entry) => entry.rowId === rowId),
    reviewed: set?.authoring?.status === 'reviewed'
  };
}

describe('reviewed Earth and matter semantic animations', () => {
  const cases = [
    {
      path: 'content/knowledge/sof-class3-science-breadth.json',
      rowId: 'kr.sof3.earth.revolution.sun.year',
      conceptId: 'sof3.earth.revolution',
      animationId: 'animation.earth.revolution-sun',
      sceneId: 'scene.universe.earth-revolution',
      expectedWords: ['around the Sun', 'one year']
    },
    {
      path: 'content/knowledge/sof-class3-science-expanded.json',
      rowId: 'kr.sof3.planets.orbit.sun',
      conceptId: 'sof3.planets.orbit',
      animationId: 'animation.planet.orbit-sun',
      sceneId: 'scene.universe.planet-orbit',
      expectedWords: ['around the Sun', 'orbit']
    },
    {
      path: 'content/knowledge/sof-class3-matter.json',
      rowId: 'kr.sof3.matter.liquid.shape.container',
      conceptId: 'sof3.matter.liquid-shape',
      animationId: 'animation.liquid.takes-container-shape',
      sceneId: 'scene.matter.liquid-container-shape',
      expectedWords: ['liquid', 'container']
    }
  ] as const;

  it('grounds each new scene in a reviewed canonical row and keeps inference presentation-only', () => {
    for (const item of cases) {
      const { entry, reviewed } = findEntry(item.path, item.rowId);
      expect(reviewed, `${item.rowId} source should be reviewed`).toBe(true);
      expect(entry?.conceptIds).toContain(item.conceptId);

      const composition = resolveAnimationComposition(item.animationId);
      expect(composition, `${item.animationId} should resolve`).toBeTruthy();
      for (const word of item.expectedWords) {
        expect(composition?.ariaLabel.toLowerCase()).toContain(word.toLowerCase());
      }

      const question = questionFor(item.rowId, item.conceptId);
      expect(resolveQuestionSceneId(question)).toBe(item.sceneId);
      expect(resolveQuestionSceneId(question, false)).toBeNull();
    }
  });

  it('keeps the visual relation statically meaningful when motion is removed', () => {
    const earth = resolveAnimationComposition('animation.earth.revolution-sun');
    expect(earth?.parts.some((part) => part.visualRef === 'entity.nature.sun')).toBe(true);
    expect(earth?.parts.some((part) => part.text === '~1 year')).toBe(true);

    const planet = resolveAnimationComposition('animation.planet.orbit-sun');
    expect(planet?.parts.some((part) => part.visualRef === 'entity.nature.sun')).toBe(true);
    expect(planet?.parts.some((part) => part.text === 'around Sun')).toBe(true);

    const liquid = resolveAnimationComposition('animation.liquid.takes-container-shape');
    expect(liquid?.parts.some((part) => part.visualRef === 'entity.water.bucket')).toBe(true);
    expect(liquid?.parts.some((part) => part.text === 'same liquid')).toBe(true);
    expect(liquid?.parts.some((part) => part.text === 'container shape')).toBe(true);
  });
});
