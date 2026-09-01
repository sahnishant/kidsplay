import { shuffled, type RandomSource } from './random';

interface MatchableItem {
  id: string;
}

interface MatchableTarget {
  id: string;
}

function sameOrder<T>(left: readonly T[], right: readonly T[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function rotate<T>(values: readonly T[], offset: number): T[] {
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function positionalMatchCount<TItem extends MatchableItem, TTarget extends MatchableTarget>(
  items: readonly TItem[],
  targets: readonly TTarget[],
  assignments: Readonly<Record<string, string>>
): number {
  const comparableCount = Math.min(items.length, targets.length);
  let matches = 0;

  for (let index = 0; index < comparableCount; index += 1) {
    if (assignments[items[index].id] === targets[index].id) matches += 1;
  }

  return matches;
}

/**
 * Shuffle a presentation list while ensuring a multi-item list never falls back
 * to its authored order just because Fisher-Yates happened to produce identity.
 */
export function shuffledForDisplay<T>(values: readonly T[], random: RandomSource = Math.random): T[] {
  const result = shuffled(values, random);
  if (result.length > 1 && sameOrder(result, values)) return rotate(result, 1);
  return result;
}

/**
 * Build independent source/target orders for matching activities. Beyond normal
 * shuffling, rotate the target order to minimise positionally correct pairs so
 * authored 1→1, 2→2 ordering cannot become an answer hint in the viewport.
 */
export function createMatchingDisplayOrder<
  TItem extends MatchableItem,
  TTarget extends MatchableTarget
>(
  items: readonly TItem[],
  targets: readonly TTarget[],
  assignments: Readonly<Record<string, string>>,
  random: RandomSource = Math.random
): { items: TItem[]; targets: TTarget[] } {
  const displayItems = shuffledForDisplay(items, random);
  const targetBase = shuffledForDisplay(targets, random);

  let bestTargets = targetBase;
  let bestMatchCount = positionalMatchCount(displayItems, bestTargets, assignments);

  for (let offset = 1; offset < targetBase.length && bestMatchCount > 0; offset += 1) {
    const candidate = rotate(targetBase, offset);
    const matchCount = positionalMatchCount(displayItems, candidate, assignments);
    if (matchCount < bestMatchCount) {
      bestTargets = candidate;
      bestMatchCount = matchCount;
    }
  }

  return { items: displayItems, targets: bestTargets };
}
