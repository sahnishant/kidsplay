import { describe, expect, it } from 'vitest';
import type { AssemblyDefinition } from '../src/mechanics/assembly';
import { commitAssemblyPlacement, createAssemblyInteractionState } from '../src/mechanics/assemblyInteraction';

const repair: AssemblyDefinition = {
  schemaVersion: 1,
  assemblyId: 'assembly.test.repair',
  operation: 'repair_restore',
  orderMode: 'unordered',
  parts: [
    { partId: 'part.roof', semanticRef: 'semantic.roof' },
    { partId: 'part.perch', semanticRef: 'semantic.perch' }
  ],
  slots: [
    { slotId: 'slot.roof', semanticRef: 'semantic.roof-slot' },
    { slotId: 'slot.perch', semanticRef: 'semantic.perch-slot' }
  ],
  requiredAssignments: [
    { partId: 'part.roof', slotId: 'slot.roof' },
    { partId: 'part.perch', slotId: 'slot.perch' }
  ],
  retryPolicy: 'reset_for_retry_preserve_first_attempt'
};

const ordered: AssemblyDefinition = {
  ...repair,
  assemblyId: 'assembly.test.ordered',
  operation: 'place_part_in_slot',
  orderMode: 'ordered',
  requiredPlacementOrder: ['part.roof', 'part.perch']
};

describe('G2 assembly interaction state', () => {
  it('auto-submits when the final required placement is committed', () => {
    const first = commitAssemblyPlacement(repair, createAssemblyInteractionState(), { partId: 'part.roof', slotId: 'slot.roof' });
    expect(first.feedback).toBe('placed');
    expect(first.autoSubmitted).toBe(false);
    expect(first.state.firstAttemptCorrect).toBeNull();

    const final = commitAssemblyPlacement(repair, first.state, { partId: 'part.perch', slotId: 'slot.perch' });
    expect(final.feedback).toBe('complete');
    expect(final.autoSubmitted).toBe(true);
    expect(final.state.completed).toBe(true);
    expect(final.state.firstAttemptCorrect).toBe(true);
    expect(final.state.evaluation?.correct).toBe(true);
  });

  it('keeps an incorrect drop in place for retry without clearing correct work', () => {
    const first = commitAssemblyPlacement(repair, createAssemblyInteractionState(), { partId: 'part.roof', slotId: 'slot.roof' });
    const miss = commitAssemblyPlacement(repair, first.state, { partId: 'part.perch', slotId: 'slot.roof' });

    expect(miss.feedback).toBe('retry_in_place');
    expect(miss.autoSubmitted).toBe(false);
    expect(miss.state.assignments).toEqual([{ partId: 'part.roof', slotId: 'slot.roof' }]);
    expect(miss.state.firstAttemptCorrect).toBe(false);

    const recovered = commitAssemblyPlacement(repair, miss.state, { partId: 'part.perch', slotId: 'slot.perch' });
    expect(recovered.state.completed).toBe(true);
    expect(recovered.state.firstAttemptCorrect).toBe(false);
  });

  it('preserves first-attempt failure when semantic order is wrong and retries cleanly', () => {
    const first = commitAssemblyPlacement(ordered, createAssemblyInteractionState(), { partId: 'part.perch', slotId: 'slot.perch' });
    const wrongOrder = commitAssemblyPlacement(ordered, first.state, { partId: 'part.roof', slotId: 'slot.roof' });
    expect(wrongOrder.feedback).toBe('retry_in_place');
    expect(wrongOrder.autoSubmitted).toBe(true);
    expect(wrongOrder.state.assignments).toEqual([]);
    expect(wrongOrder.state.firstAttemptCorrect).toBe(false);

    const retryOne = commitAssemblyPlacement(ordered, wrongOrder.state, { partId: 'part.roof', slotId: 'slot.roof' });
    const retryTwo = commitAssemblyPlacement(ordered, retryOne.state, { partId: 'part.perch', slotId: 'slot.perch' });
    expect(retryTwo.feedback).toBe('complete');
    expect(retryTwo.state.firstAttemptCorrect).toBe(false);
  });
});
