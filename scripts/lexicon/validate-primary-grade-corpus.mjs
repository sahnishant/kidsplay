import { readFileSync } from 'node:fs';
import { GRADE_TARGETS, REVIEW_STATUSES, TOTAL_TARGET } from './reband-primary-grade-corpus.mjs';

const root = new URL('../../', import.meta.url);
const corpus = JSON.parse(readFileSync(new URL('content/lexicon/open/primary-grade-corpus.json', root), 'utf8'));
const sources = JSON.parse(readFileSync(new URL('content/lexicon/sources.json', root), 'utf8'));
const errors = [];
const reviewStatuses = new Set(REVIEW_STATUSES);
const allowedEntryKeys = new Set(['id', 'word', 'lemma', 'partOfSpeech', 'grade', 'sourceGrade', 'frequency', 'gradeEvidence', 'gradeBandEvidence', 'reviewStatus', 'runtimeActive', 'provenance']);
const allowedFrequencyKeys = new Set(['zipf', 'perMillion', 'band']);
const allowedGradeEvidenceKeys = new Set(['reason', 'cefrLevel', 'yleLevel', 'tags']);
const allowedGradeBandEvidenceKeys = new Set(['method', 'rank', 'targetGrade', 'sourceGrade', 'score']);
const allowedProvenanceKeys = new Set(['sourceId', 'sourceRevision', 'license']);
const gradeCounts = Object.fromEntries(Object.keys(GRADE_TARGETS).map((grade) => [grade, 0]));
const statusCounts = Object.fromEntries(REVIEW_STATUSES.map((status) => [status, 0]));

const rejectUnknownKeys = (object, allowed, prefix) => {
  if (!object || typeof object !== 'object' || Array.isArray(object)) { errors.push(`${prefix}: expected object`); return; }
  for (const key of Object.keys(object)) if (!allowed.has(key)) errors.push(`${prefix}: unsupported field ${key}`);
};

if (corpus.schemaVersion !== 2) errors.push('Primary grade corpus must use schemaVersion 2');
if (corpus.id !== 'lexicon.primary.english.grade-candidates.001') errors.push(`Unexpected corpus id ${corpus.id}`);
if (corpus.language !== 'en') errors.push('Primary grade corpus must be English');
if (corpus.license !== 'CC-BY-SA-4.0') errors.push(`Primary grade corpus license must be CC-BY-SA-4.0, got ${corpus.license}`);
if (corpus.source?.id !== 'grundwortschatz-voc-en') errors.push(`Unexpected corpus source ${corpus.source?.id}`);
if (!/^([0-9a-f]{40}|[0-9a-f]{64})$/i.test(String(corpus.source?.revision ?? ''))) errors.push('Corpus source revision must be a stable repository SHA');
if (corpus.policy?.childFacingDefinitionIncluded !== false) errors.push('Corpus must explicitly exclude child-facing definitions');
if (corpus.policy?.importedExamplesIncluded !== false) errors.push('Corpus must explicitly exclude imported examples');
if (corpus.policy?.runtimeDefault !== false) errors.push('Full candidate corpus must not be runtime-default content');
if (corpus.policy?.rowLevelProvenanceRequired !== true) errors.push('Corpus policy must require row-level provenance');
if (corpus.policy?.uniqueNormalizedLemmaRequired !== true) errors.push('Corpus policy must require globally unique normalized lemmas');
if (!Array.isArray(corpus.entries) || corpus.entries.length !== TOTAL_TARGET) errors.push(`Expected exactly ${TOTAL_TARGET} ranked corpus entries, got ${corpus.entries?.length ?? 0}`);

const sourceDefinition = (sources.sources ?? []).find((source) => source.id === 'grundwortschatz-voc-en');
if (sourceDefinition?.license !== 'CC-BY-SA-4.0' || sourceDefinition?.adoption !== 'isolated_open_data') errors.push('Source registry must mark grundwortschatz-voc-en as isolated CC-BY-SA-4.0 data');
for (const blockedId of ['norare-data-curation-repo', 'vxgl']) {
  const source = (sources.sources ?? []).find((candidate) => candidate.id === blockedId);
  if (!source || source.adoption !== 'do_not_import_product_data') errors.push(`${blockedId} must remain product-import blocked`);
}

