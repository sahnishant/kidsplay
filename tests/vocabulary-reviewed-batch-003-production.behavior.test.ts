import { describe, expect, it } from 'vitest';

import grade1Review from '../content/lexicon/reviews/grade-1-batch-003.json';
import grade2Review from '../content/lexicon/reviews/grade-2-batch-003.json';
import reviewedLearnablesJson from '../content/learnables/primary-vocabulary-reviewed-batch-003.json';
import reviewedKnowledgeJson from '../content/knowledge/english-vocabulary-primary-reviewed-batch-003.json';
import generatedCrosswordAuthoringJson from '../content/authoring/crosswords/__generated-from-knowledge.json';
import generatedQuestionsJson from '../content/questions/__generated-from-knowledge.json';
import freeVocabularyPack from '../content/packs/free-vocabulary.json';
import cbseClass1 from '../content/profile-memberships/CBSE_INDIA_CLASS1.json';
import cisceClass1 from '../content/profile-memberships/CISCE_INDIA_CLASS1.json';
import cbseClass2 from '../content/profile-memberships/CBSE_INDIA_CLASS2.json';
import cisceClass2 from '../content/profile-memberships/CISCE_INDIA_CLASS2.json';
import sofClass2 from '../content/profile-memberships/SOF_INDIA_CLASS2.json';
import deliveryRecipes from '../content/recipes/primary-vocabulary-reviewed-delivery-batch-003.json';

const SOURCE = 'knowledge.english.vocabulary.primary-reviewed.003';
const entries = (reviewedKnowledgeJson as any[])[0]?.entries ?? [];
const entryById = new Map(entries.map((entry: any) => [entry.id, entry]));
const generatedQuestions = generatedQuestionsJson as any[];
const questionById = new Map(generatedQuestions.map((question: any) => [question.id, question]));
const crosswords = generatedCrosswordAuthoringJson as any[];
const memberships = new Map([
  [cbseClass1.profileRef, cbseClass1],
  [cisceClass1.profileRef, cisceClass1],
  [cbseClass2.profileRef, cbseClass2],
  [cisceClass2.profileRef, cisceClass2],
  [sofClass2.profileRef, sofClass2]
]);

const explicitSenseChoices = new Map([
  ['experience', 'experience#n#3'],
  ['natural', 'natural#a#2'],
  ['once', 'once#r#1'],
  ['appear', 'appear#v#2'],
  ['father', 'father#n#3'],
  ['today', 'today#r#2'],
  ['hold', 'hold#v#2'],
  ['competition', 'competition#n#2'],
  ['describe', 'describe#v#2'],
  ['radio', 'radio#n#2']
]);

const groups = [
  'grade1-a', 'grade1-b', 'grade1-c', 'grade1-d',
  'grade2-a', 'grade2-b', 'grade2-c', 'grade2-d'
];

function perEntryRefs() {
  return [
    'vocab.primary.reviewed.mcq.word-to-meaning.003',
    'vocab.primary.reviewed.mcq.meaning-to-word.003',
    'vocab.primary.reviewed.unscramble.003'
  ].flatMap((prefix) => entries.map((entry: any) => `${prefix}.${entry.id}`));
}

function groupedRefs(kind: 'match' | 'word-search' | 'crossword') {
  return groups.map((group) => `vocab.primary.reviewed.${kind}.${group}.003`);
}

describe('reviewed primary vocabulary production batch 003', () => {
  it('reproduces all 32 explicitly human-approved meanings with no holds', () => {
    expect((reviewedKnowledgeJson as any[])[0].id).toBe(SOURCE);
    expect(entries).toHaveLength(32);
    expect(entries.filter((entry: any) => entry.meta.primaryVocabularyGrade === 1)).toHaveLength(16);
    expect(entries.filter((entry: any) => entry.meta.primaryVocabularyGrade === 2)).toHaveLength(16);
    expect(grade1Review.summary).toMatchObject({ accepted: 16, held: 0, reviewedProfilePlacements: 16 });
    expect(grade2Review.summary).toMatchObject({ accepted: 16, held: 0, reviewedProfilePlacements: 16 });
    expect(grade1Review.unresolvedItems).toEqual([]);
    expect(grade2Review.unresolvedItems).toEqual([]);

    const decisions = [...grade1Review.decisions, ...grade2Review.decisions];
    expect(decisions).toHaveLength(32);
    for (const decision of decisions) {
      expect(decision).toMatchObject({
        status: 'reviewed', decision: 'accept', reviewAuthority: 'human_editor',
        reviewer: 'sahnishant', reviewedAt: '2026-09-02'
      });
      const entry = entryById.get(decision.lemma) as any;
      expect(entry).toBeTruthy();
      expect(entry.meta.curation.candidateId).toBe(decision.candidateId);
      expect(entry.object.label).toBe(decision.childDefinition);
      expect(entry.meta.curation.sourceGlossCopied).toBe(false);
    }
    for (const [lemma, candidateId] of explicitSenseChoices) {
      expect((entryById.get(lemma) as any)?.meta?.curation?.candidateId).toBe(candidateId);
    }
  });

  it('keeps explicit profile placement reachable and non-official', () => {
    const placements = [...grade1Review.profilePlacements, ...grade2Review.profilePlacements];
    expect(placements).toHaveLength(32);
    for (const profile of memberships.values()) expect(profile.provenance.status).toBe('prototype_unverified');
    for (const placement of placements) {
      expect(placement).toMatchObject({ status: 'reviewed', reviewAuthority: 'human_editor', reviewer: 'sahnishant', reviewedAt: '2026-09-02' });
      const entry = entryById.get(placement.lemma) as any;
      expect(entry).toBeTruthy();
      for (const profileRef of placement.approvedProfileRefs) {
        const profile = memberships.get(profileRef) as any;
        expect(profile).toBeTruthy();
        expect(profile.members.some((member: any) => member.rowId === entry.rowId && member.fit === 'core')).toBe(true);
      }
    }
  });

  it('routes the same semantic rows through the existing six delivery forms', () => {
    expect(deliveryRecipes).toHaveLength(27);
    expect(deliveryRecipes.every((recipe) => recipe.sourceRef === SOURCE)).toBe(true);
    expect(deliveryRecipes.some((recipe) => recipe.engine === 'memory_pairs@1' || recipe.engine === 'word_bank_fill@1')).toBe(false);

    const perEntry = perEntryRefs();
    const matching = groupedRefs('match');
    const wordSearch = groupedRefs('word-search');
    const crossword = groupedRefs('crossword');
    expect(perEntry).toHaveLength(96);
    expect(matching).toHaveLength(8);
    expect(wordSearch).toHaveLength(8);
    expect(crossword).toHaveLength(8);
    const launchRefs = [...perEntry, ...matching, ...wordSearch, ...crossword];
    expect(launchRefs).toHaveLength(120);
    expect(new Set(launchRefs).size).toBe(120);

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

  it('keeps one reviewed learnable for every batch-003 semantic row', () => {
    const learnableIds = new Set((reviewedLearnablesJson as any[]).map((learnable: any) => learnable.id));
    expect(learnableIds.size).toBe(32);
    for (const entry of entries) expect(learnableIds.has(entry.conceptIds[0])).toBe(true);
  });
});
