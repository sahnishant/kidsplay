import { readFileSync, readdirSync } from 'node:fs';
import { planVocabularyScene, validateStrategyItem } from './vocabulary-visuals/strategy-contract.mjs';

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
const CHILD_FACING_MATURITIES = new Set(['V5', 'V6']);

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

const senseCandidateById = new Map();
const meaningQueueLemmas = new Set();
const senseReviewFiles = [];
for (let grade = 1; grade <= 6; grade += 1) {
  const name = `grade-${grade}-introduced-meaning-oewn.json`;
  const review = readJson(`content/lexicon/open/sense-review/${name}`);
  senseReviewFiles.push(name);
  for (const candidate of review.candidates ?? []) {
    senseCandidateById.set(candidate.candidateId, { ...candidate, grade, sourceFile: name });
    meaningQueueLemmas.add(String(candidate.lemma ?? '').toLocaleLowerCase('en-US'));
  }
  for (const missing of review.missing ?? []) meaningQueueLemmas.add(String(missing.lemma ?? '').toLocaleLowerCase('en-US'));
}

const errors = [];
const seenSenseKeys = new Set();
const items = [];
const itemBySenseKey = new Map();
for (const { name, value } of batches) {
  if (value?.schemaVersion !== 1) errors.push(`${name}: schemaVersion must be 1`);
  if (!Array.isArray(value?.items)) errors.push(`${name}: items must be an array`);
  for (const item of value?.items ?? []) {
    const prefix = `${name}/${item?.senseKey ?? item?.lemma ?? '<unknown>'}`;
    if (seenSenseKeys.has(item?.senseKey)) errors.push(`${prefix}: duplicate senseKey across visual batches`);
    else seenSenseKeys.add(item?.senseKey);
    for (const error of validateStrategyItem(item, registry, visualIds)) errors.push(`${name}: ${error}`);
    const corpusEntry = corpusByLemma.get(item?.lemma);
    if (!corpusEntry) {
      if (item?.corpusDisposition !== 'existing_runtime_only') {
        errors.push(`${prefix}: lemma is not present in the committed primary vocabulary corpus and lacks explicit existing_runtime_only disposition`);
      }
    } else if (item?.corpusDisposition === 'existing_runtime_only') {
      errors.push(`${prefix}: existing_runtime_only disposition is stale because the lemma is present in the primary corpus`);
    }
    if (item?.corpusDisposition && item.corpusDisposition !== 'existing_runtime_only') {
      errors.push(`${prefix}: unsupported corpusDisposition ${item.corpusDisposition}`);
    }
    const enriched = { ...item, batch: name, corpus: corpusEntry ?? null };
    items.push(enriched);
    itemBySenseKey.set(item.senseKey, enriched);
  }
}

const senseLinkFiles = readdirSync(new URL('content/vocabulary-visuals/sense-links/', root)).filter((name) => name.endsWith('.json')).sort();
const linkedSenseKeys = new Set();
const linkedCandidateIds = new Set();
for (const name of senseLinkFiles) {
  const value = readJson(`content/vocabulary-visuals/sense-links/${name}`);
  if (value?.schemaVersion !== 1) errors.push(`${name}: sense-link schemaVersion must be 1`);
  if (value?.source?.sourceId !== 'open-english-wordnet' || value?.source?.sourceVersion !== '2025' || value?.source?.license !== 'CC-BY-4.0') {
    errors.push(`${name}: sense links must point only at the pinned OEWN 2025 candidate lane`);
  }
  if (value?.policy?.selectsHumanEditorialSense !== false || value?.policy?.importsGloss !== false || value?.policy?.importsExample !== false) {
    errors.push(`${name}: visual sense links must remain reference-only and must not impersonate human editorial acceptance`);
  }
  for (const link of value?.links ?? []) {
    if (linkedSenseKeys.has(link.senseKey)) errors.push(`${name}/${link.senseKey}: duplicate visual sense link`);
    linkedSenseKeys.add(link.senseKey);
    const item = itemBySenseKey.get(link.senseKey);
    if (!item) errors.push(`${name}/${link.senseKey}: unknown vocabulary visual senseKey`);
    const candidate = senseCandidateById.get(link.candidateId);
    if (!candidate) errors.push(`${name}/${link.senseKey}: unknown OEWN candidateId ${link.candidateId}`);
    if (item && candidate && item.lemma !== String(candidate.lemma ?? '').toLocaleLowerCase('en-US')) {
      errors.push(`${name}/${link.senseKey}: candidate ${link.candidateId} belongs to ${candidate.lemma}, not ${item.lemma}`);
    }
    linkedCandidateIds.add(link.candidateId);
  }
}

if (registryJson?.schemaVersion !== 1) errors.push('Vocabulary visual registry schemaVersion must be 1');
if (registryJson?.policy?.bareLemmaMappingAllowed !== false) errors.push('Vocabulary visual registry must block bare lemma mapping');
if (registryJson?.policy?.senseKeyRequired !== true) errors.push('Vocabulary visual registry must require senseKey');
if (registryJson?.policy?.reducedMotionStaticMeaningRequired !== true) errors.push('Vocabulary visual registry must require reduced-motion static meaning');
if (registryJson?.policy?.nonCommercialAssetAdmissionAllowed !== false) errors.push('Vocabulary visual registry must reject non-commercial asset admission');

