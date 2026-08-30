import { describe, expect, it } from 'vitest';
import { extractOewnCandidates } from '../scripts/lexicon/extract-oewn-candidates.mjs';

const miniOewn = {
  version: '2026-test',
  lexicalEntries: [
    {
      id: 'oewn-enormous-a',
      lemma: { writtenForm: 'enormous', partOfSpeech: 'a' },
      senses: [
        { id: 'oewn-enormous-a-01', synset: 'oewn-synset-enormous-a' },
        { id: 'oewn-enormous-a-02', synset: 'oewn-synset-enormous-figurative-a' }
      ]
    },
    {
      id: 'oewn-observe-v',
      lemma: { writtenForm: 'observe', partOfSpeech: 'v' },
      senses: [{ id: 'oewn-observe-v-01', synset: 'oewn-synset-observe-v' }]
    }
  ],
  synsets: [
    {
      id: 'oewn-synset-enormous-a',
      partOfSpeech: 'a',
      definition: 'Very large in size or amount.',
      members: ['enormous', 'immense'],
      examples: ['A synthetic example for extractor testing.']
    },
    {
      id: 'oewn-synset-enormous-figurative-a',
      partOfSpeech: 'a',
      definition: [{ value: 'Very serious or important.' }],
      members: ['enormous']
    },
    {
      id: 'oewn-synset-observe-v',
      partOfSpeech: 'v',
      definitions: ['Watch attentively.'],
      members: ['observe', 'watch']
    }
  ]
};

const wordlist = {
  id: 'test-wordlist',
  sourceVersion: '2026-test',
  items: [
    { lemma: 'enormous', partOfSpeech: 'a', targetRowId: 'kr.test.enormous' },
    { lemma: 'observe', partOfSpeech: 'v', targetRowId: 'kr.test.observe' },
    { lemma: 'missing', partOfSpeech: 'a', targetRowId: 'kr.test.missing' }
  ]
};

describe('Open English WordNet candidate extraction', () => {
  it('extracts review-only senses with provenance instead of publishing definitions directly', () => {
    const output = extractOewnCandidates(miniOewn, wordlist, { maxSenses: 1 });

    expect(output.summary).toEqual({ requestedWords: 3, candidateSenses: 2, missingWords: 1 });
    expect(output.missing).toEqual([
      { lemma: 'missing', partOfSpeech: 'a', targetRowId: 'kr.test.missing' }
    ]);

    expect(output.candidates[0]).toMatchObject({
      lemma: 'enormous',
      partOfSpeech: 'a',
      targetRowId: 'kr.test.enormous',
      sourceSense: {
        senseId: 'oewn-enormous-a-01',
        synsetId: 'oewn-synset-enormous-a',
        definition: 'Very large in size or amount.',
        synonyms: ['immense']
      },
      review: {
        status: 'pending',
        selected: false,
        childDefinition: null,
        childExample: null
      },
      provenance: {
        sourceId: 'open-english-wordnet',
        sourceVersion: '2026-test',
        license: 'CC-BY-4.0',
        importedFieldPolicy: 'reference_candidate_only'
      }
    });
  });

  it('keeps multiple senses when no review cap is requested', () => {
    const output = extractOewnCandidates(miniOewn, {
      id: 'polysemy-test',
      items: [{ lemma: 'enormous', partOfSpeech: 'a' }]
    });

    expect(output.candidates).toHaveLength(2);
    expect(output.candidates.map((candidate) => candidate.sourceSense.definition)).toEqual([
      'Very large in size or amount.',
      'Very serious or important.'
    ]);
    expect(output.candidates.every((candidate) => candidate.review.status === 'pending')).toBe(true);
  });
});
