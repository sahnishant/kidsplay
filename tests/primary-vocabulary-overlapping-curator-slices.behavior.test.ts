import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { candidateIndex } from '../scripts/lexicon/import-primary-vocabulary-reviews.mjs';

const slice = (definition: string) => ({
  schemaVersion: 1,
  generatedFrom: {
    sourceId: 'open-english-wordnet',
    sourceVersion: '2025',
    license: 'CC-BY-4.0'
  },
  items: [{
    lemma: 'old',
    grade: 1,
    upstreamSourceGrade: 1,
    partOfSpeech: 'adjective',
    candidateSenses: [{
      candidateId: 'old#a#1',
      partOfSpeech: 'a',
      referenceOnly: true,
      sourceSense: {
        senseId: 'old%3:00:01::',
        synsetId: '01649031-a',
        definition,
        examples: [],
        synonyms: []
      },
      provenance: {
        sourceId: 'open-english-wordnet',
        sourceVersion: '2025',
        license: 'CC-BY-4.0',
        importedFieldPolicy: 'reference_candidate_only',
        upstreamIds: ['old%3:00:01::', '01649031-a']
      }
    }]
  }]
});

describe('review importer with overlapping deterministic curator windows', () => {
  it('deduplicates identical OEWN candidate evidence from nested windows', () => {
    const directory = mkdtempSync(join(tmpdir(), 'kidsplay-curator-overlap-'));
    try {
      const evidence = slice('having lived for a relatively long time or attained a specific age');
      writeFileSync(join(directory, 'grade-1-meaning-review.json'), JSON.stringify(evidence));
      writeFileSync(join(directory, 'grade-1-meaning-review-080.json'), JSON.stringify(evidence));
      const index = candidateIndex(directory);
      expect(index.size).toBe(1);
      expect(index.get('old#a#1')?.item.lemma).toBe('old');
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('fails closed when the same candidate id carries conflicting evidence', () => {
    const directory = mkdtempSync(join(tmpdir(), 'kidsplay-curator-conflict-'));
    try {
      writeFileSync(join(directory, 'a.json'), JSON.stringify(slice('first reference gloss')));
      writeFileSync(join(directory, 'b.json'), JSON.stringify(slice('conflicting reference gloss')));
      expect(() => candidateIndex(directory)).toThrow(/Conflicting duplicate candidate id old#a#1/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
