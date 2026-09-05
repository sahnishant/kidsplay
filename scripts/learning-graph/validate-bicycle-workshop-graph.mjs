import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const read = (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const invariant = (condition, message) => { if (!condition) throw new Error(message); };
const byId = (records, label) => {
  const result = new Map();
  for (const record of records) {
    invariant(typeof record?.id === 'string' && record.id, `${label} requires id`);
    invariant(!result.has(record.id), `Duplicate ${label} ${record.id}`);
    result.set(record.id, record);
  }
  return result;
};
const learnableIds = () => new Set(
  readdirSync(resolve(ROOT, 'content/learnables'))
    .filter((name) => name.endsWith('.json'))
    .sort()
    .flatMap((name) => read(`content/learnables/${name}`))
    .map((item) => item.id)
);

export function validateBicycleWorkshopGraph() {
  const ontology = read('content/learning-graph/ontology/core-v1.json');
  const graph = read('content/learning-graph/modules/bicycle-workshop.json');
  const importedNodes = graph.imports.nodeFiles.flatMap((path) => read(path).nodes ?? []);
  const importedClaims = graph.imports.claimFiles.flatMap((path) => read(path).claims ?? []);
  const nodes = [...importedNodes, ...graph.nodes];
  const claims = [
    ...importedClaims.map((claim) => ({
      id: claim.id,
      from: claim.subjectRef,
      relation: claim.predicate,
      to: claim.objectRef,
      qualifiers: claim.qualifiers ?? {},
      conceptIds: claim.conceptIds ?? [],
      authority: claim.authority,
      scope: claim.scope
    })),
    ...graph.edges.map((edge) => ({
      ...edge,
      qualifiers: edge.qualifiers ?? {},
      authority: { kind: graph.defaults.authority },
      scope: { kind: graph.defaults.scope }
    }))
  ];

  const nodeMap = byId(nodes, 'Learning Graph node');
  const claimMap = byId(claims, 'Learning Graph claim');
  const predicates = byId(ontology.predicateDefinitions, 'ontology predicate');
  const qualifiers = byId(ontology.qualifierDefinitions, 'ontology qualifier');
  const concepts = learnableIds();

  invariant(ontology.openWorldAssumption === true, 'Graph must retain open-world semantics');
  invariant(graph.defaults.scope === 'shared', 'Runtime graph additions must default to shared scope');
  invariant(graph.defaults.authority === 'canonical', 'Runtime graph additions must default to canonical authority');
  invariant(graph.defaults.publishable === false, 'Graph additions must not bypass human publication review');

  for (const node of nodes) {
    invariant(ontology.nodeTypes.includes(node.type), `${node.id}: unsupported node type ${node.type}`);
    if (node.scope === 'shared') invariant(node.review?.publishable === false, `${node.id}: unapproved shared node marked publishable`);
  }

  for (const claim of claims) {
    const subject = nodeMap.get(claim.from);
    const object = nodeMap.get(claim.to);
    const predicate = predicates.get(claim.relation);
    invariant(subject, `${claim.id}: unknown subject ${claim.from}`);
    invariant(object, `${claim.id}: unknown object ${claim.to}`);
    invariant(predicate, `${claim.id}: unknown relation ${claim.relation}`);
    invariant(predicate.subjectTypes.includes(subject.type), `${claim.id}: ${subject.type} cannot be ${claim.relation} subject`);
    invariant(predicate.objectTypes.includes(object.type), `${claim.id}: ${object.type} cannot be ${claim.relation} object`);

    for (const [key, value] of Object.entries(claim.qualifiers ?? {})) {
      invariant(predicate.qualifiersAllowed.includes(key), `${claim.id}: ${key} is not allowed for ${claim.relation}`);
      const definition = qualifiers.get(key);
      invariant(definition, `${claim.id}: unknown qualifier ${key}`);
      if (definition.valueType === 'node_ref') invariant(nodeMap.has(value), `${claim.id}: qualifier ${key} has unknown node ${value}`);
      if (definition.valueType === 'enum') invariant(definition.values.includes(value), `${claim.id}: qualifier ${key} has invalid value ${value}`);
    }

    for (const conceptId of claim.conceptIds ?? []) {
      invariant(concepts.has(conceptId), `${claim.id}: unknown learnable concept ${conceptId}`);
    }
    invariant(claim.authority?.kind === 'canonical' || claim.authority?.kind === 'chapter_contextual', `${claim.id}: unsupported authority ${claim.authority?.kind}`);
    if (claim.authority?.kind === 'chapter_contextual') {
      invariant(typeof claim.scope?.moduleRef === 'string', `${claim.id}: chapter-contextual claim requires module scope`);
    }
  }

  const depthRefs = Object.values(graph.depthBands ?? {}).flat();
  for (const ref of depthRefs) invariant(nodeMap.has(ref), `Depth band refers to unknown node ${ref}`);
  invariant(new Set(depthRefs).size === depthRefs.length, 'A node appears in more than one depth band');

  for (const process of graph.processes ?? []) {
    const refs = [...(process.orderedEdgeRefs ?? []), ...(process.parallelEdgeRefs ?? [])];
    invariant(refs.length >= 2, `${process.id}: process requires at least two claims`);
    for (const ref of refs) invariant(claimMap.has(ref), `${process.id}: unknown claim ${ref}`);
  }

  for (const misconception of graph.misconceptions ?? []) {
    invariant(typeof misconception.incorrect === 'string' && misconception.incorrect, `${misconception.id}: misconception wording required`);
    invariant((misconception.repairWith ?? []).length > 0, `${misconception.id}: repair claims required`);
    for (const ref of misconception.repairWith) invariant(claimMap.has(ref), `${misconception.id}: unknown repair claim ${ref}`);
  }

  return {
    graphId: graph.graphId,
    nodeCount: nodeMap.size,
    claimCount: claimMap.size,
    registeredConceptCount: new Set(claims.flatMap((claim) => claim.conceptIds ?? [])).size,
    depthBandCount: Object.keys(graph.depthBands ?? {}).length,
    processCount: graph.processes?.length ?? 0,
    misconceptionCount: graph.misconceptions?.length ?? 0,
    openWorldAssumption: ontology.openWorldAssumption
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const result = validateBicycleWorkshopGraph();
    console.log(process.argv.includes('--json') ? JSON.stringify(result) : `Validated ${result.graphId}: ${result.nodeCount} nodes and ${result.claimCount} typed claims.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
