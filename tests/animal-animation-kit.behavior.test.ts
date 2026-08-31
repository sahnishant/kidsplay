import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import SemanticAnimation from '../src/presentation/SemanticAnimation.svelte';
import {
  getAnimationCompositions,
  resolveAnimationForState
} from '../src/presentation/animationRegistry';
import { resolveVisualDefinition } from '../src/presentation/visualRegistry';

afterEach(() => cleanup());

describe('reusable animal semantic animation kit', () => {
  it('extends the dog identity with excited/ball and resting/mat states', () => {
    const dogStates = getAnimationCompositions().filter((item) => item.semanticRef === 'dog');
    expect(dogStates.length).toBeGreaterThanOrEqual(5);

    expect(resolveAnimationForState({
      semanticRef: 'dog',
      expression: 'excited',
      pose: 'play',
      partVisualRefs: { prop: ['entity.object.ball'] }
    })?.id).toBe('animation.dog.excited-ball');

    expect(resolveAnimationForState({
      semanticRef: 'dog',
      pose: 'rest',
      partVisualRefs: { context: ['entity.object.mat'] }
    })?.id).toBe('animation.dog.resting-mat');
  });

  it('authors whale, bird and cow states on the same generic composition architecture', () => {
    expect(resolveAnimationForState({
      semanticRef: 'whale',
      pose: 'swim',
      partVisualRefs: { context: ['entity.habitat.ocean'] }
    })?.id).toBe('animation.whale.ocean-swim');

    expect(resolveAnimationForState({
      semanticRef: 'bird',
      pose: 'rest',
      partVisualRefs: { context: ['entity.nature.branch'] }
    })?.id).toBe('animation.bird.branch-flap');

    expect(resolveAnimationForState({
      semanticRef: 'cow',
      pose: 'stand',
      partVisualRefs: { prop: ['entity.plant.grass'] }
    })?.id).toBe('animation.cow.grass-chew');
  });

  it('keeps presentation variants identity-bound and registers reusable original props', () => {
    expect(resolveVisualDefinition('animation.variant.dog-excited-state')?.animationIdentityRef).toBe('dog');
    expect(resolveVisualDefinition('animation.variant.whale-swim-state')?.animationIdentityRef).toBe('whale');
    expect(resolveVisualDefinition('animation.variant.bird-branch-state')?.animationIdentityRef).toBe('bird');
    expect(resolveVisualDefinition('animation.variant.cow-grazing-state')?.animationIdentityRef).toBe('cow');

    for (const visualRef of ['entity.object.ball', 'entity.object.mat', 'entity.nature.branch', 'entity.plant.grass']) {
      expect(resolveVisualDefinition(visualRef), `${visualRef} should be registered`).toBeTruthy();
    }
  });

  it('renders authored animal props and contexts without per-question renderer code', () => {
    const { container } = render(SemanticAnimation, {
      props: { animationId: 'animation.cow.grass-chew' }
    });

    expect(container.querySelector('[data-animation-id="animation.cow.grass-chew"]')).toBeTruthy();
    expect(container.querySelector('[data-part-role="subject"] [data-visual-ref="animation.variant.cow-grazing-state"]')).toBeTruthy();
    expect(container.querySelector('[data-part-id="grass"][data-visual-ref="entity.plant.grass"]')).toBeTruthy();
  });

  it('falls back within the requested identity when an authored prop is unavailable', () => {
    const fallback = resolveAnimationForState({
      semanticRef: 'dog',
      expression: 'excited',
      partVisualRefs: { prop: ['entity.object.not-authored'] }
    });
    expect(fallback?.semanticRef).toBe('dog');
    expect(fallback?.id).toBe('animation.dog.excited-ball');

    expect(resolveAnimationForState({
      semanticRef: 'whale',
      partVisualRefs: { prop: ['entity.object.not-authored'] }
    })?.semanticRef).toBe('whale');
  });
});
