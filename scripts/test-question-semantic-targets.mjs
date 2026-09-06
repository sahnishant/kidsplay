import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadObjectiveSystem } from './learning-graph/objective-projection.mjs';
import { validateCanonicalGraph } from './learning-graph/canonical-graph.mjs';
import { validateBicycleSemanticTargets, validateQuestionSemanticTarget } from './learning-graph/question-semantic-targets.mjs';

const system = loadObjectiveSystem(), graph = system.graph;
const questions = JSON.parse(readFileSync('content/curriculum-runtime/bicycle-workshop/questions/core.json', 'utf8'));
const question = (suffix) => structuredClone(questions.find((item) => item.id === `bicycle.workshop.${suffix}.001`));
assert.deepEqual(validateBicycleSemanticTargets(), { semanticTargetCount: 8, naturalLanguageEntailmentCertified: false, unapprovedTargetsPracticeOnly: true });
let mutations = 0;
function rejects(suffix, mutate, pattern) { const q = question(suffix); mutate(q); assert.throws(() => validateQuestionSemanticTarget(q, system), pattern); mutations++; }
rejects('part.pedal', (q) => { q.semanticTarget.claimRef = 'claim.bicycle.typically-has-part.pedal'; }, /predicate/);
rejects('part.wheel', (q) => { q.semanticTarget.claimRef = 'claim.bicycle.typically-has-part.wheel'; }, /predicate/);
rejects('part.pedal', (q) => q.solution.correctOptionIds = ['bell'], /answer does not match/);
rejects('part.pedal', (q) => q.knowledgeRefs = ['claim.bicycle.typically-has-part.pedal'], /omits its actual/);
rejects('part.pedal', (q) => q.semanticTarget.claimRevision = 100, /stale claim/);
rejects('part.pedal', (q) => q.prompt.text = 'Which part rings?', /prompt drift/);
rejects('part.pedal', (q) => q.feedback.correct = 'This invented fact is unsupported.', /feedback drift/);
rejects('part.pedal', (q) => delete q.semanticTarget.optionNodeRefs.bell, /incomplete option/);
rejects('part.pedal', (q) => delete q.evidencePolicy, /cannot refresh mastery/);
rejects('safety.helmet', (q) => delete q.semanticTarget.query.qualifiers.conditionRef, /condition loss/);
rejects('safety.helmet', (q) => q.semanticTarget.review.publishable = true, /cannot claim editorial/);
rejects('part.pedal', (q) => q.semanticTarget.objectiveRef = 'objective.bicycle.parts.bell', /outside the objective/);
function graphRejects(mutate, pattern) { const g = structuredClone(graph); mutate(g); assert.throws(() => validateCanonicalGraph(g), pattern); mutations++; }
graphRejects((g) => delete g.nodes.find((n) => n.id === 'concept.word-sense.action').allowOrphan, /unexplained orphan/);
graphRejects((g) => delete g.claims.find((c) => c.predicate === 'helps_protect').qualifiers.conditionRef, /required qualifier/);
graphRejects((g) => { const original = g.claims.find((c) => c.predicate === 'subclass_of'); g.claims.push({ ...structuredClone(original), id: 'test.cycle', subjectRef: original.objectRef, objectRef: original.subjectRef }); }, /forbidden cycle/);
graphRejects((g) => { const original = g.claims.find((c) => c.id === 'claim.bicycle.rim.part-of.wheel'); g.claims.push({ ...structuredClone(original), id: 'test.part-cycle', subjectRef: original.objectRef, objectRef: original.subjectRef }); }, /forbidden cycle/);
const migration = JSON.parse(readFileSync('content/learning-graph/migrations/003-semantic-traceability.json', 'utf8'));
for (const id of migration.preservedNodeIds) assert.ok(graph.nodes.some((node) => node.id === id));
for (const id of migration.preservedClaimIds) assert.ok(graph.claims.some((claim) => claim.id === id));
assert.equal(graph.claims.filter((c) => c.predicate === 'drives').length, 3);
assert.ok(graph.claims.some((c) => c.predicate === 'contextual_instance_of'));
assert.ok(graph.claims.some((c) => c.predicate === 'instance_of'));
assert.ok(!graph.claims.some((c) => c.predicate === 'is_a'));
console.log(JSON.stringify({ semanticTraceability: 'PASS', semanticTargets: 8, rejectedMutations: mutations, preservedOriginalNodes: migration.preservedNodeIds.length, preservedOriginalClaims: migration.preservedClaimIds.length, humanApproval: false }));
