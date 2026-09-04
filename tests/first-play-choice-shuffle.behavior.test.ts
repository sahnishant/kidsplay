import { describe, expect, it } from 'vitest';
import { createSeededRandom, shuffled } from '../src/mechanics/random';

describe('First Play / visual-choice visible shuffling', () => {
  it('can place the same correct option in different visible positions across session seeds', () => {
    const options = ['correct', 'other'];
    const seenPositions = new Set<number>();

    for (let seed = 1; seed <= 64; seed += 1) {
      seenPositions.add(shuffled(options, createSeededRandom(seed)).indexOf('correct'));
    }

    expect([...seenPositions].sort()).toEqual([0, 1]);
  });

  it('preserves candidate identity while changing only visible order', () => {
    const options = ['a', 'b', 'c', 'd'];
    const ordered = shuffled(options, createSeededRandom(27));
    expect(new Set(ordered)).toEqual(new Set(options));
    expect(ordered).toHaveLength(options.length);
  });
});
