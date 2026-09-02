import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import SemanticVisualPresenter from '../src/presentation/SemanticVisualPresenter.svelte';
import { vocabularyVisualPresentation } from '../src/presentation/semanticVisualPresentation';

afterEach(() => cleanup());

function renderVocabulary(senseKey: string, compact = false) {
  return render(SemanticVisualPresenter, {
    props: { presentation: vocabularyVisualPresentation(senseKey, compact) }
  });
}

describe('V6 semantic-depth cue layout', () => {
  it('keeps the connected-explanation cue in flow instead of covering semantic SVG artwork', () => {
    const { container } = renderVocabulary('village#settlement');
    const root = container.querySelector<HTMLElement>('[data-vocabulary-sense="village#settlement"]');
    const cue = container.querySelector<HTMLElement>('[data-semantic-depth-cue]');
    const svg = container.querySelector<SVGElement>('.semantic-svg');

    expect(root).toBeTruthy();
    expect(cue).toBeTruthy();
    expect(svg).toBeTruthy();
    expect(window.getComputedStyle(cue!).position).toBe('static');
  });

  it('preserves the compact semantic-scene contract while the cue remains in flow', () => {
    const { container } = renderVocabulary('village#settlement', true);
    const root = container.querySelector<HTMLElement>('[data-vocabulary-sense="village#settlement"]');
    const cue = container.querySelector<HTMLElement>('[data-semantic-depth-cue]');
    const svg = container.querySelector<SVGElement>('.semantic-svg');

    expect(root).toBeTruthy();
    expect(root?.classList.contains('compact')).toBe(true);
    expect(svg).toBeTruthy();
    expect(window.getComputedStyle(cue!).position).toBe('static');
  });

  it('keeps direct-entity V6 plans rendered with the cue outside overlay positioning', () => {
    const { container } = renderVocabulary('tree#n#1');
    const root = container.querySelector<HTMLElement>('[data-vocabulary-sense="tree#n#1"]');
    const cue = container.querySelector<HTMLElement>('[data-semantic-depth-cue]');
    const entity = container.querySelector<HTMLElement>('.direct-entity');

    expect(root).toBeTruthy();
    expect(cue).toBeTruthy();
    expect(entity).toBeTruthy();
    expect(window.getComputedStyle(cue!).position).toBe('static');
  });

  it('keeps the visible cue decorative while preserving the connected explanation in the root accessible name', () => {
    const { container } = renderVocabulary('village#settlement');
    const root = container.querySelector<HTMLElement>('[data-vocabulary-sense="village#settlement"]');
    const cue = container.querySelector<HTMLElement>('[data-semantic-depth-cue]');

    expect(cue?.getAttribute('aria-hidden')).toBe('true');
    expect(root?.getAttribute('aria-label')).toContain('Connected explanation:');
  });
});