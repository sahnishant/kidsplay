import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { compileObjectiveProjection } from '../objective-projection.mjs';

const root = process.cwd(), read = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const write = (path, value) => { mkdirSync(dirname(resolve(root, path)), { recursive: true }); writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`); };
const must = (condition, message) => { if (!condition) throw new Error(message); };
const modulePath = 'content/learning-graph/modules/bicycle-workshop.json', module = read(modulePath);
const objectiveFile = 'content/learning-graph/objectives/bicycle-workshop.json';
const capabilityFile = 'content/learning-graph/capabilities/english-class2-my-bicycle.json';
if (module.objectiveFile) {
  must(module.objectiveFile === objectiveFile, 'Unexpected prior objective migration');
  console.log('002 objective-authority: already migrated; no writes');
} else {
  must(process.argv.includes('--write') && module.schemaVersion === 2, 'Run 001 first; 002 requires --write');
  must(!existsSync(resolve(root, objectiveFile)), 'Objective destination already exists');
  const projectionPath = 'content/knowledge/bicycle-workshop-runtime-projection.json', projection = read(projectionPath);
  const learnablePaths = ['content/learnables/bicycle-workshop.json', 'content/learnables/bicycle-workshop-reading.json'];
  const learnables = learnablePaths.flatMap(read);
  must(learnables.length === 34 && new Set(learnables.map((item) => item.id)).size === 34, 'Unexpected legacy progress registry');
  const files = module.imports.claimFiles.map((path) => ({ path, data: read(path) }));
  const claims = files.flatMap((file) => file.data.claims), byId = new Map(claims.map((claim) => [claim.id, claim]));
  const bindings = new Map(claims.map((claim) => [claim.id, [...claim.conceptIds]]));
  // This is a one-time audited migration of existing bindings, not runtime inference.
  for (const row of projection.entries) {
    must(byId.has(row.graphClaimRef), `Unknown original projection claim ${row.graphClaimRef}`);
    const existing = bindings.get(row.graphClaimRef);
    must(!existing.length || JSON.stringify(existing) === JSON.stringify(row.conceptIds), `${row.graphClaimRef}: conflicting authored mappings`);
    bindings.set(row.graphClaimRef, [...row.conceptIds]);
  }
  const review = { status: 'editorial_candidate', authority: 'kidsplay_editorial_review_required', publishable: false };
  const caps = read(capabilityFile), capById = new Map(caps.capabilities.map((cap) => [cap.id, cap]));
  const objectiveId = (id) => `objective.${id}`;
  const operations = { 'bicycle.motion.chain': 'sequence', 'bicycle.braking.chain': 'sequence', 'bicycle.parts.drive': 'reason', 'bicycle.parts.optional': 'compare', 'bicycle.safety.pre-ride': 'apply' };
  const foundations = new Set(['bicycle.identity','bicycle.parts.wheel','bicycle.parts.pedal','bicycle.safety.helmet']);
  const objectives = learnables.map((item) => {
    const capability = item.id.startsWith('capability.');
    if (capability) {
      if (!capById.has(item.id)) {
        must(['capability.english.reading.sequence-retrieval','capability.english.reading.simple-inference'].includes(item.id), `Unknown capability addition ${item.id}`);
        const cap = { id: item.id, domain: 'english', kind: 'reading_comprehension', cognitiveOperation: item.id.endsWith('sequence-retrieval') ? 'sequence' : 'infer', defaultEvidence: { evaluative: 'record', guidedPractice: 'practice_only', exposure: 'none' }, review: { ...review } };
        capById.set(cap.id, cap); caps.capabilities.push(cap);
      }
      capById.get(item.id).description = { en: item.statement };
    }
    const operation = capability ? capById.get(item.id).cognitiveOperation : operations[item.id] ?? 'recognise';
    return { id: objectiveId(item.id), revision: 1,
      ...(capability ? { descriptionSource: 'capability' } : { descriptionSource: 'objective', description: { en: item.statement } }),
      cognitiveOperation: operation, defaultDepth: foundations.has(item.id) ? 'D0' : ['sequence','reason','compare','infer'].includes(operation) ? 'D2' : 'D1',
      targetClaimRefs: claims.filter((claim) => bindings.get(claim.id).includes(item.id)).map((claim) => claim.id),
      capabilityRefs: capability ? [item.id] : [], legacyConceptIds: [item.id],
      bindingReview: 'migrated_references_not_semantic_entailment_approval', review: { ...review } };
  });
  const placements = {
    schemaVersion: 2, moduleRef: module.runtimeCompanionRef,
    objectives: learnables.map(({ id, statement, ...context }) => ({ objectiveRef: objectiveId(id), ...context })),
    capabilities: caps.capabilities.map((cap) => ({ capabilityRef: cap.id, expectedStage: cap.stage ?? 'class2', contextAuthority: 'migrated_curriculum_placement_not_intrinsic_skill_level' })),
    discoveryDepth: module.depthBands,
    depthSemantics: 'Node bands are contextual discovery suggestions; objective depth owns the cognitive demand. Migrated objective depths remain editorial candidates.'
  };
  for (const cap of caps.capabilities) { cap.revision ??= 1; delete cap.stage; }
  caps.schemaVersion = 2;
  for (const claim of claims) { claim.objectiveRefs = bindings.get(claim.id).map(objectiveId); delete claim.conceptIds; }
  const { canonicalSource, entries, authoring, ...header } = projection;
  const compatibility = {
    schemaVersion: 2, generatedOnly: true,
    notes: 'Entry subject/object labels are retained presentation aliases, not canonical endpoints or additional facts. All predicates and objective/progress mappings are projected from canonical claims. Historical reviewed output status is compatibility metadata, not human graph approval.',
    learnables: Object.fromEntries(learnablePaths.map((path) => [path, read(path).map((item) => objectiveId(item.id))])),
    projection: { outputPath: projectionPath, header, authoring, entries: entries.map((row) => ({ id: row.id, claimRef: row.graphClaimRef, subject: row.subject, object: row.object, meta: { knowledgeLevel: row.meta.knowledgeLevel, skills: row.meta.skills } })) }
  };
  const ledger = { migrationId: 'learning-graph.002-objective-authority', preservedProgressIds: learnables.map((item) => item.id), addedCanonicalCapabilities: ['capability.english.reading.sequence-retrieval','capability.english.reading.simple-inference'], sourceHashes: {}, approvalGranted: false };
  for (const path of [...learnablePaths, projectionPath, capabilityFile]) ledger.sourceHashes[path] = createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');
  const changes = new Map();
  for (const { path, data } of files) changes.set(path, data);
  changes.set(capabilityFile, caps);
  changes.set(objectiveFile, { schemaVersion: 2, objectives });
  const placementFile = 'content/learning-graph/placements/bicycle-workshop.json', compatibilityFile = 'content/learning-graph/projections/bicycle-workshop.json';
  changes.set(placementFile, placements); changes.set(compatibilityFile, compatibility);
  changes.set(modulePath, { ...module, objectiveFile, capabilityFile, placementFile, compatibilityFile, objectiveRefs: objectives.map((item) => item.id) });
  const codeEdits = new Map();
  const replace = (path, before, after) => {
    let code = codeEdits.get(path) ?? readFileSync(resolve(root, path), 'utf8');
    must(code.includes(before), `${path}: migration anchor missing`);
    codeEdits.set(path, code.replace(before, after));
  };
  replace('scripts/learning-graph/canonical-graph.mjs', "    assert(Array.isArray(claim.conceptIds) && new Set(claim.conceptIds).size === claim.conceptIds.length, `${claim.id}: explicit unique concept bindings required`);\n    for (const id of claim.conceptIds) assert(graph.learnableIds.has(id), `${claim.id}: unknown concept binding ${id}`);", "    assert(!('conceptIds' in claim), `${claim.id}: authored legacy concept bindings forbidden`);\n    assert(Array.isArray(claim.objectiveRefs) && new Set(claim.objectiveRefs).size === claim.objectiveRefs.length, `${claim.id}: explicit unique objective bindings required`);\n    for (const id of claim.objectiveRefs) assert(graph.objectiveIds.has(id), `${claim.id}: unknown objective binding ${id}`);");
  replace('scripts/learning-graph/canonical-graph.mjs', "return { ...module, ontology:", "const objectiveIds = new Set(read(module.objectiveFile).objectives.map((item) => item.id));\n  return { ...module, objectiveIds, ontology:");
  replace('scripts/learning-graph/canonical-graph.mjs', 'graph.claims.flatMap((claim) => claim.conceptIds)', 'graph.claims.flatMap((claim) => claim.objectiveRefs)');
  replace('scripts/learning-graph/validate-bicycle-workshop-production.mjs', "invariant(Array.isArray(edge.conceptIds), `${edge.id}: explicit concept bindings required`);", "invariant(Array.isArray(edge.objectiveRefs), `${edge.id}: explicit objective bindings required`);");
  replace('scripts/test-canonical-graph.mjs', "(g) => g.claims[0].conceptIds = ['missing'], /unknown concept/", "(g) => g.claims[0].objectiveRefs = ['missing'], /unknown objective/");
  replace('scripts/compile-knowledge.mjs', "for (const script of [", "for (const script of [\n  'scripts/learning-graph/objective-projection.mjs',");
  // Normal builds CHECK checked-in derived files. Regeneration is an explicit authoring action.
  for (const [path, value] of changes) write(path, value);
  for (const [path, code] of codeEdits) writeFileSync(resolve(root, path), code);
  write('content/learning-graph/migrations/002-objective-authority.json', ledger);
  const result = compileObjectiveProjection({ root, check: false });
  console.log(JSON.stringify({ migration: ledger.migrationId, ...result }));
}
