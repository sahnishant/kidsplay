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

function seedGrowthQuestion(): SingleChoiceQuestion {
  return {
    id: 'test.seed.growth.001',
    revision: 1,
    schemaVersion: 1,
    conceptIds: ['plants.parts.seed'],
    knowledgeRefs: ['kr.plants.seed.function.new-plant'],
    difficulty: 1,
    language: 'en',
    prompt: { text: 'Which plant part can grow into a new plant?' },
    interaction: {
      type: 'single_choice',
      version: 1,
      shuffleOptions: false,
      options: [
        { id: 'seed', label: 'Seed' },
        { id: 'flower', label: 'Flower' }
      ]
    },
    solution: { type: 'exact_option', correctOptionIds: ['seed'] },
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

  it('shows experience framing only inside a story mission', () => {
    render(Session, {
      props: {
        title: 'The Forest Trail Mix-Up',
        questions: [seedGrowthQuestion()],
        childName: 'Mira',
        childAvatar: 'fox',
        storyCompletion: {
          text: 'Forest trail restored.',
          rewardLabel: 'Forest Trail Keeper',
          stars: 3
        }
      }
    });

    expect(screen.getByText('Scientu: Try the clue, then notice what happens.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Which plant part can grow into a new plant?' })).toBeTruthy();
  });

  it('does not add story experience framing to ordinary Free Play', () => {
    render(Session, {
      props: {
        title: 'Free Play',
        questions: [seedGrowthQuestion()],
        childName: 'Mira',
        childAvatar: 'fox'
      }
    });

    expect(screen.queryByText('Scientu: Try the clue, then notice what happens.')).toBeNull();
  });

  it('suppresses story experience framing in assessment even if a story completion view is supplied', () => {
    render(Session, {
      props: {
        title: 'Assessment',
        mode: 'goal_mock',
        questions: [seedGrowthQuestion()],
        childName: 'Mira',
        childAvatar: 'fox',
        storyCompletion: {
          text: 'Not used in assessment.',
          rewardLabel: 'None',
          stars: 0
        }
      }
    });

    expect(screen.queryByText('Scientu: Try the clue, then notice what happens.')).toBeNull();
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
    expect(splash?.textContent).toContain('Great!');
    expect(screen.getByRole('button', { name: 'See result' })).toBeTruthy();
  });

  it('shows a clear lost-state reaction and returns to the same item for retry', async () => {
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
    expect(screen.getByRole('status').textContent).toContain('Try another way.');
    const splash = document.querySelector('[data-answer-feedback="incorrect"]');
    expect(splash).toBeTruthy();
    expect(splash?.textContent).toContain('Try again');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(container.querySelector('[data-session-state="answer"]')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Look at the scene and choose the best answer.' })).toBeTruthy();
  });
});