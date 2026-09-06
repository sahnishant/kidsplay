// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/svelte';
import StudioScene from '../src/presentation/StudioScene.svelte';
import LazyStudioScene from '../src/presentation/LazyStudioScene.svelte';
import visuals from '../content/visuals/studio-scenes.json';

afterEach(cleanup);
describe('shared illustration families', () => {
  it.each(visuals)('renders $glyph without answer text or interactive controls', (visual) => {
    const view = render(StudioScene, { icon: visual.glyph });
    const scene = view.container.querySelector('[data-studio-scene]')!;
    expect(scene.getAttribute('data-studio-scene')).toBe(visual.glyph);
    const canvas = scene.querySelector('svg')!;
    expect(canvas.getAttribute('viewBox')).toBe('0 0 320 200');
    expect(canvas.getAttribute('aria-hidden')).toBe('true');
    expect(canvas.querySelectorAll('path,circle,ellipse,rect').length).toBeGreaterThan(8);
    expect(scene.querySelectorAll('button,a,input,text')).toHaveLength(0);
  });
  it('fails closed for unsupported glyphs rather than showing an unrelated default', () => {
    expect(render(StudioScene, { icon: 'unreviewed-new-stage' }).container.querySelector('svg')).toBeNull();
  });
  it('loads lazily and changes the visual when a reused view changes stage', async () => {
    const view = render(LazyStudioScene, { icon: 'day-sunrise' });
    await waitFor(() => expect(view.container.querySelector('[data-studio-scene="day-sunrise"]')).not.toBeNull());
    await view.rerender({ icon: 'day-midnight' });
    expect(view.container.querySelector('[data-studio-scene="day-sunrise"]')).toBeNull();
    expect(view.container.querySelector('[data-studio-scene="day-midnight"]')).not.toBeNull();
  });
  it('keeps the canonical Dheu persona in all four story scenes', () => {
    for (const visual of visuals.filter((item) => item.glyph.startsWith('visit-'))) {
      const view = render(StudioScene, { icon: visual.glyph });
      expect(view.container.querySelector('.studio-scene__hero svg')).not.toBeNull();
      view.unmount();
    }
  });
});
