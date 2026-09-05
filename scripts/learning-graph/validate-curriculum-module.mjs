import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_MODULE_PATH = 'content/curriculum-modules/ncert/2026-27/class-2/english/mridang/chapters/my-bicycle.json';
const HEX_64 = /^[a-f0-9]{64}$/;
const RAW_MEDIA = /(?:https?:\/\/|\.(?:svg|png|jpe?g|webp|gif|mp3|wav|ogg|m4a)(?:$|[?#]))/i;
const PROHIBITED_KNOWLEDGE_KEYS = new Set([
  'src', 'url', 'assetPath', 'filePath', 'audioPath', 'imagePath', 'coordinates', 'css', 'animationId'
]);

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

function collectRecords(root, field) {
  return collectJsonFiles(root).flatMap((path) => {
    const value = readJson(path);
    return Array.isArray(value?.[field]) ? value[field].map((record) => ({ record, path })) : [];
  });
}

function uniqueById(items, field, label) {
  const map = new Map();
  for (const { record, path } of items) {
    const id = record?.[field];
    invariant(typeof id === 'string' && id.length > 0, `${label} in ${path} is missing ${field}`);
    const existing = map.get(id);
    invariant(!existing, `Duplicate ${label} ${id} in ${path}${existing ? ` and ${existing.path}` : ''}`);
    map.set(id, { record, path });
  }
  return map;
}

function visit(value, callback, path = '$') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => visit(item, callback, `${path}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      callback({ key, value: child, path: `${path}.${key}` });
      visit(child, callback, `${path}.${key}`);
    }
  }
}

function assertNoPresentationLeak(record, id) {
  const violations = [];
  visit(record, ({ key, value, path }) => {
    if (PROHIBITED_KNOWLEDGE_KEYS.has(key)) violations.push(`${path}: prohibited key ${key}`);
    if (typeof value === 'string' && RAW_MEDIA.test(value)) violations.push(`${path}: raw media/URL ${value}`);
  });
  invariant(violations.length === 0, `${id} leaks presentation data into knowledge:\n${violations.join('\n')}`);
}

function refs(value, fields) {
  return fields.flatMap((field) => Array.isArray(value?.[field]) ? value[field] : []);
}

export function validateCurriculumModule({ root = process.cwd(), modulePath = DEFAULT_MODULE_PATH } = {}) {
  const absoluteModulePath = resolve(root, modulePath);
  const module = readJson(absoluteModulePath);
  const sourceItems = collectJsonFiles(resolve(root, 'content/source-manifests')).map((path) => ({ record: readJson(path), path }));
  const sourceById = uniqueById(sourceItems, 'sourceId', 'source manifest');
  const nodeById = uniqueById(collectRecords(resolve(root, 'content/learning-graph/nodes'), 'nodes'), 'id', 'node');
  const claimById = uniqueById(collectRecords(resolve(root, 'content/learning-graph/claims'), 'claims'), 'id', 'claim');
  const capabilityById = uniqueById(collectRecords(resolve(root, 'content/learning-graph/capabilities'), 'capabilities'), 'id', 'capability');
  const mediaById = uniqueById(collectRecords(resolve(root, 'content/media-bindings'), 'bindings'), 'id', 'media binding');
  const assessmentItems = collectJsonFiles(resolve(root, 'content/module-assessments')).map((path) => ({ record: readJson(path), path }));
  const assessmentById = uniqueById(assessmentItems, 'blueprintId', 'assessment blueprint');

  const ontologyFiles = collectJsonFiles(resolve(root, 'content/learning-graph/ontology'));
  invariant(ontologyFiles.length > 0, 'No learning-graph ontology found');
  const ontology = readJson(ontologyFiles.find((path) => readJson(path).ontologyId === 'kidsplay.learning-graph.core.v1') ?? ontologyFiles[0]);
  invariant(ontology.openWorldAssumption === true, 'Learning Graph must use an open-world assumption');
  const predicateById = new Map(ontology.predicateDefinitions.map((item) => [item.id, item]));
  const qualifierById = new Map(ontology.qualifierDefinitions.map((item) => [item.id, item]));
  const reviewStatuses = new Set(ontology.reviewStatuses);
  const authorityKinds = new Set(ontology.authorityKinds);
  const mediaPurposes = new Set(ontology.mediaPurposes);

  invariant(module.moduleType === 'curriculum_chapter', `${module.moduleId}: expected curriculum_chapter`);
  const source = sourceById.get(module.sourceRef)?.record;
  invariant(source, `${module.moduleId}: unknown sourceRef ${module.sourceRef}`);
  invariant(source.files.every((file) => HEX_64.test(file.sha256) && Number.isInteger(file.bytes) && file.bytes > 0), `${source.sourceId}: invalid source hash/size`);
  invariant(source.rights.status === 'all_rights_reserved', `${source.sourceId}: rights status must remain explicit`);
  invariant(source.rights.runtimeTextPolicy === 'prohibited_without_separate_permission', `${source.sourceId}: runtime text policy weakened`);
  invariant(source.rights.runtimeArtworkPolicy === 'prohibited_without_separate_permission', `${source.sourceId}: runtime artwork policy weakened`);
  invariant(source.files.every((file) => file.includedInRepository === false && file.runtimeBundled === false), `${source.sourceId}: source binary must not be committed or bundled`);
  invariant(module.publication.runtimeEligible === false, `${module.moduleId}: all-rights-reserved pilot cannot be runtime-published`);
  invariant(module.publication.sourceTextStored === false && module.publication.sourceArtworkStored === false, `${module.moduleId}: source text/art boundary missing`);

  const moduleClaimIds = new Set([...module.sharedClaimRefs, ...module.localClaimRefs]);
  const moduleCapabilityIds = new Set(module.capabilityRefs);
  const moduleMediaIds = new Set(module.mediaBindingRefs);
  const moduleNodeRefs = new Set(module.rootNodeRefs);
  for (const target of module.lexicalTargets ?? []) {
    for (const ref of target.senseRefs ?? []) moduleNodeRefs.add(ref);
    if (target.formNodeRef) moduleNodeRefs.add(target.formNodeRef);
    if (target.status === 'blocked_pending_sense_review') {
      invariant(target.runtimeEligible === false, `${module.moduleId}: unresolved lexical target ${target.form} became runtime eligible`);
    }
  }
  for (const target of module.languageTargets ?? []) {
    moduleNodeRefs.add(target.conceptRef);
    invariant(moduleCapabilityIds.has(target.capabilityRef), `${target.id}: capability ${target.capabilityRef} not admitted by module`);
  }
  for (const ref of moduleNodeRefs) invariant(nodeById.has(ref), `${module.moduleId}: unknown node ref ${ref}`);
  for (const ref of moduleClaimIds) invariant(claimById.has(ref), `${module.moduleId}: unknown claim ref ${ref}`);
  for (const ref of moduleCapabilityIds) invariant(capabilityById.has(ref), `${module.moduleId}: unknown capability ref ${ref}`);
  for (const ref of moduleMediaIds) invariant(mediaById.has(ref), `${module.moduleId}: unknown media binding ref ${ref}`);

  for (const [id, { record: node }] of nodeById) {
    invariant(ontology.nodeTypes.includes(node.type), `${id}: unknown node type ${node.type}`);
    invariant(reviewStatuses.has(node.review?.status), `${id}: unknown review status ${node.review?.status}`);
    invariant(node.review?.publishable === false || node.review?.status === 'human_approved', `${id}: unapproved node marked publishable`);
    assertNoPresentationLeak(node, id);
  }

  for (const [id, { record: claim }] of claimById) {
    invariant(claim.polarity === 'positive' || claim.polarity === 'negative', `${id}: polarity must be explicit`);
    invariant(authorityKinds.has(claim.authority?.kind), `${id}: invalid authority kind ${claim.authority?.kind}`);
    invariant(reviewStatuses.has(claim.review?.status), `${id}: invalid review status ${claim.review?.status}`);
    const subject = nodeById.get(claim.subjectRef)?.record;
    const object = nodeById.get(claim.objectRef)?.record;
    invariant(subject, `${id}: unknown subjectRef ${claim.subjectRef}`);
    invariant(object, `${id}: unknown objectRef ${claim.objectRef}`);
    const predicate = predicateById.get(claim.predicate);
    invariant(predicate, `${id}: unknown predicate ${claim.predicate}`);
    invariant(predicate.subjectTypes.includes(subject.type), `${id}: ${subject.type} is not allowed as ${claim.predicate} subject`);
    invariant(predicate.objectTypes.includes(object.type), `${id}: ${object.type} is not allowed as ${claim.predicate} object`);
    for (const [key, value] of Object.entries(claim.qualifiers ?? {})) {
      invariant(predicate.qualifiersAllowed.includes(key), `${id}: qualifier ${key} is not allowed for ${claim.predicate}`);
      const definition = qualifierById.get(key);
      invariant(definition, `${id}: qualifier ${key} has no ontology definition`);
      if (definition.valueType === 'node_ref') invariant(nodeById.has(value), `${id}: qualifier ${key} points to unknown node ${value}`);
      if (definition.valueType === 'enum') invariant(definition.values.includes(value), `${id}: qualifier ${key} has invalid value ${value}`);
    }
    invariant((claim.provenance ?? []).some((item) => sourceById.has(item.sourceRef)), `${id}: missing resolvable provenance`);
    assertNoPresentationLeak(claim, id);
  }

  for (const id of module.sharedClaimRefs) {
    const claim = claimById.get(id).record;
    invariant(claim.authority.kind === 'canonical', `${id}: shared claim must use canonical authority`);
    invariant(claim.scope.kind === 'shared' && !claim.scope.moduleRef, `${id}: shared claim cannot be module-local`);
  }
  for (const id of module.localClaimRefs) {
    const claim = claimById.get(id).record;
    invariant(claim.authority.kind !== 'canonical', `${id}: local claim cannot masquerade as canonical`);
    invariant(claim.scope.moduleRef === module.moduleId, `${id}: local claim scope does not match module`);
  }

  for (const section of module.sectionSpine) {
    for (const claimRef of section.claimRefs) invariant(moduleClaimIds.has(claimRef), `${section.id}: claim ${claimRef} is outside module scope`);
    for (const capabilityRef of section.capabilityRefs) invariant(moduleCapabilityIds.has(capabilityRef), `${section.id}: capability ${capabilityRef} is outside module scope`);
  }
  const ordered = [...module.sectionSpine].sort((a, b) => a.order - b.order);
  invariant(ordered.every((section, index) => section.order === index + 1), `${module.moduleId}: section spine order must be contiguous from 1`);

  for (const id of module.mediaBindingRefs) {
    const binding = mediaById.get(id).record;
    invariant(binding.moduleRefs.includes(module.moduleId), `${id}: moduleRef missing`);
    invariant(mediaPurposes.has(binding.purpose), `${id}: invalid media purpose ${binding.purpose}`);
    for (const ref of binding.semanticRefs) invariant(nodeById.has(ref) || claimById.has(ref), `${id}: unresolved semantic ref ${ref}`);
    invariant(binding.sourceArtworkAllowed === false, `${id}: source artwork must remain prohibited`);
    assertNoPresentationLeak(binding.assetPolicy, id);
    if (binding.assessmentUse?.preAnswerAllowed) {
      invariant(binding.purpose === 'neutral_assessment_stimulus', `${id}: only neutral media may be used pre-answer`);
      invariant(binding.answerDisclosure === 'none', `${id}: pre-answer media may not disclose the answer`);
    }
    if (binding.motion?.mode === 'meaningful') {
      invariant(Boolean(binding.motion.staticEquivalent), `${id}: meaningful motion needs staticEquivalent`);
      invariant(Boolean(binding.motion.reducedMotionEquivalent), `${id}: meaningful motion needs reducedMotionEquivalent`);
    }
  }

  const blueprint = assessmentById.get(module.assessmentBlueprintRef)?.record;
  invariant(blueprint, `${module.moduleId}: unknown assessment blueprint ${module.assessmentBlueprintRef}`);
  invariant(blueprint.moduleRef === module.moduleId, `${blueprint.blueprintId}: moduleRef mismatch`);
  invariant(blueprint.generationPolicy.verbatimSourceTextAllowed === false, `${blueprint.blueprintId}: verbatim source prompts must remain forbidden`);
  invariant(blueprint.generationPolicy.sourceArtworkAllowed === false, `${blueprint.blueprintId}: source artwork must remain forbidden`);
  invariant(blueprint.generationPolicy.runtimeCloudGenerationAllowed === false, `${blueprint.blueprintId}: runtime cloud generation must remain disabled`);

  for (const target of blueprint.targets) {
    invariant(!Object.prototype.hasOwnProperty.call(target, 'prompt') && !Object.prototype.hasOwnProperty.call(target, 'questionText') && !Object.prototype.hasOwnProperty.call(target, 'sourceText'), `${target.id}: stores authored/source question wording instead of a semantic target`);
    for (const ref of target.targetCapabilityRefs ?? []) {
      invariant(moduleCapabilityIds.has(ref), `${target.id}: capability ${ref} is outside module scope`);
    }
    for (const ref of target.targetNodeRefs ?? []) invariant(nodeById.has(ref), `${target.id}: unknown target node ${ref}`);
    for (const ref of refs(target, ['targetClaimRefs', 'supportingClaimRefs', 'contextClaimRefs'])) {
      invariant(moduleClaimIds.has(ref), `${target.id}: claim ${ref} is outside module scope`);
    }
    for (const ref of target.mediaBindingRefs ?? []) {
      invariant(moduleMediaIds.has(ref), `${target.id}: media ${ref} is outside module scope`);
      if (target.preAnswerMedia) invariant(mediaById.get(ref).record.assessmentUse.preAnswerAllowed === true, `${target.id}: unsafe pre-answer media ${ref}`);
    }
    invariant(target.evidencePolicy.supportingClaims === 'none', `${target.id}: supporting knowledge may not silently receive mastery`);
    invariant(target.evidencePolicy.contextClaims === 'none', `${target.id}: chapter context may not silently receive mastery`);
    if (target.mode === 'non_evaluative') {
      invariant(Object.values(target.evidencePolicy).every((value) => value === 'none'), `${target.id}: non-evaluative activity writes evidence`);
    }
    if (target.mode === 'evaluative') invariant(target.evidencePolicy.capabilities === 'record', `${target.id}: evaluative target must record primary capability evidence`);
    if (target.expectedSemantics?.expectedJudgement === false) {
      invariant((target.expectedSemantics.evidenceClaimRefs ?? []).length > 0, `${target.id}: false judgement inferred from missing data`);
      for (const ref of target.expectedSemantics.evidenceClaimRefs) invariant(moduleClaimIds.has(ref), `${target.id}: unresolved explicit judgement evidence ${ref}`);
    }
  }

  return {
    moduleId: module.moduleId,
    sourceId: source.sourceId,
    rightsStatus: source.rights.status,
    runtimeEligible: module.publication.runtimeEligible,
    nodeCount: nodeById.size,
    claimCount: moduleClaimIds.size,
    sharedClaimCount: module.sharedClaimRefs.length,
    localClaimCount: module.localClaimRefs.length,
    capabilityCount: moduleCapabilityIds.size,
    mediaBindingCount: moduleMediaIds.size,
    assessmentTargetCount: blueprint.targets.length,
    blockedLexicalTargets: (module.lexicalTargets ?? []).filter((target) => target.status.startsWith('blocked')).map((target) => target.form)
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const modulePath = process.argv.find((arg, index) => index > 1 && !arg.startsWith('--')) ?? DEFAULT_MODULE_PATH;
    const result = validateCurriculumModule({ root: process.cwd(), modulePath });
    if (process.argv.includes('--json')) console.log(JSON.stringify(result));
    else console.log(`Validated ${result.moduleId}: ${result.claimCount} claims, ${result.capabilityCount} capabilities, ${result.assessmentTargetCount} assessment targets.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
