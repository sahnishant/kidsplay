import { readFileSync, readdirSync } from 'node:fs';
import { validateStrategyItem } from './vocabulary-visuals/strategy-contract.mjs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const failOnInvalid = args.includes('--fail-on-invalid');
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const limit = Math.max(1, Number(limitArg?.split('=')[1] ?? 30) || 30);

const registryJson = readJson('content/vocabulary-visuals/registry.json');
const registry = {
  strategyIds: new Set((registryJson.strategies ?? []).map((entry) => entry.id)),
  maturityRanks: new Map((registryJson.maturityLevels ?? []).map((entry) => [entry.id, entry.rank])),
  templateById: new Map((registryJson.sceneTemplates ?? []).map((entry) => [entry.id, entry])),
  motionPolicies: new Set(registryJson.motionPolicies ?? []),
  answerSafety: new Set(registryJson.answerSafety ?? [])
};

const visualFiles = readdirSync(new URL('content/visuals/', root)).filter((name) => name.endsWith('.json')).sort();
const visuals = visualFiles.flatMap((name) => {
  const value = readJson(`content/visuals/${name}`);
  return Array.isArray(value) ? value : [];
});
const visualIds = new Set(visuals.map((visual) => visual.id));

const batchFiles = readdirSync(new URL('content/vocabulary-visuals/batches/', root)).filter((name) => name.endsWith('.json')).sort();
const batches = batchFiles.map((name) => ({ name, value: readJson(`content/vocabulary-visuals/batches/${name}`) }));
const corpus = readJson('content/lexicon/open/primary-grade-corpus.json');
const corpusByLemma = new Map((corpus.entries ?? []).map((entry) => [entry.lemma, entry]));

const errors = [];
const seenSenseKeys = new Set();
const items = [];
for (const { name, value } of batches) {
  if (value?.schemaVersion !== 1) errors.push(`${name}: schemaVersion must be 1`);
  if (!Array.isArray(value?.items)) errors.push(`${name}: items must be an array`);
  for (const item of value?.items ?? []) {
    const prefix = `${name}/${item?.senseKey ?? item?.lemma ?? '<unknown>'}`;
    if (seenSenseKeys.has(item?.senseKey)) errors.push(`${prefix}: duplicate senseKey across visual batches`);
    else seenSenseKeys.add(item?.senseKey);
    for (const error of validateStrategyItem(item, registry, visualIds)) errors.push(`${name}: ${error}`);
    const corpusEntry = corpusByLemma.get(item?.lemma);
    if (!corpusEntry) errors.push(`${prefix}: lemma is not present in the committed primary vocabulary corpus`);
    items.push({ ...item, batch: name, corpus: corpusEntry ?? null });
  }
}

if (registryJson?.schemaVersion !== 1) errors.push('Vocabulary visual registry schemaVersion must be 1');
if (registryJson?.policy?.bareLemmaMappingAllowed !== false) errors.push('Vocabulary visual registry must block bare lemma mapping');
if (registryJson?.policy?.senseKeyRequired !== true) errors.push('Vocabulary visual registry must require senseKey');
if (registryJson?.policy?.reducedMotionStaticMeaningRequired !== true) errors.push('Vocabulary visual registry must require reduced-motion static meaning');
if (registryJson?.policy?.nonCommercialAssetAdmissionAllowed !== false) errors.push('Vocabulary visual registry must reject non-commercial asset admission');

const auditedLemmas = new Set(items.map((item) => item.lemma));
const byStrategy = {};
const byMaturity = {};
const byGrade = Object.fromEntries(['1', '2', '3', '4', '5', '6'].map((grade) => [grade, 0]));
const byReviewStatus = {};
let sceneComposableTargets = 0;
let directVisuals = 0;
let meaningfulMotionTargets = 0;
let neutralSafeTargets = 0;
let unresolvedSenses = 0;
let textualOnlySenses = 0;

