import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatAssociationSet } from '../scripts/formatters/associationSet.mjs';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));

describe('semantic single-choice families', () => {
  it('keeps the Class 3 animal-feeding choices on one explicit concept family', () => {
    const questions = readJson('content/questions/__generated-from-knowledge.json');
    const prefix = 'sof3.life-adaptations.mcq.each.generated.001.';
    const generated = questions.filter((question: { id: string }) => question.id.startsWith(prefix));

    expect(generated.map((question: { id: string }) => question.id)).toEqual([
      `${prefix}herbivore`,
      `${prefix}carnivore`,
      `${prefix}omnivore`,
      `${prefix}camouflage`
    ]);

    const expectedLabels = ['Herbivore', 'Carnivore', 'Omnivore', 'Camouflage'].sort();
    for (const question of generated) {
      const labels = question.interaction.options.map((option: { label: string }) => option.label);
      expect([...labels].sort()).toEqual(expectedLabels);
      expect(new Set(labels).size).toBe(4);
    }

    const carnivore = generated.find((question: { id: string }) => question.id === `${prefix}carnivore`);
    expect(carnivore.prompt.text).toContain('mainly eats other animals');
    expect(carnivore.solution.correctOptionIds).toEqual(['carnivore:subject']);
  });

  it('fails a curated choice family closed when two cards would look the same', () => {
    const source = {
      sourceRef: 'knowledge.test.choice-family',
      datatype: 'association_set@1',
      language: 'en',
      authoring: { status: 'reviewed' },
      units: [
        {
          rowId: 'row.a', localId: 'a', relation: 'is', conceptIds: [],
          subject: { id: 'a', label: 'Same label' }, object: { id: 'oa', label: 'first idea' }
        },
        {
          rowId: 'row.b', localId: 'b', relation: 'is', conceptIds: [],
          subject: { id: 'b', label: 'Same label' }, object: { id: 'ob', label: 'second idea' }
        },
        {
          rowId: 'row.c', localId: 'c', relation: 'is', conceptIds: [],
          subject: { id: 'c', label: 'Third' }, object: { id: 'oc', label: 'third idea' }
        },
        {
          rowId: 'row.d', localId: 'd', relation: 'is', conceptIds: [],
          subject: { id: 'd', label: 'Fourth' }, object: { id: 'od', label: 'fourth idea' }
        }
      ]
    };

    expect(() => formatAssociationSet(source, {
      id: 'test.choice-family',
      engine: 'single_choice@1',
      entryIds: ['a'],
      choiceFamilyEntryIds: ['a', 'b', 'c', 'd'],
      distractorCount: 3
    })).toThrow('choice family must resolve to unique visible subject options');
  });
});