const runtimeFile = readJson('content/vocabulary-visuals/__generated-runtime-plans.json');
if (runtimeFile?.schemaVersion !== 1) errors.push('Generated vocabulary visual runtime plans schemaVersion must be 1');
if (runtimeFile?.issueRef !== 80) errors.push('Generated vocabulary visual runtime plans must belong to issue #80');
const runtimePlans = Array.isArray(runtimeFile?.plans) ? runtimeFile.plans : [];
const mappedKnowledgeRefs = new Set();
const childFacingKnowledgeRefs = new Set();
const pendingProofKnowledgeRefs = new Set();
const rendererAdmittedSenseKeys = new Set();
const childFacingSenseKeys = new Set();
const pendingProofSenseKeys = new Set();
const motionRuntimeSenseKeys = new Set();
let templateProofPlans = 0;
let mappedKnowledgePlans = 0;
let childFacingPlans = 0;
let pendingProofPlans = 0;
for (const plan of runtimePlans) {
  const item = itemBySenseKey.get(plan?.senseKey);
  if (!item) errors.push(`runtime/${plan?.senseKey}: generated runtime plan points to unknown strategy senseKey`);
  rendererAdmittedSenseKeys.add(plan?.senseKey);
  if (plan?.runtimeUsage === 'knowledge_reinforcement') {
    mappedKnowledgePlans += 1;
    const knowledgeRef = String(plan?.knowledgeRef ?? '');
    if (!knowledgeRef.startsWith('kr.')) errors.push(`runtime/${plan?.senseKey}: knowledge runtime plan requires canonical knowledgeRef`);
    if (mappedKnowledgeRefs.has(knowledgeRef)) errors.push(`runtime/${plan?.senseKey}: duplicate knowledge runtime knowledgeRef ${knowledgeRef}`);
    mappedKnowledgeRefs.add(knowledgeRef);

    if (CHILD_FACING_MATURITIES.has(plan?.maturity)) {
      childFacingPlans += 1;
      childFacingSenseKeys.add(plan?.senseKey);
      childFacingKnowledgeRefs.add(knowledgeRef);
    } else {
      pendingProofPlans += 1;
      pendingProofSenseKeys.add(plan?.senseKey);
      pendingProofKnowledgeRefs.add(knowledgeRef);
    }
  } else if (plan?.runtimeUsage === 'template_proof') {
    templateProofPlans += 1;
    if (plan?.knowledgeRef !== null) errors.push(`runtime/${plan?.senseKey}: template proof must not claim a knowledgeRef`);
  } else {
    errors.push(`runtime/${plan?.senseKey}: unsupported runtimeUsage ${plan?.runtimeUsage}`);
  }
  if (plan?.motionPolicy && plan.motionPolicy !== 'none') motionRuntimeSenseKeys.add(plan.senseKey);
}

const auditedCorpusItems = items.filter((item) => Boolean(item.corpus));
const outsideCorpusItems = items.filter((item) => !item.corpus);
const auditedLemmas = new Set(auditedCorpusItems.map((item) => item.lemma));
const auditedMeaningQueueLemmas = new Set([...meaningQueueLemmas].filter((lemma) => auditedLemmas.has(lemma)));
const byStrategy = {};
const byMaturity = {};
const byGrade = Object.fromEntries(['1', '2', '3', '4', '5', '6'].map((grade) => [grade, 0]));
const byReviewStatus = {};
let sceneTemplateTargets = 0;
let sceneReadyV3 = 0;
let validSemanticPlans = 0;
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
  if (item.sceneTemplate) sceneTemplateTargets += 1;
  if (item.sceneTemplate && (registry.maturityRanks.get(item.maturity) ?? 0) >= 3) sceneReadyV3 += 1;
  if (planVocabularyScene(item, { phase: 'explanation' }).status === 'ready') validSemanticPlans += 1;
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
const meaningQueueGaps = [...meaningQueueLemmas]
  .filter((lemma) => !auditedLemmas.has(lemma))
  .map((lemma) => corpusByLemma.get(lemma))
  .filter(Boolean)
  .sort((left, right) => (left.gradeBandEvidence?.rank ?? Number.MAX_SAFE_INTEGER) - (right.gradeBandEvidence?.rank ?? Number.MAX_SAFE_INTEGER))
  .slice(0, limit)
  .map((entry) => ({
    id: entry.id,
    lemma: entry.lemma,
    grade: entry.grade,
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
  answerSafety: item.answerSafety,
  candidateLinked: linkedSenseKeys.has(item.senseKey),
  rendererAdmitted: rendererAdmittedSenseKeys.has(item.senseKey),
  childFacing: childFacingSenseKeys.has(item.senseKey),
  pendingProof: pendingProofSenseKeys.has(item.senseKey)
}));

