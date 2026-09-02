import { describe, expect, it } from 'vitest';

import grade1Review from '../content/lexicon/reviews/grade-1-batch-002.json';
import grade2Review from '../content/lexicon/reviews/grade-2-batch-002.json';
import deliveryMatrix from '../content/lexicon/reviews/reviewed-delivery-batch-002-compatibility.json';
import reviewedLearnablesJson from '../content/learnables/primary-vocabulary-reviewed-batch-002.json';
import vocabularyFoundationLearnablesJson from '../content/learnables/vocabulary-foundation.json';
import reviewedKnowledgeJson from '../content/knowledge/english-vocabulary-primary-reviewed-batch-002.json';
import generatedCrosswordAuthoringJson from '../content/authoring/crosswords/__generated-from-knowledge.json';
import generatedQuestionsJson from '../content/questions/__generated-from-knowledge.json';
import freeVocabularyPack from '../content/packs/free-vocabulary.json';
import cbseClass1 from '../content/profile-memberships/CBSE_INDIA_CLASS1.json';
import cisceClass1 from '../content/profile-memberships/CISCE_INDIA_CLASS1.json';
import cbseClass2 from '../content/profile-memberships/CBSE_INDIA_CLASS2.json';
import cisceClass2 from '../content/profile-memberships/CISCE_INDIA_CLASS2.json';
import sofClass2 from '../content/profile-memberships/SOF_INDIA_CLASS2.json';
import deliveryRecipes from '../content/recipes/primary-vocabulary-reviewed-delivery-batch-002.json';

const SOURCE = 'knowledge.english.vocabulary.primary-reviewed.002';
const entries = (reviewedKnowledgeJson as any[])[0]?.entries ?? [];
const entryById = new Map(entries.map((entry: any) => [entry.id, entry]));
const rowById = new Map(entries.map((entry: any) => [entry.rowId, entry]));
const generatedQuestions = generatedQuestionsJson as any[];
const questionById = new Map(generatedQuestions.map((question: any) => [question.id, question]));
const crosswords = generatedCrosswordAuthoringJson as any[];
const batchLearnableIds = new Set((reviewedLearnablesJson as any[]).map((learnable: any) => learnable.id));
const foundationLearnableIds = new Set((vocabularyFoundationLearnablesJson as any[]).map((learnable: any) => learnable.id));
const globalVocabularyLearnableIds = new Set([...batchLearnableIds, ...foundationLearnableIds]);
const memberships = new Map([
  [cbseClass1.profileRef, cbseClass1],
  [cisceClass1.profileRef, cisceClass1],
  [cbseClass2.profileRef, cbseClass2],
  [cisceClass2.profileRef, cisceClass2],
  [sofClass2.profileRef, sofClass2]
]);

