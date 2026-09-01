import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import type { DragToTargetQuestion } from '../src/contracts/question';
import DragToTarget from '../src/engines/DragToTarget.svelte';
import { createMatchingDisplayOrder } from '../src/mechanics/matchingPresentation';

afterEach(() => {
  cleanup();
});

function matchingQuestion(): DragToTargetQuestion {
  return {
    id: 'test.animals.homes.drag.001',
    revision: 1,
    schemaVersion: 1,
    conceptIds: ['test.animals.homes'],
    difficulty: 1,
    language: 'en',
    prompt: { text: 'Take every animal to the correct home.' },
    feedback: { correct: 'Correct.', incorrect: 'Try again.' },
    authoring: { status: 'reviewed', source: 'behavior-test' },
    interaction: {
      type: 'drag_to_target',
      version: 1,
      items: [
        { id: 'dog', label: 'Dog', symbol: '🐶' },
        { id: 'horse', label: 'Horse', symbol: '🐴' },
        { id: 'cow', label: 'Cow', symbol: '🐄' }
      ],
      targets: [
        { id: 'kennel', label: 'kennel' },
        { id: 'stable', label: 'stable' },
        { id: 'cowshed', label: 'cowshed' }
      ]
    },
    solution: {
      type: 'target_assignment',
      assignments: { dog: 'kennel', horse: 'stable', cow: 'cowshed' }
    }
  };
}

describe('matching presentation', () => {
  it('keeps source cards unchanged after an item is assigned', async () => {
    render(DragToTarget, {
      props: {
        question: matchingQuestion(),
        onSubmit: vi.fn(),
        checkResponse: vi.fn()
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Dog' }));
    await fireEvent.click(screen.getByRole('button', { name: /kennel/i }));

    expect(screen.getByRole('button', { name: 'Dog' })).toBeTruthy();
    expect(screen.queryByText('Dog → kennel')).toBeNull();
    expect(screen.getByText('🐶 Dog')).toBeTruthy();
  });

  it('reshuffles both sides and removes the authored 1-to-1 positional hint', () => {
    const question = matchingQuestion();
    const identityRandom = () => 0.999999;
    const order = createMatchingDisplayOrder(
      question.interaction.items,
      question.interaction.targets,
      question.solution.assignments,
      identityRandom
    );

    expect(order.items.map((item) => item.id)).not.toEqual(question.interaction.items.map((item) => item.id));
    expect(order.targets.map((target) => target.id)).not.toEqual(question.interaction.targets.map((target) => target.id));

    for (let index = 0; index < Math.min(order.items.length, order.targets.length); index += 1) {
      expect(question.solution.assignments[order.items[index].id]).not.toBe(order.targets[index].id);
    }
  });
});
