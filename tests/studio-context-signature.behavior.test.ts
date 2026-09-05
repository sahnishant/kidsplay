import { describe, expect, it } from 'vitest';
import questions from '../content/questions/fraction-studio.json';
import type { EqualPartsQuestion } from '../src/contracts/question';
import { createStudioWorkspace, readStudioWorkspace, studioQuestionSignature } from '../src/experience/studioWorkspace.mjs';

const question = questions[0] as EqualPartsQuestion;
const activity = 'studio.fractions.equal-shares';
const saved = createStudioWorkspace(activity, question, { assignments: ['gold', null, null, null] });

describe('work compatibility includes the task context, not just its answer', () => {
  it.each([
    { prompt: { text: 'A different question' } },
    { stimulus: { type: 'scene', sceneId: 'different.scene' } },
    { language: 'hi-IN' },
    { knowledgeRefs: ['different.claim'] }
  ])('refuses changed same-revision context %j', (change) => {
    const changed = Object.assign(structuredClone(question), change);
    expect(readStudioWorkspace(activity, changed, saved)).toBeNull();
    expect(saved.state).toEqual({ assignments: ['gold', null, null, null] });
  });
  it.each([Infinity, NaN])('rejects non-finite values rather than serialising them as null: %s', (value) => {
    const changed = structuredClone(question);
    Object.assign(changed.solution, { invalidNumber: value });
    expect(() => studioQuestionSignature(changed)).toThrow(/finite numbers/);
  });
  it('rejects a sparse source array rather than normalising missing entries', () => {
    const changed = structuredClone(question);
    Object.assign(changed.interaction, { invalidItems: Array(2) });
    expect(() => studioQuestionSignature(changed)).toThrow(/JSON data/);
  });
});
