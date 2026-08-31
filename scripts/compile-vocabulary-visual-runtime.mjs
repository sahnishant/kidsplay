import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { normalizeData } from './normalizers/registry.mjs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const outputUrl = new URL('content/vocabulary-visuals/__generated-runtime-plans.json', root);

const knowledgeNames = readdirSync(new URL('content/knowledge/', root))
  .filter((name) => name.endsWith('.json'))
  .sort();
const canonicalRowIds = new Set();
for (const name of knowledgeNames) {
  const value = readJson(`content/knowledge/${name}`);
  const sources = Array.isArray(value) ? value : [value];
  for (const source of sources) {
    const normalized = normalizeData(source);
    for (const unit of normalized.units ?? []) {
      const rowId = String(unit?.rowId ?? '').trim();
      if (!rowId) throw new Error(`${name}: normalized knowledge unit is missing rowId`);
      if (canonicalRowIds.has(rowId)) throw new Error(`${name}: duplicate canonical knowledge row ${rowId}`);
      canonicalRowIds.add(rowId);
    }
  }
}

const batchNames = readdirSync(new URL('content/vocabulary-visuals/batches/', root))
  .filter((name) => name.endsWith('.json'))
  .sort();
const strategyBySenseKey = new Map();
for (const name of batchNames) {
  const batch = readJson(`content/vocabulary-visuals/batches/${name}`);
  for (const item of batch.items ?? []) {
    if (!item?.senseKey) throw new Error(`${name}: visual strategy item is missing senseKey`);
    if (strategyBySenseKey.has(item.senseKey)) throw new Error(`${name}: duplicate senseKey ${item.senseKey}`);
    strategyBySenseKey.set(item.senseKey, item);
  }
}

const projectPlan = (item, runtimeUsage, knowledgeRef = null) => ({
  knowledgeRef,
  runtimeUsage,
  senseKey: item.senseKey,
  lemma: item.lemma,
  strategy: item.strategy,
  sceneTemplate: item.sceneTemplate ?? null,
  maturity: item.maturity,
  motionPolicy: item.motionPolicy,
  answerSafety: item.answerSafety,
  visualRef: item.visualRef ?? null,
  parameters: item.parameters ?? {}
});

const reinforcement = readJson('content/vocabulary-visuals/runtime-reinforcement.json');
if (reinforcement?.schemaVersion !== 1) throw new Error('Vocabulary visual runtime reinforcement schemaVersion must be 1');
if (reinforcement?.policy?.phase !== 'post_answer_only') throw new Error('Vocabulary visual runtime reinforcement must remain post_answer_only');
if (reinforcement?.policy?.structuredAssessmentAllowed !== false) throw new Error('Vocabulary visual runtime reinforcement cannot be enabled for structured assessment');
if (reinforcement?.policy?.questionSchemaCoupling !== false) throw new Error('Vocabulary visual runtime reinforcement must remain presentation-only');

const seenKnowledgeRefs = new Set();
const seenRuntimeSenseKeys = new Set();
const reinforcementPlans = (reinforcement.mappings ?? []).map((mapping) => {
  const knowledgeRef = String(mapping?.knowledgeRef ?? '').trim();
  const senseKey = String(mapping?.senseKey ?? '').trim();
  if (!knowledgeRef.startsWith('kr.')) throw new Error(`Invalid vocabulary visual runtime knowledgeRef ${knowledgeRef}`);
  if (!canonicalRowIds.has(knowledgeRef)) throw new Error(`${knowledgeRef}: vocabulary visual runtime mapping is not a canonical knowledge row`);
  if (seenKnowledgeRefs.has(knowledgeRef)) throw new Error(`Duplicate vocabulary visual runtime knowledgeRef ${knowledgeRef}`);
  seenKnowledgeRefs.add(knowledgeRef);
  if (seenRuntimeSenseKeys.has(senseKey)) throw new Error(`${senseKey}: duplicate vocabulary visual runtime sense admission`);
  seenRuntimeSenseKeys.add(senseKey);
  const item = strategyBySenseKey.get(senseKey);
  if (!item) throw new Error(`${knowledgeRef}: unknown vocabulary visual senseKey ${senseKey}`);
  if (['sense_unresolved', 'textual_only'].includes(item.strategy)) {
    throw new Error(`${knowledgeRef}: runtime reinforcement cannot use blocked strategy ${item.strategy}`);
  }
  if (!['post_answer_only', 'neutral_safe'].includes(item.answerSafety)) {
    throw new Error(`${knowledgeRef}: runtime reinforcement requires post-answer-safe strategy; got ${item.answerSafety}`);
  }
  return projectPlan(item, 'knowledge_reinforcement', knowledgeRef);
});

const templateProofs = readJson('content/vocabulary-visuals/runtime-template-proofs.json');
if (templateProofs?.schemaVersion !== 1) throw new Error('Vocabulary visual runtime template proofs schemaVersion must be 1');
if (templateProofs?.policy?.childFacingKnowledgeMapping !== false) throw new Error('Vocabulary template proofs must not imply child-facing knowledge mapping');
if (templateProofs?.policy?.profilePlacementInferred !== false) throw new Error('Vocabulary template proofs must not infer profile placement');
if (templateProofs?.policy?.assessmentUsageAllowed !== false) throw new Error('Vocabulary template proofs cannot be admitted to assessment surfaces');

const proofPlans = (templateProofs.senseKeys ?? []).map((rawSenseKey) => {
  const senseKey = String(rawSenseKey ?? '').trim();
  if (!senseKey) throw new Error('Vocabulary template proof contains an empty senseKey');
  if (seenRuntimeSenseKeys.has(senseKey)) throw new Error(`${senseKey}: duplicate vocabulary visual runtime sense admission`);
  seenRuntimeSenseKeys.add(senseKey);
  const item = strategyBySenseKey.get(senseKey);
  if (!item) throw new Error(`${senseKey}: unknown vocabulary template proof senseKey`);
  if (['sense_unresolved', 'textual_only', 'direct_entity'].includes(item.strategy)) {
    throw new Error(`${senseKey}: template proof requires a compositional semantic strategy; got ${item.strategy}`);
  }
  if (!item.sceneTemplate) throw new Error(`${senseKey}: template proof requires sceneTemplate`);
  return projectPlan(item, 'template_proof');
});

const plans = [...reinforcementPlans, ...proofPlans];
writeFileSync(outputUrl, `${JSON.stringify({ schemaVersion: 1, issueRef: 80, plans }, null, 2)}\n`, 'utf8');
console.log(
  `Compiled ${reinforcementPlans.length} child-facing vocabulary reinforcement plan(s) + ` +
  `${proofPlans.length} renderer template proof plan(s) from ${strategyBySenseKey.size} audited sense strategy item(s); ` +
  `${canonicalRowIds.size} canonical knowledge row(s) checked.`
);
