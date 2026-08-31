import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import type { SingleChoiceQuestion } from '../src/contracts/question';
import SemanticAnimation from '../src/presentation/SemanticAnimation.svelte';
import {
  getAnimationCompositions,
  resolveAnimationForState
} from '../src/presentation/animationRegistry';
import { resolveQuestionSceneId } from '../src/presentation/questionScene';
import {
  resolveItemVisualRefs,
  resolveVisualDefinition
} from '../src/presentation/visualRegistry';
import Session from '../src/ui/SessionViewport.svelte';

afterEach(() => cleanup());

function inferredDogQuestion(overrides: Partial<SingleChoiceQuestion> = {}): SingleChoiceQuestion {
  return {
    id: 'test.animation.safety.dog.001',
    revision: 1,
    schemaVersion: 1,
    conceptIds: ['animals.dog.domestic-classification'],
    knowledgeRefs: ['kr.animals.dog.domestic'],
    difficulty: 2,
    language: 'en',
    prompt: { text: 'Which animal can live with people?' },
    interaction: {
      type: 'single_choice',
      version: 1,
      shuffleOptions: false,
      options: [
        { id: 'dog', label: 'Dog' },
        { id: 'whale', label: 'Whale' }
      ]
    },
    solution: { type: 'exact_option', correctOptionIds: ['dog'] },
    feedback: { correct: 'Correct.', incorrect: 'Try again.' },
    authoring: { status: 'reviewed', source: 'behavior-test' },
    ...overrides
  };
}

describe('semantic animation coverage and safety invariants', () => {
  it('keeps visual resolution precedence explicit > semantic > conservative label', () => {
    expect(resolveItemVisualRefs({
      label: 'Cow',
      semanticRef: 'dog',
      visualRefs: ['entity.animal.whale']
    })).toEqual(['entity.animal.whale']);

    expect(resolveItemVisualRefs({ label: 'Cow', semanticRef: 'dog' }))
      .toEqual(['entity.animal.dog']);
    expect(resolveItemVisualRefs({ label: 'Whale' }))
      .toEqual(['entity.animal.whale']);
    expect(resolveItemVisualRefs({ label: 'A whale is the largest animal in this sentence' }))
      .toEqual([]);
  });

  it('never crosses semantic identity when a requested animation state or part is unavailable', () => {
    const fallback = resolveAnimationForState({
      semanticRef: 'dog',
      expression: 'excited',
      orientation: 'front',
      partVisualRefs: { prop: ['entity.object.not-authored'] }
    });
    expect(fallback?.semanticRef).toBe('dog');
    expect(fallback?.id).toBe('animation.dog.excited-ball');
    expect(resolveAnimationForState({ semanticRef: 'not-an-authored-identity' })).toBeNull();
  });

  it('keeps every composition meaningful when motion is disabled', () => {
    const source = readFileSync(new URL('../src/presentation/SemanticAnimation.svelte', import.meta.url), 'utf8');
    expect(source).toContain('@media (prefers-reduced-motion: reduce)');
    expect(source).toContain('animation: none !important');

    for (const composition of getAnimationCompositions()) {
      expect(composition.ariaLabel.trim().length, `${composition.id} needs static accessible meaning`).toBeGreaterThan(0);
      expect(resolveVisualDefinition(composition.subject.variantRef), `${composition.id} subject should resolve`).toBeTruthy();
      for (const part of composition.parts) {
        expect(Boolean(part.visualRef) !== Boolean(part.text?.trim()), `${composition.id}/${part.id} needs one static cue`).toBe(true);
        if (part.visualRef) expect(resolveVisualDefinition(part.visualRef)).toBeTruthy();
      }

      const { container, unmount } = render(SemanticAnimation, { props: { animationId: composition.id } });
      const surface = container.querySelector(`[data-animation-id="${composition.id}"]`);
      expect(surface?.getAttribute('aria-label')).toBe(composition.ariaLabel);
      unmount();
    }
  });

  it('suppresses inferred scenes when assessment presentation disables inference', () => {
    const inferred = inferredDogQuestion();
    expect(resolveQuestionSceneId(inferred)).toBe('scene.dog.happy-bone');
    expect(resolveQuestionSceneId(inferred, false)).toBeNull();

    const explicit = inferredDogQuestion({
      stimulus: { type: 'scene', sceneId: 'scene.dog.wrong-water' }
    });
    expect(resolveQuestionSceneId(explicit, false)).toBe('scene.dog.wrong-water');
  });

  it('shows inferred reinforcement only after a response is committed in free practice', async () => {
    const { container } = render(Session, {
      props: {
        title: 'Free practice',
        questions: [inferredDogQuestion()],
        childName: 'Explorer',
        childAvatar: 'fox'
      }
    });

    expect(container.querySelector('[data-session-state="answer"]')).toBeTruthy();
    expect(container.querySelector('[data-animation-id="animation.dog.happy-bone"]')).toBeNull();

    await fireEvent.click(screen.getByRole('button', { name: 'Dog' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(container.querySelector('[data-session-state="reaction"]')).toBeTruthy();
    expect(container.querySelector('[data-animation-id="animation.dog.happy-bone"]')).toBeTruthy();
  });

  it('does not add inferred reinforcement to a structured assessment reaction', async () => {
    const { container } = render(Session, {
      props: {
        title: 'Structured mock',
        questions: [inferredDogQuestion()],
        sections: [{ id: 'science', title: 'Science', startIndex: 0, count: 1, marksPerQuestion: 1 }],
        childName: 'Explorer',
        childAvatar: 'fox'
      }
    });

    expect(container.querySelector('[data-animation-id="animation.dog.happy-bone"]')).toBeNull();
    await fireEvent.click(screen.getByRole('button', { name: 'Dog' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(container.querySelector('[data-session-state="reaction"]')).toBeTruthy();
    expect(container.querySelector('[data-animation-id="animation.dog.happy-bone"]')).toBeNull();
  });
});