const criticalCandidateIds = new Map([
  ['class', 'class#n#2'],
  ['friend', 'friend#n#2'],
  ['history', 'history#n#1'],
  ['past', 'past#n#1'],
  ['path', 'path#n#2'],
  ['plant', 'plant#n#2'],
  ['school', 'school#n#2'],
  ['sentence', 'sentence#n#1']
]);

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
  it('reproduces the exact 30 human-approved meanings and only the two approved holds', () => {
    expect(entries).toHaveLength(30);
    expect(entries.filter((entry: any) => entry.meta.primaryVocabularyGrade === 1)).toHaveLength(15);
    expect(entries.filter((entry: any) => entry.meta.primaryVocabularyGrade === 2)).toHaveLength(15);

    expect(grade1Review.summary).toMatchObject({ accepted: 15, held: 1, reviewedProfilePlacements: 15 });
    expect(grade2Review.summary).toMatchObject({ accepted: 15, held: 1, reviewedProfilePlacements: 15 });

    const decisions = [...grade1Review.decisions, ...grade2Review.decisions];
    const unresolved = [...grade1Review.unresolvedItems, ...grade2Review.unresolvedItems];
    expect(decisions).toHaveLength(30);
    expect(unresolved).toHaveLength(2);
    expect(new Set(decisions.map((decision) => decision.lemma))).toEqual(new Set(deliveryMatrix.entryIds));
    expect(unresolved.map((item) => item.lemma).sort()).toEqual(['great', 'opposite']);
    expect(unresolved.every((item) => item.status === 'sense_unresolved' && item.decision === 'hold')).toBe(true);

    for (const decision of decisions) {
      expect(decision).toMatchObject({ status: 'reviewed', decision: 'accept', reviewAuthority: 'human_editor', reviewer: 'sahnishant', reviewedAt: '2026-09-02' });
      const entry = entryById.get(decision.lemma) as any;
      expect(entry).toBeTruthy();
      expect(entry.meta.curation.candidateId).toBe(decision.candidateId);
      expect(entry.object.label).toBe(decision.childDefinition);
      expect(entry.meta.curation.sourceGlossCopied).toBe(false);
    }

    for (const [lemma, candidateId] of criticalCandidateIds) {
      expect((entryById.get(lemma) as any)?.meta?.curation?.candidateId).toBe(candidateId);
    }
  });

  it('keeps profile placement editorial, reachable, and non-official', () => {
    const placements = [...grade1Review.profilePlacements, ...grade2Review.profilePlacements];
    expect(placements).toHaveLength(30);
    expect(deliveryMatrix.policy).toMatchObject({
      profilePlacementAuthority: 'human_editor',
      profilePlacementIsEditorialNotOfficialBoardEvidence: true,
      duplicateQuestionBankAllowed: false,
      newEngineRequired: false,
      productionisedFormCount: 6
    });

    for (const profile of memberships.values()) {
      expect(profile.provenance.status).toBe('prototype_unverified');
    }

    for (const placement of placements) {
      expect(placement).toMatchObject({ status: 'reviewed', reviewAuthority: 'human_editor', reviewer: 'sahnishant', reviewedAt: '2026-09-02' });
      expect(placement.approvedProfileRefs.length).toBe(grade1Review.decisions.some((decision) => decision.lemma === placement.lemma) ? 2 : 3);
      const entry = entryById.get(placement.lemma) as any;
      expect(entry).toBeTruthy();
      for (const profileRef of placement.approvedProfileRefs) {
        const profile = memberships.get(profileRef) as any;
        expect(profile).toBeTruthy();
        expect(profile.members.some((member: any) => member.rowId === entry.rowId && member.fit === 'core')).toBe(true);
      }
    }

    for (const profile of [cbseClass1, cisceClass1]) {
      expect(profile.members.some((member: any) => member.rowId === 'kr.vocab.primary.meaning.school.school-n-1')).toBe(false);
      expect(profile.members.some((member: any) => member.rowId === 'kr.vocab.primary.meaning.school.school-n-2')).toBe(true);
    }
  });

  it('routes the same 30 semantic rows through six existing delivery forms', () => {
    expect((reviewedKnowledgeJson as any[])[0].id).toBe(SOURCE);
    expect(deliveryMatrix).toMatchObject({ sourceRef: SOURCE, sourceEntryCount: 30 });
    expect(deliveryMatrix.entryIds).toEqual(entries.map((entry: any) => entry.id));
    expect(deliveryMatrix.deliveryForms.filter((form) => form.status === 'semantically_applicable')).toHaveLength(6);
    expect(deliveryRecipes).toHaveLength(27);
    expect(deliveryRecipes.every((recipe) => recipe.sourceRef === SOURCE)).toBe(true);
    expect(deliveryRecipes.some((recipe) => recipe.engine === 'memory_pairs@1' || recipe.engine === 'word_bank_fill@1')).toBe(false);
    expect(deliveryMatrix.deterministicGroups).toHaveLength(8);
    expect(deliveryMatrix.crosswordGroups).toHaveLength(8);

    const perEntry = perEntryRefs();
    const matching = groupedRefs('match');
    const wordSearch = groupedRefs('word-search');
    const crossword = groupedRefs('crossword');
    expect(perEntry).toHaveLength(90);
    expect(matching).toHaveLength(8);
    expect(wordSearch).toHaveLength(8);
    expect(crossword).toHaveLength(8);
    const launchRefs = [...perEntry, ...matching, ...wordSearch, ...crossword];
    expect(launchRefs).toHaveLength(114);
    expect(new Set(launchRefs).size).toBe(114);

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

  it('preserves semantic row and learnable traceability while reusing existing concepts without duplicate learnables', () => {
    expect(batchLearnableIds.size).toBe(29);
    expect(batchLearnableIds.has('vocabulary.meaning.ancient')).toBe(false);
    expect(foundationLearnableIds.has('vocabulary.meaning.ancient')).toBe(true);
    for (const entry of entries) {
      expect(globalVocabularyLearnableIds.has(entry.conceptIds[0])).toBe(true);
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
