import assert from 'node:assert/strict';
import { loadObjectiveSystem, projectObjectiveSystem } from './learning-graph/objective-projection.mjs';

const canonical = loadObjectiveSystem();
const claimsBefore = JSON.stringify(canonical.graph.claims);
const objectivesBefore = JSON.stringify(canonical.objectives);
const capabilitiesBefore = JSON.stringify(canonical.capabilities);
const variants = ['English', 'Science', 'EVS'];
for (const subject of variants) {
  const placed = structuredClone(canonical);
  for (const placement of placed.placements.objectives) placement.subject = subject;
  // The fixture changes context only, and does not assert a new curriculum alignment.
  for (const placement of placed.placements.capabilities) placement.expectedStage = 'synthetic-other-stage';
  const output = projectObjectiveSystem(placed);
  const learningRows = output.get('content/learnables/bicycle-workshop.json');
  assert.ok(learningRows.length > 0 && learningRows.every((row) => row.subject === subject));
  assert.equal(JSON.stringify(placed.graph.claims), claimsBefore);
  assert.equal(JSON.stringify(placed.objectives), objectivesBefore);
  assert.equal(JSON.stringify(placed.capabilities), capabilitiesBefore);
  assert.deepEqual(output.get('content/knowledge/bicycle-workshop-runtime-projection.json'), projectObjectiveSystem(canonical).get('content/knowledge/bicycle-workshop-runtime-projection.json'));
}
console.log(JSON.stringify({ contextSeparation: 'PASS', contextsTested: variants, createsCurriculumAlignment: false, canonicalTruthUnchanged: true }));
