import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractOewnCandidates } from '../scripts/lexicon/extract-oewn-candidates.mjs';
import { loadOewnJsonInput } from '../scripts/lexicon/build-grade-sense-review.mjs';

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

const globalWordnetJsonLd = {
  '@context': 'https://globalwordnet.github.io/schemas/wn-json-context-1.4.json',
  '@graph': [
    {
      '@id': 'ewn-test',
      version: '2025',
      entry: [
        {
          '@id': 'ewn-enormous-a',
          lemma: { writtenForm: 'enormous' },
          partOfSpeech: 'adjective',
          sense: [{ '@id': 'ewn-enormous-a-01', synsetRef: 'ewn-large-a' }]
        },
        {
          '@id': 'ewn-immense-a',
          lemma: { writtenForm: 'immense' },
          partOfSpeech: 'adjective',
          sense: [{ '@id': 'ewn-immense-a-01', synsetRef: 'ewn-large-a' }]
        }
      ],
      synset: [
        {
          '@id': 'ewn-large-a',
          partOfSpeech: 'adjective',
          definition: [{ gloss: 'Very large in size or amount.' }],
          example: [{ value: 'A second synthetic extractor example.' }],
          members: ['ewn-enormous-a-01', 'ewn-immense-a-01']
        }
      ]
    }
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

  it('accepts the Global WordNet JSON-LD entry/synset shape used by official releases', () => {
    const output = extractOewnCandidates(globalWordnetJsonLd, {
      id: 'jsonld-test',
      sourceId: 'open-english-wordnet',
      items: [{ lemma: 'enormous', partOfSpeech: 'a' }]
    });

    expect(output.generatedFrom.sourceVersion).toBe('2025');
    expect(output.candidates).toHaveLength(1);
    expect(output.candidates[0]).toMatchObject({
      lemma: 'enormous',
      partOfSpeech: 'a',
      sourceSense: {
        entryId: 'ewn-enormous-a',
        senseId: 'ewn-enormous-a-01',
        synsetId: 'ewn-large-a',
        definition: 'Very large in size or amount.',
        examples: ['A second synthetic extractor example.'],
        synonyms: ['immense']
      }
    });
  });

  it('loads the sharded entry/synset directory layout used by the OEWN 2025 JSON archive', () => {
    const directory = mkdtempSync(join(tmpdir(), 'kidsplay-oewn-shards-'));
    try {
      writeFileSync(join(directory, 'entries-e.json'), JSON.stringify({
        'oewn-enormous-a': {
          lemma: { writtenForm: 'enormous', partOfSpeech: 'a' },
          senses: [{ id: 'oewn-enormous-a-01', synset: 'oewn-synset-enormous-a' }]
        }
      }));
      writeFileSync(join(directory, 'adj.all.json'), JSON.stringify({
        'oewn-synset-enormous-a': {
          partOfSpeech: 'a',
          definition: 'Very large in size or amount.',
          members: ['enormous']
        }
      }));
      writeFileSync(join(directory, 'frames.json'), JSON.stringify({ frames: [] }));

      const loaded = loadOewnJsonInput(directory);
      const output = extractOewnCandidates(loaded, {
        id: 'sharded-json-test',
        sourceId: 'open-english-wordnet',
        items: [{ lemma: 'enormous', partOfSpeech: 'a' }]
      }, { sourceVersion: '2025' });

      expect(loaded.lexicalEntries).toHaveLength(1);
      expect(loaded.synsets).toHaveLength(1);
      expect(output.candidates).toHaveLength(1);
      expect(output.candidates[0].sourceSense).toMatchObject({
        entryId: 'oewn-enormous-a',
        synsetId: 'oewn-synset-enormous-a',
        definition: 'Very large in size or amount.'
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('rejects wrong-source word lists and malformed source graphs', () => {
    expect(() => extractOewnCandidates(miniOewn, {
      id: 'wrong-source',
      sourceId: 'some-other-dictionary',
      items: [{ lemma: 'enormous' }]
    })).toThrow(/sourceId/);

    expect(() => extractOewnCandidates({ lexicalEntries: [] }, {
      id: 'bad-input',
      items: [{ lemma: 'enormous' }]
    })).toThrow(/supported Open English WordNet JSON/);
  });
});
