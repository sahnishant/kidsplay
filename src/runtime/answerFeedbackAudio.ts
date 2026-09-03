import { playAnswerCue } from './childAudio';

/**
 * Backward-compatible facade for the Phase-A answer cue. Phase C owns the
 * actual local audio context and master sound gate.
 */
export function playAnswerFeedback(correct: boolean, enabled = true): void {
  playAnswerCue(correct, enabled);
}
