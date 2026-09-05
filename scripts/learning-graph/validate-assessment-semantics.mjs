import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_MODULE_PATH = 'content/curriculum-modules/ncert/2026-27/class-2/english/mridang/chapters/my-bicycle.json';

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function collectJsonFiles(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root).sort().flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? collectJsonFiles(path) : path.endsWith('.json') ? [path] : [];
  });
}

function collectById(root, field, idField = 'id') {
  const result = new Map();
  for (const path of collectJsonFiles(root)) {
    const value = readJson(path);
    for (const record of Array.isArray(value?.[field]) ? value[field] : []) {
      invariant(typeof record?.[idField] === 'string' && record[idField], `${path}: record missing ${idField}`);
      invariant(!result.has(record[idField]), `${path}: duplicate ${idField} ${record[idField]}`);
      result.set(record[idField], record);
    }
  }
  return result;
}

function validateTypedAssertion(assertion, id, nodeById, predicateById, qualifierById) {
  invariant(assertion && typeof assertion === 'object', `${id}: assertion must be an object`);
  const subject = nodeById.get(assertion.subjectRef);
  const object = nodeById.get(assertion.objectRef);
  invariant(subject, `${id}: unknown subjectRef ${assertion.subjectRef}`);
  invariant(object, `${id}: unknown objectRef ${assertion.objectRef}`);
  const predicate = predicateById.get(assertion.predicate);
  invariant(predicate, `${id}: unknown predicate ${assertion.predicate}`);
  invariant(predicate.subjectTypes.includes(subject.type), `${id}: ${subject.type} is not allowed as ${assertion.predicate} subject`);
  invariant(predicate.objectTypes.includes(object.type), `${id}: ${object.type} is not allowed as ${assertion.predicate} object`);

  for (const [key, value] of Object.entries(assertion.qualifiers ?? {})) {
    invariant(predicate.qualifiersAllowed.includes(key), `${id}: qualifier ${key} is not allowed for ${assertion.predicate}`);
    const definition = qualifierById.get(key);
    invariant(definition, `${id}: qualifier ${key} has no ontology definition`);
    if (definition.valueType === 'node_ref') invariant(nodeById.has(value), `${id}: qualifier ${key} points to unknown node ${value}`);
    if (definition.valueType === 'enum') invariant(definition.values.includes(value), `${id}: qualifier ${key} has invalid value ${value}`);
  }
}

export function validateAssessmentSemantics({ root = process.cwd(), modulePath = DEFAULT_MODULE_PATH } = {}) {
  const module = readJson(resolve(root, modulePath));
  const ontologyFiles = collectJsonFiles(resolve(root, 'content/learning-graph/ontology'));
  invariant(ontologyFiles.length > 0, 'No learning-graph ontology found');
  const ontology = readJson(ontologyFiles.find((path) => readJson(path).ontologyId === 'kidsplay.learning-graph.core.v1') ?? ontologyFiles[0]);
  invariant(ontology.openWorldAssumption === true, 'Assessment semantics require an open-world graph');

  const nodeById = collectById(resolve(root, 'content/learning-graph/nodes'), 'nodes');
  const claimById = collectById(resolve(root, 'content/learning-graph/claims'), 'claims');
  const mediaById = collectById(resolve(root, 'content/media-bindings'), 'bindings');
  const blueprintById = new Map(collectJsonFiles(resolve(root, 'content/module-assessments')).map((path) => {
    const blueprint = readJson(path);
    return [blueprint.blueprintId, blueprint];
  }));
  const predicateById = new Map(ontology.predicateDefinitions.map((item) => [item.id, item]));
  const qualifierById = new Map(ontology.qualifierDefinitions.map((item) => [item.id, item]));
  const mediaPurposes = new Set(ontology.mediaPurposes);
  const moduleClaimIds = new Set([...module.sharedClaimRefs, ...module.localClaimRefs]);
  const blueprint = blueprintById.get(module.assessmentBlueprintRef);
  invariant(blueprint, `${module.moduleId}: unknown assessment blueprint ${module.assessmentBlueprintRef}`);

  let semanticTargetCount = 0;
  let falseJudgementCount = 0;
  for (const target of blueprint.targets) {
    const semantics = target.expectedSemantics;
    if (!semantics) continue;
    semanticTargetCount += 1;
    for (const ref of semantics.evidenceClaimRefs ?? []) {
      invariant(moduleClaimIds.has(ref) && claimById.has(ref), `${target.id}: unresolved explicit semantic evidence ${ref}`);
    }
    if (semantics.kind === 'select_object') {
      invariant(nodeById.has(semantics.objectRef), `${target.id}: unknown expected object ${semantics.objectRef}`);
    }
    if (semantics.kind === 'truth_judgement') {
      validateTypedAssertion(
        semantics.candidateAssertion,
        `${target.id}.candidateAssertion`,
        nodeById,
        predicateById,
        qualifierById
      );
      if (semantics.expectedJudgement === false) {
        falseJudgementCount += 1;
        invariant((semantics.evidenceClaimRefs ?? []).length > 0, `${target.id}: false judgement inferred from missing data`);
      }
    }
  }

  const nonEvaluativeMedia = [];
  for (const ref of module.mediaBindingRefs) {
    const binding = mediaById.get(ref);
    invariant(binding, `${module.moduleId}: unknown media binding ${ref}`);
    invariant(mediaPurposes.has(binding.purpose), `${ref}: invalid media purpose ${binding.purpose}`);
    if (binding.assessmentUse?.preAnswerAllowed) {
      invariant(binding.purpose === 'neutral_assessment_stimulus', `${ref}: only neutral media may be used pre-answer`);
      invariant(binding.answerDisclosure === 'none', `${ref}: pre-answer media may not disclose the answer`);
    }
    if (binding.purpose === 'non_evaluative_activity') {
      nonEvaluativeMedia.push(ref);
      invariant(binding.assessmentUse?.preAnswerAllowed === false, `${ref}: non-evaluative activity media cannot be assessment stimulus`);
      invariant(binding.answerDisclosure === 'none', `${ref}: non-evaluative activity media should not encode an answer`);
    }
  }

  return {
    moduleId: module.moduleId,
    semanticTargetCount,
    falseJudgementCount,
    nonEvaluativeMedia
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const modulePath = process.argv.find((arg, index) => index > 1 && !arg.startsWith('--')) ?? DEFAULT_MODULE_PATH;
    const result = validateAssessmentSemantics({ root: process.cwd(), modulePath });
    if (process.argv.includes('--json')) console.log(JSON.stringify(result));
    else console.log(`Validated ${result.moduleId}: ${result.semanticTargetCount} semantic targets, ${result.falseJudgementCount} explicit false judgements.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
