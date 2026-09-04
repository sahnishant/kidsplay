import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import type { DragToTargetQuestion } from '../src/contracts/question';
import DragToTarget from '../src/engines/DragToTarget.svelte';

function matchingQuestion(id = 'test.drag.tap-selection'): DragToTargetQuestion {
  return {
    id,
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

function rect(left: number, top: number, right: number, bottom: number): DOMRect {
  return {
    left,
    top,
    right,
    bottom,
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
    toJSON: () => ({})
  } as DOMRect;
}

beforeEach(() => {
  Object.defineProperties(HTMLButtonElement.prototype, {
    setPointerCapture: { configurable: true, value: vi.fn() },
    hasPointerCapture: { configurable: true, value: vi.fn(() => false) },
    releasePointerCapture: { configurable: true, value: vi.fn() }
  });
  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: vi.fn(() => null)
  });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(HTMLButtonElement.prototype, 'setPointerCapture');
  Reflect.deleteProperty(HTMLButtonElement.prototype, 'hasPointerCapture');
  Reflect.deleteProperty(HTMLButtonElement.prototype, 'releasePointerCapture');
  Reflect.deleteProperty(document, 'elementFromPoint');
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

  it('keeps legacy exact-target behavior unless forgiving snap is explicitly enabled', async () => {
    const first = render(DragToTarget, {
      props: {
        question: matchingQuestion('test.drag.default-exact'),
        onSubmit: vi.fn(),
        submissionMode: 'explicit'
      }
    });
    const item = first.container.querySelector<HTMLButtonElement>('.drag-item')!;
    const target = first.container.querySelector<HTMLButtonElement>('.drop-target')!;
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(rect(100, 0, 200, 100));

    await fireEvent.pointerDown(item, { pointerId: 8, pointerType: 'touch', clientX: 50, clientY: 50 });
    await fireEvent.pointerMove(item, { pointerId: 8, pointerType: 'touch', clientX: 88, clientY: 50 });
    await fireEvent.pointerUp(item, { pointerId: 8, pointerType: 'touch', clientX: 88, clientY: 50 });
    expect(target.textContent).toContain('Drop here');

    first.unmount();
    const forgiving = render(DragToTarget, {
      props: {
        question: matchingQuestion('test.drag.forgiving'),
        onSubmit: vi.fn(),
        submissionMode: 'explicit',
        dropSnapTolerancePx: 24
      }
    });
    const forgivingItem = forgiving.container.querySelector<HTMLButtonElement>('.drag-item')!;
    const forgivingTarget = forgiving.container.querySelector<HTMLButtonElement>('.drop-target')!;
    vi.spyOn(forgivingTarget, 'getBoundingClientRect').mockReturnValue(rect(100, 0, 200, 100));

    await fireEvent.pointerDown(forgivingItem, { pointerId: 9, pointerType: 'touch', clientX: 50, clientY: 50 });
    await fireEvent.pointerMove(forgivingItem, { pointerId: 9, pointerType: 'touch', clientX: 88, clientY: 50 });
    await fireEvent.pointerUp(forgivingItem, { pointerId: 9, pointerType: 'touch', clientX: 88, clientY: 50 });
    expect(forgivingTarget.textContent).toContain('Leaf');
  });

  it('never snaps a drag to a target owned by another activity instance', async () => {
    const first = render(DragToTarget, {
      props: {
        question: matchingQuestion('test.drag.scope-one'),
        onSubmit: vi.fn(),
        submissionMode: 'explicit',
        dropSnapTolerancePx: 24
      }
    });
    const second = render(DragToTarget, {
      props: {
        question: matchingQuestion('test.drag.scope-two'),
        onSubmit: vi.fn(),
        submissionMode: 'explicit',
        dropSnapTolerancePx: 24
      }
    });

    const firstItem = first.container.querySelector<HTMLButtonElement>('.drag-item')!;
    const firstTarget = first.container.querySelector<HTMLButtonElement>('.drop-target')!;
    const secondTarget = second.container.querySelector<HTMLButtonElement>('.drop-target')!;
    vi.spyOn(firstTarget, 'getBoundingClientRect').mockReturnValue(rect(300, 0, 400, 100));
    vi.spyOn(secondTarget, 'getBoundingClientRect').mockReturnValue(rect(100, 0, 200, 100));
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => secondTarget)
    });

    await fireEvent.pointerDown(firstItem, { pointerId: 10, pointerType: 'touch', clientX: 50, clientY: 50 });
    await fireEvent.pointerMove(firstItem, { pointerId: 10, pointerType: 'touch', clientX: 110, clientY: 50 });
    await fireEvent.pointerUp(firstItem, { pointerId: 10, pointerType: 'touch', clientX: 110, clientY: 50 });

    expect(firstTarget.textContent).toContain('Drop here');
    expect(secondTarget.textContent).toContain('Drop here');
  });
});
