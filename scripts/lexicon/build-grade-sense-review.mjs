import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { extractOewnCandidates } from './extract-oewn-candidates.mjs';

const DEFAULT_WORDLIST_DIR = 'content/lexicon/open/review-wordlists';
const DEFAULT_OUTPUT_DIR = 'content/lexicon/open/sense-review';
const DEFAULT_MAX_SENSES = 3;

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
  if (!args.input) throw new Error('--input <Open English WordNet JSON> is required');
  const inputPath = resolve(String(args.input));
  const wordlistDir = resolve(String(args['wordlist-dir'] || DEFAULT_WORDLIST_DIR));
  const outputDir = resolve(String(args['output-dir'] || DEFAULT_OUTPUT_DIR));
  const maxSenses = Number(args['max-senses'] || DEFAULT_MAX_SENSES);
  if (!Number.isInteger(maxSenses) || maxSenses < 1 || maxSenses > 10) throw new Error('--max-senses must be an integer from 1 to 10');

  const oewnData = JSON.parse(readFileSync(inputPath, 'utf8'));
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
