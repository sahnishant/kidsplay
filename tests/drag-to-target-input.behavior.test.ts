import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import type { DragToTargetQuestion } from '../src/contracts/question';
import DragToTarget from '../src/engines/DragToTarget.svelte';

function matchingQuestion(): DragToTargetQuestion {
  return {
    id: 'test.drag.tap-selection',
    revision: 1,
    schemaVersion: 1,
    conceptIds: ['test.drag'],
    knowledgeRefs: ['kr.test.drag'],
    difficulty: 1,
    language: 'en-IN',
    prompt: { text: 'Match the leaf to its place.' },
    feedback: { correct: 'Correct.', incorrect: 'Try again.' },
    authoring: { status: 'reviewed', source: 'drag-tap-selection-test' },
    interaction: {
      type: 'drag_to_target',
      version: 1,
      items: [{ id: 'leaf', label: 'Leaf' }],
      targets: [{ id: 'plant', label: 'Plant' }]
    },
    solution: {
      type: 'target_assignment',
      assignments: { leaf: 'plant' }
    }
  };
}

beforeEach(() => {
  Object.defineProperty(HTMLButtonElement.prototype, 'setPointerCapture', {
    configurable: true,
    value: vi.fn()
  });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(HTMLButtonElement.prototype, 'setPointerCapture');
});

describe('drag-to-target child input', () => {
  it('keeps tap selection after pointerdown so a destination tap assigns the item', async () => {
    const { container } = render(DragToTarget, {
      props: {
        question: matchingQuestion(),
        onSubmit: vi.fn(),
        submissionMode: 'explicit'
      }
    });

    const item = container.querySelector<HTMLButtonElement>('.drag-item');
    const target = container.querySelector<HTMLButtonElement>('.drop-target');
    expect(item).not.toBeNull();
    expect(target).not.toBeNull();

    await fireEvent.pointerDown(item!, { pointerId: 7, pointerType: 'touch', clientX: 10, clientY: 10 });
    await fireEvent.click(item!);

    expect(item!.getAttribute('aria-pressed')).toBe('true');

    await fireEvent.click(target!);

    expect(target!.textContent).toContain('Leaf');
    expect(item!.getAttribute('aria-pressed')).toBe('false');
  });
});