import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateEqualPartsQuestion, evaluateEqualParts, createEqualPartsState, equalPartSector } from '../src/mechanics/equalParts.mjs';

const questions = JSON.parse(readFileSync(new URL('../content/questions/fraction-studio.json', import.meta.url), 'utf8'));
const expectedValidCounts = [6, 280, 140];
const report = [];
let totalChecked = 0;
for (const [index, question] of questions.entries()) {
  assert.deepEqual(validateEqualPartsQuestion(question), []);
  const ids = question.interaction.categories.map((category) => category.id);
  const n = question.interaction.partCount;
  const targets = Object.fromEntries(Object.entries(question.solution.fractions).map(([id, f]) => [id, n * f.numerator / f.denominator]));
  let valid = 0;
  for (let code = 0; code < (ids.length + 1) ** n; code++) {
    let v = code;
    const assignments = Array.from({length:n}, () => { const digit = v % (ids.length + 1); v = Math.floor(v / (ids.length + 1)); return digit === ids.length ? null : ids[digit]; });
    const expected = !assignments.includes(null) && ids.every((id) => assignments.filter((a) => a === id).length === targets[id]);
    const result = evaluateEqualParts(question, {assignments});
    assert.equal(result.correct, expected);
    if (expected) valid++;
    totalChecked++;
  }
  assert.equal(valid, expectedValidCounts[index]);
  const sample = ids.flatMap((id) => Array(targets[id]).fill(id));
  for (const representation of ['circle','bar','grid']) {
    const varied = structuredClone(question); varied.interaction.representation = representation;
    assert.equal(evaluateEqualParts(varied, {assignments:[...sample].reverse()}).correct, true);
  }
  for (const response of [null, {}, {assignments:[]}, {assignments:[...sample,'invalid']}, {assignments:sample.slice(1)}, {assignments:Array(n).fill('unknown')}, {assignments:Array(n)}, {assignments:Array(n).fill(1)}]) assert.equal(evaluateEqualParts(question,response).status, 'invalid_response');
  const restored = createEqualPartsState(question,{assignments:sample}); restored.assignments[0] = null;
  assert.notEqual(sample[0],null);
  assert.deepEqual(createEqualPartsState(question,{assignments:['bad']}),{assignments:Array(n).fill(null)});
  report.push({questionId:question.id,statesChecked:(ids.length+1)**n,validArrangements:valid});
}
const bad = structuredClone(questions[0]); bad.interaction.partCount = 8; bad.solution.fractions = {gold:{numerator:1,denominator:3},teal:{numerator:2,denominator:3}};
assert.ok(validateEqualPartsQuestion(bad).some((e)=>e.includes('cannot be made')));
for (const mutate of [
 q=>q.interaction.partCount=13,
 q=>q.interaction.representation='freehand',
 q=>q.interaction.categories[1].id=q.interaction.categories[0].id,
 q=>q.solution.fractions.gold.numerator=0,
 q=>q.solution.fractions.gold.denominator=0,
 q=>q.solution.fractions.gold.numerator=NaN,
 q=>q.solution.fractions.extra={numerator:1,denominator:4},
 q=>q.interaction.categories[0].id='constructor'
]) { const q = structuredClone(questions[0]); mutate(q); assert.ok(validateEqualPartsQuestion(q).length); }
for (let count=2;count<=12;count++) for (let i=0;i<count;i++) {
 const sector = equalPartSector(i,count); assert.ok(!/NaN|Infinity/.test(sector.path));
 assert.ok(sector.labelX>=0&&sector.labelX<=200&&sector.labelY>=0&&sector.labelY<=200);
}
assert.throws(()=>equalPartSector(12,12));
console.log(JSON.stringify({status:'passed',totalChecked,activities:report,additionalChecks:'malformed responses, impossible tasks, equivalent arrangements, representation invariance, clone isolation, bounds'},null,2));
