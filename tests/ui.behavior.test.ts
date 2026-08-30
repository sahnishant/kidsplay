import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import App from '../src/App.svelte';
import Session from '../src/ui/Session.svelte';
import { createSessionForCatalogEntry, getCatalogEntries } from '../src/content';
import type { SingleChoiceQuestion } from '../src/contracts/question';
import type { SessionAttempt } from '../src/contracts/runtime';
import {
  getPatternMockContractSignature,
  getQuestionContractSignature
} from '../src/runtime/mockContract';
import { recordMockCompletion, saveMockCheckpoint } from '../src/runtime/mockPersistence';
import { createSessionState, submitResponse } from '../src/runtime/session';

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

function reasoningQuestion(): SingleChoiceQuestion {
  return {
    ...testQuestion(),
    id: 'test.reasoning.choice.001',
    conceptIds: ['test.reasoning.one', 'test.reasoning.two'],
    knowledgeRefs: ['kr.human.one', 'kr.food.two'],
    difficulty: 3,
    prompt: { text: 'Use two ideas to solve this.' }
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
    expect(screen.getAllByText('Profile: SOF_INDIA_CLASS2')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Try 35-question mock' })).toBeTruthy();

    const nameInput = screen.getByLabelText('Child name') as HTMLInputElement;
    await fireEvent.input(nameInput, { target: { value: 'Dheu' } });
    const stored = JSON.parse(window.localStorage.getItem(CHILD_KEY) ?? '{}') as { name?: string };
    expect(stored.name).toBe('Dheu');

    await fireEvent.click(screen.getByRole('button', { name: 'Try prototype' }));
    expect(screen.getByText('Class 2 Science Olympiad: Core Science & EVS')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back to Kidsplay home' })).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: 'Back to Kidsplay home' }));
    expect(screen.getByRole('heading', { name: 'Choose what to do' })).toBeTruthy();
  });

  it('surfaces and resumes an exact saved pattern mock and shows saved mock history', async () => {
    const patternEntry = getCatalogEntries().find((entry) => entry.actionLabel === 'Try 35-question mock');
    expect(patternEntry).toBeTruthy();
    const launch = createSessionForCatalogEntry(patternEntry!.id, {});

    saveMockCheckpoint({
      entryId: patternEntry!.id,
      title: launch.title,
      questionIds: launch.questions.map((question) => question.id),
      sectionSignature: getPatternMockContractSignature(launch.profileRef),
      questionSignature: getQuestionContractSignature(launch.questions),
      state: {
        sessionId: 'session.saved-pattern',
        index: 0,
        responses: [],
        submitted: false
      }
    });
    recordMockCompletion({
      sessionId: 'session.completed-pattern',
      entryId: patternEntry!.id,
      title: launch.title,
      questionCount: 35,
      correct: 28,
      earnedMarks: 31,
      maxMarks: 40,
      sections: [
        {
          id: 'logical_reasoning',
          title: 'Logical Reasoning',
          correct: 4,
          answered: 5,
          total: 5,
          accuracy: 0.8,
          earnedMarks: 4,
          maxMarks: 5
        },
        {
          id: 'science',
          title: 'Science',
          correct: 20,
          answered: 25,
          total: 25,
          accuracy: 0.8,
          earnedMarks: 20,
          maxMarks: 25
        },
        {
          id: 'achievers',
          title: 'Achievers',
          correct: 4,
          answered: 5,
          total: 5,
          accuracy: 0.8,
          earnedMarks: 7,
          maxMarks: 10
        }
      ]
    });

    render(App);
    expect(screen.getByRole('heading', { name: 'Resume your saved mock' })).toBeTruthy();
    expect(screen.getByText('0 of 35 answered · your exact question order is preserved.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'How mock practice is moving' })).toBeTruthy();
    expect(screen.getByText('31 / 40')).toBeTruthy();
    expect(screen.getByText(/Logical Reasoning 4\/5/)).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: 'Resume saved mock' }));
    expect(screen.getByText('Mock progress saves on this device')).toBeTruthy();
    expect(screen.getByText('1 / 35')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back to Kidsplay home' })).toBeTruthy();
  });

  it('restores submitted feedback without reopening the answer engine', async () => {
    const question = testQuestion();
    const initialState = createSessionState();
    submitResponse(initialState, question, { selectedOptionIds: ['dog'] });

    render(Session, {
      props: {
        title: 'Saved Mock Boundary',
        questions: [question],
        childName: 'Dheu',
        childAvatar: 'owl',
        initialState
      }
    });

    expect(screen.getByRole('note').textContent).toContain('Your saved answer is restored');
    expect(screen.getByRole('status').textContent).toContain('Yes, a dog is a common pet.');
    expect(screen.queryByRole('button', { name: 'Check answer' })).toBeNull();

    await fireEvent.click(screen.getByRole('button', { name: 'See result' }));
    expect(screen.getByRole('heading', { name: 'Nice work, Dheu' })).toBeTruthy();
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

  it('marks multi-knowledge challenge questions as a think-it-through moment', () => {
    render(Session, {
      props: {
        title: 'Reasoning Test',
        questions: [reasoningQuestion()],
        childName: 'Dheu',
        childAvatar: 'owl'
      }
    });

    expect(screen.getByText('Think it through')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Use two ideas to solve this.' })).toBeTruthy();
  });

  it('shows the active section and mark weight inside a structured mock', () => {
    render(Session, {
      props: {
        title: 'Pattern Mock',
        questions: [testQuestion()],
        sections: [{ id: 'science', title: 'Science', startIndex: 0, count: 1, marksPerQuestion: 1 }],
        childName: 'Dheu',
        childAvatar: 'tiger'
      }
    });

    expect(screen.getByText(/Section: Science/).textContent).toContain('1 mark each');
  });
});
