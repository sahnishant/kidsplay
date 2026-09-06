import { describe, expect, it } from 'vitest';
import authored from '../content/questions/fraction-studio.json';
import type { EqualPartsQuestion } from '../src/contracts/question';
import { evaluate } from '../src/evaluation/evaluate';
import { evaluateEqualParts, equalPartsTargetCounts, validateEqualPartsQuestion, createEqualPartsState } from '../src/mechanics/equalParts.mjs';

const questions = authored as EqualPartsQuestion[];
const responseFor = (question: EqualPartsQuestion) => ({ assignments: Object.entries(equalPartsTargetCounts(question)).flatMap(([id, count]) => Array(count).fill(id) as string[]).reverse() });

describe('shared equal-parts engine boundary', () => {
  it.each(questions)('accepts equivalent arrangements for $id through the canonical evaluator', (question) => {
    expect(validateEqualPartsQuestion(question)).toEqual([]);
    const response = responseFor(question);
    expect(evaluateEqualParts(question, response).correct).toBe(true);
    expect(evaluate(question, response)).toMatchObject({correct:true,score:1,masteryEvidence:[],knowledgeEvidence:[]});
  });
  it('keeps evidence policy separate from mathematics', () => {
    const question = structuredClone(questions[0]);
    delete question.evidencePolicy;
    expect(evaluate(question, responseFor(question)).masteryEvidence).toHaveLength(1);
    question.evidencePolicy = 'practice_only';
    expect(evaluate(question, responseFor(question)).masteryEvidence).toEqual([]);
  });
  it('rejects thirds on eight indivisible regions and non-conserving goals', () => {
    const question = structuredClone(questions[0]);
    question.interaction.partCount = 8;
    question.solution.fractions = {gold:{numerator:1,denominator:3},teal:{numerator:2,denominator:3}};
    expect(validateEqualPartsQuestion(question).join(' ')).toContain('cannot be made');
    question.solution.fractions = {gold:{numerator:1,denominator:2},teal:{numerator:1,denominator:4}};
    expect(validateEqualPartsQuestion(question).join(' ')).toContain('exactly one whole');
  });
  it('restores valid partial work by value and rejects foreign response cells', () => {
    const question = questions[0];
    const saved = {assignments:['gold',null,'teal',null]};
    const restored = createEqualPartsState(question,saved);
    restored.assignments[0] = null;
    expect(saved.assignments[0]).toBe('gold');
    expect(evaluateEqualParts(question,saved).status).toBe('incomplete');
    expect(evaluateEqualParts(question,{assignments:['gold','gold','teal','unknown']}).status).toBe('invalid_response');
    expect(evaluateEqualParts(question,{assignments:new Array(4)}).status).toBe('invalid_response');
  });
});
