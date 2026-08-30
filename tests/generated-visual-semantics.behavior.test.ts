import { describe, expect, it } from 'vitest';
import generatedQuestions from '../content/questions/__generated-from-knowledge.json';

type GeneratedQuestion = (typeof generatedQuestions)[number];

function questionById(id: string): GeneratedQuestion {
  const question = generatedQuestions.find((candidate) => candidate.id === id);
  if (!question) throw new Error(`Missing generated question ${id}`);
  return question;
}

describe('generated semantic visual hooks', () => {
  it('preserves subject entity ids in generated single-choice options', () => {
    const question = questionById('animals.associations.mcq.camel.generated.001');
    expect(question.interaction.type).toBe('single_choice');
    if (question.interaction.type !== 'single_choice') return;

    const camel = question.interaction.options.find((option) => option.label === 'Camel');
    expect(camel).toMatchObject({ label: 'Camel', semanticRef: 'camel' });
    expect(question.interaction.options.every((option) => Boolean(option.semanticRef))).toBe(true);
  });

  it('preserves both sides semantic ids for generated memory cards', () => {
    const question = questionById('animals.associations.memory.generated.001');
    expect(question.interaction.type).toBe('memory_pairs');
    if (question.interaction.type !== 'memory_pairs') return;

    const cards = question.interaction.cards;
    expect(cards.find((card) => card.label === 'Dog')).toMatchObject({ semanticRef: 'dog' });
    expect(cards.find((card) => card.label === 'Seahorse')).toMatchObject({ semanticRef: 'seahorse' });
    expect(cards.find((card) => card.label === 'domestic animal')).toMatchObject({ semanticRef: 'domestic-animal' });
  });

  it('keeps generated drag matching free of automatic semantic visual hints', () => {
    const question = questionById('animals.associations.match.generated.001');
    expect(question.interaction.type).toBe('drag_to_target');
    if (question.interaction.type !== 'drag_to_target') return;

    expect(question.interaction.items.every((item) => item.semanticRef === undefined)).toBe(true);
    expect(question.interaction.targets.every((item) => item.semanticRef === undefined)).toBe(true);
  });

  it('preserves object semantic ids in generated word-bank options', () => {
    const question = questionById('animals.associations.fill.mammoth.generated.001');
    expect(question.interaction.type).toBe('word_bank_fill');
    if (question.interaction.type !== 'word_bank_fill') return;

    const extinct = question.interaction.wordBank.find((word) => word.label === 'extinct animal');
    expect(extinct).toMatchObject({ semanticRef: 'extinct-animal' });
  });
});
