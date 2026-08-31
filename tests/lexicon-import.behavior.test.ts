import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractOewnCandidates } from '../scripts/lexicon/extract-oewn-candidates.mjs';
import { buildResolvedGradeSenseReviews, loadOewnJsonInput } from '../scripts/lexicon/build-grade-sense-review.mjs';

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
      '@context': { '@language': 'en' },
      '@id': 'ewn-test',
      '@type': 'lime:Lexicon',
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

  it('treats WordNet adjective satellites as compatible with adjective review requests', () => {
    const satelliteData = {
      version: '2026-test',
      lexicalEntries: [{
        id: 'oewn-sleepy-s',
        lemma: { writtenForm: 'sleepy', partOfSpeech: 's' },
        senses: [{ id: 'oewn-sleepy-s-01', synset: 'oewn-synset-sleepy-s' }]
      }],
      synsets: [{
        id: 'oewn-synset-sleepy-s',
        partOfSpeech: 's',
        definition: 'Inclined to sleep.',
        members: ['sleepy']
      }]
    };

    const output = extractOewnCandidates(satelliteData, {
      id: 'satellite-test',
      items: [{ lemma: 'sleepy', partOfSpeech: 'adjective' }]
    });

    expect(output.summary).toEqual({ requestedWords: 1, candidateSenses: 1, missingWords: 0 });
    expect(output.candidates[0]).toMatchObject({
      lemma: 'sleepy',
      partOfSpeech: 's',
      sourceSense: { synsetId: 'oewn-synset-sleepy-s' }
    });
  });

  it('backfills meaning queues past unresolved source candidates without publishing source glosses', () => {
    const corpus = {
      id: 'lexicon.primary.english.grade-candidates.001',
      license: 'CC-BY-SA-4.0',
      source: { id: 'grundwortschatz-voc-en', revision: 'a'.repeat(40) },
      entries: [
        {
          id: 'source.unresolved-name', word: 'Ghostname', lemma: 'Ghostname', partOfSpeech: 'noun', grade: 2,
          frequency: { zipf: 7, perMillion: 100, band: 1 },
          gradeEvidence: { reason: null, cefrLevel: 'A1', yleLevel: null, tags: ['source:test'] },
          reviewStatus: 'candidate'
        },
        {
          id: 'source.enormous', word: 'enormous', lemma: 'enormous', partOfSpeech: 'adjective', grade: 2,
          frequency: { zipf: 6, perMillion: 50, band: 1 },
          gradeEvidence: { reason: null, cefrLevel: 'A1', yleLevel: null, tags: ['source:test'] },
          reviewStatus: 'candidate'
        }
      ]
    };

    const [result] = buildResolvedGradeSenseReviews(miniOewn, corpus, {
      grades: [2],
      targetPerGrade: 1,
      overscanPerGrade: 2,
      maxSenses: 1,
      sourceVersion: '2026-test'
    });

    expect(result.wordlist.items).toHaveLength(1);
    expect(result.wordlist.items[0].lemma).toBe('enormous');
    expect(result.wordlist.selection.semanticResolution).toMatchObject({
      sourceId: 'open-english-wordnet',
      sourceVersion: '2026-test',
      overscanRequested: 2,
      skippedUnresolved: 1,
      filledAvailableTarget: true,
      policy: 'meaning_queue_backfill_only_no_runtime_publish'
    });
    expect(result.output.summary).toEqual({ requestedWords: 1, candidateSenses: 1, missingWords: 0 });
    expect(JSON.stringify(result.wordlist)).not.toContain('Very large in size or amount.');
  });

  it('accepts the Global WordNet JSON-LD entry/synset shape used by official interchange', () => {
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

  it('loads the lemma-to-POS shard layout used by the OEWN 2025 JSON archive', () => {
    const directory = mkdtempSync(join(tmpdir(), 'kidsplay-oewn-shards-'));
    try {
      writeFileSync(join(directory, 'entries-e.json'), JSON.stringify({
        enormous: {
          a: {
            sense: [{ id: 'enormous%3:00:00::', synset: '01389738-a' }]
          }
        },
        observe: {
          v: {
            sense: [{ id: 'observe%2:39:00::', synset: '02133467-v' }]
          }
        }
      }));
      writeFileSync(join(directory, 'adj.all.json'), JSON.stringify({
        '01389738-a': {
          partOfSpeech: 'a',
          definition: ['Very large in size or amount.'],
          members: ['enormous', 'immense']
        }
      }));
      writeFileSync(join(directory, 'verb.perception.json'), JSON.stringify({
        '02133467-v': {
          partOfSpeech: 'v',
          definition: ['Watch attentively.'],
          members: ['observe', 'watch']
        }
      }));
      writeFileSync(join(directory, 'frames.json'), JSON.stringify({ frames: [] }));

      const loaded = loadOewnJsonInput(directory);
      const output = extractOewnCandidates(loaded, {
        id: 'sharded-json-test',
        sourceId: 'open-english-wordnet',
        items: [
          { lemma: 'enormous', partOfSpeech: 'a' },
          { lemma: 'observe', partOfSpeech: 'v' }
        ]
      }, { sourceVersion: '2025' });

      expect(loaded.lexicalEntries).toHaveLength(2);
      expect(loaded.synsets).toHaveLength(2);
      expect(output.summary).toEqual({ requestedWords: 2, candidateSenses: 2, missingWords: 0 });
      expect(output.candidates[0].sourceSense).toMatchObject({
        entryId: null,
        senseId: 'enormous%3:00:00::',
        synsetId: '01389738-a',
        definition: 'Very large in size or amount.',
        synonyms: ['immense']
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
