import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import VisualMeaningPresenter from '../src/presentation/VisualMeaningPresenter.svelte';

afterEach(() => cleanup());

describe('VisualMeaningPresenter accessibility contract', () => {
  it('names the word, caller-supplied meaning and visual role without sourcing editorial text itself', () => {
    const { container } = render(VisualMeaningPresenter, {
      props: {
        senseKey: 'enormous#very-large-size',
        word: 'Enormous',
        meaning: 'Very large.'
      }
    });

    const presenter = container.querySelector('article.visual-meaning-presenter');
    expect(presenter?.getAttribute('aria-label')).toBe('Meaning of Enormous: Very large.');
    expect(presenter?.getAttribute('data-copy-authority')).toBe('caller');
    expect(screen.getByRole('group', { name: 'Visual explanation for Enormous' })).toBeTruthy();
  });

  it('keeps glance naming compact because the child meaning is intentionally hidden', () => {
    const { container } = render(VisualMeaningPresenter, {
      props: {
        senseKey: 'enormous#very-large-size',
        word: 'Enormous',
        meaning: 'Very large.',
        mode: 'glance'
      }
    });

    const presenter = container.querySelector('article.visual-meaning-presenter');
    expect(presenter?.getAttribute('aria-label')).toBe('Meaning of Enormous');
    expect(screen.queryByText('Very large.')).toBeNull();
  });

  it('retains an accessible text meaning when visual authority is unavailable', () => {
    const { container } = render(VisualMeaningPresenter, {
      props: {
        senseKey: 'bank#unresolved',
        word: 'Bank',
        meaning: 'This meaning still needs review.'
      }
    });

    const presenter = container.querySelector('article.visual-meaning-presenter');
    expect(presenter?.getAttribute('aria-label')).toBe('Meaning of Bank: This meaning still needs review.');
    expect(container.querySelector('[data-visual-meaning-scene]')).toBeNull();
    expect(screen.getByText('This meaning still needs review.')).toBeTruthy();
  });
});
