import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DEFAULT_CORPUS = 'content/lexicon/open/primary-grade-corpus.json';
const DEFAULT_OUTPUT_DIR = 'content/lexicon/open/review-wordlists';
const DEFAULT_PER_GRADE = 400;
const MODES = new Set(['introduced', 'cumulative']);
const PURPOSES = new Set(['meaning', 'spelling']);
const SEMANTIC_QUEUE_STATUSES = new Set(['clean', 'needs_sense_review']);
const SPELLING_QUEUE_STATUSES = new Set(['clean', 'needs_sense_review', 'spelling_only']);

const MEANING_QUEUE_EXCLUSIONS = new Set(`
a an the and or but if because as than that this these those
all any both each either enough every few many more most neither other another same several some such
i me my mine myself we us our ours ourselves you your yours yourself yourselves
he him his himself she her hers herself it its itself they them their theirs themselves
who whom whose which what whatever whoever
am is are was were be been being do does did doing done have has had having
can could may might must shall should will would
of to in on at by for from with without into onto upon over under through during before after
about against between among around across behind beside beyond near off out up down
here there where when why how then only also too very just even still
not no nor yes
`.trim().split(/\s+/));

const isCleanWord = (lemma) => /^[a-z]+(?:['-][a-z]+)?$/i.test(String(lemma ?? '')) && String(lemma).length >= 2 && String(lemma).length <= 24;
const isMeaningCandidate = (entry) => isCleanWord(entry.lemma)
  && !MEANING_QUEUE_EXCLUSIONS.has(String(entry.lemma).toLowerCase())
  && !/^(article|determiner|pronoun|preposition|conjunction|auxiliary|modal|particle|letter|symbol|number)$/i.test(String(entry.partOfSpeech ?? ''));
const isSpellingCandidate = (entry) => isCleanWord(entry.lemma);

function signalScore(entry, purpose) {
  const tags = entry.gradeEvidence?.tags ?? [];
  let score = Number(entry.frequency?.zipf ?? 0) * 2;
  if (tags.some((tag) => /^source:uk_y\d/.test(tag))) score += 9;
  if (tags.some((tag) => tag.startsWith('source:cambridge_yle'))) score += 7;
  if (entry.gradeEvidence?.yleLevel) score += 5;
  if (entry.gradeEvidence?.cefrLevel) score += 4;
  if (tags.includes('source:dolch')) score += 3;
  if (tags.includes('source:fry')) score += 3;
  if (entry.lemma.length <= 10) score += 1;
  if (purpose === 'meaning') score += ({ noun: 4, adjective: 4, verb: 2, adverb: 0 }[String(entry.partOfSpeech)] ?? 0);
  else {
    if (tags.includes('often_misspelled')) score += 4;
    if (tags.includes('source:common_misspelled')) score += 4;
    if (entry.lemma.length >= 4 && entry.lemma.length <= 10) score += 1.5;
  }
  return score;
}

function dedupeLemmas(entries, purpose) {
  const best = new Map();
  for (const entry of entries) {
    const key = entry.lemma.toLocaleLowerCase('en');
    const existing = best.get(key);
    if (!existing || signalScore(entry, purpose) > signalScore(existing, purpose)) best.set(key, entry);
  }
  return [...best.values()];
}

function balancedSelection(entries, limit, purpose) {
  const ranked = [...entries].sort((left, right) =>
    signalScore(right, purpose) - signalScore(left, purpose)
      || Number(right.frequency?.zipf ?? 0) - Number(left.frequency?.zipf ?? 0)
      || left.lemma.localeCompare(right.lemma, 'en'));
  if (purpose === 'spelling') return ranked.slice(0, limit);
  const buckets = new Map();
  for (const entry of ranked) {
    const key = ['noun', 'verb', 'adjective', 'adverb'].includes(String(entry.partOfSpeech)) ? entry.partOfSpeech : 'other';
    buckets.set(key, [...(buckets.get(key) ?? []), entry]);
  }
  const targets = {
    noun: Math.floor(limit * 0.38), verb: Math.floor(limit * 0.25), adjective: Math.floor(limit * 0.25),
    adverb: Math.floor(limit * 0.06), other: Math.floor(limit * 0.06)
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
  return selected.sort((left, right) => signalScore(right, purpose) - signalScore(left, purpose) || left.lemma.localeCompare(right.lemma, 'en'));
}

export function selectGradeReviewWordlist(corpus, grade, limit = DEFAULT_PER_GRADE, mode = 'introduced', purpose = 'meaning') {
  if (!Number.isInteger(grade) || grade < 1 || grade > 6) throw new Error(`grade must be 1-6, got ${grade}`);
  if (!Number.isInteger(limit) || limit < 1) throw new Error(`limit must be a positive integer, got ${limit}`);
  if (!MODES.has(mode)) throw new Error(`mode must be introduced or cumulative, got ${mode}`);
  if (!PURPOSES.has(purpose)) throw new Error(`purpose must be meaning or spelling, got ${purpose}`);
  const allowedStatuses = purpose === 'meaning' ? SEMANTIC_QUEUE_STATUSES : SPELLING_QUEUE_STATUSES;
  const rawGradePool = (corpus.entries ?? []).filter((entry) =>
    (mode === 'cumulative' ? entry.grade <= grade : entry.grade === grade) && allowedStatuses.has(entry.reviewStatus));
  const predicate = purpose === 'meaning' ? isMeaningCandidate : isSpellingCandidate;
  const candidates = dedupeLemmas(rawGradePool.filter(predicate), purpose);
  const selected = balancedSelection(candidates, Math.min(limit, candidates.length), purpose);

  return {
    schemaVersion: 2,
    id: `vocabulary.primary.grade${grade}.${mode}.${purpose}.review`,
    language: 'en',
    sourceId: purpose === 'meaning' ? 'open-english-wordnet' : 'grundwortschatz-voc-en',
    sourceVersion: purpose === 'meaning' ? '2025' : corpus.source?.revision,
    purpose: purpose === 'meaning'
      ? `Prioritized grade-${grade} ${mode} semantic candidates for OEWN sense review; this queue never approves or publishes imported definitions.`
      : `Prioritized grade-${grade} ${mode} spelling/recognition candidates; spelling_only rows are allowed and no meaning or board placement is implied.`,
    sourceGradeCorpus: { id: corpus.id, sourceId: corpus.source?.id, sourceRevision: corpus.source?.revision, license: corpus.license },
    selection: {
      grade, mode, purpose, requested: limit, selected: selected.length, rawGradeRows: rawGradePool.length,
      candidatePool: candidates.length, excludedOrDeduplicated: rawGradePool.length - candidates.length,
      allowedReviewStatuses: [...allowedStatuses].sort(),
      algorithm: purpose === 'meaning'
        ? 'semantic-safe status + clean lemma + closed-class exclusion + dedupe + curriculum/frequency/content-POS score + POS balancing'
        : 'spelling-safe status + clean lemma + dedupe + curriculum/frequency/spelling-difficulty score',
      reviewStatus: purpose === 'meaning' ? 'pending_sense_and_editorial_review' : 'pending_spelling_profile_review'
    },
    items: selected.map((entry) => ({
      lemma: entry.lemma,
      partOfSpeech: entry.partOfSpeech ?? null,
      sourceCorpusId: entry.id,
      sourcePartOfSpeech: entry.partOfSpeech ?? null,
      sourceGrade: entry.grade,
      upstreamSourceGrade: entry.sourceGrade ?? null,
      sourceZipf: entry.frequency?.zipf ?? null,
      sourceTags: entry.gradeEvidence?.tags ?? [],
      reviewStatus: entry.reviewStatus,
      provenance: entry.provenance ?? null,
      priorityScore: Number(signalScore(entry, purpose).toFixed(3)),
      notes: `Kidsplay grade ${entry.grade}; upstream grade ${entry.sourceGrade ?? 'unknown'}; selected for grade-${grade} ${mode} ${purpose} review from ${entry.id}.`
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
  const purpose = String(args.purpose || 'meaning');
  if (!Number.isInteger(perGrade) || perGrade < 1) throw new Error('--per-grade must be a positive integer');
  if (!MODES.has(mode)) throw new Error('--mode must be introduced or cumulative');
  if (!PURPOSES.has(purpose)) throw new Error('--purpose must be meaning or spelling');
  const corpus = JSON.parse(readFileSync(corpusPath, 'utf8'));
  mkdirSync(outputDir, { recursive: true });
  const grades = args.grade ? [Number(args.grade)] : [1, 2, 3, 4, 5, 6];
  const summaries = [];
  for (const grade of grades) {
    const wordlist = selectGradeReviewWordlist(corpus, grade, perGrade, mode, purpose);
    const output = resolve(outputDir, `grade-${grade}-${mode}-${purpose}.json`);
    writeFileSync(output, `${JSON.stringify(wordlist, null, 2)}\n`, 'utf8');
    summaries.push({ grade, ...wordlist.selection, output });
  }
  console.log(`Vocabulary review wordlists written: ${JSON.stringify(summaries)}`);
}

if (import.meta.url === `file://${resolve(process.argv[1] ?? '')}`) main();
