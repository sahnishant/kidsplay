import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
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

function motionQuestion(): SingleChoiceQuestion {
  return {
    ...testQuestion(),
    id: 'test.air.kite.choice.001',
    conceptIds: ['air.properties.kite'],
    knowledgeRefs: ['kr.air.kite.moved-by.wind'],
    prompt: { text: 'What helps a kite fly?' },
    interaction: {
      type: 'single_choice',
      version: 1,
      shuffleOptions: false,
      options: [
        { id: 'wind', label: 'Moving air' },
        { id: 'stone', label: 'A stone' }
      ]
    },
    solution: { type: 'exact_option', correctOptionIds: ['wind'] }
  };
}

async function openGrownUpArea(): Promise<void> {
  await fireEvent.click(screen.getByRole('button', { name: 'Open player settings' }));
  await fireEvent.click(screen.getByRole('button', { name: 'Open grown-up area' }));
}

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, '', '/');
});

afterEach(() => {
  cleanup();
});

describe('user-facing product flow', () => {
  it('makes the home screen a compact child-first mission control and keeps grown-up data behind Player', async () => {
    render(App);

    expect(screen.getByRole('button', { name: 'Open player settings' })).toBeTruthy();
    expect(screen.getByLabelText('Current adventure level 1')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeTruthy();
    expect(screen.getAllByText('LEVEL 1').length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText('Kidsplay')).toBeNull();
    expect(screen.queryByRole('heading', { name: "Dheu's science world" })).toBeNull();
    expect(screen.getByRole('button', { name: 'Open story world' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open practice activities' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Open learning progress' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open goal learning' })).toBeNull();
    expect(screen.queryByText(/Curriculum profile:/)).toBeNull();
    expect(screen.queryByLabelText('Child name')).toBeNull();

    await fireEvent.click(screen.getByRole('button', { name: 'Open player settings' }));
    expect(screen.getByRole('heading', { name: 'Who is playing?' })).toBeTruthy();
    const nameInput = screen.getByLabelText('Child name') as HTMLInputElement;
    await fireEvent.input(nameInput, { target: { value: 'Dheu' } });
    const stored = JSON.parse(window.localStorage.getItem(CHILD_KEY) ?? '{}') as { name?: string };
    expect(stored.name).toBe('Dheu');
    expect(screen.getByText('For grown-ups')).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: 'Open grown-up area' }));
    expect(screen.getByRole('heading', { name: 'Learning progress' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '0 strong facts!' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: "Science worlds you've explored" })).toBeTruthy();
    expect(screen.getByText('Numbers for grown-ups')).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: "Back to Dheu's world" }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeTruthy());

    await fireEvent.click(screen.getByRole('button', { name: 'Open practice activities' }));
    expect(screen.getByRole('heading', { name: 'Choose a play activity' })).toBeTruthy();
    expect(screen.queryByText(/Curriculum profile:/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Try 35-question mock' })).toBeNull();

    await fireEvent.click(screen.getByRole('button', { name: 'Play free' }));
    expect(screen.getByText('Science Explorer: Class 2 Science & EVS')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back to Kidsplay home' })).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: 'Back to Kidsplay home' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeTruthy());
  });

  it('uses Escape and browser Back through one overlay-first home navigation contract', async () => {
    render(App);

    await fireEvent.click(screen.getByRole('button', { name: 'Open player settings' }));
    expect(screen.getByRole('heading', { name: 'Who is playing?' })).toBeTruthy();
    window.history.back();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeTruthy());

    await openGrownUpArea();
    expect(screen.getByRole('heading', { name: 'Learning progress' })).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'Assessment' }));
    expect(screen.getByRole('heading', { name: 'Assessment & mocks' })).toBeTruthy();
    await fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeTruthy());

    await fireEvent.click(screen.getByRole('button', { name: 'River & Pond Quest, Level 4: The Puppy by the Pond' }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    await fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('heading', { name: 'Forest Explorer Trail' })).toBeTruthy();
  });

  it('keeps saved mock resume/history behind the grown-up assessment screen', async () => {
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
    expect(screen.queryByRole('heading', { name: 'Pick up where you left off' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Mock medals' })).toBeNull();

    await openGrownUpArea();
    await fireEvent.click(screen.getByRole('button', { name: 'Assessment' }));
    expect(screen.getByRole('heading', { name: 'Assessment & mocks' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Pick up where you left off' })).toBeTruthy();
    expect(screen.getByText('0 / 35')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Mock medals' })).toBeTruthy();
    expect(screen.getByText(/31\/40 marks/)).toBeTruthy();
    expect(screen.queryByText(/Logical Reasoning 4\/5/)).toBeNull();
    expect(screen.getByText('ⓘ About readiness')).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: /Continue/ }));
    expect(screen.getByText('Saved on this device')).toBeTruthy();
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

    await fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(screen.getByRole('heading', { name: 'Nice work, Dheu' })).toBeTruthy();
  });

  it('submits a single-choice answer on the option tap, emits one attempt and reaches completion', async () => {
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

    expect(screen.queryByRole('button', { name: 'Check answer' })).toBeNull();
    await fireEvent.click(screen.getByRole('button', { name: 'Dog' }));

    expect(screen.getByRole('status').textContent).toContain('Yes, a dog is a common pet.');
    expect(attempts).toHaveLength(1);
    expect(attempts[0].result.correct).toBe(true);
    expect(attempts[0].question.knowledgeRefs).toEqual(['kr.test.animals.dog.domestic']);

    await fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(screen.getByRole('heading', { name: 'Nice work, Dheu' })).toBeTruthy();
  });

  it('shows incorrect feedback immediately after a wrong option tap', async () => {
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

    await fireEvent.click(screen.getByRole('button', { name: 'Whale' }));

    expect(screen.getByRole('status').textContent).toContain('Try the animal that often lives with people.');
    expect(attempts).toHaveLength(1);
    expect(attempts[0].result.correct).toBe(false);
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

  it('uses inferred motion as post-answer reinforcement in practice and never as a mock hint', async () => {
    const first = render(Session, {
      props: {
        title: 'Motion Practice',
        questions: [motionQuestion()],
        childName: 'Dheu',
        childAvatar: 'fox'
      }
    });

    expect(screen.queryByRole('img', { name: 'A kite moving in the air while wind blows across the sky.' })).toBeNull();
    await fireEvent.click(screen.getByRole('button', { name: 'Moving air' }));
    expect(screen.getByRole('img', { name: 'A kite moving in the air while wind blows across the sky.' })).toBeTruthy();
    first.unmount();

    render(Session, {
      props: {
        title: 'Motion Mock',
        questions: [motionQuestion()],
        sections: [{ id: 'science', title: 'Science', startIndex: 0, count: 1, marksPerQuestion: 1 }],
        childName: 'Dheu',
        childAvatar: 'fox'
      }
    });

    expect(screen.queryByRole('img', { name: 'A kite moving in the air while wind blows across the sky.' })).toBeNull();
    await fireEvent.click(screen.getByRole('button', { name: 'Moving air' }));
    expect(screen.queryByRole('img', { name: 'A kite moving in the air while wind blows across the sky.' })).toBeNull();
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

    expect(screen.getByText('Science · 1 mark')).toBeTruthy();
  });
});
