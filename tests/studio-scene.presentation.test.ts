// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/svelte';
import StudioScene from '../src/presentation/StudioScene.svelte';
import LazyStudioScene from '../src/presentation/LazyStudioScene.svelte';
import visuals from '../content/visuals/studio-scenes.json';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe('shared illustration families', () => {
  it.each(visuals)('renders $glyph without answer text or interactive controls', async (visual) => {
    const view = render(StudioScene, { icon: visual.glyph });
    await waitFor(() => {
      const scene = view.container.querySelector('[data-studio-scene]')!;
      expect(scene.getAttribute('data-studio-scene')).toBe(visual.glyph);
      const canvas = scene.querySelector('svg')!;
      expect(canvas.getAttribute('viewBox')).toBe('0 0 320 200');
      expect(canvas.getAttribute('aria-hidden')).toBe('true');
      // Check the actual SVG children after the reactive construction settles.
      // Include the canvas in a failure so malformed markup is not mistaken
      // for a selector/timing problem or hidden by weakening the assertion.
      const rectangles = Array.from(canvas.getElementsByTagName('rect'));
      const background = rectangles.find((rect) => rect.getAttribute('width') === '318' && rect.getAttribute('height') === '198');
      expect(background, `${visual.glyph}: ${canvas.outerHTML}`).toBeDefined();
      expect(canvas.getElementsByTagName('path').length).toBeGreaterThan(2);
      expect(scene.querySelectorAll('button,a,input,text')).toHaveLength(0);
    });
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
  it('pauses only mounted studio SVG timelines and reapplies after a stage change', async () => {
    const paused: Element[] = [];
    const descriptor = Object.getOwnPropertyDescriptor(SVGSVGElement.prototype, 'pauseAnimations');
    Object.defineProperty(SVGSVGElement.prototype, 'pauseAnimations', { configurable: true, value: function(this: SVGSVGElement) { paused.push(this); } });
    try {
      const view = render(LazyStudioScene, { icon: 'visit-arrive' });
      await waitFor(() => expect(paused.some((svg) => svg.getAttribute('data-character') === 'dheu')).toBe(true));
      expect(paused.every((svg) => view.container.contains(svg))).toBe(true);
      const previous = paused.length;
      await view.rerender({ icon: 'visit-draw' });
      await waitFor(() => expect(paused.length).toBeGreaterThan(previous));
      view.unmount();
    } finally {
      if (descriptor) Object.defineProperty(SVGSVGElement.prototype, 'pauseAnimations', descriptor);
      else Reflect.deleteProperty(SVGSVGElement.prototype, 'pauseAnimations');
    }
  });
});
