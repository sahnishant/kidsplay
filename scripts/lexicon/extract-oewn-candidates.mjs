import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const OEWN_SOURCE_ID = 'open-english-wordnet';
export const OEWN_LICENSE = 'CC-BY-4.0';

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
};

const textValues = (value) => {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  return values
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (!item || typeof item !== 'object') return '';
      const text = item.value ?? item.text ?? item.writtenForm ?? '';
      return typeof text === 'string' ? text.trim() : '';
    })
    .filter(Boolean);
};

const rootSection = (data, key) => {
  if (data && typeof data === 'object') {
    if (data[key] != null) return data[key];
    if (data.lexicon && typeof data.lexicon === 'object' && data.lexicon[key] != null) return data.lexicon[key];
  }
  return [];
};

const entryLemma = (entry) => {
  const lemma = entry?.lemma;
  if (typeof lemma === 'string') return lemma;
  return typeof lemma?.writtenForm === 'string' ? lemma.writtenForm : '';
};

const entryPos = (entry) => {
  const lemma = entry?.lemma;
  return String(lemma?.partOfSpeech ?? entry?.partOfSpeech ?? '').trim();
};

const synsetDefinition = (synset) => {
  const values = textValues(synset?.definition ?? synset?.definitions);
  return values[0] ?? '';
};

const synsetExamples = (synset) => textValues(synset?.examples ?? synset?.example);
const synsetMembers = (synset) => textValues(synset?.members);

const normalizeWordlist = (wordlist) => {
  if (!wordlist || typeof wordlist !== 'object' || !Array.isArray(wordlist.items)) {
    throw new Error('Word list must be an object with an items array');
  }
  if (wordlist.sourceId && wordlist.sourceId !== OEWN_SOURCE_ID) {
    throw new Error(`Word list sourceId must be ${OEWN_SOURCE_ID}`);
  }

  const seen = new Set();
  return wordlist.items.map((item, index) => {
    if (!item || typeof item !== 'object' || !String(item.lemma ?? '').trim()) {
      throw new Error(`Word list item ${index + 1} requires lemma`);
    }
    const normalized = {
      lemma: String(item.lemma).trim(),
      partOfSpeech: item.partOfSpeech ? String(item.partOfSpeech).trim() : null,
      targetRowId: item.targetRowId ? String(item.targetRowId).trim() : null,
      notes: item.notes ? String(item.notes).trim() : null
    };
    const key = `${normalized.lemma.toLocaleLowerCase('en')}#${normalized.partOfSpeech ?? '*'}`;
    if (seen.has(key)) throw new Error(`Duplicate word list item ${normalized.lemma} (${normalized.partOfSpeech ?? 'any POS'})`);
    seen.add(key);
    return normalized;
  });
};

