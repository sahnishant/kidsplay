import { describe, expect, it } from 'vitest';

import grade1Review from '../content/lexicon/reviews/grade-1-batch-004.json';
import grade2Review from '../content/lexicon/reviews/grade-2-batch-004.json';
import reviewedLearnablesJson from '../content/learnables/primary-vocabulary-reviewed-batch-004.json';
import reviewedKnowledgeJson from '../content/knowledge/english-vocabulary-primary-reviewed-batch-004.json';
import generatedCrosswordAuthoringJson from '../content/authoring/crosswords/__generated-from-knowledge.json';
import generatedQuestionsJson from '../content/questions/__generated-from-knowledge.json';
import freeVocabularyPack from '../content/packs/free-vocabulary.json';
import cbseClass1 from '../content/profile-memberships/CBSE_INDIA_CLASS1.json';
import cisceClass1 from '../content/profile-memberships/CISCE_INDIA_CLASS1.json';
import cbseClass2 from '../content/profile-memberships/CBSE_INDIA_CLASS2.json';
import cisceClass2 from '../content/profile-memberships/CISCE_INDIA_CLASS2.json';
import sofClass2 from '../content/profile-memberships/SOF_INDIA_CLASS2.json';
import deliveryRecipes from '../content/recipes/primary-vocabulary-reviewed-delivery-batch-004.json';

const SOURCE = 'knowledge.english.vocabulary.primary-reviewed.004';
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

const expectedChoices = new Map([
  ['answer', 'answer#n#1'], ['door', 'door#n#1'], ['difficult', 'difficult#a#1'],
  ['century', 'century#n#1'], ['eye', 'eye#n#1'], ['often', 'often#r#1'],
  ['new', 'new#a#3'], ['good', 'good#a#1'], ['first', 'first#a#1'],
  ['believe', 'believe#v#1'], ['work', 'work#n#1'], ['best', 'best#a#1'],
  ['sort', 'sort#n#1'], ['speed', 'speed#n#1'], ['quick', 'quick#a#1'],
  ['clean', 'clean#a#1'], ['computer', 'computer#n#1'], ['hotel', 'hotel#n#1'],
  ['beach', 'beach#n#1'], ['color', 'color#n#1'], ['shop', 'shop#n#1'],
  ['camera', 'camera#n#1'], ['lake', 'lake#n#1'], ['adult', 'adult#n#1'], ['window', 'window#n#1']
]);
const held = new Set(['earth', 'well', 'move', 'long', 'region', 'sun', 'subject']);
const groups = ['grade1-a', 'grade1-b', 'grade1-c', 'grade2-a', 'grade2-b', 'grade2-c'];

function perEntryRefs() {
  return [
    'vocab.primary.reviewed.mcq.word-to-meaning.004',
    'vocab.primary.reviewed.mcq.meaning-to-word.004',
    'vocab.primary.reviewed.unscramble.004'
  ].flatMap((prefix) => entries.map((entry: any) => `${prefix}.${entry.id}`));
}

function groupedRefs(kind: 'match' | 'word-search' | 'crossword') {
  return groups.map((group) => `vocab.primary.reviewed.${kind}.${group}.004`);
}

describe('reviewed primary vocabulary production batch 004', () => {
  it('publishes exactly the 25 human-approved meanings and keeps seven explicit holds out', () => {
    expect((reviewedKnowledgeJson as any[])[0].id).toBe(SOURCE);
    expect(entries).toHaveLength(25);
    expect(entries.filter((entry: any) => entry.meta.primaryVocabularyGrade === 1)).toHaveLength(12);
    expect(entries.filter((entry: any) => entry.meta.primaryVocabularyGrade === 2)).toHaveLength(13);
    expect(grade1Review.summary).toMatchObject({ accepted: 12, held: 4, reviewedProfilePlacements: 12 });
    expect(grade2Review.summary).toMatchObject({ accepted: 13, held: 3, reviewedProfilePlacements: 13 });
    expect(new Set([...grade1Review.unresolvedItems, ...grade2Review.unresolvedItems].map((item: any) => item.lemma))).toEqual(held);

    const decisions = [...grade1Review.decisions, ...grade2Review.decisions];
    expect(decisions).toHaveLength(25);
    for (const decision of decisions) {
      expect(decision).toMatchObject({
        status: 'reviewed', decision: 'accept', reviewAuthority: 'human_editor',
        reviewer: 'sahnishant', reviewedAt: '2026-09-03'
      });
      const entry = entryById.get(decision.lemma) as any;
      expect(entry).toBeTruthy();
      expect(entry.meta.curation.candidateId).toBe(decision.candidateId);
      expect(entry.object.label).toBe(decision.childDefinition);
      expect(entry.meta.curation.sourceGlossCopied).toBe(false);
    }
    for (const item of [...grade1Review.unresolvedItems, ...grade2Review.unresolvedItems]) {
      expect(item).toMatchObject({ status: 'sense_unresolved', decision: 'hold', reviewAuthority: 'human_editor', reviewer: 'sahnishant', reviewedAt: '2026-09-03', candidateCorrectionRequiresExplicitApproval: false });
      expect(entryById.has(item.lemma)).toBe(false);
    }
    for (const [lemma, candidateId] of expectedChoices) expect((entryById.get(lemma) as any)?.meta?.curation?.candidateId).toBe(candidateId);
  });

  it('materializes only approved editorial profile placement and keeps provenance non-official', () => {
    const placements = [...grade1Review.profilePlacements, ...grade2Review.profilePlacements];
    expect(placements).toHaveLength(25);
    for (const profile of memberships.values()) expect(profile.provenance.status).toBe('prototype_unverified');
    for (const placement of placements) {
      expect(held.has(placement.lemma)).toBe(false);
      expect(placement).toMatchObject({ status: 'reviewed', reviewAuthority: 'human_editor', reviewer: 'sahnishant', reviewedAt: '2026-09-03' });
      const entry = entryById.get(placement.lemma) as any;
      expect(entry).toBeTruthy();
      for (const profileRef of placement.approvedProfileRefs) {
        const profile = memberships.get(profileRef) as any;
        expect(profile).toBeTruthy();
        expect(profile.members.some((member: any) => member.rowId === entry.rowId && member.fit === 'core')).toBe(true);
      }
    }
  });

  it('routes the same 25 semantic rows through the existing six delivery forms', () => {
    expect(deliveryRecipes).toHaveLength(21);
    expect(deliveryRecipes.every((recipe) => recipe.sourceRef === SOURCE)).toBe(true);
    const perEntry = perEntryRefs();
    const matching = groupedRefs('match');
    const wordSearch = groupedRefs('word-search');
    const crossword = groupedRefs('crossword');
    expect(perEntry).toHaveLength(75);
    expect(matching).toHaveLength(6);
    expect(wordSearch).toHaveLength(6);
    expect(crossword).toHaveLength(6);
    const launchRefs = [...perEntry, ...matching, ...wordSearch, ...crossword];
    expect(launchRefs).toHaveLength(93);
    expect(new Set(launchRefs).size).toBe(93);

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

  it('keeps one reviewed learnable for every accepted batch-004 row and none for held rows', () => {
    const learnables = reviewedLearnablesJson as any[];
    const learnableIds = new Set(learnables.map((learnable: any) => learnable.id));
    expect(learnableIds.size).toBe(25);
    for (const entry of entries) expect(learnableIds.has(entry.conceptIds[0])).toBe(true);
    for (const lemma of held) expect(learnableIds.has(`vocabulary.meaning.${lemma}`)).toBe(false);
  });
});
