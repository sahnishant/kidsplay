import { describe, expect, it } from 'vitest';
import { formatProcess } from '../scripts/formatters/process.mjs';
import { evaluate } from '../src/evaluation/evaluate';
import type { SequenceOrderQuestion } from '../src/contracts/question';

const source = {
  sourceRef: 'knowledge.test.process', datatype: 'process@1', language: 'en',
  authoring: { status: 'draft' },
  units: [{ localId: 'growth', prompt: 'growth', conceptIds: ['test.growth'],
    stages: [{ id: 'young', label: 'Young' }, { id: 'adult', label: 'Adult' }] }]
};
const recipe = { id: 'test.process.studio', engine: 'sequence_order@1', revision: 3 };

describe('process teaching evidence boundary', () => {
  it('compiles practice-only at source, not only after the studio wrapper', () => {
    const before = structuredClone(source);
    const question = formatProcess(source, { ...recipe, evidencePolicy: 'practice_only' }).questions[0] as SequenceOrderQuestion;
    const result = evaluate(question, { orderedItemIds: question.solution.orderedItemIds });
    expect(question.evidencePolicy).toBe('practice_only');
    expect(question.authoring.status).toBe('draft');
    expect(question.revision).toBe(3);
    expect(result.correct).toBe(true);
    expect(result.masteryEvidence).toEqual([]);
    expect(result.knowledgeEvidence).toEqual([]);
    expect(source).toEqual(before);
  });
  it('preserves existing process recipes with no policy', () => {
    expect(formatProcess(source, recipe).questions[0]).not.toHaveProperty('evidencePolicy');
  });
  it('does not inherit adaptation approval from a reviewed source', () => {
    const reviewed = {...source,authoring:{status:'reviewed'}};
    expect(formatProcess(reviewed,{...recipe,evidencePolicy:'practice_only'}).questions[0].authoring.status).toBe('draft');
    expect(formatProcess(reviewed,recipe).questions[0].authoring.status).toBe('reviewed');
  });
  it.each(['independent', 'mastered', false, null, {}])('rejects an unsupported policy %j', (policy) => {
    expect(() => formatProcess(source, { ...recipe, evidencePolicy: policy })).toThrow(/evidence policy/);
  });
});
