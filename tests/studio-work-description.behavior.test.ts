import { describe, expect, it } from 'vitest';
import fractions from '../content/questions/fraction-studio.json';
import type { EqualPartsQuestion, SequenceOrderQuestion } from '../src/contracts/question';
import { describeStudioWork } from '../src/presentation/studioWorkDescription';

const fraction = fractions[0] as EqualPartsQuestion;
const sequence: SequenceOrderQuestion = {
  id: 'test.words', revision: 1, schemaVersion: 1, conceptIds: ['test'], difficulty: 1, language: 'en-IN',
  prompt: { text: 'Order.' }, authoring: { status: 'draft', source: 'test' }, feedback: { correct: 'Done', incorrect: 'Try again' },
  interaction: { type: 'sequence_order', version: 1, seed: 1, items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] },
  solution: { type: 'ordered_items', orderedItemIds: ['a','b'] }
};
describe('accessible read-only work is not an answer-key projection', () => {
  it('describes an incorrect allocation using the actual amounts', () => {
    expect(describeStudioWork(fraction, { assignments: ['gold','gold','gold','teal'] }))
      .toBe('Your submitted work: Gold: 3 of 4 equal parts; Teal: 1 of 4 equal parts.');
  });
  it('preserves the child order even when it is not the expected order', () => {
    expect(describeStudioWork(sequence, { orderedItemIds: ['b','a'] })).toBe('Your submitted work: B → A.');
  });
  it('does not invent a description for a malformed response', () => {
    expect(describeStudioWork(sequence, { orderedItemIds: ['x'] })).toBe('Submitted work is unavailable.');
  });
});
