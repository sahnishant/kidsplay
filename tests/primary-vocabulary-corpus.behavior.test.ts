import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { selectGradeReviewWordlist } from '../scripts/lexicon/select-grade-vocabulary.mjs';

const corpus = JSON.parse(readFileSync(new URL('../content/lexicon/open/primary-grade-corpus.json', import.meta.url), 'utf8'));
const sources = JSON.parse(readFileSync(new URL('../content/lexicon/sources.json', import.meta.url), 'utf8'));

describe('grade-aware primary vocabulary corpus', () => {
  it('keeps a large six-grade candidate pool with no imported dictionary prose', () => {
    expect(corpus.license).toBe('CC-BY-SA-4.0');
    expect(corpus.entries.length).toBeGreaterThanOrEqual(10_000);
    expect(corpus.policy).toMatchObject({
      childFacingDefinitionIncluded: false,
      importedExamplesIncluded: false,
      runtimeDefault: false,
      reviewRequiredBeforeMeaningInstruction: true
    });

    const grades = new Set(corpus.entries.map((entry: any) => entry.grade));
    expect(grades).toEqual(new Set([1, 2, 3, 4, 5, 6]));
    for (const grade of grades) {
      expect(corpus.entries.filter((entry: any) => entry.grade === grade).length).toBeGreaterThan(100);
    }
    expect(corpus.entries.every((entry: any) => entry.reviewStatus === 'candidate')).toBe(true);
    const serialized = JSON.stringify(corpus.entries).toLowerCase();
    expect(serialized).not.toContain('"definitions"');
    expect(serialized).not.toContain('"grade_examples"');
    expect(serialized).not.toContain('"gutenberg_examples"');
  });

  it('builds prioritized, unique OEWN review queues for every introduction grade', () => {
    for (let grade = 1; grade <= 6; grade += 1) {
      const wordlist = selectGradeReviewWordlist(corpus, grade, 60, 'introduced');
      expect(wordlist.sourceId).toBe('open-english-wordnet');
      expect(wordlist.sourceGradeCorpus.license).toBe('CC-BY-SA-4.0');
      expect(wordlist.selection).toMatchObject({ grade, mode: 'introduced', selected: 60 });
      expect(wordlist.items).toHaveLength(60);
      expect(new Set(wordlist.items.map((item: any) => item.lemma.toLowerCase())).size).toBe(60);
      expect(wordlist.items.every((item: any) => item.sourceGrade === grade)).toBe(true);
      expect(wordlist.items.every((item: any) => item.priorityScore > 0)).toBe(true);
    }
  });

  it('can build cumulative by-grade pools without treating the source grade as board alignment', () => {
    let previousPool = 0;
    for (let grade = 1; grade <= 6; grade += 1) {
      const wordlist = selectGradeReviewWordlist(corpus, grade, 60, 'cumulative');
      expect(wordlist.selection.mode).toBe('cumulative');
      expect(wordlist.items.every((item: any) => item.sourceGrade <= grade)).toBe(true);
      expect(wordlist.selection.candidatePool).toBeGreaterThanOrEqual(previousPool);
      previousPool = wordlist.selection.candidatePool;
    }
  });

  it('keeps non-commercial datasets out of the product-import path', () => {
    for (const id of ['norare-data-curation-repo', 'vxgl']) {
      expect(sources.sources.find((source: any) => source.id === id)).toMatchObject({
        role: 'research_reference_only',
        adoption: 'do_not_import_product_data'
      });
    }
    expect(sources.sources.find((source: any) => source.id === 'norare-cldf')).toMatchObject({
      license: 'CC-BY-4.0',
      adoption: 'allowed_released_data_only'
    });
  });
});
