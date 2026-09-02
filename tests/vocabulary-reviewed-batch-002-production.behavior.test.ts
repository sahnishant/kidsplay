import { describe, expect, it } from 'vitest';

import grade1Review from '../content/lexicon/reviews/grade-1-batch-002.json';
import grade2Review from '../content/lexicon/reviews/grade-2-batch-002.json';
import deliveryMatrix from '../content/lexicon/reviews/reviewed-delivery-batch-002-compatibility.json';
import reviewedLearnablesJson from '../content/learnables/primary-vocabulary-reviewed-batch-002.json';
import reviewedKnowledgeJson from '../content/knowledge/english-vocabulary-primary-reviewed-batch-002.json';
import generatedCrosswordAuthoringJson from '../content/authoring/crosswords/__generated-from-knowledge.json';
import generatedQuestionsJson from '../content/questions/__generated-from-knowledge.json';
import freeVocabularyPack from '../content/packs/free-vocabulary.json';
import deliveryRecipes from '../content/recipes/primary-vocabulary-reviewed-delivery-batch-002.json';

const SOURCE = 'knowledge.english.vocabulary.primary-reviewed.002';
const entries = (reviewedKnowledgeJson as any[])[0]?.entries ?? [];
const entryById = new Map(entries.map((entry: any) => [entry.id, entry]));
const rowById = new Map(entries.map((entry: any) => [entry.rowId, entry]));
const generatedQuestions = generatedQuestionsJson as any[];
const questionById = new Map(generatedQuestions.map((question: any) => [question.id, question]));
const crosswords = generatedCrosswordAuthoringJson as any[];
const learnableIds = new Set((reviewedLearnablesJson as any[]).map((learnable: any) => learnable.id));

function perEntryRefs() {
  return [
    'vocab.primary.reviewed.mcq.word-to-meaning.002',
    'vocab.primary.reviewed.mcq.meaning-to-word.002',
    'vocab.primary.reviewed.unscramble.002'
  ].flatMap((prefix) => deliveryMatrix.entryIds.map((entryId) => `${prefix}.${entryId}`));
}

function groupedRefs(kind: 'match' | 'word-search' | 'crossword') {
  const groups = kind === 'crossword' ? deliveryMatrix.crosswordGroups : deliveryMatrix.deterministicGroups;
  return groups.map((group) => `vocab.primary.reviewed.${kind}.${group.id}.002`);
}

