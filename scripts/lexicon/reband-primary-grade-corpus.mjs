import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const GRADE_TARGETS = Object.freeze({ 1: 800, 2: 1500, 3: 1700, 4: 1800, 5: 1900, 6: 2300 });
export const TOTAL_TARGET = Object.values(GRADE_TARGETS).reduce((sum, value) => sum + value, 0);
export const REVIEW_STATUSES = Object.freeze(['clean', 'needs_sense_review', 'spelling_only']);

const DEFAULT_CORPUS = 'content/lexicon/open/primary-grade-corpus.json';
const SOURCE_ID = 'grundwortschatz-voc-en';
const SOURCE_LICENSE = 'CC-BY-SA-4.0';

const CLOSED_CLASS = new Set(`
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

const BLOCKED_TERMS = new Set([
  'fuck', 'fucking', 'fucked', 'fucker', 'shit', 'shitty', 'bullshit', 'bitch', 'bastard',
  'cunt', 'dick', 'cock', 'pussy', 'penis', 'vagina', 'porn', 'porno', 'pornography',
  'sex', 'sexual', 'sexy', 'rape', 'rapist', 'nude', 'nudity', 'orgasm', 'masturbate',
  'masturbation', 'whore', 'slut', 'prostitute', 'prostitution'
]);

const clean = (value) => String(value ?? '').normalize('NFKC').trim();
const normalizeLemma = (value) => clean(value).toLocaleLowerCase('en-US');
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const tagsOf = (entry) => Array.isArray(entry?.gradeEvidence?.tags) ? entry.gradeEvidence.tags.filter((tag) => typeof tag === 'string') : [];

export function classifyImportedEntry(entry) {
  const sourceWord = clean(entry?.word || entry?.lemma);
  const lemma = normalizeLemma(entry?.lemma || entry?.word);
  const pos = clean(entry?.partOfSpeech).toLocaleLowerCase('en-US');
  const tags = tagsOf(entry).map((tag) => tag.toLocaleLowerCase('en-US'));
  if (!lemma) return { accepted: false, reason: 'empty' };
  if (lemma.length < 2 || lemma.length > 24) return { accepted: false, reason: 'length' };
  if (!/^[a-z]+(?:['-][a-z]+)?$/.test(lemma)) return { accepted: false, reason: 'malformed_or_symbolic' };
  if (/^[A-Z]{2,6}$/.test(sourceWord) && !/[a-z]/.test(sourceWord)) return { accepted: false, reason: 'abbreviation' };
  if (/proper/.test(pos) || tags.some((tag) => /proper[_ -]?noun|named[_ -]?entity/.test(tag))) return { accepted: false, reason: 'proper_name' };
  if (BLOCKED_TERMS.has(lemma)) return { accepted: false, reason: 'adult_or_profane' };
  const spellingOnly = CLOSED_CLASS.has(lemma)
    || /^(article|determiner|pronoun|preposition|conjunction|auxiliary|modal|particle|interjection|letter|symbol|number)$/i.test(pos);
  return { accepted: true, lemma, reviewStatus: spellingOnly ? 'spelling_only' : 'needs_sense_review' };
}

function curriculumSignals(entry) {
  const tags = tagsOf(entry);
  let score = 0;
  if (tags.some((tag) => /^source:uk_y\d/.test(tag))) score += 5;
  if (tags.some((tag) => tag.startsWith('source:cambridge_yle'))) score += 4;
  if (entry?.gradeEvidence?.yleLevel) score += 3;
  if (entry?.gradeEvidence?.cefrLevel) score += 2;
  if (tags.includes('source:dolch')) score += 1.5;
  if (tags.includes('source:fry')) score += 1.5;
  return score;
}

export function rankingScore(entry) {
  return finite(entry?.frequency?.zipf) * 100 + curriculumSignals(entry);
}

function betterRepresentative(left, right) {
  const scoreDelta = rankingScore(right) - rankingScore(left);
  if (scoreDelta !== 0) return scoreDelta > 0 ? right : left;
  const leftGrade = Number(left?.sourceGrade ?? left?.grade ?? 99);
  const rightGrade = Number(right?.sourceGrade ?? right?.grade ?? 99);
  if (leftGrade !== rightGrade) return rightGrade < leftGrade ? right : left;
  const leftId = clean(left?.id);
  const rightId = clean(right?.id);
  return rightId.localeCompare(leftId, 'en') < 0 ? right : left;
}

function gradeForRank(rank) {
  let boundary = 0;
  for (let grade = 1; grade <= 6; grade += 1) {
    boundary += GRADE_TARGETS[grade];
    if (rank <= boundary) return grade;
  }
  throw new Error(`Rank ${rank} is outside the ${TOTAL_TARGET}-term target`);
}

function summarize(entries, excluded) {
  const byGrade = Object.fromEntries(Object.keys(GRADE_TARGETS).map((grade) => [grade, 0]));
  const byReviewStatus = Object.fromEntries(REVIEW_STATUSES.map((status) => [status, 0]));
  let withFrequency = 0;
  let withCefr = 0;
  let withYle = 0;
  let withCurriculumSource = 0;
  for (const entry of entries) {
    byGrade[String(entry.grade)] += 1;
    byReviewStatus[entry.reviewStatus] += 1;
    if (entry.frequency?.zipf !== null && entry.frequency?.zipf !== undefined) withFrequency += 1;
    if (entry.gradeEvidence?.cefrLevel) withCefr += 1;
    if (entry.gradeEvidence?.yleLevel) withYle += 1;
    if (tagsOf(entry).some((tag) => tag.startsWith('source:'))) withCurriculumSource += 1;
  }
  return { total: entries.length, byGrade, byReviewStatus, withFrequency, withCefr, withYle, withCurriculumSource, excluded };
}

export function rebandPrimaryGradeCorpus(corpus) {
  if (!corpus || !Array.isArray(corpus.entries)) throw new Error('Corpus entries are required');
  const sourceId = corpus.source?.id || SOURCE_ID;
  const sourceRevision = clean(corpus.source?.revision);
  const sourceLicense = corpus.license || SOURCE_LICENSE;
  if (sourceId !== SOURCE_ID) throw new Error(`Unexpected primary vocabulary source ${sourceId}`);
  if (!sourceRevision) throw new Error('Primary vocabulary source revision is required');
  if (sourceLicense !== SOURCE_LICENSE) throw new Error(`Unexpected source license ${sourceLicense}`);

  const excluded = {};
  const unique = new Map();
  for (const original of corpus.entries) {
    const classification = classifyImportedEntry(original);
    if (!classification.accepted) {
      excluded[classification.reason] = (excluded[classification.reason] ?? 0) + 1;
      continue;
    }
    const normalized = {
      ...original,
      word: classification.lemma,
      lemma: classification.lemma,
      sourceGrade: Number(original.sourceGrade ?? original.grade),
      reviewStatus: classification.reviewStatus,
      runtimeActive: false,
      provenance: { sourceId, sourceRevision, license: sourceLicense }
    };
    delete normalized.gradeBandEvidence;
    const existing = unique.get(classification.lemma);
    unique.set(classification.lemma, existing ? betterRepresentative(existing, normalized) : normalized);
  }

  const ranked = [...unique.values()].sort((left, right) =>
    rankingScore(right) - rankingScore(left)
      || finite(right.frequency?.zipf) - finite(left.frequency?.zipf)
      || Number(left.sourceGrade ?? 99) - Number(right.sourceGrade ?? 99)
      || left.lemma.localeCompare(right.lemma, 'en')
      || String(left.id).localeCompare(String(right.id), 'en'));
  if (ranked.length < TOTAL_TARGET) throw new Error(`Only ${ranked.length} safe unique lemmas remain after filtering; ${TOTAL_TARGET} are required`);

  const entries = ranked.slice(0, TOTAL_TARGET).map((entry, index) => {
    const rank = index + 1;
    const grade = gradeForRank(rank);
    return {
      id: entry.id,
      word: entry.word,
      lemma: entry.lemma,
      partOfSpeech: entry.partOfSpeech ?? null,
      grade,
      sourceGrade: entry.sourceGrade,
      frequency: entry.frequency,
      gradeEvidence: entry.gradeEvidence,
      gradeBandEvidence: {
        method: 'frequency_proxy_v1', rank, targetGrade: grade, sourceGrade: entry.sourceGrade,
        score: Number(rankingScore(entry).toFixed(3))
      },
      reviewStatus: entry.reviewStatus,
      runtimeActive: false,
      provenance: entry.provenance
    };
  });

  return {
    ...corpus,
    schemaVersion: 2,
    status: 'open_source_ranked_review_corpus',
    policy: {
      ...(corpus.policy ?? {}),
      gradeMeaning: 'Kidsplay frequency-ranked primary vocabulary band. sourceGrade preserves the upstream estimate; neither field is a CBSE/SOF alignment claim.',
      gradeBandTargets: GRADE_TARGETS,
      uniqueNormalizedLemmaRequired: true,
      rowLevelProvenanceRequired: true,
      semanticStatuses: REVIEW_STATUSES,
      childFacingDefinitionIncluded: false,
      importedExamplesIncluded: false,
      runtimeDefault: false,
      reviewRequiredBeforeMeaningInstruction: true
    },
    summary: summarize(entries, excluded),
    entries
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
  const input = resolve(String(args.corpus || DEFAULT_CORPUS));
  const output = resolve(String(args.output || input));
  const corpus = JSON.parse(readFileSync(input, 'utf8'));
  const rebanded = rebandPrimaryGradeCorpus(corpus);
  writeFileSync(output, `${JSON.stringify(rebanded, null, 2)}\n`, 'utf8');
  console.log(`Primary vocabulary rebanded: ${rebanded.summary.total} unique terms -> ${output}`);
  console.log(`Grade distribution: ${JSON.stringify(rebanded.summary.byGrade)}`);
  console.log(`Review states: ${JSON.stringify(rebanded.summary.byReviewStatus)}`);
}

if (import.meta.url === `file://${resolve(process.argv[1] ?? '')}`) main();
