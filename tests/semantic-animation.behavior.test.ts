import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import SemanticAnimation from '../src/presentation/SemanticAnimation.svelte';
import Scene from '../src/presentation/Scene.svelte';
import {
  getAnimationCompositions,
  resolveAnimationComposition,
  resolveAnimationForState
} from '../src/presentation/animationRegistry';
import { resolveVisualDefinition } from '../src/presentation/visualRegistry';

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
    expect(dogStates.every((item) => item.subject.orientation === 'side')).toBe(true);
    expect(dogStates.every((item) => item.parts.length >= 2)).toBe(true);
  });

  it('binds presentation-only subject variants to the same semantic identity', () => {
    for (const composition of getAnimationCompositions()) {
      const subjectVisual = resolveVisualDefinition(composition.subject.variantRef);
      expect(subjectVisual).toBeTruthy();
      expect(subjectVisual?.animationIdentityRef).toBe(composition.semanticRef);
    }
  });

  it('resolves exact identity/state/part combinations and ranks partial matches safely', () => {
    expect(resolveAnimationForState({
      semanticRef: 'dog',
      expression: 'worried',
      pose: 'stand',
      orientation: 'side',
      partVisualRefs: { context: ['entity.habitat.water'] }
    })?.id).toBe('animation.dog.worried-water');

    expect(resolveAnimationForState({
      semanticRef: 'dog',
      expression: 'happy',
      pose: 'stand',
      orientation: 'side',
      partVisualRefs: { prop: ['entity.object.bone'] }
    })?.id).toBe('animation.dog.happy-bone');

    const themeFallback = resolveAnimationForState({
      semanticRef: 'dog',
      expression: 'neutral',
      pose: 'play',
      orientation: 'front',
      theme: 'paper',
      partVisualRefs: { prop: ['entity.object.bone'] }
    });
    expect(themeFallback?.semanticRef).toBe('dog');
    expect(themeFallback?.id).toBe('animation.dog.curious-bone');

    const missingPropFallback = resolveAnimationForState({
      semanticRef: 'dog',
      expression: 'worried',
      partVisualRefs: { prop: ['entity.object.ball'] }
    });
    expect(missingPropFallback?.semanticRef).toBe('dog');
    expect(missingPropFallback?.id).toBe('animation.dog.worried-water');
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
    expect(animation?.getAttribute('data-orientation')).toBe('side');
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
