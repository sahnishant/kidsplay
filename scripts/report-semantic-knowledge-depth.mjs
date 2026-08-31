import { readdirSync, readFileSync } from 'node:fs';
import { normalizeData } from './normalizers/registry.mjs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const readJsonDirectory = (path) => readdirSync(new URL(path, root))
  .filter((name) => name.endsWith('.json'))
  .sort()
  .map((name) => ({ name, value: readJson(`${path}${name}`) }));

const fail = process.argv.includes('--fail');
const errors = [];
const canonicalByRowId = new Map();
const relationTypes = new Set();

for (const { name, value } of readJsonDirectory('content/knowledge/')) {
  const sources = Array.isArray(value) ? value : [value];
  for (const source of sources) {
    const normalized = normalizeData(source);
    for (const unit of normalized.units ?? []) {
      if (canonicalByRowId.has(unit.rowId)) errors.push(`${name}: duplicate canonical row ${unit.rowId}`);
      canonicalByRowId.set(unit.rowId, { sourceRef: normalized.sourceRef, datatype: normalized.datatype, unit });
      if (unit.relation) relationTypes.add(unit.relation);
      if (unit.unitType === 'process') relationTypes.add('ordered_process');
    }
  }
}

const strategySenseKeys = new Set();
for (const { name, value } of readJsonDirectory('content/vocabulary-visuals/batches/')) {
  for (const item of value.items ?? []) {
    const senseKey = String(item?.senseKey ?? '').trim();
    if (!senseKey) errors.push(`${name}: missing visual strategy senseKey`);
    else if (strategySenseKeys.has(senseKey)) errors.push(`${name}: duplicate visual strategy senseKey ${senseKey}`);
    else strategySenseKeys.add(senseKey);
  }
}

const generatedQuestions = readJson('content/questions/__generated-from-knowledge.json');
const runtimePlansFile = readJson('content/vocabulary-visuals/__generated-runtime-plans.json');
const generatedQuestionRows = new Set(generatedQuestions.flatMap((question) => question.knowledgeRefs ?? []));
const runtimePlansByKnowledgeRef = new Map((runtimePlansFile.plans ?? [])
  .filter((plan) => plan?.knowledgeRef)
  .map((plan) => [plan.knowledgeRef, plan]));

const semanticFiles = readJsonDirectory('content/semantic-knowledge/');
const semanticIssueRefs = new Set();
const neighbourhoodIds = new Set();
const patternIds = new Set();
const allNeighbourhoods = [];
const allPatterns = [];
const processRowRefs = new Set();
const semanticRowRefs = new Set();
const forbiddenKeys = new Set(['visualRef', 'assetRef', 'assetUrl', 'url', 'file', 'filename', 'x', 'y', 'motion', 'css']);

const findForbiddenKeys = (value, path = '') => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => findForbiddenKeys(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) errors.push(`${path || '<root>'}: semantic knowledge may not contain presentation key ${key}`);
    findForbiddenKeys(nested, path ? `${path}.${key}` : key);
  }
};

for (const { name, value } of semanticFiles) {
  if (value?.schemaVersion !== 1) errors.push(`${name}: expected schemaVersion 1`);
  if (!Number.isInteger(value?.issueRef) || value.issueRef < 1) errors.push(`${name}: expected a positive issueRef`);
  else semanticIssueRefs.add(value.issueRef);
  const policy = value?.policy ?? {};
  for (const field of ['canonicalFactsCopied', 'artReferencesAllowed', 'coordinatesAllowed', 'motionInstructionsAllowed', 'profilePlacementInferred', 'sourceGlossesAllowed']) {
    if (policy[field] !== false) errors.push(`${name}: policy.${field} must be false`);
  }
  findForbiddenKeys(value, name);

  for (const neighbourhood of value.neighbourhoods ?? []) {
    const id = String(neighbourhood?.id ?? '').trim();
    if (!id || neighbourhoodIds.has(id)) errors.push(`${name}: duplicate/missing neighbourhood id ${id || '<empty>'}`);
    else neighbourhoodIds.add(id);
    const rows = [...new Set((neighbourhood.rowRefs ?? []).map(String))];
    if (rows.length < 2) errors.push(`${name}/${id}: neighbourhood requires at least two canonical rows`);
    for (const rowRef of rows) {
      semanticRowRefs.add(rowRef);
      if (!canonicalByRowId.has(rowRef)) errors.push(`${name}/${id}: unknown canonical row ${rowRef}`);
    }
    const senseKeys = [...new Set((neighbourhood.visualSenseKeys ?? []).map(String))];
    for (const senseKey of senseKeys) if (!strategySenseKeys.has(senseKey)) errors.push(`${name}/${id}: unknown visual sense ${senseKey}`);
    const modes = [...new Set((neighbourhood.reasoningModes ?? []).map(String))];
    if (!modes.length) errors.push(`${name}/${id}: reasoningModes cannot be empty`);
    allNeighbourhoods.push({ ...neighbourhood, id, rowRefs: rows, visualSenseKeys: senseKeys, reasoningModes: modes });
  }

  for (const pattern of value.reasoningPatterns ?? []) {
    const id = String(pattern?.id ?? '').trim();
    if (!id || patternIds.has(id)) errors.push(`${name}: duplicate/missing reasoning pattern id ${id || '<empty>'}`);
    else patternIds.add(id);
    const premiseRowRefs = [...new Set((pattern.premiseRowRefs ?? []).map(String))];
    const contrastRowRefs = [...new Set((pattern.contrastRowRefs ?? []).map(String))];
    if (!premiseRowRefs.length) errors.push(`${name}/${id}: reasoning pattern requires at least one premise row`);
    for (const rowRef of [...premiseRowRefs, ...contrastRowRefs]) {
      semanticRowRefs.add(rowRef);
      if (!canonicalByRowId.has(rowRef)) errors.push(`${name}/${id}: unknown reasoning row ${rowRef}`);
    }
    const visualSenseKey = String(pattern?.visualSenseKey ?? '').trim();
    if (!visualSenseKey || !strategySenseKeys.has(visualSenseKey)) errors.push(`${name}/${id}: unknown/missing visualSenseKey ${visualSenseKey || '<empty>'}`);
    allPatterns.push({ ...pattern, id, premiseRowRefs, contrastRowRefs, visualSenseKey });
  }

  for (const rawRowRef of value.processRowRefs ?? []) {
    const rowRef = String(rawRowRef);
    processRowRefs.add(rowRef);
    semanticRowRefs.add(rowRef);
    const canonical = canonicalByRowId.get(rowRef);
    if (!canonical) errors.push(`${name}: unknown process row ${rowRef}`);
    else if (canonical.unit.unitType !== 'process') errors.push(`${name}: processRowRef ${rowRef} is not process@1 knowledge`);
  }
}

