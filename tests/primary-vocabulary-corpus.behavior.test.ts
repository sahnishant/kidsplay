import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildPrimaryVocabularyProfileSlice } from '../scripts/lexicon/build-primary-vocabulary-profile-slice.mjs';
import { selectGradeReviewWordlist } from '../scripts/lexicon/select-grade-vocabulary.mjs';

const corpus = JSON.parse(readFileSync(resolve('content/lexicon/open/primary-grade-corpus.json'), 'utf8'));
const sources = JSON.parse(readFileSync(resolve('content/lexicon/sources.json'), 'utf8'));
const vocabularyKnowledge = JSON.parse(readFileSync(resolve('content/knowledge/english-vocabulary-foundation.json'), 'utf8'));
const cbseClass2Membership = JSON.parse(readFileSync(resolve('content/profile-memberships/CBSE_INDIA_CLASS2.json'), 'utf8'));

describe('grade-aware primary vocabulary corpus', () => {
  it('keeps a large six-grade review corpus with no imported dictionary prose', () => {
    expect(corpus.license).toBe('CC-BY-SA-4.0');
    expect(corpus.entries.length).toBe(10_000);
    expect(corpus.policy).toMatchObject({
      childFacingDefinitionIncluded: false,
      importedExamplesIncluded: false,
      runtimeDefault: false,
      reviewRequiredBeforeMeaningInstruction: true,
      uniqueNormalizedLemmaRequired: true,
      rowLevelProvenanceRequired: true
    });
    const expected = { 1: 800, 2: 1500, 3: 1700, 4: 1800, 5: 1900, 6: 2300 };
    for (const [grade, target] of Object.entries(expected)) {
      expect(corpus.entries.filter((entry: any) => entry.grade === Number(grade))).toHaveLength(target);
    }
    const allowedStatuses = new Set(['clean', 'needs_sense_review', 'spelling_only']);
    expect(corpus.entries.every((entry: any) => allowedStatuses.has(entry.reviewStatus))).toBe(true);
    expect(corpus.entries.some((entry: any) => entry.reviewStatus === 'needs_sense_review')).toBe(true);
    expect(corpus.entries.some((entry: any) => entry.reviewStatus === 'spelling_only')).toBe(true);
    const serialized = JSON.stringify(corpus.entries).toLowerCase();
    expect(serialized).not.toContain('"definitions"');
    expect(serialized).not.toContain('"grade_examples"');
    expect(serialized).not.toContain('"gutenberg_examples"');
  });

  it('separates semantic enrichment from spelling/recognition selection', () => {
    const meaning = selectGradeReviewWordlist(corpus, 2, 80, 'introduced', 'meaning');
    const spelling = selectGradeReviewWordlist(corpus, 2, 80, 'introduced', 'spelling');
    expect(meaning.sourceId).toBe('open-english-wordnet');
    expect(spelling.sourceId).toBe('grundwortschatz-voc-en');
    expect(meaning.selection.purpose).toBe('meaning');
    expect(spelling.selection.purpose).toBe('spelling');
    expect(meaning.items).toHaveLength(80);
    expect(spelling.items).toHaveLength(80);
    expect(meaning.items.every((item: any) => item.reviewStatus !== 'spelling_only')).toBe(true);
    expect(meaning.items.some((item: any) => item.lemma.toLowerCase() === 'here')).toBe(false);
  });

  it('builds prioritized, unique meaning-review queues for every introduction grade', () => {
    for (let grade = 1; grade <= 6; grade += 1) {
      const wordlist = selectGradeReviewWordlist(corpus, grade, 40, 'introduced', 'meaning');
      const expectedSelected = Math.min(40, wordlist.selection.candidatePool);
      expect(wordlist.sourceGradeCorpus.license).toBe('CC-BY-SA-4.0');
      expect(wordlist.selection).toMatchObject({ grade, mode: 'introduced', purpose: 'meaning', requested: 40, selected: expectedSelected });
      expect(wordlist.items).toHaveLength(expectedSelected);
      expect(wordlist.items.length).toBeGreaterThan(0);
      expect(new Set(wordlist.items.map((item: any) => item.lemma.toLowerCase())).size).toBe(expectedSelected);
      expect(wordlist.items.every((item: any) => item.sourceGrade === grade)).toBe(true);
      expect(wordlist.items.every((item: any) => item.priorityScore > 0)).toBe(true);
      expect(wordlist.items.every((item: any) => item.partOfSpeech === item.sourcePartOfSpeech)).toBe(true);
    }
  });

  it('can build cumulative by-grade meaning pools without treating source grade as board alignment', () => {
    let previousPool = 0;
    for (let grade = 1; grade <= 6; grade += 1) {
      const wordlist = selectGradeReviewWordlist(corpus, grade, 40, 'cumulative', 'meaning');
      expect(wordlist.selection.mode).toBe('cumulative');
      expect(wordlist.items.every((item: any) => item.sourceGrade <= grade)).toBe(true);
      expect(wordlist.selection.candidatePool).toBeGreaterThanOrEqual(previousPool);
      previousPool = wordlist.selection.candidatePool;
    }
  });

  it('keeps non-commercial datasets out of the product-import path', () => {
    for (const id of ['norare-data-curation-repo', 'vxgl']) {
      expect(sources.sources.find((source: any) => source.id === id)).toMatchObject({ role: 'research_reference_only', adoption: 'do_not_import_product_data' });
    }
    expect(sources.sources.find((source: any) => source.id === 'norare-cldf')).toMatchObject({ license: 'CC-BY-4.0', adoption: 'allowed_released_data_only' });
  });

  it('builds profile review slices without copying child or source definitions into the bridge', () => {
    const syntheticCorpus = {
      id: 'lexicon.primary.english.grade-candidates.001',
      license: 'CC-BY-SA-4.0',
      source: { id: 'grundwortschatz-voc-en', revision: 'a'.repeat(40) },
      entries: [
        {
          id: 'source.alpha', word: 'alpha', lemma: 'alpha', partOfSpeech: 'noun', grade: 2, sourceGrade: 2,
          frequency: { zipf: 5, perMillion: 10, band: 1 },
          gradeEvidence: { reason: null, cefrLevel: 'A1', yleLevel: null, tags: ['source:test'] },
          reviewStatus: 'needs_sense_review'
        },
        {
          id: 'source.beta', word: 'beta', lemma: 'beta', partOfSpeech: 'adjective', grade: 2, sourceGrade: 2,
          frequency: { zipf: 4, perMillion: 5, band: 2 },
          gradeEvidence: { reason: null, cefrLevel: 'A1', yleLevel: null, tags: ['source:test'] },
          reviewStatus: 'needs_sense_review'
        }
      ]
    };
    const knowledge = [{
      authoring: { status: 'reviewed' },
      entries: [{
        rowId: 'kr.vocab.meaning.alpha.safe', relation: 'means',
        subject: { id: 'alpha', label: 'alpha' }, object: { id: 'alpha-object', label: 'this prose must never enter the profile bridge' }
      }]
    }, {
      authoring: { status: 'draft' },
      entries: [{
        rowId: 'kr.vocab.meaning.beta.draft', relation: 'means',
        subject: { id: 'beta', label: 'beta' }, object: { id: 'beta-object', label: 'draft prose must stay out too' }
      }]
    }];
    const membership = { profileRef: 'TEST_PRIMARY_PROFILE', members: [{ rowId: 'kr.vocab.meaning.alpha.safe', fit: 'review' }] };
    const slice = buildPrimaryVocabularyProfileSlice(syntheticCorpus, knowledge, membership, {
      profileRef: 'TEST_PRIMARY_PROFILE', grade: 2, mode: 'introduced', limit: 2
    });
    expect(slice.policy).toMatchObject({
      runtimeContent: false, mutatesKnowledge: false, mutatesProfileMembership: false,
      sourceDefinitionsIncluded: false, sourceExamplesIncluded: false, boardAlignmentClaimed: false
    });
    expect(slice.summary).toEqual({
      selectedCandidates: 2, reviewedCandidateWords: 1, alreadyInProfileWords: 1, alreadyInProfileRows: 1, pendingEditorialWords: 1
    });
    expect(slice.readyForProfileReview).toEqual([expect.objectContaining({
      lemma: 'alpha', sourceCorpusId: 'source.alpha', kidsplayRowIds: ['kr.vocab.meaning.alpha.safe'],
      existingProfileMemberships: [{ rowId: 'kr.vocab.meaning.alpha.safe', fit: 'review' }]
    })]);
    expect(slice.pendingEditorialReview).toEqual([expect.objectContaining({
      lemma: 'beta', sourceCorpusId: 'source.beta', reviewNeeded: ['kidsplay_child_definition', 'profile_placement']
    })]);
    const serialized = JSON.stringify(slice);
    expect(serialized).not.toContain('this prose must never enter the profile bridge');
    expect(serialized).not.toContain('draft prose must stay out too');
    expect(serialized).not.toContain('"object"');
  });

  it('connects a real grade/profile selection to existing reviewed vocabulary rows without changing membership semantics', () => {
    const slice = buildPrimaryVocabularyProfileSlice(corpus, [vocabularyKnowledge], cbseClass2Membership, {
      profileRef: 'CBSE_INDIA_CLASS2', grade: 2, mode: 'introduced', limit: 100
    });
    expect(slice.summary.selectedCandidates).toBe(100);
    expect(slice.summary.reviewedCandidateWords + slice.summary.pendingEditorialWords).toBe(100);
    expect(slice.sourceGradeCorpus).toMatchObject({ sourceId: 'grundwortschatz-voc-en', license: 'CC-BY-SA-4.0' });
    expect(slice.readyForProfileReview.every((item: any) => item.kidsplayRowIds.every((rowId: string) => rowId.startsWith('kr.vocab.meaning.')))).toBe(true);
    expect(slice.policy.mutatesProfileMembership).toBe(false);
  });

  it('can consume a finalized OEWN-resolvable meaning wordlist and rejects stale corpus provenance', () => {
    const finalizedWordlist = selectGradeReviewWordlist(corpus, 2, 5, 'introduced', 'meaning');
    finalizedWordlist.selection.semanticResolution = {
      sourceId: 'open-english-wordnet', sourceVersion: '2025', requestedTarget: 5, selectedResolved: 5,
      targetShortfall: 0, filledRequestedTarget: true, policy: 'meaning_queue_backfill_only_no_runtime_publish'
    };
    const slice = buildPrimaryVocabularyProfileSlice(corpus, [vocabularyKnowledge], cbseClass2Membership, {
      profileRef: 'CBSE_INDIA_CLASS2', grade: 2, mode: 'introduced', limit: 3, wordlist: finalizedWordlist
    });
    expect(slice.summary.selectedCandidates).toBe(3);
    expect(slice.sourceSelection).toMatchObject({
      requested: 5, selected: 5, sliceLimit: 3, sliceSelected: 3,
      semanticResolution: { selectedResolved: 5, targetShortfall: 0, filledRequestedTarget: true }
    });
    const staleWordlist = structuredClone(finalizedWordlist);
    staleWordlist.sourceGradeCorpus.sourceRevision = 'b'.repeat(40);
    expect(() => buildPrimaryVocabularyProfileSlice(corpus, [vocabularyKnowledge], cbseClass2Membership, {
      profileRef: 'CBSE_INDIA_CLASS2', grade: 2, mode: 'introduced', limit: 3, wordlist: staleWordlist
    })).toThrow(/source revision/);
  });
});