for (const item of items) {
  byStrategy[item.strategy] = (byStrategy[item.strategy] ?? 0) + 1;
  byMaturity[item.maturity] = (byMaturity[item.maturity] ?? 0) + 1;
  if (item.corpus?.grade) byGrade[String(item.corpus.grade)] += 1;
  if (item.corpus?.reviewStatus) byReviewStatus[item.corpus.reviewStatus] = (byReviewStatus[item.corpus.reviewStatus] ?? 0) + 1;
  if (item.sceneTemplate) sceneComposableTargets += 1;
  if (item.strategy === 'direct_entity') directVisuals += 1;
  if (item.motionPolicy !== 'none') meaningfulMotionTargets += 1;
  if (item.answerSafety === 'neutral_safe') neutralSafeTargets += 1;
  if (item.strategy === 'sense_unresolved') unresolvedSenses += 1;
  if (item.strategy === 'textual_only') textualOnlySenses += 1;
}

const unaudited = (corpus.entries ?? []).filter((entry) => !auditedLemmas.has(entry.lemma));
const highPriorityGaps = unaudited.slice(0, limit).map((entry) => ({
  id: entry.id,
  lemma: entry.lemma,
  grade: entry.grade,
  sourceGrade: entry.sourceGrade,
  partOfSpeech: entry.partOfSpeech,
  reviewStatus: entry.reviewStatus,
  zipf: entry.frequency?.zipf,
  rank: entry.gradeBandEvidence?.rank
}));

const maturityRows = items.map((item) => ({
  lemma: item.lemma,
  senseKey: item.senseKey,
  grade: item.corpus?.grade ?? null,
  strategy: item.strategy,
  maturity: item.maturity,
  sceneTemplate: item.sceneTemplate ?? null,
  visualRef: item.visualRef ?? null,
  motionPolicy: item.motionPolicy,
  answerSafety: item.answerSafety
}));

const result = {
  issueRef: 76,
  corpus: {
    totalLemmas: corpus.entries?.length ?? 0,
    auditedLemmas: auditedLemmas.size,
    unauditedLemmas: unaudited.length,
    auditedPercent: corpus.entries?.length ? Number(((auditedLemmas.size / corpus.entries.length) * 100).toFixed(2)) : 0
  },
  batches: batchFiles,
  summary: {
    auditedSenseItems: items.length,
    directVisuals,
    sceneComposableTargets,
    meaningfulMotionTargets,
    neutralSafeTargets,
    unresolvedSenses,
    textualOnlySenses,
    byStrategy,
    byMaturity,
    byGrade,
    byReviewStatus,
    errors: errors.length
  },
  highPriorityGaps,
  maturityRows: maturityRows.slice(0, Math.max(limit, 100)),
  errors: errors.slice(0, 100)
};

if (jsonMode) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log('# Vocabulary visual semantic coverage');
  console.log(`Corpus: ${result.corpus.auditedLemmas}/${result.corpus.totalLemmas} lemma(s) audited (${result.corpus.auditedPercent}%).`);
  console.log(`Sense strategies: ${items.length}; direct visuals: ${directVisuals}; scene-template targets: ${sceneComposableTargets}; meaningful-motion targets: ${meaningfulMotionTargets}.`);
  console.log(`Sense-unresolved: ${unresolvedSenses}; textual-only: ${textualOnlySenses}; validation errors: ${errors.length}.`);
  console.log(`Strategies: ${JSON.stringify(byStrategy)}`);
  console.log(`Maturity: ${JSON.stringify(byMaturity)}`);
  console.log(`Audited corpus grades: ${JSON.stringify(byGrade)}`);
  console.log('\nHighest-priority unaudited corpus lemmas:');
  for (const gap of highPriorityGaps) {
    console.log(`- #${gap.rank} ${gap.lemma} (grade ${gap.grade}, ${gap.partOfSpeech ?? 'unknown POS'}, ${gap.reviewStatus}, zipf=${gap.zipf ?? 'n/a'})`);
  }
  if (errors.length) {
    console.log('\nValidation errors:');
    for (const error of errors.slice(0, 30)) console.log(`- ${error}`);
  }
}

if (failOnInvalid && errors.length) process.exitCode = 1;
