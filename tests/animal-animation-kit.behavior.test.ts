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

  it('keeps presentation variants identity-bound with the intended lightweight motion', () => {
    const expectedVariants = [
      ['animation.variant.dog-excited-state', 'dog', 'hop'],
      ['animation.variant.dog-resting-state', 'dog', 'breathe'],
      ['animation.variant.whale-swim-state', 'whale', 'swim'],
      ['animation.variant.bird-branch-state', 'bird', 'flap'],
      ['animation.variant.cow-grazing-state', 'cow', 'chomp']
    ] as const;

    for (const [visualRef, identityRef, motion] of expectedVariants) {
      const definition = resolveVisualDefinition(visualRef);
      expect(definition?.animationIdentityRef, `${visualRef} identity`).toBe(identityRef);
      expect(definition?.motion, `${visualRef} motion`).toBe(motion);
    }
  });

  it('registers and renders every original prop/context glyph used by the kit', () => {
    const cases = [
      ['animation.dog.excited-ball', 'ball', 'entity.object.ball', '.entity-ball'],
      ['animation.dog.resting-mat', 'mat', 'entity.object.mat', '.entity-mat'],
      ['animation.bird.branch-flap', 'branch', 'entity.nature.branch', '.entity-branch'],
      ['animation.cow.grass-chew', 'grass', 'entity.plant.grass', '.entity-grass']
    ] as const;

    for (const [animationId, partId, visualRef, glyphSelector] of cases) {
      expect(resolveVisualDefinition(visualRef), `${visualRef} should be registered`).toBeTruthy();
      const { container } = render(SemanticAnimation, { props: { animationId } });
      expect(container.querySelector(`[data-animation-id="${animationId}"]`)).toBeTruthy();
      expect(container.querySelector(`[data-part-id="${partId}"][data-visual-ref="${visualRef}"]`)).toBeTruthy();
      expect(container.querySelector(glyphSelector), `${visualRef} should render its original glyph`).toBeTruthy();
      cleanup();
    }
  });

  it('renders the whale context and animal subjects without source-specific renderer code', () => {
    const { container } = render(SemanticAnimation, {
      props: { animationId: 'animation.whale.ocean-swim' }
    });

    expect(container.querySelector('[data-part-role="subject"] [data-visual-ref="animation.variant.whale-swim-state"]')).toBeTruthy();
    expect(container.querySelector('[data-part-id="ocean"][data-visual-ref="entity.habitat.ocean"]')).toBeTruthy();
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
