import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadObjectiveSystem, validateObjectiveSystem, projectObjectiveSystem, compileObjectiveProjection } from './learning-graph/objective-projection.mjs';

const system = loadObjectiveSystem();
const report = compileObjectiveProjection();
assert.equal(report.objectiveCount, 34);
assert.equal(report.capabilityCount, 11);
assert.equal(report.legacyProgressIdCount, 34);
assert.equal(report.projectedClaimCount, 29);
const expected = JSON.parse(readFileSync('content/learning-graph/migrations/002-objective-authority.json', 'utf8')).preservedProgressIds;
assert.deepEqual(system.objectives.flatMap((item) => item.legacyConceptIds), expected);
let mutations = 0;
function rejects(name, mutate, pattern) {
  const changed = structuredClone(system); mutate(changed);
  assert.throws(() => projectObjectiveSystem(changed), pattern, name); mutations += 1;
}
rejects('projection cannot add progress semantics', (s) => s.compatibility.projection.entries[0].conceptIds = ['invented'], /may not author/);
rejects('projection cannot override a predicate', (s) => s.compatibility.projection.entries[0].relation = 'invented', /may not author/);
rejects('legacy mapping cannot remain authored on claims', (s) => s.graph.claims[0].conceptIds = [], /authored legacy/);
rejects('capability grade belongs to placement', (s) => s.capabilities[0].stage = 'class2', /grade-neutral/);
rejects('objective subject belongs to placement', (s) => s.objectives[0].subject = 'English', /belongs to placement/);
rejects('old progress ID has one owner', (s) => s.objectives[1].legacyConceptIds = s.objectives[0].legacyConceptIds, /duplicate legacy/);
rejects('claim target must be reciprocal', (s) => s.objectives[0].targetClaimRefs.push('missing'), /not reciprocal/);
rejects('canonical capability must exist', (s) => s.objectives.at(-1).capabilityRefs = ['missing'], /unknown capability/);
rejects('candidate does not become approved by compile', (s) => s.objectives[0].review.publishable = true, /unproved approval/);
rejects('empty reference bundle cannot count as objective', (s) => { s.objectives[0].targetClaimRefs = []; s.objectives[0].capabilityRefs = []; }, /unbound/);
rejects('one capability description authority', (s) => s.objectives.at(-1).description = { en: 'duplicate' }, /description authority/);
rejects('unsafe output path', (s) => { s.compatibility.learnables['../escape.json'] = []; }, /Unsafe generated/);
rejects('missing placement', (s) => s.placements.objectives.pop(), /contextual placement/);
rejects('invented compatibility metadata', (s) => s.compatibility.projection.entries[0].meta.objectiveRefs = [], /cannot author truth/);
const changed = structuredClone(system), obj = changed.objectives.find((item) => item.legacyConceptIds[0] === 'bicycle.parts.pedal');
obj.description.en += ' Canonical update.';
const changedOutput = projectObjectiveSystem(changed).get('content/learnables/bicycle-workshop.json');
assert.equal(changedOutput.find((item) => item.id === 'bicycle.parts.pedal').statement, obj.description.en);
assert.deepEqual([...projectObjectiveSystem(system)], [...projectObjectiveSystem(system)]);
console.log(JSON.stringify({ objectiveAuthority: 'PASS', ...validateObjectiveSystem(system), rejectedMutations: mutations, progressIdsPreserved: true }));
