import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GRADE_TARGETS, TOTAL_TARGET, rebandPrimaryGradeCorpus } from '../scripts/lexicon/reband-primary-grade-corpus.mjs';
import { selectGradeReviewWordlist } from '../scripts/lexicon/select-grade-vocabulary.mjs';

const corpus = JSON.parse(readFileSync(resolve('content/lexicon/open/primary-grade-corpus.json'), 'utf8'));

describe('primary vocabulary issue #38 mandate', () => {
  it('enforces exact grade targets, unique normalized lemmas, and row-level source provenance', () => {
    expect(corpus.entries).toHaveLength(TOTAL_TARGET);
    expect(corpus.summary.byGrade).toEqual(Object.fromEntries(Object.entries(GRADE_TARGETS).map(([grade, count]) => [grade, count])));
    expect(new Set(corpus.entries.map((entry: any) => entry.lemma)).size).toBe(TOTAL_TARGET);
    for (const entry of corpus.entries) {
      expect(entry.lemma).toBe(entry.lemma.normalize('NFKC').toLocaleLowerCase('en-US'));
      expect(entry.word).toBe(entry.lemma);
      expect(entry.sourceGrade).toBeGreaterThanOrEqual(1);
      expect(entry.sourceGrade).toBeLessThanOrEqual(6);
      expect(entry.provenance).toEqual({ sourceId: corpus.source.id, sourceRevision: corpus.source.revision, license: corpus.license });
      expect(entry.runtimeActive).toBe(false);
      expect(entry).not.toHaveProperty('definitions');
    }
  });

  it('keeps spelling-only rows available for spelling but out of semantic review queues', () => {
    const synthetic = {
      id: 'synthetic', license: 'CC-BY-SA-4.0', source: { id: 'grundwortschatz-voc-en', revision: 'a'.repeat(40) },
      entries: [
        { id: 'the', lemma: 'the', word: 'the', partOfSpeech: 'article', grade: 1, sourceGrade: 1, reviewStatus: 'spelling_only', frequency: { zipf: 7 }, gradeEvidence: { tags: [] } },
        { id: 'dog', lemma: 'dog', word: 'dog', partOfSpeech: 'noun', grade: 1, sourceGrade: 1, reviewStatus: 'needs_sense_review', frequency: { zipf: 5 }, gradeEvidence: { tags: [] } }
      ]
    };
    const meaning = selectGradeReviewWordlist(synthetic, 1, 10, 'introduced', 'meaning');
    const spelling = selectGradeReviewWordlist(synthetic, 1, 10, 'introduced', 'spelling');
    expect(meaning.items.map((item: any) => item.lemma)).toEqual(['dog']);
    expect(spelling.items.map((item: any) => item.lemma)).toEqual(expect.arrayContaining(['the', 'dog']));
  });

  it('rebanding is deterministic and frequency-led', () => {
    const entries = Array.from({ length: TOTAL_TARGET + 10 }, (_, index) => ({
      id: `row-${index}`, word: `word${index}`, lemma: `word${index}`, partOfSpeech: 'noun', grade: (index % 6) + 1,
      frequency: { zipf: 9 - index / 10000, perMillion: null, band: 1 },
      gradeEvidence: { reason: null, cefrLevel: null, yleLevel: null, tags: [] }, reviewStatus: 'candidate'
    }));
    const letters = (n: number) => {
      let value = n + 1;
      let out = '';
      while (value > 0) { value -= 1; out = String.fromCharCode(97 + (value % 26)) + out; value = Math.floor(value / 26); }
      return `word${out}`;
    };
    entries.forEach((entry, index) => { entry.word = letters(index); entry.lemma = letters(index); });
    const input = {
      id: 'lexicon.primary.english.grade-candidates.001', language: 'en', license: 'CC-BY-SA-4.0',
      source: { id: 'grundwortschatz-voc-en', revision: 'a'.repeat(40) }, policy: {}, entries
    };
    const first = rebandPrimaryGradeCorpus(input);
    const second = rebandPrimaryGradeCorpus(input);
    expect(second.entries).toEqual(first.entries);
    expect(first.entries[0].gradeBandEvidence.rank).toBe(1);
    expect(first.entries.at(-1).gradeBandEvidence.rank).toBe(TOTAL_TARGET);
    expect(first.summary.byGrade).toEqual({ '1': 800, '2': 1500, '3': 1700, '4': 1800, '5': 1900, '6': 2300 });
  });
});