describe('reviewed primary vocabulary production batch 002', () => {
  it('imports only candidate-safe human approvals and keeps every unresolved item blocked', () => {
    expect(entries).toHaveLength(23);
    expect(entries.filter((entry: any) => entry.meta.primaryVocabularyGrade === 1)).toHaveLength(11);
    expect(entries.filter((entry: any) => entry.meta.primaryVocabularyGrade === 2)).toHaveLength(12);

    expect(grade1Review.summary).toMatchObject({ accepted: 11, held: 5, reviewedProfilePlacements: 11 });
    expect(grade2Review.summary).toMatchObject({ accepted: 12, held: 4, reviewedProfilePlacements: 12 });

    const decisions = [...grade1Review.decisions, ...grade2Review.decisions];
    const unresolved = [...grade1Review.unresolvedItems, ...grade2Review.unresolvedItems];
    expect(decisions).toHaveLength(23);
    expect(unresolved).toHaveLength(9);
    expect(new Set(decisions.map((decision) => decision.lemma))).toEqual(new Set(deliveryMatrix.entryIds));

    for (const decision of decisions) {
      expect(decision).toMatchObject({ status: 'reviewed', decision: 'accept', reviewAuthority: 'human_editor', reviewer: 'sahnishant', reviewedAt: '2026-09-02' });
      const entry = entryById.get(decision.lemma) as any;
      expect(entry).toBeTruthy();
      expect(entry.meta.curation.candidateId).toBe(decision.candidateId);
      expect(entry.object.label).toBe(decision.childDefinition);
      expect(entry.meta.curation.sourceGlossCopied).toBe(false);
    }

    for (const item of unresolved) {
      expect(entryById.has(item.lemma)).toBe(false);
      if (item.status === 'blocked_candidate_pointer_mismatch') {
        expect(item.candidateCorrectionRequiresExplicitApproval).toBe(true);
        expect(item.proposedCorrectedCandidateId).toBeTruthy();
      }
    }
    expect(unresolved.filter((item) => item.status === 'sense_unresolved').map((item) => item.lemma).sort()).toEqual(['great', 'opposite']);
  });

  it('keeps profile placement editorial and never turns it into official-board provenance', () => {
    const placements = [...grade1Review.profilePlacements, ...grade2Review.profilePlacements];
    expect(placements).toHaveLength(23);
    expect(deliveryMatrix.policy).toMatchObject({
      profilePlacementAuthority: 'human_editor',
      profilePlacementIsEditorialNotOfficialBoardEvidence: true,
      duplicateQuestionBankAllowed: false,
      newEngineRequired: false,
      productionisedFormCount: 6
    });
    for (const placement of placements) {
      expect(placement).toMatchObject({ status: 'reviewed', reviewAuthority: 'human_editor', reviewer: 'sahnishant', reviewedAt: '2026-09-02' });
      expect(placement.approvedProfileRefs.length).toBe(grade1Review.decisions.some((decision) => decision.lemma === placement.lemma) ? 2 : 3);
    }
  });

  it('routes the same 23 semantic rows through six existing delivery forms', () => {
    expect((reviewedKnowledgeJson as any[])[0].id).toBe(SOURCE);
    expect(deliveryMatrix).toMatchObject({ sourceRef: SOURCE, sourceEntryCount: 23 });
    expect(deliveryMatrix.entryIds).toEqual(entries.map((entry: any) => entry.id));
    expect(deliveryMatrix.deliveryForms.filter((form) => form.status === 'semantically_applicable')).toHaveLength(6);
    expect(deliveryRecipes).toHaveLength(21);
    expect(deliveryRecipes.every((recipe) => recipe.sourceRef === SOURCE)).toBe(true);
    expect(deliveryRecipes.some((recipe) => recipe.engine === 'memory_pairs@1' || recipe.engine === 'word_bank_fill@1')).toBe(false);

    const perEntry = perEntryRefs();
    const matching = groupedRefs('match');
    const wordSearch = groupedRefs('word-search');
    const crossword = groupedRefs('crossword');
    expect(perEntry).toHaveLength(69);
    expect(matching).toHaveLength(6);
    expect(wordSearch).toHaveLength(6);
    expect(crossword).toHaveLength(6);
    const launchRefs = [...perEntry, ...matching, ...wordSearch, ...crossword];
    expect(launchRefs).toHaveLength(87);
    expect(new Set(launchRefs).size).toBe(87);

    const packRefs = new Set(freeVocabularyPack.questionRefs);
    for (const ref of [...perEntry, ...matching, ...wordSearch]) {
      expect(packRefs.has(ref)).toBe(true);
      expect(questionById.has(ref)).toBe(true);
    }
    for (const ref of crossword) {
      expect(packRefs.has(ref)).toBe(true);
      expect(crosswords.some((item: any) => item.id === ref)).toBe(true);
    }
  });

  it('preserves semantic row and learnable traceability for every generated batch-002 activity', () => {
    expect(learnableIds.size).toBe(23);
    for (const entry of entries) {
      expect(learnableIds.has(entry.conceptIds[0])).toBe(true);
      for (const prefix of ['vocab.primary.reviewed.mcq.word-to-meaning.002', 'vocab.primary.reviewed.mcq.meaning-to-word.002', 'vocab.primary.reviewed.unscramble.002']) {
        const question = questionById.get(`${prefix}.${entry.id}`);
        expect(question?.knowledgeRefs).toEqual([entry.rowId]);
        expect(question?.conceptIds).toEqual(entry.conceptIds);
        expect(question?.authoring?.source).toBe(`knowledge:${SOURCE}`);
      }
    }
    for (const group of deliveryMatrix.deterministicGroups) {
      const expectedRows = group.entryIds.map((entryId) => (entryById.get(entryId) as any).rowId);
      for (const kind of ['match', 'word-search']) {
        const question = questionById.get(`vocab.primary.reviewed.${kind}.${group.id}.002`);
        expect(new Set(question?.knowledgeRefs)).toEqual(new Set(expectedRows));
        expect(question?.knowledgeRefs.every((rowId: string) => rowById.has(rowId))).toBe(true);
      }
    }
  });
});
