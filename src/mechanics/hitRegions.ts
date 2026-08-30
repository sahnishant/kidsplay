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

function boundedSpan(start: number, size: number): { start: number; size: number } {
  const safeStart = Number.isFinite(start) ? start : 0;
  const safeSize = Number.isFinite(size) ? Math.max(0, size) : 0;
  const left = clamp01(safeStart);
  const right = clamp01(safeStart + safeSize);
  return {
    start: Math.min(left, right),
    size: Math.max(0, right - left)
  };
}

export function regionBox(shape: HotspotShape): NormalizedRegionBox {
  if (shape.type === 'circle') {
    const radius = Number.isFinite(shape.radius) ? Math.max(0, shape.radius) : 0;
    const horizontal = boundedSpan(shape.centerX - radius, radius * 2);
    const vertical = boundedSpan(shape.centerY - radius, radius * 2);
    return {
      left: horizontal.start,
      top: vertical.start,
      width: horizontal.size,
      height: vertical.size,
      circular: true
    };
  }

  const horizontal = boundedSpan(shape.x, shape.width);
  const vertical = boundedSpan(shape.y, shape.height);
  return {
    left: horizontal.start,
    top: vertical.start,
    width: horizontal.size,
    height: vertical.size,
    circular: false
  };
}

export const asPercent = (value: number): string => `${clamp01(value) * 100}%`;
