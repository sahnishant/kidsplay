import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import SemanticVisualPresenter from '../src/presentation/SemanticVisualPresenter.svelte';
import { vocabularyVisualPresentation } from '../src/presentation/semanticVisualPresentation';

const presenterSource = readFileSync(new URL('../src/presentation/SemanticVisualPresenter.svelte', import.meta.url), 'utf8');

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

  it('keeps bounded regular and compact SVG dimensions in the presentation contract', () => {
    expect(presenterSource).toContain('.vocabulary-semantic-scene[data-semantic-depth-mode] .semantic-svg)');
    expect(presenterSource).toContain('height: 158px;');
    expect(presenterSource).toContain('.vocabulary-semantic-scene.compact[data-semantic-depth-mode] .semantic-svg)');
    expect(presenterSource).toContain('height: 120px;');
  });

  it('reserves bounded cue space for direct-entity V6 plans without relying on overlay positioning', () => {
    const { container } = renderVocabulary('tree#n#1');
    const root = container.querySelector<HTMLElement>('[data-vocabulary-sense="tree#n#1"]');
    const cue = container.querySelector<HTMLElement>('[data-semantic-depth-cue]');
    const entity = container.querySelector<HTMLElement>('.direct-entity');

    expect(root).toBeTruthy();
    expect(cue).toBeTruthy();
    expect(entity).toBeTruthy();
    expect(window.getComputedStyle(cue!).position).toBe('static');
    expect(presenterSource).toContain('.vocabulary-semantic-scene[data-semantic-depth-mode] .direct-entity)');
    expect(presenterSource).toContain('height: 132px;');
    expect(presenterSource).toContain('.vocabulary-semantic-scene.compact[data-semantic-depth-mode] .direct-entity)');
    expect(presenterSource).toContain('height: 112px;');
  });

  it('keeps the visible cue decorative while preserving the connected explanation in the root accessible name', () => {
    const { container } = renderVocabulary('village#settlement');
    const root = container.querySelector<HTMLElement>('[data-vocabulary-sense="village#settlement"]');
    const cue = container.querySelector<HTMLElement>('[data-semantic-depth-cue]');

    expect(cue?.getAttribute('aria-hidden')).toBe('true');
    expect(root?.getAttribute('aria-label')).toContain('Connected explanation:');
  });
});