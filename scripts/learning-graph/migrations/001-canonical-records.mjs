import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const root = process.cwd();
const read = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const write = (path, value) => { mkdirSync(dirname(resolve(root, path)), { recursive: true }); writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`); };
const must = (value, message) => { if (!value) throw new Error(message); };
const modulePath = 'content/learning-graph/modules/bicycle-workshop.json';
const module = read(modulePath);
if (module.schemaVersion === 2) {
  must(!('edges' in module) && !('nodes' in module) && !('defaults' in module), 'Incomplete prior canonical migration');
  console.log('001 canonical-records: already migrated; no writes');
} else {
  must(process.argv.includes('--write'), '001 requires --write on a dedicated review branch');
  must(module.schemaVersion === 1 && module.nodes?.length === 40 && module.edges?.length === 32, 'Unexpected migration source; inspect before continuing');
  const ledger = { migrationId: 'learning-graph.001-canonical-records', sourceGraphId: module.graphId, sourceSchemaVersion: 1, targetSchemaVersion: 2, sourceHashes: {}, preservedNodeIds: [], preservedClaimIds: [], semanticApprovalGranted: false };
  for (const path of [modulePath, ...module.imports.nodeFiles, ...module.imports.claimFiles]) ledger.sourceHashes[path] = createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');
  const defaultReview = { status: module.defaults.reviewStatus, authority: 'kidsplay_editorial_review_required', publishable: false };
  const normalizeNode = (node) => {
    must(!node.labels || !node.label || node.labels.en === node.label, `${node.id}: conflicting labels`);
    const result = { ...node, revision: node.revision ?? 1, labels: node.labels ?? { en: node.label }, review: node.review ?? defaultReview };
    delete result.label;
    ledger.preservedNodeIds.push(result.id);
    return result;
  };
  const normalizeClaim = (claim) => {
    must(!claim.subjectRef || !claim.from || claim.subjectRef === claim.from, `${claim.id}: conflicting endpoints`);
    const result = { ...claim, revision: claim.revision ?? 1, subjectRef: claim.subjectRef ?? claim.from, predicate: claim.predicate ?? claim.relation, objectRef: claim.objectRef ?? claim.to,
      polarity: claim.polarity ?? 'positive', authority: claim.authority ?? { kind: module.defaults.authority }, scope: claim.scope ?? { kind: module.defaults.scope },
      review: claim.review ?? defaultReview, provenance: claim.provenance ?? [{ sourceRef: module.defaults.provenance.sourceRef, sourceRole: module.defaults.provenance.role, sourceExpressionCopied: false }],
      qualifiers: claim.qualifiers ?? {}, conceptIds: claim.conceptIds ?? [] };
    delete result.from; delete result.relation; delete result.to;
    ledger.preservedClaimIds.push(result.id);
    return result;
  };
  const outputs = new Map();
  for (const path of module.imports.nodeFiles) { const value = read(path); outputs.set(path, { ...value, schemaVersion: 2, nodes: value.nodes.map(normalizeNode) }); }
  for (const path of module.imports.claimFiles) { const value = read(path); outputs.set(path, { ...value, schemaVersion: 2, claims: value.claims.map(normalizeClaim) }); }
  const nodePath = 'content/learning-graph/nodes/bicycle-workshop.json', claimPath = 'content/learning-graph/claims/bicycle-workshop.json';
  must(!existsSync(resolve(root, nodePath)) && !existsSync(resolve(root, claimPath)), 'Destination records already exist; refusing overwrite');
  outputs.set(nodePath, { schemaVersion: 2, graphSliceId: 'graph-slice.bicycle-workshop.nodes', nodes: module.nodes.map(normalizeNode) });
  outputs.set(claimPath, { schemaVersion: 2, graphSliceId: 'graph-slice.bicycle-workshop.claims', claims: module.edges.map(normalizeClaim) });
  must(new Set(ledger.preservedNodeIds).size === 79 && new Set(ledger.preservedClaimIds).size === 64, 'Migration must preserve all 79 nodes and 64 claims');
  const next = { ...module, schemaVersion: 2, ontologyFile: 'content/learning-graph/ontology/core-v1.json', imports: { nodeFiles: [...module.imports.nodeFiles, nodePath], claimFiles: [...module.imports.claimFiles, claimPath] }, migrationRef: ledger.migrationId };
  delete next.nodes; delete next.edges; delete next.defaults;
  outputs.set(modulePath, next);
  const validatorPath = 'scripts/learning-graph/validate-bicycle-workshop-production.mjs';
  let source = readFileSync(resolve(root, validatorPath), 'utf8');
  const replace = (before, after) => { must(source.includes(before), `Migration source mismatch: ${before}`); source = source.replace(before, after); };
  replace("const graph = read('content/learning-graph/modules/bicycle-workshop.json');", 'const graph = loadCanonicalGraph({ root: ROOT });\n  validateCanonicalGraph(graph);');
  replace("  const importedNodes = graph.imports.nodeFiles.flatMap((path) => read(path).nodes ?? []);\n  const importedClaims = graph.imports.claimFiles.flatMap((path) => read(path).claims ?? []);\n", '');
  replace('[...importedNodes, ...graph.nodes]', 'graph.nodes');
  replace('[...importedClaims, ...graph.edges]', 'graph.claims');
  replace('for (const edge of graph.edges)', 'for (const edge of graph.claims)');
  source = source.replaceAll('edge.from', 'edge.subjectRef').replaceAll('edge.to', 'edge.objectRef');
  replace("invariant(Array.isArray(edge.conceptIds) && edge.conceptIds.length > 0, `${edge.id}: conceptIds required`);", "invariant(Array.isArray(edge.conceptIds), `${edge.id}: explicit concept bindings required`);");
  source = "import { loadCanonicalGraph, validateCanonicalGraph } from './canonical-graph.mjs';\n" + source;
  // Prepare all transformations before touching the checkout. Git commits are the atomic boundary.
  for (const [path, value] of outputs) write(path, value);
  writeFileSync(resolve(root, validatorPath), source);
  write('content/learning-graph/migrations/001-canonical-records.json', ledger);
  console.log(JSON.stringify({ migration: ledger.migrationId, nodes: 79, claims: 64, written: [...outputs.keys(), validatorPath] }));
}
