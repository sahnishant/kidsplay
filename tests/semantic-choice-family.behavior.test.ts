import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatAssociationSet } from '../scripts/formatters/associationSet.mjs';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));

describe('semantic single-choice families', () => {
  it('keeps Class 3 animal-feeding choices inside one dietary concept family', () => {
    const questions = readJson('content/questions/__generated-from-knowledge.json');
    const prefix = 'sof3.life-adaptations.mcq.each.generated.001.';
    const generated = questions.filter((question: { id: string }) => question.id.startsWith(prefix));

    expect(generated.map((question: { id: string }) => question.id)).toEqual([
      `${prefix}herbivore`,
      `${prefix}carnivore`,
      `${prefix}omnivore`
    ]);

    const expectedLabels = ['Herbivore', 'Carnivore', 'Omnivore'].sort();
    for (const question of generated) {
      const labels = question.interaction.options.map((option: { label: string }) => option.label);
      expect([...labels].sort()).toEqual(expectedLabels);
      expect(new Set(labels).size).toBe(3);
    }

    const carnivore = generated.find((question: { id: string }) => question.id === `${prefix}carnivore`);
    expect(carnivore.prompt.text).toContain('mainly eats other animals');
    expect(carnivore.solution.correctOptionIds).toEqual(['carnivore:subject']);
  });

  it('does not force repeated Living things rows through game projections that require distinguishable cards', () => {
    const questions = readJson('content/questions/__generated-from-knowledge.json');
    const memory = questions.find((question: { id: string }) => question.id === 'sof3.life-adaptations.memory.generated.001');
    const matching = questions.find((question: { id: string }) => question.id === 'sof3.life-adaptations.match.generated.001');
    const pack = readJson('content/packs/free-class3-foundation.json');

    expect(memory.interaction.cards.filter((card: { id: string }) => card.id.endsWith(':subject')).map((card: { label: string }) => card.label))
      .toEqual(['Herbivore', 'Carnivore', 'Omnivore', 'Camouflage']);
    expect(matching.interaction.items.map((item: { label: string }) => item.label))
      .toEqual(['Herbivore', 'Carnivore', 'Omnivore', 'Camouflage']);
    expect(pack.questionRefs.some((id: string) => id.startsWith('sof3.life-adaptations.mcq.each.generated.001.living-'))).toBe(false);
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
