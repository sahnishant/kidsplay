import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { evaluateEqualParts, validateEqualPartsQuestion, createEqualPartsState } from '../src/mechanics/equalParts.mjs';

// Explicit independent oracle: these counts are requirements, not calculated
// from the solution being tested. Include incomplete allocations in the search.
const expected = {
  'fractions.studio.three-friends.001': { parts: 6, counts: { dheu: 2, scientu: 2, shaitanu: 2 }, valid: 90 },
  'fractions.studio.four-friends.001': { parts: 8, counts: { dheu: 2, scientu: 2, shaitanu: 2, you: 2 }, valid: 2520 }
};
const questions = JSON.parse(readFileSync(fileURLToPath(new URL('../content/questions/studio-reuse.json', import.meta.url)), 'utf8'));
assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
assert.deepEqual(questions.map((q) => q.id).sort(), Object.keys(expected).sort());
const results = [];
for (const question of questions) {
  const spec = expected[question.id];
  assert.deepEqual(validateEqualPartsQuestion(question), []);
  assert.equal(question.interaction.partCount, spec.parts);
  assert.equal(question.evidencePolicy, 'practice_only');
  assert.equal(question.authoring.status, 'draft');
  const categories = question.interaction.categories.map(({ id }) => id);
  assert.deepEqual(categories, Object.keys(spec.counts));
  const alphabet = [null, ...categories];
  const states = alphabet.length ** spec.parts;
  let accepted = 0;
  for (let encoded = 0; encoded < states; encoded += 1) {
    let cursor = encoded;
    const assignments = Array.from({ length: spec.parts }, () => {
      const id = alphabet[cursor % alphabet.length];
      cursor = Math.floor(cursor / alphabet.length);
      return id;
    });
    const counts = Object.fromEntries(categories.map((id) => [id, assignments.filter((value) => value === id).length]));
    const correct = !assignments.includes(null) && categories.every((id) => counts[id] === spec.counts[id]);
    const result = evaluateEqualParts(question, { assignments });
    assert.equal(result.correct, correct, `${question.id}, state ${encoded}`);
    assert.equal(result.status, correct ? 'correct' : assignments.includes(null) ? 'incomplete' : 'mismatch');
    accepted += Number(result.correct);
  }
  assert.equal(accepted, spec.valid);
  for (const assignments of [[], Array(spec.parts - 1).fill(null), Array(spec.parts + 1).fill(null), Array(spec.parts), Array(spec.parts).fill('foreign')]) {
    assert.equal(evaluateEqualParts(question, { assignments }).status, 'invalid_response');
  }
  const solution = categories.flatMap((id) => Array(spec.counts[id]).fill(id));
  const saved = createEqualPartsState(question, { assignments: solution });
  saved.assignments[0] = null;
  assert.notEqual(solution[0], null);
  for (const representation of ['circle', 'bar', 'grid']) {
    const alternate = structuredClone(question);
    alternate.interaction.representation = representation;
    assert.equal(evaluateEqualParts(alternate, { assignments: [...solution].reverse() }).correct, true);
  }
  const impossible = structuredClone(question);
  impossible.interaction.partCount = 5;
  assert.ok(validateEqualPartsQuestion(impossible).some((error) => error.includes('cannot be made')));
  results.push({ questionId: question.id, states, validArrangements: accepted });
}
console.log(JSON.stringify({ productionModel: 'equal_parts@1', totalStates: results.reduce((total, row) => total + row.states, 0), results }, null, 2));
