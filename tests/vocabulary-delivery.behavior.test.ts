import { describe, expect, it } from 'vitest';
import reviewedDeliveryMatrix from '../content/lexicon/reviews/reviewed-delivery-batch-001-compatibility.json';
import reviewedKnowledgeJson from '../content/knowledge/english-vocabulary-primary-reviewed.json';
import lexiconSources from '../content/lexicon/sources.json';
import generatedCrosswordAuthoringJson from '../content/authoring/crosswords/__generated-from-knowledge.json';
import generatedQuestionsJson from '../content/questions/__generated-from-knowledge.json';
import freeVocabularyPack from '../content/packs/free-vocabulary.json';
import reviewedDeliveryRecipes from '../content/recipes/primary-vocabulary-reviewed-delivery-batch-001.json';
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
const reviewedKnowledge = reviewedKnowledgeJson as any[];
const reviewedEntries = reviewedKnowledge[0]?.entries ?? [];
const reviewedEntryById = new Map(reviewedEntries.map((entry: any) => [entry.id, entry]));
const crosswordAuthoring = generatedCrosswordAuthoringJson as any[];

function question(id: string): Question {
  const value = byId.get(id);
  if (!value) throw new Error(`Missing generated vocabulary question ${id}`);
  return value;
}

function expectedReviewedQuestionRefs() {
  const perEntryPrefixes = [
    'vocab.primary.reviewed.mcq.word-to-meaning.001',
    'vocab.primary.reviewed.mcq.meaning-to-word.001',
    'vocab.primary.reviewed.unscramble.001',
    'vocab.primary.reviewed.fill.meaning.001'
  ];
  const refs = perEntryPrefixes.flatMap((prefix) =>
    reviewedDeliveryMatrix.entryIds.map((entryId) => `${prefix}.${entryId}`)
  );
  for (const slug of ['match', 'memory', 'word-search']) {
    for (const group of reviewedDeliveryMatrix.deterministicGroups) {
      refs.push(`vocab.primary.reviewed.${slug}.${group.id}.001`);
    }
  }
  for (const group of reviewedDeliveryMatrix.crosswordGroups) {
    refs.push(`vocab.primary.reviewed.crossword.${group.id}.001`);
  }
  return refs;
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

  it('uses the 16 human-reviewed meaning rows as the single source for the compatibility matrix', () => {
    expect(reviewedKnowledge).toHaveLength(1);
    expect(reviewedEntries).toHaveLength(16);
    expect(reviewedDeliveryMatrix).toMatchObject({
      kind: 'primary_vocabulary_delivery_compatibility_matrix',
      sourceRef: 'knowledge.english.vocabulary.primary-reviewed.001',
      sourceEntryCount: 16,
      policy: {
        sameSemanticRowsRequired: true,
        duplicateQuestionBankAllowed: false,
        newEngineRequired: false,
        profilePlacementAuthority: 'none'
      }
    });
    expect(reviewedDeliveryMatrix.entryIds).toEqual(reviewedEntries.map((entry: any) => entry.id));
    expect(reviewedDeliveryMatrix.inventory).toEqual(
      reviewedEntries.map((entry: any) => ({
        entryId: entry.id,
        rowId: entry.rowId,
        lemma: entry.subject.label,
        selectedCandidateId: entry.meta.curation.candidateId,
        primaryVocabularyGrade: entry.meta.primaryVocabularyGrade,
        gradeReviewSource: `content/lexicon/reviews/grade-${entry.meta.primaryVocabularyGrade}-batch-001.json`,
        placementAuthority: 'none'
      }))
    );
    expect(reviewedDeliveryMatrix.deliveryForms).toHaveLength(8);
    expect(reviewedDeliveryMatrix.deliveryForms.every((form) => form.status === 'semantically_applicable')).toBe(true);
    expect(reviewedDeliveryMatrix.excludedExistingFormatterSurfaces).toEqual([
      expect.objectContaining({ engine: 'print_cards@1' })
    ]);

    expect(reviewedDeliveryRecipes.every((recipe) => recipe.sourceRef === reviewedDeliveryMatrix.sourceRef)).toBe(true);
    const recipeText = JSON.stringify(reviewedDeliveryRecipes);
    for (const entry of reviewedEntries) {
      expect(recipeText).not.toContain(entry.object.label);
    }
  });

  it('generates both MCQ directions, spelling and meaning-fill from every reviewed semantic row', () => {
    for (const entry of reviewedEntries) {
      const wordToMeaning = question(`vocab.primary.reviewed.mcq.word-to-meaning.001.${entry.id}`);
      const meaningToWord = question(`vocab.primary.reviewed.mcq.meaning-to-word.001.${entry.id}`);
      const unscramble = question(`vocab.primary.reviewed.unscramble.001.${entry.id}`);
      const fill = question(`vocab.primary.reviewed.fill.meaning.001.${entry.id}`);

      expect(wordToMeaning.knowledgeRefs).toEqual([entry.rowId]);
      expect(meaningToWord.knowledgeRefs).toEqual([entry.rowId]);
      expect(unscramble.knowledgeRefs).toEqual([entry.rowId]);
      expect(fill.knowledgeRefs).toEqual([entry.rowId]);
      expect(entry.meta.curation.sourceGlossCopied).toBe(false);

      expect(wordToMeaning.interaction.type).toBe('single_choice');
      expect(meaningToWord.interaction.type).toBe('single_choice');
      if (wordToMeaning.interaction.type === 'single_choice') {
        expect(wordToMeaning.prompt.text).toContain(entry.subject.label);
        expect(wordToMeaning.interaction.options.map((option) => option.label)).toContain(entry.object.label);
      }
      if (meaningToWord.interaction.type === 'single_choice') {
        expect(meaningToWord.prompt.text).toContain(entry.object.label);
        expect(meaningToWord.interaction.options.map((option) => option.label)).toContain(entry.subject.label);
      }

      expect(unscramble.interaction.type).toBe('sequence_order');
      if (unscramble.interaction.type === 'sequence_order') {
        expect(unscramble.interaction.items.map((item) => item.label).join('')).toBe(
          entry.subject.label.toUpperCase().replace(/[^A-Z0-9]/g, '')
        );
      }

      expect(fill.interaction.type).toBe('word_bank_fill');
      if (fill.interaction.type === 'word_bank_fill') {
        expect(fill.interaction.wordBank.map((item) => item.label)).toContain(entry.object.label);
      }
    }
  });

  it('reuses deterministic row groups for matching, memory and recognition, with grade-bounded crosswords', () => {
    const seenByForm = {
      match: new Set<string>(),
      memory: new Set<string>(),
      wordSearch: new Set<string>()
    };

    for (const group of reviewedDeliveryMatrix.deterministicGroups) {
      const expectedEntries = group.entryIds.map((entryId) => reviewedEntryById.get(entryId));
      expect(expectedEntries.every(Boolean)).toBe(true);
      const expectedRowIds = expectedEntries.map((entry: any) => entry.rowId);

      const match = question(`vocab.primary.reviewed.match.${group.id}.001`);
      const memory = question(`vocab.primary.reviewed.memory.${group.id}.001`);
      const wordSearch = question(`vocab.primary.reviewed.word-search.${group.id}.001`);

      expect(new Set(match.knowledgeRefs)).toEqual(new Set(expectedRowIds));
      expect(new Set(memory.knowledgeRefs)).toEqual(new Set(expectedRowIds));
      expect(new Set(wordSearch.knowledgeRefs)).toEqual(new Set(expectedRowIds));

      expect(match.interaction.type).toBe('drag_to_target');
      expect(match.solution.type).toBe('target_assignment');
      if (match.interaction.type === 'drag_to_target' && match.solution.type === 'target_assignment') {
        expect(match.interaction.items.map((item) => item.label)).toEqual(expectedEntries.map((entry: any) => entry.subject.label));
        expect(match.interaction.targets.map((target) => target.label)).toEqual(expectedEntries.map((entry: any) => entry.object.label));

        const correctAssignments = { ...match.solution.assignments };
        expect(evaluate(match, { assignments: correctAssignments })).toMatchObject({ correct: true, score: 1 });

        const reorderedView = {
          ...match,
          interaction: {
            ...match.interaction,
            items: [...match.interaction.items].reverse(),
            targets: [...match.interaction.targets].reverse()
          }
        } as Question;
        expect(evaluate(reorderedView, { assignments: correctAssignments })).toMatchObject({ correct: true, score: 1 });

        const itemIds = Object.keys(correctAssignments);
        const wrongAssignments = { ...correctAssignments, [itemIds[0]]: correctAssignments[itemIds[1]] };
        expect(evaluate(reorderedView, { assignments: wrongAssignments }).correct).toBe(false);
      }

      expect(memory.interaction.type).toBe('memory_pairs');
      if (memory.interaction.type === 'memory_pairs') {
        const labels = memory.interaction.cards.map((card) => card.label);
        for (const entry of expectedEntries) {
          expect(labels).toContain(entry.subject.label);
          expect(labels).toContain(entry.object.label);
        }
      }

      expect(wordSearch.interaction.type).toBe('word_search');
      if (wordSearch.interaction.type === 'word_search') {
        expect(wordSearch.interaction.terms.map((term) => term.word)).toEqual(
          expectedEntries.map((entry: any) => entry.subject.label)
        );
      }

      for (const entryId of group.entryIds) {
        seenByForm.match.add(entryId);
        seenByForm.memory.add(entryId);
        seenByForm.wordSearch.add(entryId);
      }
    }

    for (const seen of Object.values(seenByForm)) {
      expect([...seen].sort()).toEqual([...reviewedDeliveryMatrix.entryIds].sort());
    }

    const crosswordSeen = new Set<string>();
    for (const group of reviewedDeliveryMatrix.crosswordGroups) {
      const authored = crosswordAuthoring.find(
        (item) => item.id === `vocab.primary.reviewed.crossword.${group.id}.001`
      );
      expect(authored).toBeTruthy();
      expect(authored.entries.map((entry: any) => entry.id)).toEqual(group.entryIds);
      expect(authored.entries.map((entry: any) => entry.answer)).toEqual(group.entryIds);
      for (const entry of authored.entries) {
        expect(entry.clue.length).toBeGreaterThan(3);
        crosswordSeen.add(entry.id);
      }
    }
    expect([...crosswordSeen].sort()).toEqual([...reviewedDeliveryMatrix.entryIds].sort());
  });

  it('keeps every reviewed delivery form launchable from the free Vocabulary Playground pack', () => {
    const refs = new Set(freeVocabularyPack.questionRefs);
    const reviewedRefs = expectedReviewedQuestionRefs();
    expect(reviewedRefs).toHaveLength(82);
    expect(new Set(reviewedRefs).size).toBe(82);

    for (const ref of reviewedRefs) {
      expect(refs.has(ref)).toBe(true);
      if (!ref.includes('.crossword.')) expect(byId.has(ref)).toBe(true);
    }
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
