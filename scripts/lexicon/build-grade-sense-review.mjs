import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { extractOewnCandidates } from './extract-oewn-candidates.mjs';

const DEFAULT_WORDLIST_DIR = 'content/lexicon/open/review-wordlists';
const DEFAULT_OUTPUT_DIR = 'content/lexicon/open/sense-review';
const DEFAULT_MAX_SENSES = 3;
const OEWN_POS_CODES = new Set(['n', 'v', 'a', 's', 'r']);

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
const recordId = (value) => String(value?.id ?? value?.['@id'] ?? '').trim();

function collectSynsetRecords(node, parentKey = null, output = []) {
  if (Array.isArray(node)) {
    for (const item of node) collectSynsetRecords(item, null, output);
    return output;
  }
  if (!isObject(node)) return output;

  const looksLikeSynset = node.lemma == null
    && (
      node.partOfSpeech != null
      || node.definition != null
      || node.definitions != null
      || node.members != null
      || node.ili != null
    );
  if (looksLikeSynset) {
    if (!recordId(node) && parentKey && !/^\d+$/.test(parentKey)) output.push({ id: parentKey, ...node });
    else output.push(node);
    return output;
  }

  for (const [key, value] of Object.entries(node)) collectSynsetRecords(value, key, output);
  return output;
}

function convertSourceEntryShard(data) {
  if (!isObject(data)) return [];
  const entries = [];
  for (const [lemma, posMap] of Object.entries(data)) {
    if (!isObject(posMap)) continue;
    for (const [partOfSpeech, payload] of Object.entries(posMap)) {
      if (!OEWN_POS_CODES.has(partOfSpeech) || !isObject(payload)) continue;
      const senses = payload.sense ?? payload.senses;
      if (!senses || (Array.isArray(senses) && senses.length === 0)) continue;
      entries.push({
        lemma: { writtenForm: lemma, partOfSpeech },
        partOfSpeech,
        sense: senses
      });
    }
  }
  return entries;
}

export function loadOewnJsonInput(input) {
  const inputPath = resolve(String(input));
  const stats = statSync(inputPath);
  if (!stats.isDirectory()) return JSON.parse(readFileSync(inputPath, 'utf8'));

  const filenames = readdirSync(inputPath).filter((filename) => filename.endsWith('.json')).sort();
  const entryFiles = filenames.filter((filename) => /^entries-[0-9a-z]+\.json$/i.test(filename));
  const synsetFiles = filenames.filter((filename) => /^(noun|verb|adj|adv)\..+\.json$/i.test(filename));
  if (!entryFiles.length || !synsetFiles.length) {
    throw new Error(
      `OEWN directory ${inputPath} must contain entries-*.json and noun/verb/adj/adv synset JSON shards; ` +
      `found ${entryFiles.length} entry shard(s) and ${synsetFiles.length} synset shard(s)`
    );
  }

  // OEWN 2025's JSON archive mirrors the repository source layout rather than
  // wrapping every shard in the Global WordNet JSON-LD graph. Entry shards are
  // keyed as lemma -> POS -> { sense: [...] }; convert only that structural
  // envelope and retain the authoritative sense/synset IDs inside each record.
  const lexicalEntries = entryFiles.flatMap((filename) => {
    const data = JSON.parse(readFileSync(resolve(inputPath, filename), 'utf8'));
    return convertSourceEntryShard(data);
  });
  const synsets = synsetFiles.flatMap((filename) => {
    const data = JSON.parse(readFileSync(resolve(inputPath, filename), 'utf8'));
    return collectSynsetRecords(data);
  });
  if (!lexicalEntries.length || !synsets.length) {
    throw new Error(
      `OEWN shard directory ${inputPath} yielded ${lexicalEntries.length} lexical entries and ${synsets.length} synsets`
    );
  }

  return { lexicalEntries, synsets };
}

export function buildGradeSenseReviews(oewnData, wordlists, options = {}) {
  const maxSenses = Number.isInteger(options.maxSenses) && options.maxSenses > 0
    ? options.maxSenses
    : DEFAULT_MAX_SENSES;
  const sourceVersion = String(options.sourceVersion ?? '2025');
  return wordlists.map(({ filename, wordlist }) => ({
    filename: filename.replace(/\.json$/, '-oewn.json'),
    output: extractOewnCandidates(oewnData, wordlist, { maxSenses, sourceVersion })
  }));
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) args[key] = true;
    else { args[key] = next; index += 1; }
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) throw new Error('--input <Open English WordNet JSON file or unpacked JSON directory> is required');
  const inputPath = resolve(String(args.input));
  const wordlistDir = resolve(String(args['wordlist-dir'] || DEFAULT_WORDLIST_DIR));
  const outputDir = resolve(String(args['output-dir'] || DEFAULT_OUTPUT_DIR));
  const maxSenses = Number(args['max-senses'] || DEFAULT_MAX_SENSES);
  if (!Number.isInteger(maxSenses) || maxSenses < 1 || maxSenses > 10) throw new Error('--max-senses must be an integer from 1 to 10');

  const oewnData = loadOewnJsonInput(inputPath);
  console.log(
    `Loaded OEWN review input: ${oewnData.lexicalEntries?.length ?? 'single-file'} lexical entr${oewnData.lexicalEntries?.length === 1 ? 'y' : 'ies'}, ` +
    `${oewnData.synsets?.length ?? 'single-file'} synsets`
  );
  const wordlists = readdirSync(wordlistDir)
    .filter((filename) => /^grade-[1-6]-(introduced|cumulative)-meaning\.json$/.test(filename))
    .sort()
    .map((filename) => ({
      filename,
      wordlist: JSON.parse(readFileSync(resolve(wordlistDir, filename), 'utf8'))
    }));
  if (!wordlists.length) throw new Error(`No meaning review wordlists found in ${wordlistDir}`);

  mkdirSync(outputDir, { recursive: true });
  const outputs = buildGradeSenseReviews(oewnData, wordlists, {
    maxSenses,
    sourceVersion: args['source-version'] || '2025'
  });
  const summary = [];
  for (const { filename, output } of outputs) {
    const outputPath = resolve(outputDir, filename);
    writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
    summary.push({
      file: basename(outputPath),
      requested: output.summary.requestedWords,
      senses: output.summary.candidateSenses,
      missing: output.summary.missingWords
    });
  }
  console.log(`Grade OEWN sense-review files written: ${JSON.stringify(summary)}`);
}

if (import.meta.url === `file://${resolve(process.argv[1] ?? '')}`) main();
