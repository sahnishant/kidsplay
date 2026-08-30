import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import type { DragToTargetQuestion, SingleChoiceQuestion } from '../src/contracts/question';
import DragToTarget from '../src/engines/DragToTarget.svelte';
import SingleChoice from '../src/engines/SingleChoice.svelte';

afterEach(() => cleanup());

function choiceQuestion(options: SingleChoiceQuestion['interaction']['options']): SingleChoiceQuestion {
  return {
    id: 'test.visual.choice.001',
    revision: 1,
    schemaVersion: 1,
    conceptIds: ['test.visual'],
    difficulty: 1,
    language: 'en',
    prompt: { text: 'Choose one.' },
    feedback: { correct: 'Correct.', incorrect: 'Try again.' },
    authoring: { status: 'reviewed', source: 'behavior-test' },
    interaction: { type: 'single_choice', version: 1, shuffleOptions: false, options },
    solution: { type: 'exact_option', correctOptionIds: [options[0].id] }
  };
}

describe('animated option visuals', () => {
  it('shows a dog and whale beside their text without changing the accessible option names', () => {
    const { container } = render(SingleChoice, {
      props: {
        question: choiceQuestion([
          { id: 'dog', label: 'Dog' },
          { id: 'whale', label: 'Whale' }
        ]),
        onSubmit: () => undefined
      }
    });

    expect(screen.getByRole('button', { name: 'Dog' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Whale' })).toBeTruthy();
    expect(container.querySelector('[data-visual-ref="entity.animal.dog"]')).toBeTruthy();
    expect(container.querySelector('[data-visual-ref="entity.animal.whale"]')).toBeTruthy();
  });

  it('renders compact multi-entity options from exact semantic labels', () => {
    const { container } = render(SingleChoice, {
      props: {
        question: choiceQuestion([
          { id: 'meal', label: 'Rice + dal + spinach' },
          { id: 'other', label: 'A long sentence with no registered visual meaning' }
        ]),
        onSubmit: () => undefined
      }
    });

    const meal = screen.getByRole('button', { name: 'Rice + dal + spinach' });
    expect(meal.querySelectorAll('[data-visual-ref]').length).toBe(3);
    expect(container.querySelectorAll('[data-visual-ref]').length).toBe(3);
  });

  it('keeps drag/match visuals authored rather than inferred from labels', () => {
    const implicitQuestion: DragToTargetQuestion = {
      id: 'test.visual.drag.implicit',
      revision: 1,
      schemaVersion: 1,
      conceptIds: ['test.visual'],
      difficulty: 1,
      language: 'en',
      prompt: { text: 'Match.' },
      feedback: { correct: 'Correct.', incorrect: 'Try again.' },
      authoring: { status: 'reviewed', source: 'behavior-test' },
      interaction: {
        type: 'drag_to_target',
        version: 1,
        items: [{ id: 'dog', label: 'Dog', symbol: '🐶' }],
        targets: [{ id: 'land', label: 'Land', symbol: '🌳' }]
      },
      solution: { type: 'target_assignment', assignments: { dog: 'land' } }
    };

    const implicit = render(DragToTarget, {
      props: { question: implicitQuestion, onSubmit: () => undefined }
    });
    expect(implicit.container.querySelector('[data-visual-ref]')).toBeNull();
    cleanup();

    const explicitQuestion: DragToTargetQuestion = {
      ...implicitQuestion,
      id: 'test.visual.drag.explicit',
      interaction: {
        ...implicitQuestion.interaction,
        items: [{ id: 'dog', label: 'Dog', visualRefs: ['entity.animal.dog'] }],
        targets: [{ id: 'land', label: 'Land', visualRefs: ['entity.habitat.land'] }]
      }
    };
    const explicit = render(DragToTarget, {
      props: { question: explicitQuestion, onSubmit: () => undefined }
    });
    expect(explicit.container.querySelector('[data-visual-ref="entity.animal.dog"]')).toBeTruthy();
    expect(explicit.container.querySelector('[data-visual-ref="entity.habitat.land"]')).toBeTruthy();
  });
});
