import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import type { SingleChoiceQuestion } from '../src/contracts/question';
import Session from '../src/ui/Session.svelte';

afterEach(() => cleanup());

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

describe('authored visual assessment boundary', () => {
  it('keeps an explicitly authored scene visible from the start inside a structured mock', () => {
    render(Session, {
      props: {
        title: 'Visual Mock',
        questions: [authoredVisualQuestion()],
        sections: [{ id: 'science', title: 'Science', startIndex: 0, count: 1, marksPerQuestion: 1 }],
        childName: 'Explorer',
        childAvatar: 'fox'
      }
    });

    expect(
      screen.getByRole('img', {
        name: 'A worried dog near water, showing that this is not its normal habitat.'
      })
    ).toBeTruthy();
    expect(screen.getByText(/Section: Science/)).toBeTruthy();
  });
});
