import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import SemanticVisualPresenter from '../src/presentation/SemanticVisualPresenter.svelte';
import {
  animationVisualPresentation,
  recipeVisualPresentation,
  resolveItemVisualPresentation,
  vocabularyVisualPresentation
} from '../src/presentation/semanticVisualPresentation';

afterEach(() => cleanup());

describe('canonical semantic visual presenter', () => {
  it('normalizes interactive items once and renders compound entities through one path', () => {
    const presentation = resolveItemVisualPresentation({
      label: 'Dog and whale',
      visualRefs: ['entity.animal.dog', 'entity.animal.whale']
    });

    expect(presentation).toMatchObject({
      kind: 'entities',
      context: 'option',
      hasVisuals: true,
      compound: true,
      decorative: true
    });

    const { container } = render(SemanticVisualPresenter, {
      props: {
        presentation,
        class: 'test-visuals',
        itemClass: 'test-visual',
        compoundClass: 'test-visuals--compound'
      }
    });

    const group = container.querySelector('[data-semantic-visual-kind="entities"]');
    expect(group?.getAttribute('data-visual-count')).toBe('2');
    expect(group?.classList.contains('test-visuals--compound')).toBe(true);
    expect(container.querySelectorAll('.test-visual')).toHaveLength(2);
    expect(container.querySelector('[data-visual-ref="entity.animal.dog"]')).toBeTruthy();
    expect(container.querySelector('[data-visual-ref="entity.animal.whale"]')).toBeTruthy();
  });

  it('dispatches recipe, animation and exact-sense vocabulary capabilities', () => {
    const recipe = render(SemanticVisualPresenter, {
      props: { presentation: recipeVisualPresentation('recipe.measurement.temperature') }
    });
    expect(recipe.container.querySelector('[data-recipe-id="recipe.measurement.temperature"]')).toBeTruthy();
    recipe.unmount();

    const animation = render(SemanticVisualPresenter, {
      props: { presentation: animationVisualPresentation('animation.dog.happy-bone') }
    });
    expect(animation.container.querySelector('[data-animation-id="animation.dog.happy-bone"]')).toBeTruthy();
    expect(screen.getByRole('img', { name: /happy dog beside a bone/i })).toBeTruthy();
    animation.unmount();

    const vocabulary = render(SemanticVisualPresenter, {
      props: { presentation: vocabularyVisualPresentation('pull#move-toward-by-force') }
    });
    expect(vocabulary.container.querySelector('[data-vocabulary-sense="pull#move-toward-by-force"]')).toBeTruthy();
  });

  it('preserves answer-surface identity-only recipe exposure in the shared item plan', () => {
    const option = resolveItemVisualPresentation({
      label: "Earth's revolution",
      semanticRef: 'earth-revolution'
    });

    expect(option.visualRefs).toEqual(['entity.universe.earth']);
    expect(option.context).toBe('option');
  });
});
