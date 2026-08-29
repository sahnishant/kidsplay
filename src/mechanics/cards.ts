import { createSeededRandom, shuffled } from './random';

/**
 * Deterministically shuffle card-like data without adding any game semantics.
 * Memory, matching, flashcards and future card activities can all share this.
 */
export function createShuffledDeck<T>(cards: readonly T[], seed: number): T[] {
  return shuffled(cards, createSeededRandom(seed));
}
