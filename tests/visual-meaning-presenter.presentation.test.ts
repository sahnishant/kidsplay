import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import VisualMeaningPresenter from '../src/presentation/VisualMeaningPresenter.svelte';
import { resolveVisualMeaningPresentation } from '../src/presentation/vocabularyPresentation';

afterEach(() => cleanup());

describe('VisualMeaningPresenter', () => {
  it('renders a proof-backed child-facing semantic visual from the existing renderer', () => {
    const resolved = resolveVisualMeaningPresentation('enormous#very-large-size');
    expect(resolved).toMatchObject({
      phase: 'explanation',
      derivedMode: 'compare',
      deliveryMode: 'compare',
      visualAllowed: true,
      maturity: 'V5',
      runtimeUsage: 'knowledge_reinforcement'
    });

    const { container } = render(VisualMeaningPresenter, {
      props: {
        senseKey: 'enormous#very-large-size',
        word: 'Enormous',
        meaning: 'Very large.'
      }
    });
    const root = container.querySelector('[data-presentation-key="visual-meaning:v1:enormous#very-large-size"]');
    expect(root).toBeTruthy();
    expect(root?.getAttribute('data-presentation-mode')).toBe('compare');
    expect(root?.getAttribute('data-presentation-phase')).toBe('explanation');
    expect(root?.getAttribute('data-derived-mode')).toBe('compare');
    expect(root?.getAttribute('data-visual-allowed')).toBe('true');
    expect(container.querySelector('[data-visual-meaning-scene]')).toBeTruthy();
    expect(container.querySelector('[data-scene-kind="attribute-contrast"]')).toBeTruthy();
    expect(screen.getByText('Very large.')).toBeTruthy();
  });

  it('does not promote a V3 renderer template proof into a child-facing dictionary visual', () => {
    const resolved = resolveVisualMeaningPresentation('village#settlement');
    expect(resolved).toMatchObject({
      derivedMode: 'compose',
      deliveryMode: 'text',
      visualAllowed: false,
      fallbackReason: 'runtime_not_child_facing',
      maturity: 'V3',
      runtimeUsage: 'template_proof'
    });

    const { container } = render(VisualMeaningPresenter, {
      props: {
        senseKey: 'village#settlement',
        word: 'Village',
        meaning: 'A small settlement where people live.'
      }
    });
    const root = container.querySelector('[data-presentation-key="visual-meaning:v1:village#settlement"]');
    expect(root?.getAttribute('data-presentation-mode')).toBe('text');
    expect(root?.getAttribute('data-derived-mode')).toBe('compose');
    expect(root?.getAttribute('data-visual-fallback')).toBe('runtime_not_child_facing');
    expect(container.querySelector('[data-visual-meaning-scene]')).toBeNull();
    expect(screen.getByText('A small settlement where people live.')).toBeTruthy();
  });

  it('suppresses non-neutral V5 visuals when reused before an assessment answer', () => {
    const resolved = resolveVisualMeaningPresentation('enormous#very-large-size', {
      phase: 'assessment_pre_answer'
    });
    expect(resolved).toMatchObject({
      phase: 'assessment_pre_answer',
      derivedMode: 'compare',
      deliveryMode: 'text',
      visualAllowed: false,
      fallbackReason: 'answer_safety',
      maturity: 'V5'
    });

    const { container } = render(VisualMeaningPresenter, {
      props: {
        senseKey: 'enormous#very-large-size',
        word: 'Enormous',
        meaning: 'Very large.',
        phase: 'assessment_pre_answer'
      }
    });
    const root = container.querySelector('[data-presentation-key="visual-meaning:v1:enormous#very-large-size"]');
    expect(root?.getAttribute('data-presentation-phase')).toBe('assessment_pre_answer');
    expect(root?.getAttribute('data-presentation-mode')).toBe('text');
    expect(root?.getAttribute('data-visual-fallback')).toBe('answer_safety');
    expect(container.querySelector('[data-visual-meaning-scene]')).toBeNull();
  });

  it('falls back to supplied child text when no runtime sense plan exists', () => {
    const { container } = render(VisualMeaningPresenter, {
      props: {
        senseKey: 'bank#unresolved',
        word: 'Bank',
        meaning: 'This meaning still needs review.'
      }
    });
    const root = container.querySelector('[data-presentation-key="visual-meaning:v1:bank#unresolved"]');
    expect(root?.getAttribute('data-presentation-mode')).toBe('text');
    expect(root?.getAttribute('data-visual-allowed')).toBe('false');
    expect(root?.getAttribute('data-visual-fallback')).toBe('runtime_plan_missing');
    expect(container.querySelector('[data-visual-meaning-scene]')).toBeNull();
    expect(screen.getByText('This meaning still needs review.')).toBeTruthy();
  });

  it('keeps glance compact, learn semantic, and explore explicitly deeper', () => {
    const glance = render(VisualMeaningPresenter, {
      props: {
        senseKey: 'enormous#very-large-size',
        word: 'Enormous',
        meaning: 'Very large.',
        example: 'The elephant looked enormous.',
        mode: 'glance'
      }
    });
    expect(glance.container.querySelector('.visual-meaning-presenter.glance')).toBeTruthy();
    expect(glance.queryByText('Very large.')).toBeNull();
    expect(glance.queryByText('The elephant looked enormous.')).toBeNull();
    glance.unmount();

    const learn = render(VisualMeaningPresenter, {
      props: {
        senseKey: 'enormous#very-large-size',
        word: 'Enormous',
        meaning: 'Very large.',
        example: 'The elephant looked enormous.',
        mode: 'learn'
      }
    });
    expect(learn.getByText('Very large.')).toBeTruthy();
    expect(learn.queryByText('The elephant looked enormous.')).toBeNull();
    learn.unmount();

    const explore = render(VisualMeaningPresenter, {
      props: {
        senseKey: 'enormous#very-large-size',
        word: 'Enormous',
        meaning: 'Very large.',
        example: 'The elephant looked enormous.',
        mode: 'explore'
      }
    });
    expect(explore.container.querySelector('.visual-meaning-presenter.explore')).toBeTruthy();
    expect(explore.getByText('Very large.')).toBeTruthy();
    expect(explore.getByText('The elephant looked enormous.')).toBeTruthy();
  });

  it('exposes an optional audio affordance without coupling presentation to an audio source', async () => {
    const onSpeak = vi.fn();
    render(VisualMeaningPresenter, {
      props: {
        senseKey: 'enormous#very-large-size',
        word: 'Enormous',
        meaning: 'Very large.',
        onSpeak
      }
    });
    await fireEvent.click(screen.getByRole('button', { name: 'Hear Enormous' }));
    expect(onSpeak).toHaveBeenCalledTimes(1);
  });
});
