import { describe, expect, it } from 'vitest';

import reviewedDeliveryMatrix from '../content/lexicon/reviews/reviewed-delivery-batch-001-compatibility.json';
import reviewedLearnablesJson from '../content/learnables/primary-vocabulary-reviewed.json';
import reviewedKnowledgeJson from '../content/knowledge/english-vocabulary-primary-reviewed.json';
import generatedCrosswordAuthoringJson from '../content/authoring/crosswords/__generated-from-knowledge.json';
import generatedQuestionsJson from '../content/questions/__generated-from-knowledge.json';
import freeVocabularyPack from '../content/packs/free-vocabulary.json';
import reviewedDeliveryRecipes from '../content/recipes/primary-vocabulary-reviewed-delivery-batch-001.json';
import type { Question } from '../src/contracts/question';
import { evaluate } from '../src/evaluation/evaluate';

const REVIEWED_SOURCE = 'knowledge.english.vocabulary.primary-reviewed.001';
const reviewedEntries = (reviewedKnowledgeJson as any[])[0]?.entries ?? [];
const reviewedEntryById = new Map(reviewedEntries.map((entry: any) => [entry.id, entry]));
const reviewedRowById = new Map(reviewedEntries.map((entry: any) => [entry.rowId, entry]));
const registeredConceptIds = new Set((reviewedLearnablesJson as any[]).map((learnable) => learnable.id));
const generatedQuestions = generatedQuestionsJson as unknown as Question[];
const byId = new Map(generatedQuestions.map((question) => [question.id, question]));
const crosswordAuthoring = generatedCrosswordAuthoringJson as any[];

function expectedDirectRefs() {
  const refs = [
    'vocab.primary.reviewed.mcq.word-to-meaning.001',
    'vocab.primary.reviewed.mcq.meaning-to-word.001',
    'vocab.primary.reviewed.unscramble.001'
  ].flatMap((prefix) => reviewedDeliveryMatrix.entryIds.map((entryId) => `${prefix}.${entryId}`));
  for (const slug of ['match', 'word-search']) {
    for (const group of reviewedDeliveryMatrix.deterministicGroups) {
      refs.push(`vocab.primary.reviewed.${slug}.${group.id}.001`);
    }
  }
  return refs;
}

function expectedCrosswordRefs() {
  return reviewedDeliveryMatrix.crosswordGroups.map((group) => `vocab.primary.reviewed.crossword.${group.id}.001`);
}

function expectedConceptIdsFor(knowledgeRefs: string[]) {
  return [...new Set(knowledgeRefs.flatMap((rowId) => reviewedRowById.get(rowId)?.conceptIds ?? []))].sort();
}

