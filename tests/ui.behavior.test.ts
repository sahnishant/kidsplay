import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import App from '../src/App.svelte';
import Session from '../src/ui/Session.svelte';
import type { SingleChoiceQuestion } from '../src/contracts/question';
import type { SessionAttempt } from '../src/contracts/runtime';

const CHILD_KEY = 'kidsplay.child.v1';

function testQuestion(): SingleChoiceQuestion {
  return {
    id: 'test.animals.dog.choice.001',
    revision: 1,
    schemaVersion: 1,
    conceptIds: ['test.animals.domestic'],
    knowledgeRefs: ['kr.test.animals.dog.domestic'],
    difficulty: 1,
    language: 'en',
    prompt: { text: 'Which animal is a common pet?' },
    feedback: {
      correct: 'Yes, a dog is a common pet.',
      incorrect: 'Try the animal that often lives with people.'
    },
    authoring: { status: 'reviewed', source: 'behavior-test' },
    interaction: {
      type: 'single_choice',
      version: 1,
      shuffleOptions: false,
      options: [
        { id: 'dog', label: 'Dog' },
        { id: 'whale', label: 'Whale' }
      ]
    },
    solution: { type: 'exact_option', correctOptionIds: ['dog'] }
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe('user-facing product flow', () => {
  it('shows the learning map, saves the player and enters and leaves a profile-driven goal session', async () => {
    render(App);

    expect(screen.getByRole('heading', { name: 'Learn as you play' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'How each topic is going' })).toBeTruthy();
    expect(screen.getByText('Human Body')).toBeTruthy();
    expect(screen.getByText('Food')).toBeTruthy();
    expect(screen.getByText('Profile: SOF_INDIA_CLASS2')).toBeTruthy();

    const nameInput = screen.getByLabelText('Child name') as HTMLInputElement;
    await fireEvent.input(nameInput, { target: { value: 'Dheu' } });
    const stored = JSON.parse(window.localStorage.getItem(CHILD_KEY) ?? '{}') as { name?: string };
    expect(stored.name).toBe('Dheu');

    await fireEvent.click(screen.getByRole('button', { name: 'Try prototype' }));
    expect(screen.getByText('Class 2 Science Olympiad: Living World, Body & Food')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back to Kidsplay home' })).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: 'Back to Kidsplay home' }));
    expect(screen.getByRole('heading', { name: 'Choose what to do' })).toBeTruthy();
  });

  it('submits through the engine host, emits one attempt and reaches completion', async () => {
    const attempts: SessionAttempt[] = [];
    render(Session, {
      props: {
        title: 'Behavior Test',
        questions: [testQuestion()],
        childName: 'Dheu',
        childAvatar: 'fox',
        onAttempt: (attempt: SessionAttempt) => attempts.push(attempt)
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Dog' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(screen.getByRole('status').textContent).toContain('Yes, a dog is a common pet.');
    expect(attempts).toHaveLength(1);
    expect(attempts[0].result.correct).toBe(true);
    expect(attempts[0].question.knowledgeRefs).toEqual(['kr.test.animals.dog.domestic']);

    await fireEvent.click(screen.getByRole('button', { name: 'See result' }));
    expect(screen.getByRole('heading', { name: 'Nice work, Dheu' })).toBeTruthy();
  });
});
