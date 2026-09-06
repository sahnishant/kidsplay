import assert from 'node:assert/strict';
import { loadCanonicalGraph, validateCanonicalGraph } from './learning-graph/canonical-graph.mjs';

const source = loadCanonicalGraph();
const result = validateCanonicalGraph(source);
assert.equal(result.nodeCount, 79);
assert.equal(result.claimCount, 64);
let mutations = 0;
function rejects(name, mutate, pattern) {
  const graph = structuredClone(source);
  mutate(graph);
  assert.throws(() => validateCanonicalGraph(graph), pattern, name);
  mutations += 1;
}
rejects('duplicate node', (g) => g.nodes.push(g.nodes[0]), /duplicate id/);
rejects('duplicate claim', (g) => g.claims.push(g.claims[0]), /duplicate id/);
rejects('legacy node label', (g) => g.nodes[0].label = 'legacy', /legacy label/);
rejects('blank localized label', (g) => g.nodes[0].labels = { en: '' }, /localized labels/);
rejects('legacy edge dialect', (g) => g.claims[0].from = g.claims[0].subjectRef, /legacy from/);
rejects('missing endpoint', (g) => g.claims[0].objectRef = 'missing', /unresolved endpoint/);
rejects('wrong endpoint type', (g) => g.claims[0].objectRef = g.claims[0].subjectRef, /type mismatch/);
rejects('missing provenance', (g) => g.claims[0].provenance = [], /per-claim provenance/);
rejects('unknown source', (g) => g.claims[0].provenance[0].sourceRef = 'missing', /unresolved provenance/);
rejects('missing editorial state', (g) => delete g.claims[0].review, /review status/);
rejects('candidate cannot publish', (g) => g.claims[0].review.publishable = true, /human approval/);
rejects('approval label is not proof', (g) => g.claims[0].review = { status: 'human_approved', publishable: true }, /human approval/);
rejects('missing revision', (g) => delete g.claims[0].revision, /revision required/);
rejects('unknown objective compatibility ID', (g) => g.claims[0].conceptIds = ['missing'], /unknown concept/);
rejects('invalid qualifier', (g) => g.claims[0].qualifiers = { arbitrary: 'yes' }, /forbidden qualifier/);
rejects('shared claim cannot be contextual', (g) => g.claims[0].scope.moduleRef = 'chapter.fake', /shared authority/);
rejects('invalid process reference', (g) => g.processes[0].orderedEdgeRefs[0] = 'missing', /unknown claim/);
rejects('duplicate discovery placement', (g) => g.depthBands.D0.push(g.depthBands.D0[0]), /Duplicate discovery/);
console.log(JSON.stringify({ canonicalGraph: 'PASS', preservedNodes: result.nodeCount, preservedClaims: result.claimCount, rejectedMutations: mutations, orphanNodeRefs: result.orphanNodeRefs }));