const ids = new Set();
const lemmas = new Set();
let previousRank = 0;
for (const entry of corpus.entries ?? []) {
  const prefix = entry?.id ?? '<missing-id>';
  if (!entry?.id || ids.has(entry.id)) errors.push(`${prefix}: id must be non-empty and unique`);
  ids.add(entry?.id);
  const lemma = String(entry?.lemma ?? '').trim();
  if (!lemma || entry?.word !== lemma || lemma !== lemma.normalize('NFKC').toLocaleLowerCase('en-US')) errors.push(`${prefix}: word/lemma must be normalized lowercase NFKC`);
  if (lemmas.has(lemma)) errors.push(`${prefix}: normalized lemma ${lemma} is duplicated`);
  lemmas.add(lemma);
  if (!/^[a-z]+(?:['-][a-z]+)?$/.test(lemma)) errors.push(`${prefix}: malformed normalized lemma ${lemma}`);
  if (!Number.isInteger(entry?.grade) || entry.grade < 1 || entry.grade > 6) errors.push(`${prefix}: grade must be 1-6`);
  else gradeCounts[String(entry.grade)] += 1;
  if (!Number.isInteger(entry?.sourceGrade) || entry.sourceGrade < 1 || entry.sourceGrade > 6) errors.push(`${prefix}: sourceGrade must preserve an upstream grade 1-6`);
  if (!reviewStatuses.has(entry?.reviewStatus)) errors.push(`${prefix}: reviewStatus must be one of ${REVIEW_STATUSES.join(', ')}`);
  else statusCounts[entry.reviewStatus] += 1;
  if (entry?.runtimeActive !== false) errors.push(`${prefix}: imported corpus row must remain runtime inactive`);
  if (Object.hasOwn(entry ?? {}, 'definitions')) errors.push(`${prefix}: imported definitions must never be carried into the ranked corpus`);
  if (entry?.provenance?.sourceId !== corpus.source?.id || entry?.provenance?.sourceRevision !== corpus.source?.revision || entry?.provenance?.license !== corpus.license) errors.push(`${prefix}: row-level source id/revision/license must match the isolated source artifact`);
  if (entry?.gradeBandEvidence?.method !== 'frequency_proxy_v1') errors.push(`${prefix}: grade-band method must be frequency_proxy_v1`);
  if (entry?.gradeBandEvidence?.targetGrade !== entry.grade || entry?.gradeBandEvidence?.sourceGrade !== entry.sourceGrade) errors.push(`${prefix}: grade-band evidence does not match row grades`);
  if (!Number.isInteger(entry?.gradeBandEvidence?.rank) || entry.gradeBandEvidence.rank !== previousRank + 1) errors.push(`${prefix}: grade-band rank must be contiguous`);
  previousRank = entry?.gradeBandEvidence?.rank ?? previousRank;

  rejectUnknownKeys(entry, allowedEntryKeys, prefix);
  rejectUnknownKeys(entry?.frequency, allowedFrequencyKeys, `${prefix}.frequency`);
  rejectUnknownKeys(entry?.gradeEvidence, allowedGradeEvidenceKeys, `${prefix}.gradeEvidence`);
  rejectUnknownKeys(entry?.gradeBandEvidence, allowedGradeBandEvidenceKeys, `${prefix}.gradeBandEvidence`);
  rejectUnknownKeys(entry?.provenance, allowedProvenanceKeys, `${prefix}.provenance`);
  if (!entry?.frequency || !Object.hasOwn(entry.frequency, 'zipf') || !Object.hasOwn(entry.frequency, 'band')) errors.push(`${prefix}: frequency summary is incomplete`);
  if (!entry?.gradeEvidence || !Array.isArray(entry.gradeEvidence.tags)) errors.push(`${prefix}: grade evidence tags are required`);
}

for (const [grade, target] of Object.entries(GRADE_TARGETS)) {
  if (gradeCounts[grade] !== target) errors.push(`Grade ${grade} must contain exactly ${target} entries, got ${gradeCounts[grade]}`);
  if (corpus.summary?.byGrade?.[grade] !== target) errors.push(`Grade ${grade} summary mismatch: ${corpus.summary?.byGrade?.[grade]} vs ${target}`);
}
for (const status of REVIEW_STATUSES) if (corpus.summary?.byReviewStatus?.[status] !== statusCounts[status]) errors.push(`${status} summary mismatch`);
if (corpus.summary?.total !== TOTAL_TARGET) errors.push(`Total summary mismatch: ${corpus.summary?.total} vs ${TOTAL_TARGET}`);

if (errors.length) {
  console.error(`Primary vocabulary corpus validation failed with ${errors.length} error(s):`);
  for (const error of errors.slice(0, 100)) console.error(`- ${error}`);
  if (errors.length > 100) console.error(`- ... ${errors.length - 100} more`);
  process.exitCode = 1;
} else {
  console.log(`Primary vocabulary corpus OK: ${TOTAL_TARGET} unique ranked terms, grades=${JSON.stringify(gradeCounts)}, statuses=${JSON.stringify(statusCounts)}, source=${corpus.source.revision}.`);
}
