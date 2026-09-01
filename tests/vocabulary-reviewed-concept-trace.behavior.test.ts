import { describe, expect, it } from 'vitest';

import reviewedKnowledgeJson from '../content/knowledge/english-vocabulary-primary-reviewed.json';
import generatedCrosswordAuthoringJson from '../content/authoring/crosswords/__generated-from-knowledge.json';
import generatedQuestionsJson from '../content/questions/__generated-from-knowledge.json';
import reviewedDeliveryRecipes from '../content/recipes/primary-vocabulary-reviewed-delivery-batch-001.json';

const REVIEWED_PREFIX = 'vocab.primary.reviewed.';
const REVIEWED_SOURCE = 'knowledge.english.vocabulary.primary-reviewed.001';

const reviewedEntries = (reviewedKnowledgeJson as any[])[0]?.entries ?? [];
const reviewedRowIds = new Set(reviewedEntries.map((entry: any) => entry.rowId));
const generatedQuestions = generatedQuestionsJson as any[];
const generatedCrosswordAuthoring = generatedCrosswordAuthoringJson as any[];

describe('reviewed vocabulary concept trace', () => {
  it('opts the reviewed delivery recipes out of unregistered provisional concept ids', () => {
    expect(reviewedDeliveryRecipes).toHaveLength(21);
    for (const recipe of reviewedDeliveryRecipes) {
      expect(recipe.sourceRef).toBe(REVIEWED_SOURCE);
      expect(recipe.conceptIds).toEqual([]);
    }
  });

  it('keeps all direct reviewed delivery traceable through canonical knowledge rows', () => {
    const reviewedQuestions = generatedQuestions.filter((question) => question.id.startsWith(REVIEWED_PREFIX));
    expect(reviewedQuestions).toHaveLength(60);

    for (const question of reviewedQuestions) {
      expect(question.conceptIds).toEqual([]);
      expect(question.knowledgeRefs.length).toBeGreaterThan(0);
      expect(question.knowledgeRefs.every((rowId: string) => reviewedRowIds.has(rowId))).toBe(true);
      expect(question.authoring?.source).toBe(`knowledge:${REVIEWED_SOURCE}`);
    }
  });

  it('keeps reviewed crossword authoring traceable without inventing learnable concepts', () => {
    const reviewedCrosswords = generatedCrosswordAuthoring.filter((question) => question.id.startsWith(REVIEWED_PREFIX));
    expect(reviewedCrosswords).toHaveLength(6);

    for (const question of reviewedCrosswords) {
      expect(question.conceptIds).toEqual([]);
      expect(question.knowledgeRefs.length).toBeGreaterThan(0);
      expect(question.knowledgeRefs.every((rowId: string) => reviewedRowIds.has(rowId))).toBe(true);
      expect(question.authoring?.source).toBe(`knowledge:${REVIEWED_SOURCE}`);
    }
  });
});
