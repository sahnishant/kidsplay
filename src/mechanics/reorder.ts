import { createSeededRandom, shuffled } from './random';

export function swapItems<T>(values: readonly T[], firstIndex: number, secondIndex: number): T[] {
  if (firstIndex === secondIndex) return [...values];
  if (firstIndex < 0 || secondIndex < 0 || firstIndex >= values.length || secondIndex >= values.length) {
    return [...values];
  }

  const result = [...values];
  [result[firstIndex], result[secondIndex]] = [result[secondIndex], result[firstIndex]];
  return result;
}

export function moveItem<T>(values: readonly T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || fromIndex >= values.length) return [...values];
  const boundedTarget = Math.max(0, Math.min(values.length - 1, toIndex));
  if (boundedTarget === fromIndex) return [...values];

  const result = [...values];
  const [item] = result.splice(fromIndex, 1);
  result.splice(boundedTarget, 0, item);
  return result;
}

export function createShuffledOrder<T>(
  values: readonly T[],
  seed: number,
  visibleKey?: (value: T) => unknown
): T[] {
  const result = shuffled(values, createSeededRandom(seed));
  if (result.length < 2) return result;

  const appearsUnchanged = (candidate: readonly T[]): boolean => candidate.every((value, index) => {
    if (visibleKey) return visibleKey(value) === visibleKey(values[index]);
    return value === values[index];
  });

  if (!appearsUnchanged(result)) return result;

  for (let shift = 1; shift < result.length; shift += 1) {
    const rotated = [...result.slice(shift), ...result.slice(0, shift)];
    if (!appearsUnchanged(rotated)) return rotated;
  }

  // All visible keys are equivalent, so no visually different ordering exists.
  return result;
}
