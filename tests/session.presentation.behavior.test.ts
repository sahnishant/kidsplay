import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import type { SingleChoiceQuestion } from '../src/contracts/question';
import Session from '../src/ui/SessionViewport.svelte';

afterEach(() => {
  cleanup();
  document.querySelector('[data-answer-feedback]')?.remove();
});

function authoredVisualQuestion(): SingleChoiceQuestion {
  return {
    id: 'test.visual.authored.001',
    revision: 1,
    schemaVersion: 1,
    conceptIds: ['animals.dog.habitat'],
    knowledgeRefs: ['kr.animals.dog.domestic'],
    difficulty: 2,
    language: 'en',
    prompt: { text: 'Look at the scene and choose the best answer.' },
    stimulus: { type: 'scene', sceneId: 'scene.dog.wrong-water' },
    interaction: {
      type: 'single_choice',
      version: 1,
      shuffleOptions: false,
      options: [
        { id: 'land', label: 'Land' },
        { id: 'ocean', label: 'Ocean' }
      ]
    },
    solution: { type: 'exact_option', correctOptionIds: ['land'] },
    feedback: { correct: 'Correct.', incorrect: 'Try again.' },
    authoring: { status: 'reviewed', source: 'behavior-test' }
  };
}

describe('viewport session presentation boundary', () => {
  it('keeps an explicitly authored scene visible from the start inside a structured mock', () => {
    const { container } = render(Session, {
      props: {
        title: 'Visual Mock',
        questions: [authoredVisualQuestion()],
        sections: [{ id: 'science', title: 'Science', startIndex: 0, count: 1, marksPerQuestion: 1 }],
        childName: 'Explorer',
        childAvatar: 'fox'
      }
    });

    expect(container.querySelector('[data-session-state="answer"]')).toBeTruthy();
    expect(
      screen.getByRole('img', {
        name: 'A worried dog near water, showing that this is not its normal habitat.'
      })
    ).toBeTruthy();
    expect(screen.getByText(/Section: Science/)).toBeTruthy();
  });

  it('submits on the option tap and replaces the answer surface with a happy reaction', async () => {
    const { container } = render(Session, {
      props: {
        title: 'Visual Practice',
        questions: [authoredVisualQuestion()],
        childName: 'Explorer',
        childAvatar: 'fox'
      }
    });

    expect(container.querySelector('[data-session-state="answer"]')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Look at the scene and choose the best answer.' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Check answer' })).toBeNull();

    await fireEvent.click(screen.getByRole('button', { name: 'Land' }));

    expect(container.querySelector('[data-session-state="reaction"]')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Look at the scene and choose the best answer.' })).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('Correct.');
    const splash = document.querySelector('[data-answer-feedback="correct"]');
    expect(splash).toBeTruthy();
    expect(splash?.textContent).toContain('Correct!');
    expect(screen.getByRole('button', { name: 'See result' })).toBeTruthy();
  });

  it('shows a clear lost-state reaction immediately after a wrong option tap', async () => {
    const { container } = render(Session, {
      props: {
        title: 'Visual Practice',
        questions: [authoredVisualQuestion()],
        childName: 'Explorer',
        childAvatar: 'fox'
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Ocean' }));

    expect(container.querySelector('[data-session-state="reaction"]')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('Try again.');
    const splash = document.querySelector('[data-answer-feedback="incorrect"]');
    expect(splash).toBeTruthy();
    expect(splash?.textContent).toContain('Not quite!');
  });
});
