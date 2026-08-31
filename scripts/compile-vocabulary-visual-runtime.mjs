import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const outputUrl = new URL('content/vocabulary-visuals/__generated-runtime-plans.json', root);

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

const reinforcement = readJson('content/vocabulary-visuals/runtime-reinforcement.json');
if (reinforcement?.schemaVersion !== 1) throw new Error('Vocabulary visual runtime reinforcement schemaVersion must be 1');
if (reinforcement?.policy?.phase !== 'post_answer_only') throw new Error('Vocabulary visual runtime reinforcement must remain post_answer_only');
if (reinforcement?.policy?.structuredAssessmentAllowed !== false) throw new Error('Vocabulary visual runtime reinforcement cannot be enabled for structured assessment');
if (reinforcement?.policy?.questionSchemaCoupling !== false) throw new Error('Vocabulary visual runtime reinforcement must remain presentation-only');

const seenKnowledgeRefs = new Set();
const plans = (reinforcement.mappings ?? []).map((mapping) => {
  const knowledgeRef = String(mapping?.knowledgeRef ?? '').trim();
  const senseKey = String(mapping?.senseKey ?? '').trim();
  if (!knowledgeRef.startsWith('kr.')) throw new Error(`Invalid vocabulary visual runtime knowledgeRef ${knowledgeRef}`);
  if (seenKnowledgeRefs.has(knowledgeRef)) throw new Error(`Duplicate vocabulary visual runtime knowledgeRef ${knowledgeRef}`);
  seenKnowledgeRefs.add(knowledgeRef);
  const item = strategyBySenseKey.get(senseKey);
  if (!item) throw new Error(`${knowledgeRef}: unknown vocabulary visual senseKey ${senseKey}`);
  if (['sense_unresolved', 'textual_only'].includes(item.strategy)) {
    throw new Error(`${knowledgeRef}: runtime reinforcement cannot use blocked strategy ${item.strategy}`);
  }
  if (!['post_answer_only', 'neutral_safe'].includes(item.answerSafety)) {
    throw new Error(`${knowledgeRef}: runtime reinforcement requires post-answer-safe strategy; got ${item.answerSafety}`);
  }
  return {
    knowledgeRef,
    senseKey,
    lemma: item.lemma,
    strategy: item.strategy,
    sceneTemplate: item.sceneTemplate ?? null,
    maturity: item.maturity,
    motionPolicy: item.motionPolicy,
    answerSafety: item.answerSafety,
    visualRef: item.visualRef ?? null,
    parameters: item.parameters ?? {}
  };
});

writeFileSync(outputUrl, `${JSON.stringify({ schemaVersion: 1, issueRef: 80, plans }, null, 2)}\n`, 'utf8');
console.log(`Compiled ${plans.length} admitted vocabulary visual runtime plan(s) from ${strategyBySenseKey.size} audited sense strategy item(s).`);
