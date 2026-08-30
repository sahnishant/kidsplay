import { describe, expect, it } from 'vitest';
import { asPercent, regionBox } from '../src/mechanics/hitRegions';

describe('hotspot region geometry', () => {
  it('keeps a valid circle unchanged', () => {
    expect(regionBox({ type: 'circle', centerX: 0.5, centerY: 0.5, radius: 0.2 })).toEqual({
      left: 0.3,
      top: 0.3,
      width: 0.39999999999999997,
      height: 0.39999999999999997,
      circular: true
    });
  });

  it('clips an off-board rectangle to the remaining board span', () => {
    expect(regionBox({ type: 'rect', x: 0.9, y: 0.85, width: 0.5, height: 0.4 })).toEqual({
      left: 0.9,
      top: 0.85,
      width: 0.09999999999999998,
      height: 0.15000000000000002,
      circular: false
    });
  });

  it('clips a circle at the edge instead of expanding it beyond the board', () => {
    const box = regionBox({ type: 'circle', centerX: 0.1, centerY: 0.5, radius: 0.25 });
    expect(box.left).toBe(0);
    expect(box.width).toBeCloseTo(0.35);
    expect(box.top).toBeCloseTo(0.25);
    expect(box.height).toBeCloseTo(0.5);
  });

  it('never emits percentages outside the normalized board range', () => {
    expect(asPercent(-4)).toBe('0%');
    expect(asPercent(0.42)).toBe('42%');
    expect(asPercent(8)).toBe('100%');
  });
});
