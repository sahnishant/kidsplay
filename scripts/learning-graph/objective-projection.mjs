import { readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCanonicalGraph, indexRecords } from './canonical-graph.mjs';

const must = (condition, message) => { if (!condition) throw new Error(message); };
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const unique = (values, label) => { must(Array.isArray(values) && new Set(values).size === values.length, `${label}: expected unique array`); return values; };
const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
export function loadObjectiveSystem(root = ROOT, modulePath) {
  const read = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
  const graph = loadCanonicalGraph({ root, ...(modulePath ? { modulePath } : {}) });
  must(graph.objectiveFile && graph.capabilityFile && graph.placementFile, 'Graph must bind its canonical objectives, capabilities and placements');
  return { graph, objectives: read(graph.objectiveFile).objectives,
    capabilities: read(graph.capabilityFile).capabilities,
    placements: read(graph.placementFile), compatibility: read(graph.compatibilityFile) };
}
export function validateObjectiveSystem(system) {
  const { graph, placements, compatibility } = system;
  const claims = indexRecords(graph.claims, 'claim'), objectives = indexRecords(system.objectives, 'objective');
  const capabilities = indexRecords(system.capabilities, 'capability');
  const legacy = new Set();
  const isCandidate = (item) => {
    must(Number.isInteger(item.revision) && item.revision > 0, `${item.id}: revision required`);
    must(graph.ontology.reviewStatuses.includes(item.review?.status) && typeof item.review.publishable === 'boolean', `${item.id}: explicit editorial state required`);
    must(!item.review.publishable || (item.review.status === 'human_approved' && text(item.review.humanReviewRef)), `${item.id}: unproved approval`);
  };
  for (const cap of capabilities.values()) {
    isCandidate(cap);
    must(!('stage' in cap) && !('gradeBands' in cap), `${cap.id}: capability must be grade-neutral`);
    must(text(cap.domain) && text(cap.cognitiveOperation), `${cap.id}: capability semantics required`);
  }
  for (const objective of objectives.values()) {
    isCandidate(objective);
    for (const field of ['subject', 'gradeBands', 'stage']) must(!(field in objective), `${objective.id}: curriculum field ${field} belongs to placement`);
    must(text(objective.cognitiveOperation) && ['D0','D1','D2','D3'].includes(objective.defaultDepth), `${objective.id}: operation and objective depth required`);
    const caps = unique(objective.capabilityRefs, objective.id), refs = unique(objective.targetClaimRefs, objective.id);
    must(caps.length + refs.length > 0, `${objective.id}: objective is unbound`);
    for (const id of caps) must(capabilities.has(id), `${objective.id}: unknown capability ${id}`);
    must(objective.descriptionSource === 'capability' ? caps.length === 1 && !('description' in objective) : text(objective.description?.en), `${objective.id}: one description authority required`);
    for (const id of unique(objective.legacyConceptIds, objective.id)) {
      must(text(id) && !legacy.has(id), `${objective.id}: duplicate legacy progress ID ${id}`);
      legacy.add(id);
    }
    for (const ref of refs) must(claims.get(ref)?.objectiveRefs?.includes(objective.id), `${objective.id}: claim/objective binding is not reciprocal: ${ref}`);
  }
  for (const claim of claims.values()) {
    must(!('conceptIds' in claim), `${claim.id}: authored legacy concept bindings forbidden`);
    for (const ref of unique(claim.objectiveRefs, claim.id)) must(objectives.get(ref)?.targetClaimRefs.includes(claim.id), `${claim.id}: objective/claim binding is not reciprocal: ${ref}`);
  }
  const placed = new Set();
  for (const placement of placements.objectives) {
    must(objectives.has(placement.objectiveRef) && !placed.has(placement.objectiveRef), `Invalid or duplicate objective placement ${placement.objectiveRef}`);
    must(text(placement.subject) && text(placement.topic) && text(placement.subtopic), `${placement.objectiveRef}: curriculum display context required`);
    must(Array.isArray(placement.gradeBands) && placement.gradeBands.length > 0 && placement.gradeBands.every((grade) => Number.isInteger(grade) && grade > 0), `${placement.objectiveRef}: invalid grade placement`);
    placed.add(placement.objectiveRef);
  }
  must(placed.size === objectives.size, 'Every admitted objective needs a contextual placement');
  const knownCapabilities = new Set();
  for (const placement of placements.capabilities) {
    must(capabilities.has(placement.capabilityRef) && !knownCapabilities.has(placement.capabilityRef) && text(placement.expectedStage), 'Invalid capability placement');
    knownCapabilities.add(placement.capabilityRef);
  }
  must(knownCapabilities.size === capabilities.size, 'Missing migrated capability placement');
  for (const entry of compatibility.projection.entries) {
    const claim = claims.get(entry.claimRef);
    must(claim && claim.objectiveRefs.length > 0, `${entry.claimRef}: runtime row lacks canonical objective authority`);
    must(claim.scope.kind === 'shared', `${entry.claimRef}: contextual claim cannot enter shared compatibility output`);
    for (const key of Object.keys(entry)) must(['id','claimRef','subject','object','meta'].includes(key), `${entry.claimRef}: compatibility input may not author ${key}`);
    for (const side of ['subject','object']) must(text(entry[side]?.id) && text(entry[side]?.label) && Object.keys(entry[side]).every((key) => ['id','label'].includes(key)), `${entry.claimRef}: invalid presentation alias`);
    must(Object.keys(entry.meta).every((key) => ['knowledgeLevel','skills'].includes(key)), `${entry.claimRef}: compatibility metadata cannot author truth`);
  }
  must(new Set(compatibility.projection.entries.map((entry) => entry.id)).size === compatibility.projection.entries.length, 'Duplicate compatibility entry');
  must(new Set(compatibility.projection.entries.map((entry) => entry.claimRef)).size === compatibility.projection.entries.length, 'Duplicate projected claim');
  const outputs = Object.entries(compatibility.learnables);
  must(outputs.length > 0, 'Missing learnable outputs');
  const emitted = outputs.flatMap(([path, ids]) => {
    must(/^content\/learnables\/[a-z0-9-]+\.json$/.test(path), 'Unsafe generated learnable path');
    return unique(ids, path);
  });
  must(new Set(emitted).size === emitted.length, 'A legacy learnable is emitted more than once');
  must(equal(new Set(emitted), new Set(system.objectives.flatMap((item) => item.legacyConceptIds))), 'Compatibility outputs must cover every legacy progress ID exactly once');
  return system;
}

