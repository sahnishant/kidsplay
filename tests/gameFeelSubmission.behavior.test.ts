import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import type {
  DragToTargetQuestion,
  HotspotQuestion,
  SingleChoiceQuestion,
  WordBankFillQuestion
} from '../src/contracts/question';
import type { EvaluationResult } from '../src/contracts/runtime';
import DragToTarget from '../src/engines/DragToTarget.svelte';
import Hotspot from '../src/engines/Hotspot.svelte';
import WordBankFill from '../src/engines/WordBankFill.svelte';
import Session from '../src/ui/SessionViewport.svelte';

const correctResult: EvaluationResult = {
  correct: true,
  score: 1,
  maxScore: 1,
  feedbackKey: 'correct',
  masteryEvidence: [],
  knowledgeEvidence: []
};

const common = {
  revision: 1,
  schemaVersion: 1 as const,
  conceptIds: ['test.game-feel'],
  knowledgeRefs: ['kr.test.game-feel'],
  difficulty: 1,
  language: 'en',
  feedback: { correct: 'Correct.', incorrect: 'Try again.' },
  authoring: { status: 'reviewed' as const, source: 'game-feel-test' }
};

function matchingQuestion(): DragToTargetQuestion {
  return {
    ...common,
    id: 'test.game-feel.matching',
    prompt: { text: 'Match each thing.' },
    interaction: {
      type: 'drag_to_target',
      version: 1,
      items: [
        { id: 'alpha', label: 'Alpha' },
        { id: 'bravo', label: 'Bravo' }
      ],
      targets: [
        { id: 'one', label: 'One' },
        { id: 'two', label: 'Two' }
      ]
    },
    solution: { type: 'target_assignment', assignments: { alpha: 'one', bravo: 'two' } }
  };
}

function hotspotQuestion(): HotspotQuestion {
  return {
    ...common,
    id: 'test.game-feel.hotspot',
    prompt: { text: 'Tap the right place.' },
    interaction: {
      type: 'hotspot',
      version: 1,
      selectionMode: 'single',
      board: {
        ariaLabel: 'Test board',
        regions: [
          { id: 'left', label: 'Left place', shape: { type: 'rect', x: 0, y: 0, width: 0.5, height: 1 } },
          { id: 'right', label: 'Right place', shape: { type: 'rect', x: 0.5, y: 0, width: 0.5, height: 1 } }
        ]
      }
    },
    solution: { type: 'selected_regions', correctRegionIds: ['left'] }
  };
}

function fillQuestion(): WordBankFillQuestion {
  return {
    ...common,
    id: 'test.game-feel.fill',
    prompt: { text: 'Complete the sentence.' },
    interaction: {
      type: 'word_bank_fill',
      version: 1,
      segments: [
        { type: 'text', value: 'Plants need ' },
        { type: 'blank', id: 'blank-1' },
        { type: 'text', value: '.' }
      ],
      wordBank: [
        { id: 'sunlight', label: 'sunlight' },
        { id: 'stone', label: 'stone' }
      ]
    },
    solution: { type: 'blank_answers', answers: { 'blank-1': ['sunlight'] } }
  };
}

function choiceQuestion(id = 'test.game-feel.choice', prompt = 'Choose one.'): SingleChoiceQuestion {
  return {
    ...common,
    id,
    prompt: { text: prompt },
    interaction: {
      type: 'single_choice',
      version: 1,
      shuffleOptions: false,
      options: [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' }
      ]
    },
    solution: { type: 'exact_option', correctOptionIds: ['yes'] }
  };
}

function targetButton(label: string): HTMLButtonElement {
  const button = screen.getByText(label).closest('button');
  if (!(button instanceof HTMLButtonElement)) throw new Error(`Missing target button ${label}`);
  return button;
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  document.querySelector('[data-answer-feedback]')?.remove();
});