describe('reviewed vocabulary delivery batch 001', () => {
  it('keeps one reviewed semantic source and defers optional text-heavy forms instead of weakening quality gates', () => {
    expect(reviewedEntries).toHaveLength(16);
    expect(reviewedDeliveryMatrix).toMatchObject({
      kind: 'primary_vocabulary_delivery_compatibility_matrix',
      sourceRef: REVIEWED_SOURCE,
      sourceEntryCount: 16,
      policy: {
        sameSemanticRowsRequired: true,
        duplicateQuestionBankAllowed: false,
        newEngineRequired: false,
        profilePlacementAuthority: 'none',
        productionisedFormCount: 6
      }
    });
    expect(reviewedDeliveryMatrix.entryIds).toEqual(reviewedEntries.map((entry: any) => entry.id));
    expect(reviewedDeliveryMatrix.deliveryForms.filter((form) => form.status === 'semantically_applicable')).toHaveLength(6);
    for (const id of ['word_meaning_memory', 'meaning_fill']) {
      expect(reviewedDeliveryMatrix.deliveryForms.find((form) => form.id === id)).toMatchObject({
        status: 'semantically_applicable_deferred_visual_quality_gate',
        coverage: 'not_productionised_in_batch',
        recipeTemplateRefs: []
      });
    }
    expect(reviewedDeliveryRecipes).toHaveLength(17);
    expect(reviewedDeliveryRecipes.every((recipe) => recipe.sourceRef === REVIEWED_SOURCE)).toBe(true);
    expect(reviewedDeliveryRecipes.some((recipe) => recipe.engine === 'memory_pairs@1')).toBe(false);
    expect(reviewedDeliveryRecipes.some((recipe) => recipe.engine === 'word_bank_fill@1')).toBe(false);
  });

  it('generates both MCQ directions and spelling from all 16 human-reviewed rows', () => {
    for (const entry of reviewedEntries) {
      const wordToMeaning = byId.get(`vocab.primary.reviewed.mcq.word-to-meaning.001.${entry.id}`);
      const meaningToWord = byId.get(`vocab.primary.reviewed.mcq.meaning-to-word.001.${entry.id}`);
      const unscramble = byId.get(`vocab.primary.reviewed.unscramble.001.${entry.id}`);
      expect(wordToMeaning?.knowledgeRefs).toEqual([entry.rowId]);
      expect(meaningToWord?.knowledgeRefs).toEqual([entry.rowId]);
      expect(unscramble?.knowledgeRefs).toEqual([entry.rowId]);
      expect(entry.meta.curation.sourceGlossCopied).toBe(false);
    }
  });

  it('keeps matching correct after independent presentation reorder and rejects a wrong assignment', () => {
    for (const group of reviewedDeliveryMatrix.deterministicGroups) {
      const match = byId.get(`vocab.primary.reviewed.match.${group.id}.001`);
      const wordSearch = byId.get(`vocab.primary.reviewed.word-search.${group.id}.001`);
      const expectedEntries = group.entryIds.map((entryId) => reviewedEntryById.get(entryId));
      const expectedRows = expectedEntries.map((entry: any) => entry.rowId);
      expect(new Set(match?.knowledgeRefs)).toEqual(new Set(expectedRows));
      expect(new Set(wordSearch?.knowledgeRefs)).toEqual(new Set(expectedRows));
      expect(match?.interaction.type).toBe('drag_to_target');
      expect(match?.solution.type).toBe('target_assignment');
      if (!match || match.interaction.type !== 'drag_to_target' || match.solution.type !== 'target_assignment') continue;

      const assignments = { ...match.solution.assignments };
      const reordered = {
        ...match,
        interaction: {
          ...match.interaction,
          items: [...match.interaction.items].reverse(),
          targets: [...match.interaction.targets].reverse()
        }
      } as Question;
      expect(evaluate(reordered, { assignments })).toMatchObject({ correct: true, score: 1 });
      const itemIds = Object.keys(assignments);
      const wrong = { ...assignments, [itemIds[0]]: assignments[itemIds[1]] };
      expect(evaluate(reordered, { assignments: wrong }).correct).toBe(false);
    }
  });

  it('launches exactly the batch-owned delivery refs while keeping deferred memory/fill out of the free pack', () => {
    const directRefs = expectedDirectRefs();
    const crosswordRefs = expectedCrosswordRefs();
    const launchRefs = [...directRefs, ...crosswordRefs];
    expect(directRefs).toHaveLength(56);
    expect(crosswordRefs).toHaveLength(6);
    expect(launchRefs).toHaveLength(62);
    expect(new Set(launchRefs).size).toBe(62);

    const packRefs = new Set(freeVocabularyPack.questionRefs);
    for (const ref of directRefs) {
      expect(packRefs.has(ref)).toBe(true);
      expect(byId.has(ref)).toBe(true);
    }
    for (const ref of crosswordRefs) expect(packRefs.has(ref)).toBe(true);
    for (const group of reviewedDeliveryMatrix.deterministicGroups) {
      expect(packRefs.has(`vocab.primary.reviewed.memory.${group.id}.001`)).toBe(false);
    }
    for (const entryId of reviewedDeliveryMatrix.entryIds) {
      expect(packRefs.has(`vocab.primary.reviewed.fill.meaning.001.${entryId}`)).toBe(false);
    }
  });

  it('preserves row/concept traceability for every batch-owned direct question and crossword', () => {
    expect(registeredConceptIds.size).toBe(16);
    for (const ref of expectedDirectRefs()) {
      const question = byId.get(ref);
      expect(question).toBeTruthy();
      if (!question) continue;
      expect(question.knowledgeRefs.every((rowId) => reviewedRowById.has(rowId))).toBe(true);
      expect([...question.conceptIds].sort()).toEqual(expectedConceptIdsFor(question.knowledgeRefs));
      expect(question.conceptIds.every((conceptId) => registeredConceptIds.has(conceptId))).toBe(true);
      expect(question.authoring?.source).toBe(`knowledge:${REVIEWED_SOURCE}`);
    }

    for (const ref of expectedCrosswordRefs()) {
      const question = crosswordAuthoring.find((item) => item.id === ref);
      expect(question).toBeTruthy();
      expect(question.knowledgeRefs.every((rowId: string) => reviewedRowById.has(rowId))).toBe(true);
      expect([...question.conceptIds].sort()).toEqual(expectedConceptIdsFor(question.knowledgeRefs));
      expect(question.conceptIds.every((conceptId: string) => registeredConceptIds.has(conceptId))).toBe(true);
      expect(question.authoring?.source).toBe(`knowledge:${REVIEWED_SOURCE}`);
    }
  });
});
