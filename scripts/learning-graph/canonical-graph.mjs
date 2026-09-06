import { readFileSync, readdirSync, realpathSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';

export const BICYCLE_GRAPH_PATH = 'content/learning-graph/modules/bicycle-workshop.json';
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
export function indexRecords(records, name) {
  assert(Array.isArray(records), `${name}: expected an array`);
  const map = new Map();
  for (const item of records) {
    assert(record(item) && text(item.id), `${name}: missing id`);
    assert(!map.has(item.id), `${name}: duplicate id ${item.id}`);
    map.set(item.id, item);
  }
  return map;
}

export function loadCanonicalGraph({ root = process.cwd(), modulePath = BICYCLE_GRAPH_PATH } = {}) {
  const base = realpathSync(root);
  const read = (path) => {
    assert(text(path) && !isAbsolute(path), 'Graph imports must be repository-relative');
    const filename = realpathSync(resolve(base, path));
    const rel = relative(base, filename);
    assert(rel !== '..' && !rel.startsWith('../') && !rel.startsWith('..\\') && !isAbsolute(rel), 'Graph import escapes repository');
    return JSON.parse(readFileSync(filename, 'utf8'));
  };
  const module = read(modulePath);
  assert(module.schemaVersion === 2, `${module.graphId}: migrate the graph module to schemaVersion 2`);
  for (const key of ['nodes', 'edges', 'claims', 'defaults']) assert(!(key in module), `${module.graphId}: module cannot author ${key}`);
  const paths = [...(module.imports?.nodeFiles ?? []), ...(module.imports?.claimFiles ?? [])];
  assert(paths.length > 0 && new Set(paths).size === paths.length, 'Graph import paths must be nonempty and unique');
  const collect = (files, field) => (files ?? []).flatMap((path) => {
    const value = read(path);
    assert(value.schemaVersion === 2 && Array.isArray(value[field]), `${path}: expected canonical v2 ${field}`);
    return value[field];
  });
  const sourceIds = new Set(readdirSync(resolve(base, 'content/source-manifests')).filter((name) => name.endsWith('.json')).map((name) => read(`content/source-manifests/${name}`).sourceId));
  const learnableIds = new Set(readdirSync(resolve(base, 'content/learnables')).filter((name) => name.endsWith('.json')).flatMap((name) => read(`content/learnables/${name}`)).map((item) => item.id));
  const objectiveIds = new Set(read(module.objectiveFile).objectives.map((item) => item.id));
  return { ...module, objectiveIds, ontology: read(module.ontologyFile), sourceIds, learnableIds,
    nodes: collect(module.imports.nodeFiles, 'nodes'), claims: collect(module.imports.claimFiles, 'claims') };
}

export function validateCanonicalGraph(graph) {
  const { ontology } = graph;
  assert(ontology.openWorldAssumption === true, 'Graph must retain open-world semantics');
  const nodes = indexRecords(graph.nodes, 'node');
  const claims = indexRecords(graph.claims, 'claim');
  const predicates = indexRecords(ontology.predicateDefinitions, 'predicate');
  const qualifiers = indexRecords(ontology.qualifierDefinitions, 'qualifier');
  const review = (item) => {
    assert(Number.isInteger(item.revision) && item.revision > 0, `${item.id}: positive revision required`);
    assert(ontology.reviewStatuses.includes(item.review?.status), `${item.id}: explicit review status required`);
    assert(typeof item.review.publishable === 'boolean', `${item.id}: explicit publication flag required`);
    assert(!item.review.publishable || (item.review.status === 'human_approved' && text(item.review.humanReviewRef)), `${item.id}: publication needs evidenced human approval`);
  };
  for (const node of nodes.values()) {
    assert(ontology.nodeTypes.includes(node.type), `${node.id}: unsupported node type`);
    assert(!('label' in node), `${node.id}: legacy label dialect is forbidden`);
    assert(record(node.labels) && Object.keys(node.labels).length > 0 && Object.values(node.labels).every(text), `${node.id}: localized labels required`);
    review(node);
  }
  const used = new Set();
  for (const claim of claims.values()) {
    for (const field of ['from', 'relation', 'to']) assert(!(field in claim), `${claim.id}: legacy ${field} dialect is forbidden`);
    const subject = nodes.get(claim.subjectRef), object = nodes.get(claim.objectRef), predicate = predicates.get(claim.predicate);
    assert(subject && object, `${claim.id}: unresolved endpoint`);
    assert(predicate, `${claim.id}: unknown predicate ${claim.predicate}`);
    assert(predicate.subjectTypes.includes(subject.type) && predicate.objectTypes.includes(object.type), `${claim.id}: endpoint type mismatch`);
    assert(['positive', 'negative'].includes(claim.polarity), `${claim.id}: explicit polarity required`);
    assert(ontology.authorityKinds.includes(claim.authority?.kind), `${claim.id}: explicit knowledge authority required`);
    assert(record(claim.scope), `${claim.id}: explicit scope required`);
    if (claim.authority.kind === 'canonical') {
      assert(claim.scope.kind === 'shared' && !claim.scope.moduleRef, `${claim.id}: shared authority cannot be contextual`);
      assert(!subject.type.startsWith('chapter_') && !object.type.startsWith('chapter_'), `${claim.id}: chapter facts cannot become shared truth`);
    }
    if (claim.authority.kind === 'chapter_contextual') assert(text(claim.scope.moduleRef), `${claim.id}: contextual scope needs moduleRef`);
    review(claim);
    assert(Array.isArray(claim.provenance) && claim.provenance.length > 0, `${claim.id}: per-claim provenance required`);
    for (const source of claim.provenance) assert(graph.sourceIds.has(source.sourceRef) && text(source.sourceRole), `${claim.id}: unresolved provenance`);
    assert(record(claim.qualifiers), `${claim.id}: explicit qualifiers required`);
    for (const [key, value] of Object.entries(claim.qualifiers)) {
      const definition = qualifiers.get(key);
      assert(definition && predicate.qualifiersAllowed.includes(key), `${claim.id}: forbidden qualifier ${key}`);
      if (definition.valueType === 'node_ref') { assert(nodes.has(value), `${claim.id}: unresolved qualifier ${key}`); used.add(value); }
      if (definition.valueType === 'enum') assert(definition.values.includes(value), `${claim.id}: invalid qualifier ${key}`);
    }
    assert(!('conceptIds' in claim), `${claim.id}: authored legacy concept bindings forbidden`);
    assert(Array.isArray(claim.objectiveRefs) && new Set(claim.objectiveRefs).size === claim.objectiveRefs.length, `${claim.id}: explicit unique objective bindings required`);
    for (const id of claim.objectiveRefs) assert(graph.objectiveIds.has(id), `${claim.id}: unknown objective binding ${id}`);
    used.add(claim.subjectRef); used.add(claim.objectRef);
  }
  // Only predicates explicitly declaring acyclic structure prohibit cycles.
  for (const predicate of predicates.values()) if (predicate.acyclic === true) {
    const adjacency = new Map();
    for (const claim of claims.values()) if (claim.predicate === predicate.id && claim.polarity === 'positive') {
      adjacency.set(claim.subjectRef, [...(adjacency.get(claim.subjectRef) ?? []), claim.objectRef]);
    }
    const active = new Set(), done = new Set();
    function visit(id) {
      assert(!active.has(id), `${predicate.id}: forbidden cycle at ${id}`);
      if (done.has(id)) return;
      active.add(id);
      for (const next of adjacency.get(id) ?? []) visit(next);
      active.delete(id); done.add(id);
    }
    for (const id of adjacency.keys()) visit(id);
  }
  for (const process of graph.processes ?? []) {
    const refs = [...(process.orderedEdgeRefs ?? []), ...(process.parallelEdgeRefs ?? [])];
    assert(refs.length >= 2 && new Set(refs).size === refs.length, `${process.id}: process needs unique claim references`);
    for (const id of refs) assert(claims.has(id), `${process.id}: unknown claim ${id}`);
  }
  for (const misconception of graph.misconceptions ?? []) {
    assert(text(misconception.incorrect) && misconception.repairWith?.length > 0, `${misconception.id}: wording and repair claims required`);
    for (const id of misconception.repairWith) assert(claims.has(id), `${misconception.id}: unknown repair claim ${id}`);
  }
  const depthRefs = Object.values(graph.depthBands ?? {}).flat();
  assert(new Set(depthRefs).size === depthRefs.length, 'Duplicate discovery-depth placement');
  for (const id of depthRefs) assert(nodes.has(id), `Unknown discovery node ${id}`);
  return { graphId: graph.graphId, nodeCount: nodes.size, claimCount: claims.size,
    registeredConceptCount: new Set(graph.claims.flatMap((claim) => claim.objectiveRefs)).size,
    depthBandCount: Object.keys(graph.depthBands ?? {}).length, processCount: graph.processes?.length ?? 0,
    misconceptionCount: graph.misconceptions?.length ?? 0, openWorldAssumption: true,
    orphanNodeRefs: [...nodes.keys()].filter((id) => !used.has(id)).sort() };
}
