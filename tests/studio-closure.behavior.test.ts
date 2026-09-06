import { describe, expect, it } from 'vitest';
import { evaluate } from '../src/evaluation/evaluate';
import { loadLearningStudioQuestion, createStudioWorkspace, restoreStudioWorkspace } from '../src/experience/learningStudios';
import { getEngineComponent } from '../src/runtime/engineRegistry';

function permutations<T>(values: T[]): T[][] {
  if (values.length < 2) return [values.slice()];
  return values.flatMap((value, index) => permutations([...values.slice(0,index),...values.slice(index+1)]).map((rest) => [value,...rest]));
}

describe('STUDIO-08 count collections and STUDIO-09 dependency ordering', () => {
  it('grades collection cardinality rather than arbitrary object identities', async () => {
    const question = await loadLearningStudioQuestion('studio.collections.equal-share');
    expect(question.interaction.type).toBe('collection_count');
    if (question.interaction.type !== 'collection_count') throw new Error('Expected collection_count');
    const ids = question.interaction.items.map((item) => item.id);
    const first = { assignments: Object.fromEntries(ids.map((id,index) => [id, ['dheu','scientu','shaitanu'][index % 3]])) };
    const second = { assignments: Object.fromEntries(ids.map((id,index) => [id, ['scientu','shaitanu','dheu'][index % 3]])) };
    for (const response of [first,second]) {
      const result = evaluate(question,response);
      expect(result.correct).toBe(true);
      expect(result.masteryEvidence).toEqual([]);
      expect(result.knowledgeEvidence).toEqual([]);
    }
    expect(evaluate(question,{assignments:Object.fromEntries(ids.map((id,index)=>[id,index < 3 ? 'dheu' : index < 5 ? 'scientu' : 'shaitanu']))}).correct).toBe(false);
  });

  it('persists only source-valid partial collection work', async () => {
    const id = 'studio.collections.equal-share';
    const question = await loadLearningStudioQuestion(id);
    if (question.interaction.type !== 'collection_count') throw new Error('Expected collection_count');
    const state = { assignments: { [question.interaction.items[0].id]: question.interaction.targets[1].id } };
    const workspace = createStudioWorkspace(id,question,state);
    expect(restoreStudioWorkspace(id,question,workspace)).toEqual(state);
    expect(restoreStudioWorkspace(id,question,{...workspace,state:{assignments:{foreign:question.interaction.targets[0].id}}})).toBeUndefined();
  });

  it('accepts every prerequisite-respecting order and rejects the others', async () => {
    const question = await loadLearningStudioQuestion('studio.sequence.bicycle-ready');
    expect(question.interaction.type).toBe('sequence_order');
    if (question.interaction.type !== 'sequence_order') throw new Error('Expected sequence_order');
    expect(question.interaction.version).toBe(2);
    const ids = question.interaction.items.map((item) => item.id);
    const accepted = permutations(ids).filter((order) => evaluate(question,{orderedItemIds:order}).correct);
    expect(accepted).toHaveLength(6);
    expect(accepted.every((order) => order.at(-1) === 'ride')).toBe(true);
    expect(new Set(accepted.map((order) => order.join('|'))).size).toBe(6);
    expect(evaluate(question,{orderedItemIds:['ride','helmet','brake','tyres']}).correct).toBe(false);
  });

  it('registers both new engines without forking the evaluator', async () => {
    const collection = await loadLearningStudioQuestion('studio.collections.equal-share');
    const dependency = await loadLearningStudioQuestion('studio.sequence.bicycle-ready');
    expect(() => getEngineComponent(collection)).not.toThrow();
    expect(() => getEngineComponent(dependency)).not.toThrow();
  });
});
