// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import EqualParts from '../src/engines/EqualParts.svelte';
import SequenceOrder from '../src/engines/SequenceOrder.svelte';
import fractions from '../content/questions/fraction-studio.json';
import type { EqualPartsQuestion, SequenceOrderQuestion } from '../src/contracts/question';

afterEach(cleanup);
const fraction = fractions[0] as EqualPartsQuestion;
const sequence: SequenceOrderQuestion = {
  id: 'test.sequence', revision: 1, schemaVersion: 1, conceptIds: ['test'], difficulty: 1, language: 'en-IN',
  prompt: { text: 'Order the letters.' }, feedback: { correct: 'In order.', incorrect: 'Try another order.' }, authoring: { status: 'draft', source: 'test-fixture' },
  interaction: { type: 'sequence_order', version: 1, seed: 1, items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] },
  solution: { type: 'ordered_items', orderedItemIds: ['a','b'] }
};

describe('committed manipulation leaves the renderer synchronously', () => {
  it('publishes a fraction edit before the next render tick and not twice', async () => {
    const change = vi.fn();
    const view = render(EqualParts, { question: fraction, onSubmit: vi.fn(), onStateChange: change });
    await tick(); change.mockClear();
    (view.getByRole('button', { name: 'Part 1: empty', exact: true }) as HTMLButtonElement).click();
    expect(change).toHaveBeenCalledExactlyOnceWith({ assignments: ['gold',null,null,null] });
    await tick();
    expect(change).toHaveBeenCalledTimes(1);
    expect(view.container.querySelector('.diagram b')?.textContent).toBe('A');
    expect(view.container.querySelector('.categories .swatch')?.textContent).toBe('A');
  });
  it('publishes a completed swap immediately but not a mere tile selection', async () => {
    const change = vi.fn();
    const view = render(SequenceOrder, { question: sequence, onSubmit: vi.fn(), onStateChange: change, initialState: { orderedItemIds: ['a','b'] } });
    await tick(); change.mockClear();
    (view.getByRole('button', { name: 'Letter A, position 1' }) as HTMLButtonElement).click();
    expect(change).not.toHaveBeenCalled();
    (view.getByRole('button', { name: 'Letter B, position 2' }) as HTMLButtonElement).click();
    expect(change).toHaveBeenCalledExactlyOnceWith({ orderedItemIds: ['b','a'] });
    await tick();
    expect(change).toHaveBeenCalledTimes(1);
  });
});
