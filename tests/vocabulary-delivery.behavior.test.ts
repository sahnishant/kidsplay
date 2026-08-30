import { describe, expect, it } from 'vitest';
import lexiconSources from '../content/lexicon/sources.json';
import generatedQuestionsJson from '../content/questions/__generated-from-knowledge.json';
import freeVocabularyPack from '../content/packs/free-vocabulary.json';
import {
  createSessionForCatalogEntry,
  getCatalogEntries,
  getFreeVocabularyExploreQuestions,
  getFreeVocabularyQuestions
} from '../src/content';
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

  it('turns a vocabulary subject into deterministic, visibly scrambled letter-ordering evidence', () => {
    const value = question('vocab.meanings.unscramble.enormous.001');
    expect(value.interaction.type).toBe('sequence_order');
    expect(value.solution.type).toBe('ordered_items');
    if (value.interaction.type !== 'sequence_order' || value.solution.type !== 'ordered_items') return;

    expect(value.interaction.items.map((item) => item.label).join('')).toBe('ENORMOUS');
    expect(value.knowledgeRefs).toEqual(['kr.vocab.meaning.enormous.very-large']);

    const visibleKey = (item: (typeof value.interaction.items)[number]) => item.label;
    const firstShuffle = createShuffledOrder(value.interaction.items, value.interaction.seed, visibleKey);
    const secondShuffle = createShuffledOrder(value.interaction.items, value.interaction.seed, visibleKey);
    expect(firstShuffle.map((item) => item.id)).toEqual(secondShuffle.map((item) => item.id));
    expect(firstShuffle.map((item) => item.id)).not.toEqual(value.solution.orderedItemIds);
    expect(firstShuffle.map((item) => item.label).join('')).not.toBe('ENORMOUS');

    for (let seed = 1; seed <= 32; seed += 1) {
      const shuffled = createShuffledOrder(value.interaction.items, seed, visibleKey);
      expect(shuffled.map((item) => item.label).join('')).not.toBe('ENORMOUS');
    }

    expect(evaluate(value, { orderedItemIds: value.solution.orderedItemIds })).toMatchObject({ correct: true, score: 1 });
    expect(evaluate(value, { orderedItemIds: firstShuffle.map((item) => item.id) }).correct).toBe(false);

    const repeatedOIds = value.interaction.items.filter((item) => item.label === 'O').map((item) => item.id);
    expect(repeatedOIds).toHaveLength(2);
    const equivalentOrder = [...value.solution.orderedItemIds];
    const firstO = equivalentOrder.indexOf(repeatedOIds[0]);
    const secondO = equivalentOrder.indexOf(repeatedOIds[1]);
    [equivalentOrder[firstO], equivalentOrder[secondO]] = [equivalentOrder[secondO], equivalentOrder[firstO]];
    expect(evaluate(value, { orderedItemIds: equivalentOrder })).toMatchObject({ correct: true, score: 1 });

    const invalidDuplicateOrder = [...value.solution.orderedItemIds];
    invalidDuplicateOrder[secondO] = repeatedOIds[0];
    expect(evaluate(value, { orderedItemIds: invalidDuplicateOrder }).correct).toBe(false);
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

  it('exposes vocabulary as a launchable free student catalog session', () => {
    const entry = getCatalogEntries().find((candidate) => candidate.id === freeVocabularyPack.id);
    expect(entry).toMatchObject({
      kind: 'free_explore',
      access: { type: 'free' },
      status: 'ready',
      actionLabel: 'Play words'
    });

    const pool = getFreeVocabularyQuestions();
    const selected = getFreeVocabularyExploreQuestions({ count: 8 });
    const launch = createSessionForCatalogEntry(freeVocabularyPack.id);

    expect(pool).toHaveLength(freeVocabularyPack.questionRefs.length);
    expect(selected).toHaveLength(8);
    expect(new Set(selected.map((item) => item.interaction.type)).size).toBeGreaterThanOrEqual(3);
    expect(launch).toMatchObject({
      id: `session.${freeVocabularyPack.id}`,
      mode: 'free_explore',
      title: freeVocabularyPack.title
    });
    expect(launch.questions).toHaveLength(8);
    expect(launch.questions.every((item) => freeVocabularyPack.questionRefs.includes(item.id))).toBe(true);
  });

  it('keeps lexical source licensing explicit and machine-readable', () => {
    expect(lexiconSources.policy.primarySourceId).toBe('open-english-wordnet');
    expect(lexiconSources.policy.shipCuratedSlicesOnly).toBe(true);
    expect(lexiconSources.policy.requireFieldLevelProvenanceForImportedText).toBe(true);

    const bySourceId = new Map(lexiconSources.sources.map((source) => [source.id, source]));
    expect(bySourceId.get('open-english-wordnet')).toMatchObject({
      license: 'CC-BY-4.0',
      adoption: 'preferred'
    });
    expect(bySourceId.get('wiktionary-kaikki')).toMatchObject({
      license: 'CC-BY-SA-4.0-and-GFDL',
      adoption: 'isolated_only'
    });
  });
});
