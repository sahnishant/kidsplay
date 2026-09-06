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
  must(emitted.length === objectives.size && new Set(emitted).size === emitted.length && emitted.every((id) => objectives.has(id)), 'Learnable outputs must partition objectives exactly once');
  return { objectiveCount: objectives.size, capabilityCount: capabilities.size, legacyProgressIdCount: legacy.size, projectedClaimCount: compatibility.projection.entries.length };
}
export function projectObjectiveSystem(system) {
  validateObjectiveSystem(system);
  const { graph, compatibility } = system;
  const objectives = indexRecords(system.objectives, 'objective'), capabilities = indexRecords(system.capabilities, 'capability'), claims = indexRecords(graph.claims, 'claim');
  const placements = new Map(system.placements.objectives.map((item) => [item.objectiveRef, item]));
  const outputs = new Map();
  for (const [path, ids] of Object.entries(compatibility.learnables)) outputs.set(path, ids.map((id) => {
    const objective = objectives.get(id), placement = placements.get(id);
    must(objective.legacyConceptIds.length === 1, `${id}: compatibility learnable needs one existing progress ID`);
    const statement = objective.descriptionSource === 'capability' ? capabilities.get(objective.capabilityRefs[0]).description?.en : objective.description.en;
    must(text(statement), `${id}: missing canonical statement`);
    return { id: objective.legacyConceptIds[0], statement, subject: placement.subject, topic: placement.topic, subtopic: placement.subtopic, gradeBands: placement.gradeBands };
  }));
  const entries = compatibility.projection.entries.map((entry) => {
    const claim = claims.get(entry.claimRef);
    return { id: entry.id, rowId: claim.id, graphClaimRef: claim.id,
      subject: entry.subject, relation: claim.predicate, object: entry.object,
      canonicalClaim: { subjectRef: claim.subjectRef, objectRef: claim.objectRef, revision: claim.revision, polarity: claim.polarity, qualifiers: claim.qualifiers, objectiveRefs: claim.objectiveRefs, reviewStatus: claim.review.status, publishable: claim.review.publishable },
      conceptIds: [...new Set(claim.objectiveRefs.flatMap((ref) => objectives.get(ref).legacyConceptIds))],
      meta: { ...entry.meta, canonicalAuthority: 'learning_graph', runtimeProjection: true } };
  });
  outputs.set(compatibility.projection.outputPath, {
    ...compatibility.projection.header,
    canonicalSource: { kind: 'learning_graph', graphRef: graph.graphId, claimFiles: graph.imports.claimFiles },
    entries, authoring: compatibility.projection.authoring
  });
  return outputs;
}
export function compileObjectiveProjection({ root = ROOT, check = true } = {}) {
  const system = loadObjectiveSystem(root), outputs = projectObjectiveSystem(system);
  for (const [path, value] of outputs) {
    must(/^content\/(?:learnables|knowledge)\/[a-z0-9-]+\.json$/.test(path), 'Unsafe compatibility output path');
    const absolute = resolve(root, path);
    if (check) {
      const actual = JSON.parse(readFileSync(absolute, 'utf8'));
      must(equal(actual, value), `${path}: generated output drift; run canonical projection compiler`);
    } else {
      const tmp = `${absolute}.${process.pid}.tmp`;
      try { writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`); renameSync(tmp, absolute); }
      finally { try { unlinkSync(tmp); } catch (error) { if (error.code !== 'ENOENT') throw error; } }
    }
  }
  return { ...validateObjectiveSystem(system), generatedFiles: outputs.size, mode: check ? 'check' : 'write' };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(compileObjectiveProjection({ check: !process.argv.includes('--write') }))); }
  catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
}
