import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import type { DragToTargetQuestion } from '../src/contracts/question';
import DragToTarget from '../src/engines/DragToTarget.svelte';
import { createMatchingDisplayOrder, matchingClueLabel } from '../src/mechanics/matchingPresentation';

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

function vocabularyMatchingQuestion(): DragToTargetQuestion {
  return {
    id: 'test.vocabulary.meaning-matching.001',
    revision: 1,
    schemaVersion: 1,
    conceptIds: ['test.vocabulary.meanings'],
    difficulty: 1,
    language: 'en',
    prompt: { text: 'Match each word to its meaning.' },
    feedback: { correct: 'Correct.', incorrect: 'Try again.' },
    authoring: { status: 'reviewed', source: 'behavior-test' },
    interaction: {
      type: 'drag_to_target',
      version: 1,
      items: [
        { id: 'different', label: 'different' },
        { id: 'friend', label: 'friend' },
        { id: 'class', label: 'class' },
        { id: 'early', label: 'early' }
      ],
      targets: [
        { id: 'different-meaning', label: 'Different means not the same as something else.' },
        { id: 'friend-meaning', label: 'A friend is someone you know well, like, and trust.' },
        { id: 'class-meaning', label: 'A class is a group of students who learn together.' },
        { id: 'early-meaning', label: 'Early means before the usual time or near the beginning.' }
      ]
    },
    solution: {
      type: 'target_assignment',
      assignments: {
        different: 'different-meaning',
        friend: 'friend-meaning',
        class: 'class-meaning',
        early: 'early-meaning'
      }
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

  it('turns paired dictionary sentences into concise clues without touching unrelated labels', () => {
    expect(matchingClueLabel('Different means not the same as something else.', 'different'))
      .toBe('not the same as something else.');
    expect(matchingClueLabel('A friend is someone you know well, like, and trust.', 'friend'))
      .toBe('someone you know well, like, and trust.');
    expect(matchingClueLabel('A class is a group of students who learn together.', 'class'))
      .toBe('a group of students who learn together.');
    expect(matchingClueLabel('The past is the time before now.', 'past'))
      .toBe('the time before now.');
    expect(matchingClueLabel('Clothes are things people wear.', 'clothes'))
      .toBe('things people wear.');
    expect(matchingClueLabel('An accident is an unexpected event.', 'accident'))
      .toBe('an unexpected event.');
    expect(matchingClueLabel('kennel', 'Dog')).toBe('kennel');
    expect(matchingClueLabel('A dog sleeps in a kennel.', 'Dog')).toBe('A dog sleeps in a kennel.');
  });

  it('renders vocabulary meaning targets as clues while preserving the source word chips', () => {
    render(DragToTarget, {
      props: {
        question: vocabularyMatchingQuestion(),
        onSubmit: vi.fn(),
        checkResponse: vi.fn()
      }
    });

    expect(screen.getByText('not the same as something else.')).toBeTruthy();
    expect(screen.getByText('someone you know well, like, and trust.')).toBeTruthy();
    expect(screen.getByText('a group of students who learn together.')).toBeTruthy();
    expect(screen.getByText('before the usual time or near the beginning.')).toBeTruthy();

    expect(screen.queryByText('Different means not the same as something else.')).toBeNull();
    expect(screen.queryByText('A friend is someone you know well, like, and trust.')).toBeNull();
    expect(screen.queryByText('A class is a group of students who learn together.')).toBeNull();
    expect(screen.queryByText('Early means before the usual time or near the beginning.')).toBeNull();

    expect(screen.getByRole('button', { name: 'different' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'friend' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'class' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'early' })).toBeTruthy();
  });
});