const result = {
  issueRef: 76,
  corpus: {
    totalLemmas: corpus.entries?.length ?? 0,
    auditedLemmas: auditedLemmas.size,
    unauditedLemmas: unaudited.length,
    auditedPercent: corpus.entries?.length ? Number(((auditedLemmas.size / corpus.entries.length) * 100).toFixed(2)) : 0,
    outsideCorpusStrategyItems: outsideCorpusItems.length
  },
  meaningQueue: {
    sourceFiles: senseReviewFiles,
    totalPriorityLemmas: meaningQueueLemmas.size,
    totalCandidateSenses: senseCandidateById.size,
    auditedLemmas: auditedMeaningQueueLemmas.size,
    auditedLemmaPercent: meaningQueueLemmas.size ? Number(((auditedMeaningQueueLemmas.size / meaningQueueLemmas.size) * 100).toFixed(2)) : 0,
    explicitCandidateLinks: linkedCandidateIds.size
  },
  runtime: {
    totalPlans: runtimePlans.length,
    rendererAdmittedSenses: rendererAdmittedSenseKeys.size,
    templateProofPlans,
    mappedKnowledgePlans,
    mappedKnowledgeRefs: mappedKnowledgeRefs.size,
    childFacingPlans,
    childFacingSenses: childFacingSenseKeys.size,
    childFacingKnowledgeRefs: childFacingKnowledgeRefs.size,
    pendingProofPlans,
    pendingProofSenses: pendingProofSenseKeys.size,
    pendingProofKnowledgeRefs: pendingProofKnowledgeRefs.size,
    meaningfulMotionSenses: motionRuntimeSenseKeys.size
  },
  batches: batchFiles,
  senseLinkFiles,
  summary: {
    auditedSenseItems: items.length,
    directVisuals,
    sceneTemplateTargets,
    sceneReadyV3,
    validSemanticPlans,
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
  meaningQueueGaps,
  maturityRows: maturityRows.slice(0, Math.max(limit, 260)),
  errors: errors.slice(0, 100)
};

if (jsonMode) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log('# Vocabulary visual semantic coverage');
  console.log(`Primary corpus: ${result.corpus.auditedLemmas}/${result.corpus.totalLemmas} lemma(s) audited (${result.corpus.auditedPercent}%); ${result.corpus.outsideCorpusStrategyItems} explicit existing-runtime-only strategy item(s).`);
  console.log(`Priority meaning queue: ${result.meaningQueue.auditedLemmas}/${result.meaningQueue.totalPriorityLemmas} lemma(s) audited (${result.meaningQueue.auditedLemmaPercent}%); ${result.meaningQueue.explicitCandidateLinks} explicit OEWN candidate link(s).`);
  console.log(`Sense strategies: ${items.length}; direct visuals: ${directVisuals}; scene-template targets: ${sceneTemplateTargets}; declared V3+ scene-ready: ${sceneReadyV3}; valid semantic plans: ${validSemanticPlans}; meaningful-motion targets: ${meaningfulMotionTargets}.`);
  console.log(`Runtime: ${result.runtime.rendererAdmittedSenses} renderer-admitted sense(s) across ${result.runtime.totalPlans} plan(s); ${result.runtime.templateProofPlans} template proof(s); ${result.runtime.mappedKnowledgePlans} mapped knowledge plan(s); ${result.runtime.childFacingPlans} proof-admitted child-facing mapping(s) / ${result.runtime.childFacingSenses} semantic sense(s); ${result.runtime.pendingProofPlans} mapping(s) pending V5/V6 proof; ${result.runtime.meaningfulMotionSenses} runtime motion-capable sense(s).`);
  console.log(`Sense-unresolved: ${unresolvedSenses}; textual-only: ${textualOnlySenses}; validation errors: ${errors.length}.`);
  console.log(`Strategies: ${JSON.stringify(byStrategy)}`);
  console.log(`Maturity: ${JSON.stringify(byMaturity)}`);
  console.log(`Audited corpus grades: ${JSON.stringify(byGrade)}`);
  console.log('\nHighest-priority unaudited corpus lemmas:');
  for (const gap of highPriorityGaps) console.log(`- #${gap.rank} ${gap.lemma} (grade ${gap.grade}, ${gap.partOfSpeech ?? 'unknown POS'}, ${gap.reviewStatus}, zipf=${gap.zipf ?? 'n/a'})`);
  console.log('\nHighest-priority unaudited meaning-queue lemmas:');
  for (const gap of meaningQueueGaps) console.log(`- #${gap.rank} ${gap.lemma} (grade ${gap.grade}, ${gap.partOfSpeech ?? 'unknown POS'}, ${gap.reviewStatus}, zipf=${gap.zipf ?? 'n/a'})`);
  if (errors.length) {
    console.log('\nValidation errors:');
    for (const error of errors.slice(0, 30)) console.log(`- ${error}`);
  }
}

if (failOnInvalid && errors.length) process.exitCode = 1;