export function extractOewnCandidates(data, wordlist, options = {}) {
  const entries = asArray(rootSection(data, 'lexicalEntries'));
  const synsets = asArray(rootSection(data, 'synsets'));
  if (!entries.length || !synsets.length) {
    throw new Error('Input does not look like Open English WordNet hierarchical JSON: lexicalEntries and synsets are required');
  }

  const synsetById = new Map(synsets.map((synset) => [String(synset?.id ?? ''), synset]).filter(([id]) => id));
  const requested = normalizeWordlist(wordlist);
  const maxSenses = Number.isInteger(options.maxSenses) && options.maxSenses > 0 ? options.maxSenses : null;
  const sourceVersion = String(
    options.sourceVersion
      ?? wordlist.sourceVersion
      ?? data?.version
      ?? data?.lexicon?.version
      ?? 'unknown'
  );

  const candidates = [];
  const missing = [];

  for (const request of requested) {
    const matchingEntries = entries.filter((entry) => {
      if (entryLemma(entry).toLocaleLowerCase('en') !== request.lemma.toLocaleLowerCase('en')) return false;
      return !request.partOfSpeech || entryPos(entry) === request.partOfSpeech;
    });

    const senses = matchingEntries.flatMap((entry) => {
      const pos = entryPos(entry) || request.partOfSpeech || null;
      return asArray(entry?.senses ?? entry?.sense).map((sense) => ({ entry, sense, pos }));
    });
    const selectedSenses = maxSenses ? senses.slice(0, maxSenses) : senses;

    if (!selectedSenses.length) {
      missing.push({ lemma: request.lemma, partOfSpeech: request.partOfSpeech, targetRowId: request.targetRowId });
      continue;
    }

    selectedSenses.forEach(({ entry, sense, pos }, senseIndex) => {
      const synsetId = String(sense?.synset ?? sense?.synsetId ?? '').trim();
      const synset = synsetById.get(synsetId);
      if (!synsetId || !synset) {
        throw new Error(`OEWN sense ${String(sense?.id ?? '<unknown>')} for ${request.lemma} references missing synset ${synsetId || '<none>'}`);
      }
      const senseId = String(sense?.id ?? '').trim() || null;
      candidates.push({
        candidateId: `${request.lemma}#${pos ?? 'u'}#${senseIndex + 1}`,
        lemma: request.lemma,
        partOfSpeech: pos,
        targetRowId: request.targetRowId,
        sourceSense: {
          entryId: String(entry?.id ?? '').trim() || null,
          senseId,
          synsetId,
          definition: synsetDefinition(synset),
          examples: synsetExamples(synset),
          synonyms: synsetMembers(synset).filter((member) => member.toLocaleLowerCase('en') !== request.lemma.toLocaleLowerCase('en'))
        },
        review: {
          status: 'pending',
          selected: false,
          childDefinition: null,
          childExample: null,
          notes: request.notes
        },
        provenance: {
          sourceId: OEWN_SOURCE_ID,
          sourceVersion,
          license: OEWN_LICENSE,
          importedFieldPolicy: 'reference_candidate_only',
          upstreamIds: [senseId, synsetId].filter(Boolean)
        }
      });
    });
  }

  return {
    schemaVersion: 1,
    kind: 'lexicon_review_candidates',
    wordlistId: String(wordlist.id ?? 'unnamed-wordlist'),
    generatedFrom: {
      sourceId: OEWN_SOURCE_ID,
      sourceVersion,
      license: OEWN_LICENSE
    },
    summary: {
      requestedWords: requested.length,
      candidateSenses: candidates.length,
      missingWords: missing.length
    },
    candidates,
    missing
  };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = value;
      index += 1;
    }
  }
  return args;
}

function runCli() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input || !args.wordlist || !args.output) {
    console.error('Usage: node scripts/lexicon/extract-oewn-candidates.mjs --input <oewn.json> --wordlist <kidsplay-wordlist.json> --output <review-candidates.json> [--source-version 2025] [--max-senses 3]');
    process.exitCode = 1;
    return;
  }

  const inputPath = resolve(String(args.input));
  const wordlistPath = resolve(String(args.wordlist));
  const outputPath = resolve(String(args.output));
  const data = JSON.parse(readFileSync(inputPath, 'utf8'));
  const wordlist = JSON.parse(readFileSync(wordlistPath, 'utf8'));
  const maxSenses = args['max-senses'] ? Number(args['max-senses']) : undefined;
  if (args['max-senses'] && (!Number.isInteger(maxSenses) || maxSenses <= 0)) {
    throw new Error('--max-senses must be a positive integer');
  }

  const output = extractOewnCandidates(data, wordlist, {
    sourceVersion: args['source-version'] ? String(args['source-version']) : undefined,
    maxSenses
  });
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(
    `OEWN candidates written: requested=${output.summary.requestedWords}, ` +
    `senses=${output.summary.candidateSenses}, missing=${output.summary.missingWords}, output=${outputPath}`
  );
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) runCli();
