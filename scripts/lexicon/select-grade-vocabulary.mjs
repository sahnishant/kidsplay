import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DEFAULT_CORPUS = 'content/lexicon/open/primary-grade-corpus.json';
const DEFAULT_OUTPUT_DIR = 'content/lexicon/open/review-wordlists';
const DEFAULT_PER_GRADE = 400;
const MODES = new Set(['introduced', 'cumulative']);

// Closed-class / grammar-heavy words are valid English, but are poor default
// candidates for a word-meaning enrichment queue. They can still be taught via
// grammar/context content; this filter only affects semantic vocabulary review.
const MEANING_QUEUE_EXCLUSIONS = new Set(`
a an the and or but if because as than that this these those
I me my mine myself we us our ours ourselves you your yours yourself yourselves
he him his himself she her hers herself it its itself they them their theirs themselves
who whom whose which what whatever whoever
am is are was were be been being do does did doing done have has had having
can could may might must shall should will would
of to in on at by for from with without into onto upon over under through during before after
about against between among around across behind beside beyond near off out up down
not no nor yes
`.trim().split(/\s+/).map((value) => value.toLowerCase()));

const clean = (value) => String(value ?? '').trim();
const isReviewableWord = (lemma) => /^[A-Za-z]+(?:'[A-Za-z]+)?$/.test(lemma) && lemma.length >= 2 && lemma.length <= 18;
const isMeaningCandidate = (entry) => isReviewableWord(entry.lemma)
  && !MEANING_QUEUE_EXCLUSIONS.has(entry.lemma.toLowerCase())
  && !/^(letter|symbol|number)$/i.test(String(entry.partOfSpeech ?? ''));

function signalScore(entry) {
  const tags = entry.gradeEvidence?.tags ?? [];
  let score = Number(entry.frequency?.zipf ?? 0) * 2;
  if (tags.some((tag) => /^source:uk_y\d/.test(tag))) score += 9;
  if (tags.some((tag) => tag.startsWith('source:cambridge_yle'))) score += 7;
  if (entry.gradeEvidence?.yleLevel) score += 5;
  if (entry.gradeEvidence?.cefrLevel) score += 4;
  if (tags.includes('source:dolch')) score += 3;
  if (tags.includes('source:fry')) score += 3;
  if (['noun', 'verb', 'adjective', 'adverb'].includes(String(entry.partOfSpeech))) score += 1.5;
  if (entry.lemma.length <= 10) score += 1;
  return score;
}

function dedupeLemmas(entries) {
  const best = new Map();
  for (const entry of entries) {
    const key = entry.lemma.toLocaleLowerCase('en');
    const existing = best.get(key);
    if (!existing || signalScore(entry) > signalScore(existing)) best.set(key, entry);
  }
  return [...best.values()];
}

function balancedSelection(entries, limit) {
  const ranked = [...entries].sort((left, right) =>
    signalScore(right) - signalScore(left)
      || Number(right.frequency?.zipf ?? 0) - Number(left.frequency?.zipf ?? 0)
      || left.lemma.localeCompare(right.lemma, 'en')
  );
  const buckets = new Map();
  for (const entry of ranked) {
    const key = ['noun', 'verb', 'adjective', 'adverb'].includes(String(entry.partOfSpeech)) ? entry.partOfSpeech : 'other';
    buckets.set(key, [...(buckets.get(key) ?? []), entry]);
  }

  const targets = {
    noun: Math.floor(limit * 0.35),
    verb: Math.floor(limit * 0.25),
    adjective: Math.floor(limit * 0.20),
    adverb: Math.floor(limit * 0.10),
    other: Math.floor(limit * 0.10)
  };
  const selected = [];
  const selectedIds = new Set();
  for (const [bucket, target] of Object.entries(targets)) {
    for (const entry of (buckets.get(bucket) ?? []).slice(0, target)) {
      selected.push(entry);
      selectedIds.add(entry.id);
    }
  }
  for (const entry of ranked) {
    if (selected.length >= limit) break;
    if (selectedIds.has(entry.id)) continue;
    selected.push(entry);
    selectedIds.add(entry.id);
  }
  return selected.sort((left, right) => signalScore(right) - signalScore(left) || left.lemma.localeCompare(right.lemma, 'en'));
}

export function selectGradeReviewWordlist(corpus, grade, limit = DEFAULT_PER_GRADE, mode = 'introduced') {
  if (!Number.isInteger(grade) || grade < 1 || grade > 6) throw new Error(`grade must be 1-6, got ${grade}`);
  if (!Number.isInteger(limit) || limit < 1) throw new Error(`limit must be a positive integer, got ${limit}`);
  if (!MODES.has(mode)) throw new Error(`mode must be introduced or cumulative, got ${mode}`);
  const rawGradePool = (corpus.entries ?? []).filter((entry) =>
    (mode === 'cumulative' ? entry.grade <= grade : entry.grade === grade) && entry.reviewStatus === 'candidate'
  );
  const candidates = dedupeLemmas(rawGradePool.filter(isMeaningCandidate));
  const selected = balancedSelection(candidates, Math.min(limit, candidates.length));

  return {
    schemaVersion: 1,
    id: `vocabulary.primary.grade${grade}.${mode}.oewn-review`,
    language: 'en',
    sourceId: 'open-english-wordnet',
    sourceVersion: '2025',
    purpose: `Prioritized grade-${grade} ${mode} primary vocabulary candidates for OEWN sense review; no imported definition is approved by this selection.`,
    sourceGradeCorpus: {
      id: corpus.id,
      sourceId: corpus.source?.id,
      sourceRevision: corpus.source?.revision,
      license: corpus.license
    },
    selection: {
      grade,
      mode,
      requested: limit,
      selected: selected.length,
      rawGradeRows: rawGradePool.length,
      candidatePool: candidates.length,
      excludedOrDeduplicated: rawGradePool.length - candidates.length,
      algorithm: 'clean lemma + closed-class exclusion + dedupe + curriculum-anchor/frequency score + coarse POS balancing',
      reviewStatus: 'pending_sense_and_editorial_review'
    },
    items: selected.map((entry) => ({
      lemma: entry.lemma,
      sourceCorpusId: entry.id,
      sourcePartOfSpeech: entry.partOfSpeech,
      sourceGrade: entry.grade,
      sourceZipf: entry.frequency?.zipf ?? null,
      sourceTags: entry.gradeEvidence?.tags ?? [],
      priorityScore: Number(signalScore(entry).toFixed(3)),
      notes: `Source grade ${entry.grade}; selected for grade-${grade} ${mode} review from ${entry.id}; sense and child-facing meaning require review.`
    }))
  };
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
  const corpusPath = resolve(String(args.corpus || DEFAULT_CORPUS));
  const outputDir = resolve(String(args['output-dir'] || DEFAULT_OUTPUT_DIR));
  const perGrade = Number(args['per-grade'] || DEFAULT_PER_GRADE);
  const mode = String(args.mode || 'introduced');
  if (!Number.isInteger(perGrade) || perGrade < 1) throw new Error('--per-grade must be a positive integer');
  if (!MODES.has(mode)) throw new Error('--mode must be introduced or cumulative');
  const corpus = JSON.parse(readFileSync(corpusPath, 'utf8'));
  mkdirSync(outputDir, { recursive: true });

  const grades = args.grade ? [Number(args.grade)] : [1, 2, 3, 4, 5, 6];
  const summaries = [];
  for (const grade of grades) {
    const wordlist = selectGradeReviewWordlist(corpus, grade, perGrade, mode);
    const output = resolve(outputDir, `grade-${grade}-${mode}.json`);
    writeFileSync(output, `${JSON.stringify(wordlist, null, 2)}\n`, 'utf8');
    summaries.push({ grade, ...wordlist.selection, output });
  }
  console.log(`Vocabulary review wordlists written: ${JSON.stringify(summaries)}`);
}

if (import.meta.url === `file://${resolve(process.argv[1] ?? '')}`) main();
