import type { HotspotShape } from '../contracts/question';

export interface NormalizedRegionBox {
  left: number;
  top: number;
  width: number;
  height: number;
  circular: boolean;
}

export const isNormalized = (value: number): boolean => Number.isFinite(value) && value >= 0 && value <= 1;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export function regionBox(shape: HotspotShape): NormalizedRegionBox {
  if (shape.type === 'circle') {
    const radius = Math.max(0, shape.radius);
    return {
      left: clamp01(shape.centerX - radius),
      top: clamp01(shape.centerY - radius),
      width: clamp01(radius * 2),
      height: clamp01(radius * 2),
      circular: true
    };
  }

  return {
    left: clamp01(shape.x),
    top: clamp01(shape.y),
    width: clamp01(shape.width),
    height: clamp01(shape.height),
    circular: false
  };
}

export const asPercent = (value: number): string => `${value * 100}%`;
