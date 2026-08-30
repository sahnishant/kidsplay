import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const corpus = JSON.parse(readFileSync(new URL('content/lexicon/open/primary-grade-corpus.json', root), 'utf8'));
const sources = JSON.parse(readFileSync(new URL('content/lexicon/sources.json', root), 'utf8'));
const errors = [];

const allowedEntryKeys = new Set(['id', 'word', 'lemma', 'partOfSpeech', 'grade', 'frequency', 'gradeEvidence', 'reviewStatus']);
const forbiddenTextKeys = new Set(['definition', 'definitions', 'example', 'examples', 'enrichment', 'enrichment_json', 'grade_examples', 'gutenberg_examples', 'pronunciation']);
const gradeCounts = Object.fromEntries(Array.from({ length: 6 }, (_, index) => [String(index + 1), 0]));

if (corpus.schemaVersion !== 1) errors.push('Primary grade corpus must use schemaVersion 1');
if (corpus.id !== 'lexicon.primary.english.grade-candidates.001') errors.push(`Unexpected corpus id ${corpus.id}`);
if (corpus.language !== 'en') errors.push('Primary grade corpus must be English');
if (corpus.license !== 'CC-BY-SA-4.0') errors.push(`Primary grade corpus license must be CC-BY-SA-4.0, got ${corpus.license}`);
if (corpus.source?.id !== 'grundwortschatz-voc-en') errors.push(`Unexpected corpus source ${corpus.source?.id}`);
if (!/^([0-9a-f]{40}|[0-9a-f]{64})$/i.test(String(corpus.source?.revision ?? ''))) errors.push('Corpus source revision must be a stable repository SHA');
if (corpus.policy?.childFacingDefinitionIncluded !== false) errors.push('Corpus must explicitly exclude child-facing definitions');
if (corpus.policy?.importedExamplesIncluded !== false) errors.push('Corpus must explicitly exclude imported examples');
if (corpus.policy?.runtimeDefault !== false) errors.push('Full candidate corpus must not be runtime-default content');
if (!Array.isArray(corpus.entries) || corpus.entries.length < 10_000) errors.push(`Expected >=10,000 corpus entries, got ${corpus.entries?.length ?? 0}`);

const sourceDefinition = (sources.sources ?? []).find((source) => source.id === 'grundwortschatz-voc-en');
if (sourceDefinition?.license !== 'CC-BY-SA-4.0' || sourceDefinition?.adoption !== 'isolated_open_data') {
  errors.push('Source registry must mark grundwortschatz-voc-en as isolated CC-BY-SA-4.0 data');
}
for (const blockedId of ['norare-data-curation-repo', 'vxgl']) {
  const source = (sources.sources ?? []).find((candidate) => candidate.id === blockedId);
  if (!source || source.adoption !== 'do_not_import_product_data') errors.push(`${blockedId} must remain product-import blocked`);
}

const ids = new Set();
for (const entry of corpus.entries ?? []) {
  const prefix = entry?.id ?? '<missing-id>';
  if (!entry?.id || ids.has(entry.id)) errors.push(`${prefix}: id must be non-empty and unique`);
  ids.add(entry?.id);
  if (!String(entry?.word ?? '').trim() || !String(entry?.lemma ?? '').trim()) errors.push(`${prefix}: word and lemma are required`);
  if (!Number.isInteger(entry?.grade) || entry.grade < 1 || entry.grade > 6) errors.push(`${prefix}: grade must be 1-6`);
  else gradeCounts[String(entry.grade)] += 1;
  if (entry?.reviewStatus !== 'candidate') errors.push(`${prefix}: imported row must remain candidate`);
  if (!entry?.frequency || !Object.hasOwn(entry.frequency, 'zipf') || !Object.hasOwn(entry.frequency, 'band')) errors.push(`${prefix}: frequency summary is incomplete`);
  if (!entry?.gradeEvidence || !Array.isArray(entry.gradeEvidence.tags)) errors.push(`${prefix}: grade evidence tags are required`);
  for (const key of Object.keys(entry ?? {})) {
    if (!allowedEntryKeys.has(key)) errors.push(`${prefix}: unsupported imported field ${key}`);
    if (forbiddenTextKeys.has(key)) errors.push(`${prefix}: forbidden source prose field ${key}`);
  }
  const serialized = JSON.stringify(entry).toLowerCase();
  for (const key of forbiddenTextKeys) if (serialized.includes(`\"${key}\"`)) errors.push(`${prefix}: nested forbidden source prose field ${key}`);
}

for (const [grade, count] of Object.entries(gradeCounts)) if (count < 100) errors.push(`Grade ${grade} unexpectedly has only ${count} entries`);
const expectedSummary = corpus.summary?.byGrade ?? {};
for (const [grade, count] of Object.entries(gradeCounts)) if (expectedSummary[grade] !== count) errors.push(`Grade ${grade} summary mismatch: ${expectedSummary[grade]} vs ${count}`);
if (corpus.summary?.total !== corpus.entries?.length) errors.push(`Total summary mismatch: ${corpus.summary?.total} vs ${corpus.entries?.length}`);

if (errors.length) {
  console.error(`Primary vocabulary corpus validation failed with ${errors.length} error(s):`);
  for (const error of errors.slice(0, 100)) console.error(`- ${error}`);
  if (errors.length > 100) console.error(`- ... ${errors.length - 100} more`);
  process.exitCode = 1;
} else {
  console.log(`Primary vocabulary corpus OK: ${corpus.entries.length} unique candidates, grades=${JSON.stringify(gradeCounts)}, source=${corpus.source.revision}.`);
}
