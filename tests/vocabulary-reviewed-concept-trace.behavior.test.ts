import { describe, expect, it } from 'vitest';

import reviewedLearnablesJson from '../content/learnables/primary-vocabulary-reviewed.json';
import reviewedKnowledgeJson from '../content/knowledge/english-vocabulary-primary-reviewed.json';
import generatedCrosswordAuthoringJson from '../content/authoring/crosswords/__generated-from-knowledge.json';
import generatedQuestionsJson from '../content/questions/__generated-from-knowledge.json';
import reviewedDeliveryRecipes from '../content/recipes/primary-vocabulary-reviewed-delivery-batch-001.json';

const REVIEWED_PREFIX = 'vocab.primary.reviewed.';
const REVIEWED_SOURCE = 'knowledge.english.vocabulary.primary-reviewed.001';

const reviewedEntries = (reviewedKnowledgeJson as any[])[0]?.entries ?? [];
const reviewedRowById = new Map(reviewedEntries.map((entry: any) => [entry.rowId, entry]));
const reviewedLearnables = reviewedLearnablesJson as any[];
const registeredConceptIds = new Set(reviewedLearnables.map((learnable) => learnable.id));
const generatedQuestions = generatedQuestionsJson as any[];
const generatedCrosswordAuthoring = generatedCrosswordAuthoringJson as any[];

function expectedConceptIdsFor(knowledgeRefs: string[]) {
  return [...new Set(
    knowledgeRefs.flatMap((rowId) => reviewedRowById.get(rowId)?.conceptIds ?? [])
  )].sort();
}

describe('reviewed vocabulary concept trace', () => {
  it('registers exactly the 16 reviewed meaning concepts without adding profile membership', () => {
    expect(reviewedEntries).toHaveLength(16);
    expect(reviewedLearnables).toHaveLength(16);
    expect(registeredConceptIds.size).toBe(16);

    for (const entry of reviewedEntries) {
      expect(entry.conceptIds).toEqual([`vocabulary.meaning.${entry.id}`]);
      const learnable = reviewedLearnables.find((candidate) => candidate.id === entry.conceptIds[0]);
      expect(learnable).toBeTruthy();
      expect(learnable).toMatchObject({
        subject: 'English',
        topic: 'Vocabulary',
        subtopic: 'Reviewed primary meanings',
        gradeBands: [entry.meta.primaryVocabularyGrade]
      });
      expect(learnable.statement.length).toBeGreaterThan(10);
    }
  });

  it('keeps all reviewed delivery recipes on the existing association runtime', () => {
    expect(reviewedDeliveryRecipes).toHaveLength(21);
    for (const recipe of reviewedDeliveryRecipes) {
      expect(recipe.sourceRef).toBe(REVIEWED_SOURCE);
      expect(recipe).not.toHaveProperty('conceptIds');
    }
  });

  it('keeps all direct reviewed delivery compatible with row and concept traceability', () => {
    const reviewedQuestions = generatedQuestions.filter((question) => question.id.startsWith(REVIEWED_PREFIX));
    expect(reviewedQuestions).toHaveLength(60);

    for (const question of reviewedQuestions) {
      expect(question.knowledgeRefs.length).toBeGreaterThan(0);
      expect(question.knowledgeRefs.every((rowId: string) => reviewedRowById.has(rowId))).toBe(true);
      expect([...question.conceptIds].sort()).toEqual(expectedConceptIdsFor(question.knowledgeRefs));
      expect(question.conceptIds.every((conceptId: string) => registeredConceptIds.has(conceptId))).toBe(true);
      expect(question.authoring?.source).toBe(`knowledge:${REVIEWED_SOURCE}`);
    }
  });

  it('keeps reviewed crossword authoring compatible with row and concept traceability', () => {
    const reviewedCrosswords = generatedCrosswordAuthoring.filter((question) => question.id.startsWith(REVIEWED_PREFIX));
    expect(reviewedCrosswords).toHaveLength(6);

    for (const question of reviewedCrosswords) {
      expect(question.knowledgeRefs.length).toBeGreaterThan(0);
      expect(question.knowledgeRefs.every((rowId: string) => reviewedRowById.has(rowId))).toBe(true);
      expect([...question.conceptIds].sort()).toEqual(expectedConceptIdsFor(question.knowledgeRefs));
      expect(question.conceptIds.every((conceptId: string) => registeredConceptIds.has(conceptId))).toBe(true);
      expect(question.authoring?.source).toBe(`knowledge:${REVIEWED_SOURCE}`);
    }
  });
});