describe('child game-feel submission policy', () => {
  it('auto-submits matching when the final item is placed during play', async () => {
    const submissions: unknown[] = [];
    render(DragToTarget, {
      props: {
        question: matchingQuestion(),
        submissionMode: 'auto_when_complete',
        checkResponse: () => correctResult,
        onSubmit: (response: unknown) => submissions.push(response)
      }
    });

    expect(screen.queryByRole('button', { name: 'Check answer' })).toBeNull();
    await fireEvent.click(screen.getByRole('button', { name: 'Alpha' }));
    await fireEvent.click(targetButton('One'));
    expect(submissions).toHaveLength(0);

    await fireEvent.click(screen.getByRole('button', { name: 'Bravo' }));
    await fireEvent.click(targetButton('Two'));
    expect(submissions).toHaveLength(1);
  });

  it('keeps matching editable behind an explicit check in assessment mode', async () => {
    const submissions: unknown[] = [];
    render(DragToTarget, {
      props: {
        question: matchingQuestion(),
        submissionMode: 'explicit',
        checkResponse: () => correctResult,
        onSubmit: (response: unknown) => submissions.push(response)
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Alpha' }));
    await fireEvent.click(targetButton('One'));
    await fireEvent.click(screen.getByRole('button', { name: 'Bravo' }));
    await fireEvent.click(targetButton('Two'));
    expect(submissions).toHaveLength(0);

    await fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(submissions).toHaveLength(1);
  });

  it('submits a single hotspot immediately in play but not in explicit assessment mode', async () => {
    const playSubmissions: unknown[] = [];
    const play = render(Hotspot, {
      props: {
        question: hotspotQuestion(),
        submissionMode: 'auto_when_complete',
        checkResponse: () => correctResult,
        onSubmit: (response: unknown) => playSubmissions.push(response)
      }
    });

    expect(screen.queryByRole('button', { name: 'Check answer' })).toBeNull();
    await fireEvent.click(screen.getByRole('button', { name: 'Left place' }));
    expect(playSubmissions).toHaveLength(1);
    play.unmount();

    const assessmentSubmissions: unknown[] = [];
    render(Hotspot, {
      props: {
        question: hotspotQuestion(),
        submissionMode: 'explicit',
        checkResponse: () => correctResult,
        onSubmit: (response: unknown) => assessmentSubmissions.push(response)
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Left place' }));
    expect(assessmentSubmissions).toHaveLength(0);
    await fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(assessmentSubmissions).toHaveLength(1);
  });

  it('auto-submits a completed word-bank fill only in play mode', async () => {
    const playSubmissions: unknown[] = [];
    const play = render(WordBankFill, {
      props: {
        question: fillQuestion(),
        submissionMode: 'auto_when_complete',
        checkResponse: () => correctResult,
        onSubmit: (response: unknown) => playSubmissions.push(response)
      }
    });

    expect(screen.queryByRole('button', { name: 'Check answer' })).toBeNull();
    await fireEvent.click(screen.getByRole('button', { name: 'sunlight' }));
    expect(playSubmissions).toHaveLength(1);
    play.unmount();

    const assessmentSubmissions: unknown[] = [];
    render(WordBankFill, {
      props: {
        question: fillQuestion(),
        submissionMode: 'explicit',
        checkResponse: () => correctResult,
        onSubmit: (response: unknown) => assessmentSubmissions.push(response)
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'sunlight' }));
    expect(assessmentSubmissions).toHaveLength(0);
    await fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(assessmentSubmissions).toHaveLength(1);
  });

  it('auto-continues normal play after the short correct-answer reaction window', async () => {
    vi.useFakeTimers();
    render(Session, {
      props: {
        title: 'Play flow',
        mode: 'free_explore',
        questions: [
          choiceQuestion('test.game-feel.choice-1', 'First choice.'),
          choiceQuestion('test.game-feel.choice-2', 'Second choice.')
        ]
      }
    });

    expect(screen.getByRole('heading', { name: 'First choice.' })).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(screen.getByRole('status').textContent).toContain('Correct.');

    await vi.advanceTimersByTimeAsync(1600);
    expect(screen.getByRole('heading', { name: 'Second choice.' })).toBeTruthy();
  });

  it('keeps incorrect teaching feedback visible until the child explicitly retries', async () => {
    vi.useFakeTimers();
    render(Session, {
      props: {
        title: 'Play correction',
        mode: 'free_explore',
        questions: [
          choiceQuestion('test.game-feel.wrong-1', 'Try this choice.'),
          choiceQuestion('test.game-feel.wrong-2', 'Next choice.')
        ]
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'No' }));
    expect(screen.getByRole('status').textContent).toContain('Try another way.');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();

    await vi.advanceTimersByTimeAsync(5000);
    expect(screen.getByRole('status').textContent).toContain('Try another way.');
    expect(screen.queryByRole('heading', { name: 'Next choice.' })).toBeNull();

    await fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('heading', { name: 'Try this choice.' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Next choice.' })).toBeNull();
  });

  it('keeps celebratory splash feedback out of assessment mode', async () => {
    render(Session, {
      props: {
        title: 'Assessment boundary',
        mode: 'goal_mock',
        questions: [choiceQuestion()],
        sections: [{ id: 'science', title: 'Science', startIndex: 0, count: 1, marksPerQuestion: 1 }]
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(document.querySelector('[data-answer-feedback]')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('Correct.');
    expect(screen.getByRole('button', { name: 'See result' })).toBeTruthy();
  });
});