export function buildLearnableProjection(system) {
  validateObjectiveSystem(system);
  const placements = new Map(system.placements.objectives.map((item) => [item.objectiveRef, item]));
  const legacy = new Map();
  for (const objective of system.objectives) {
    const placement = placements.get(objective.id);
    for (const id of objective.legacyConceptIds) {
      const description = objective.descriptionSource === 'capability'
        ? system.capabilities.find((item) => item.id === objective.capabilityRefs[0])?.statement
        : objective.description.en;
      legacy.set(id, {
        id,
        statement: description,
        subject: placement.subject,
        topic: placement.topic,
        subtopic: placement.subtopic,
        gradeBands: placement.gradeBands
      });
    }
  }
  return Object.fromEntries(Object.entries(system.compatibility.learnables).map(([path, ids]) => [path, ids.map((id) => legacy.get(id))]));
}

export function buildRuntimeKnowledgeProjection(system) {
  validateObjectiveSystem(system);
  const claimById = indexRecords(system.graph.claims, 'claim');
  const objectiveById = indexRecords(system.objectives, 'objective');
  return {
    schemaVersion: 1,
    id: system.compatibility.projection.id,
    kind: 'association_set',
    language: system.compatibility.projection.language,
    subject: system.compatibility.projection.subject,
    topic: system.compatibility.projection.topic,
    canonicalSource: {
      kind: 'learning_graph',
      graphRef: system.graph.graphId,
      claimFiles: system.graph.imports.claimFiles
    },
    status: system.compatibility.projection.status,
    source: system.compatibility.projection.source,
    entries: system.compatibility.projection.entries.map((entry) => {
      const claim = claimById.get(entry.claimRef);
      const conceptIds = claim.objectiveRefs.flatMap((ref) => objectiveById.get(ref)?.legacyConceptIds ?? []);
      return {
        id: entry.id,
        rowId: claim.id,
        graphClaimRef: claim.id,
        subject: entry.subject,
        relation: claim.predicate,
        object: entry.object,
        conceptIds,
        meta: {
          ...entry.meta,
          canonicalAuthority: 'learning_graph',
          runtimeProjection: true
        }
      };
    })
  };
}

export function writeObjectiveProjections({ root = ROOT } = {}) {
  const system = loadObjectiveSystem(root);
  const learnables = buildLearnableProjection(system), runtime = buildRuntimeKnowledgeProjection(system);
  const writes = [
    ...Object.entries(learnables),
    [system.compatibility.projection.outputPath, runtime]
  ];
  for (const [path, value] of writes) {
    const target = resolve(root, path), temp = `${target}.tmp`;
    writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`);
    renameSync(temp, target);
  }
  return { learnables: Object.keys(learnables), projection: system.compatibility.projection.outputPath };
}

export function assertGeneratedProjections({ root = ROOT } = {}) {
  const system = loadObjectiveSystem(root);
  const expected = [...Object.entries(buildLearnableProjection(system)), [system.compatibility.projection.outputPath, buildRuntimeKnowledgeProjection(system)]];
  for (const [path, value] of expected) {
    const actual = JSON.parse(readFileSync(resolve(root, path), 'utf8'));
    must(equal(actual, value), `${path}: generated compatibility projection drifted from canonical objectives`);
  }
  return true;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = process.argv.includes('--write') ? writeObjectiveProjections() : assertGeneratedProjections();
  console.log(JSON.stringify(result));
}