const projectedIssueRefs = new Set((runtimePlansFile.semanticDepthIssueRefs ?? []).map(Number));
for (const issueRef of semanticIssueRefs) {
  if (!projectedIssueRefs.has(issueRef)) errors.push(`Runtime projection is missing semantic depth issueRef ${issueRef}`);
}
for (const issueRef of projectedIssueRefs) {
  if (!semanticIssueRefs.has(issueRef)) errors.push(`Runtime projection contains unknown semantic depth issueRef ${issueRef}`);
}

const requiredNeighbourhoods = [
  'settlements',
  'push-pull-force',
  'container-state',
  'spatial-position',
  'order-sequence',
  'quantity-comparison',
  'state-transitions'
];
for (const id of requiredNeighbourhoods) if (!neighbourhoodIds.has(id)) errors.push(`Missing required semantic neighbourhood ${id}`);
if (processRowRefs.size < 5) errors.push(`Expected at least 5 canonical process rows; got ${processRowRefs.size}`);

const referencedRelationTypes = new Set();
const conceptDegree = new Map();
for (const rowRef of semanticRowRefs) {
  const unit = canonicalByRowId.get(rowRef)?.unit;
  if (!unit) continue;
  const relation = unit.unitType === 'process' ? 'ordered_process' : unit.relation;
  if (relation) referencedRelationTypes.add(relation);
  for (const conceptId of unit.conceptIds ?? []) conceptDegree.set(conceptId, (conceptDegree.get(conceptId) ?? 0) + 1);
}
if (referencedRelationTypes.size < 5) errors.push(`Semantic depth should span at least 5 relationship types; got ${referencedRelationTypes.size}`);

const processQuestionRows = [...processRowRefs].filter((rowRef) => generatedQuestionRows.has(rowRef));
if (processQuestionRows.length !== processRowRefs.size) {
  errors.push(`Every process row must generate runnable delivery; ${processQuestionRows.length}/${processRowRefs.size} covered`);
}

const sceneLinkedPatterns = allPatterns.filter((pattern) => {
  const candidateRows = [...pattern.premiseRowRefs, ...pattern.contrastRowRefs];
  return candidateRows.some((rowRef) => {
    if (!generatedQuestionRows.has(rowRef)) return false;
    const plan = runtimePlansByKnowledgeRef.get(rowRef);
    return plan?.senseKey === pattern.visualSenseKey && (plan.semanticDepthPatternRefs ?? []).includes(pattern.id);
  });
});
if (!sceneLinkedPatterns.length) {
  errors.push('Expected at least one reasoning pattern to share canonical rows with both generated delivery and post-answer semantic scene planning');
}

const multiClaimConcepts = [...conceptDegree.values()].filter((count) => count >= 2).length;
const generatedDepthRows = [...semanticRowRefs].filter((rowRef) => generatedQuestionRows.has(rowRef));

console.log('# Semantic knowledge depth report');
console.log(`Canonical rows indexed: ${canonicalByRowId.size}`);
console.log(`Semantic depth files: ${semanticFiles.length}; child issue refs: ${[...semanticIssueRefs].sort((a, b) => a - b).join(', ')}`);
console.log(`Neighbourhoods: ${allNeighbourhoods.length}`);
console.log(`Reasoning patterns: ${allPatterns.length}`);
console.log(`Semantic row refs: ${semanticRowRefs.size}`);
console.log(`Referenced relation types: ${[...referencedRelationTypes].sort().join(', ')}`);
console.log(`Multi-claim concepts (2+ referenced rows): ${multiClaimConcepts}`);
console.log(`Canonical process rows: ${processRowRefs.size}; runnable process rows: ${processQuestionRows.length}`);
console.log(`Depth rows reused by generated delivery: ${generatedDepthRows.length}/${semanticRowRefs.size}`);
console.log(`Reasoning patterns sharing question + post-answer scene rows: ${sceneLinkedPatterns.length}`);
console.log(`Validation errors: ${errors.length}`);
if (errors.length) {
  for (const error of errors) console.log(`- ${error}`);
  if (fail) process.exitCode = 1;
}
