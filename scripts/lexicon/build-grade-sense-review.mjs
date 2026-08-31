import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { extractOewnCandidates, OEWN_SOURCE_ID } from './extract-oewn-candidates.mjs';
import { selectGradeReviewWordlist } from './select-grade-vocabulary.mjs';

const DEFAULT_WORDLIST_DIR = 'content/lexicon/open/review-wordlists';
const DEFAULT_OUTPUT_DIR = 'content/lexicon/open/sense-review';
const DEFAULT_CORPUS = 'content/lexicon/open/primary-grade-corpus.json';
const DEFAULT_MAX_SENSES = 3;
const DEFAULT_TARGET_PER_GRADE = 400;
const DEFAULT_OVERSCAN_PER_GRADE = 1200;
const OEWN_POS_CODES = new Set(['n', 'v', 'a', 's', 'r']);

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
const recordId = (value) => String(value?.id ?? value?.['@id'] ?? '').trim();
const lemmaKey = (value) => String(value ?? '').trim().toLocaleLowerCase('en');

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

export function buildResolvedGradeSenseReviews(oewnData, corpus, options = {}) {
  const maxSenses = Number.isInteger(options.maxSenses) && options.maxSenses > 0
    ? options.maxSenses
    : DEFAULT_MAX_SENSES;
  const sourceVersion = String(options.sourceVersion ?? '2025');
  const mode = String(options.mode ?? 'introduced');
  if (!['introduced', 'cumulative'].includes(mode)) throw new Error('mode must be introduced or cumulative');

  const targetPerGrade = Number.isInteger(options.targetPerGrade) && options.targetPerGrade > 0
    ? options.targetPerGrade
    : DEFAULT_TARGET_PER_GRADE;
  const overscanPerGrade = Number.isInteger(options.overscanPerGrade) && options.overscanPerGrade >= targetPerGrade
    ? options.overscanPerGrade
    : Math.max(DEFAULT_OVERSCAN_PER_GRADE, targetPerGrade);
  const grades = Array.isArray(options.grades) && options.grades.length
    ? options.grades
    : [1, 2, 3, 4, 5, 6];

  return grades.map((grade) => {
    const broadWordlist = selectGradeReviewWordlist(corpus, grade, overscanPerGrade, mode, 'meaning');
    const broadReview = extractOewnCandidates(oewnData, broadWordlist, { maxSenses: 1, sourceVersion });
    const resolvedLemmas = new Set(broadReview.candidates.map((candidate) => lemmaKey(candidate.lemma)));
    const selectedItems = broadWordlist.items
      .filter((item) => resolvedLemmas.has(lemmaKey(item.lemma)))
      .slice(0, targetPerGrade);
    const availableTarget = Math.min(targetPerGrade, broadWordlist.items.length);

    const wordlist = {
      ...broadWordlist,
      selection: {
        ...broadWordlist.selection,
        requested: targetPerGrade,
        selected: selectedItems.length,
        algorithm: `${broadWordlist.selection.algorithm} + OEWN resolvability backfill`,
        semanticResolution: {
          sourceId: OEWN_SOURCE_ID,
          sourceVersion,
          overscanRequested: overscanPerGrade,
          overscanSelected: broadWordlist.items.length,
          resolvableInOverscan: resolvedLemmas.size,
          skippedUnresolved: broadReview.missing.length,
          availableTarget,
          filledAvailableTarget: selectedItems.length === Math.min(availableTarget, resolvedLemmas.size),
          policy: 'meaning_queue_backfill_only_no_runtime_publish'
        }
      },
      items: selectedItems
    };
    const output = extractOewnCandidates(oewnData, wordlist, { maxSenses, sourceVersion });
    if (output.missing.length) {
      throw new Error(`Resolved grade ${grade} meaning queue unexpectedly retained ${output.missing.length} unresolved word(s)`);
    }

    return {
      grade,
      wordlistFilename: `grade-${grade}-${mode}-meaning.json`,
      filename: `grade-${grade}-${mode}-meaning-oewn.json`,
      wordlist,
      output
    };
  });
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

function positiveInteger(value, fallback, label) {
  const parsed = value == null ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${label} must be a positive integer`);
  return parsed;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) throw new Error('--input <Open English WordNet JSON file or unpacked JSON directory> is required');
  const inputPath = resolve(String(args.input));
  const wordlistDir = resolve(String(args['wordlist-dir'] || DEFAULT_WORDLIST_DIR));
  const outputDir = resolve(String(args['output-dir'] || DEFAULT_OUTPUT_DIR));
  const maxSenses = positiveInteger(args['max-senses'], DEFAULT_MAX_SENSES, '--max-senses');
  if (maxSenses > 10) throw new Error('--max-senses must be at most 10');
  const sourceVersion = String(args['source-version'] || '2025');
  const mode = String(args.mode || 'introduced');
  if (!['introduced', 'cumulative'].includes(mode)) throw new Error('--mode must be introduced or cumulative');

  const oewnData = loadOewnJsonInput(inputPath);
  console.log(
    `Loaded OEWN review input: ${oewnData.lexicalEntries?.length ?? 'single-file'} lexical entr${oewnData.lexicalEntries?.length === 1 ? 'y' : 'ies'}, ` +
    `${oewnData.synsets?.length ?? 'single-file'} synsets`
  );

  mkdirSync(wordlistDir, { recursive: true });
  mkdirSync(outputDir, { recursive: true });

  let outputs;
  if (args.corpus) {
    const targetPerGrade = positiveInteger(args['target-per-grade'], DEFAULT_TARGET_PER_GRADE, '--target-per-grade');
    const overscanPerGrade = positiveInteger(args['overscan-per-grade'], DEFAULT_OVERSCAN_PER_GRADE, '--overscan-per-grade');
    if (overscanPerGrade < targetPerGrade) throw new Error('--overscan-per-grade must be at least --target-per-grade');
    const corpusPath = resolve(String(args.corpus || DEFAULT_CORPUS));
    const corpus = JSON.parse(readFileSync(corpusPath, 'utf8'));
    outputs = buildResolvedGradeSenseReviews(oewnData, corpus, {
      maxSenses,
      sourceVersion,
      mode,
      targetPerGrade,
      overscanPerGrade
    });
  } else {
    const wordlists = readdirSync(wordlistDir)
      .filter((filename) => new RegExp(`^grade-[1-6]-${mode}-meaning\\.json$`).test(filename))
      .sort()
      .map((filename) => ({
        filename,
        wordlist: JSON.parse(readFileSync(resolve(wordlistDir, filename), 'utf8'))
      }));
    if (!wordlists.length) throw new Error(`No meaning review wordlists found in ${wordlistDir}`);
    outputs = buildGradeSenseReviews(oewnData, wordlists, { maxSenses, sourceVersion });
  }

  const summary = [];
  for (const result of outputs) {
    if (result.wordlist && result.wordlistFilename) {
      writeFileSync(resolve(wordlistDir, result.wordlistFilename), `${JSON.stringify(result.wordlist, null, 2)}\n`, 'utf8');
    }
    const outputPath = resolve(outputDir, result.filename);
    writeFileSync(outputPath, `${JSON.stringify(result.output, null, 2)}\n`, 'utf8');
    summary.push({
      file: basename(outputPath),
      requested: result.output.summary.requestedWords,
      senses: result.output.summary.candidateSenses,
      missing: result.output.summary.missingWords,
      overscanUnresolved: result.wordlist?.selection?.semanticResolution?.skippedUnresolved ?? null
    });
  }
  console.log(`Grade OEWN sense-review files written: ${JSON.stringify(summary)}`);
}

if (import.meta.url === `file://${resolve(process.argv[1] ?? '')}`) main();
