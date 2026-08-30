import { describe, expect, it } from 'vitest';
import animalAssociations from '../content/knowledge/animal-associations.json';
import { formatDataForEngine } from '../scripts/formatters/registry.mjs';

describe('generated semantic visual hooks', () => {
  it('preserves subject entity ids in generated single-choice options', () => {
    const result = formatDataForEngine(animalAssociations, 'single_choice@1', {
      id: 'test.generated.visual.choice',
      entryIds: ['camel-ship-desert'],
      distractorCount: 3
    });
    const question = result.questions[0];
    expect(question.interaction.type).toBe('single_choice');
    expect(question.interaction.options[0]).toMatchObject({
      label: 'Camel',
      semanticRef: 'camel'
    });
    expect(question.interaction.options.every((option: { semanticRef?: string }) => Boolean(option.semanticRef))).toBe(true);
  });

  it('preserves both sides semantic ids for memory cards when the source has them', () => {
    const result = formatDataForEngine(animalAssociations, 'memory_pairs@1', {
      id: 'test.generated.visual.memory',
      entryIds: ['dog-domestic', 'seahorse-water'],
      seed: 7
    });
    const cards = result.questions[0].interaction.cards;
    expect(cards.find((card: { label: string }) => card.label === 'Dog')).toMatchObject({ semanticRef: 'dog' });
    expect(cards.find((card: { label: string }) => card.label === 'Seahorse')).toMatchObject({ semanticRef: 'seahorse' });
    expect(cards.find((card: { label: string }) => card.label === 'domestic animal')).toMatchObject({ semanticRef: 'domestic-animal' });
  });

  it('keeps generated drag matching free of automatic semantic visual hints', () => {
    const result = formatDataForEngine(animalAssociations, 'drag_to_target@1', {
      id: 'test.generated.visual.match',
      entryIds: ['dog-domestic', 'seahorse-water']
    });
    const question = result.questions[0];
    expect(question.interaction.type).toBe('drag_to_target');
    expect(question.interaction.items.every((item: { semanticRef?: string }) => item.semanticRef === undefined)).toBe(true);
    expect(question.interaction.targets.every((item: { semanticRef?: string }) => item.semanticRef === undefined)).toBe(true);
  });
});
