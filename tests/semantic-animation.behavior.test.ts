import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import SemanticAnimation from '../src/presentation/SemanticAnimation.svelte';
import Scene from '../src/presentation/Scene.svelte';
import {
  getAnimationCompositions,
  resolveAnimationComposition,
  resolveAnimationForState
} from '../src/presentation/animationRegistry';

afterEach(() => cleanup());

describe('semantic animation composition', () => {
  it('stores multiple visual states against one semantic dog identity', () => {
    const dogStates = getAnimationCompositions().filter((item) => item.semanticRef === 'dog');

    expect(dogStates).toHaveLength(3);
    expect(new Set(dogStates.map((item) => item.subject.expression))).toEqual(
      new Set(['happy', 'worried', 'curious'])
    );
    expect(new Set(dogStates.map((item) => item.subject.pose))).toEqual(
      new Set(['stand', 'sit'])
    );
    expect(dogStates.every((item) => item.parts.length >= 2)).toBe(true);
  });

  it('resolves an exact semantic state and gracefully falls back inside the same identity', () => {
    expect(resolveAnimationForState({ semanticRef: 'dog', expression: 'worried', pose: 'stand' })?.id)
      .toBe('animation.dog.worried-water');

    const fallback = resolveAnimationForState({
      semanticRef: 'dog',
      expression: 'neutral',
      pose: 'play',
      theme: 'paper'
    });
    expect(fallback?.semanticRef).toBe('dog');
    expect(fallback?.id).toBe('animation.dog.happy-bone');
    expect(resolveAnimationForState({ semanticRef: 'unknown-animal' })).toBeNull();
  });

  it('renders expression, pose, props and relation cues from content data', () => {
    const { container } = render(SemanticAnimation, {
      props: { animationId: 'animation.dog.worried-water' }
    });

    const animation = container.querySelector('[data-animation-id="animation.dog.worried-water"]');
    expect(animation).toBeTruthy();
    expect(animation?.getAttribute('data-semantic-ref')).toBe('dog');
    expect(animation?.getAttribute('data-expression')).toBe('worried');
    expect(animation?.getAttribute('data-pose')).toBe('stand');
    expect(container.querySelector('[data-part-role="subject"] [data-visual-ref="animation.variant.dog-worried-state"]')).toBeTruthy();
    expect(container.querySelector('[data-part-id="water"][data-visual-ref="entity.habitat.water"]')).toBeTruthy();
    expect(container.querySelector('[data-part-id="question"][data-part-role="relation"]')).toBeTruthy();
    expect(screen.getByRole('img', { name: /worried dog beside water/i })).toBeTruthy();
  });

  it('lets existing scene ids opt into the composition layer without changing scene callers', () => {
    const { container } = render(Scene, { props: { sceneId: 'scene.dog.happy-bone' } });

    expect(resolveAnimationComposition('animation.dog.happy-bone')).toBeTruthy();
    expect(container.querySelector('[data-animation-ref="animation.dog.happy-bone"]')).toBeTruthy();
    expect(container.querySelector('[data-animation-id="animation.dog.happy-bone"]')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'A happy dog beside a bone and a heart on grass.' })).toBeTruthy();
  });
});
