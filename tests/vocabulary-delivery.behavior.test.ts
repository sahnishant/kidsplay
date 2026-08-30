import { describe, expect, it } from 'vitest';
import generatedQuestionsJson from '../content/questions/__generated-from-knowledge.json';
import freeVocabularyPack from '../content/packs/free-vocabulary.json';
import type { Question } from '../src/contracts/question';
import { evaluate } from '../src/evaluation/evaluate';
import { createShuffledOrder } from '../src/mechanics/reorder';

const generatedQuestions = generatedQuestionsJson as unknown as Question[];
const byId = new Map(generatedQuestions.map((question) => [question.id, question]));

function question(id: string): Question {
  const value = byId.get(id);
  if (!value) throw new Error(`Missing generated vocabulary question ${id}`);
  return value;
}

describe('vocabulary delivery', () => {
  it('generates both meaning-to-word and word-to-meaning choices from the same knowledge row', () => {
    const forward = question('vocab.meanings.mcq.enormous.generated.001');
    const reverse = question('vocab.meanings.mcq.enormous.reverse.001');

    expect(forward.interaction.type).toBe('single_choice');
    expect(reverse.interaction.type).toBe('single_choice');
    if (forward.interaction.type !== 'single_choice' || reverse.interaction.type !== 'single_choice') return;

    expect(forward.prompt.text).toContain('very large');
    expect(forward.interaction.options.map((option) => option.label)).toContain('enormous');
    expect(reverse.prompt.text).toContain('enormous');
    expect(reverse.interaction.options.map((option) => option.label)).toContain('very large');
    expect(forward.knowledgeRefs).toEqual(['kr.vocab.meaning.enormous.very-large']);
    expect(reverse.knowledgeRefs).toEqual(['kr.vocab.meaning.enormous.very-large']);
  });

  it('turns a vocabulary subject into deterministic letter-ordering evidence', () => {
    const value = question('vocab.meanings.unscramble.enormous.001');
    expect(value.interaction.type).toBe('sequence_order');
    expect(value.solution.type).toBe('ordered_items');
    if (value.interaction.type !== 'sequence_order' || value.solution.type !== 'ordered_items') return;

    expect(value.interaction.items.map((item) => item.label).join('')).toBe('ENORMOUS');
    expect(value.knowledgeRefs).toEqual(['kr.vocab.meaning.enormous.very-large']);

    const firstShuffle = createShuffledOrder(value.interaction.items, value.interaction.seed);
    const secondShuffle = createShuffledOrder(value.interaction.items, value.interaction.seed);
    expect(firstShuffle.map((item) => item.id)).toEqual(secondShuffle.map((item) => item.id));
    expect(firstShuffle.map((item) => item.id)).not.toEqual(value.solution.orderedItemIds);

    expect(evaluate(value, { orderedItemIds: value.solution.orderedItemIds })).toMatchObject({ correct: true, score: 1 });
    expect(evaluate(value, { orderedItemIds: firstShuffle.map((item) => item.id) }).correct).toBe(false);
  });

  it('keeps the expanded vocabulary activities in the free pack', () => {
    const refs = new Set(freeVocabularyPack.questionRefs);
    const expectedNewRefs = [
      'vocab.meanings.mcq.enormous.reverse.001',
      'vocab.meanings.unscramble.enormous.001',
      'vocab.meanings.fill.enormous.001',
      'vocab.synonyms.unscramble.clever.001',
      'vocab.antonyms.unscramble.smooth.001',
      'vocab.homophones.unscramble.flower.001'
    ];
    for (const ref of expectedNewRefs) {
      expect(refs.has(ref)).toBe(true);
      expect(byId.has(ref)).toBe(true);
    }
  });
});
