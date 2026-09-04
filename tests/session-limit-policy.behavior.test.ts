import { describe, expect, it } from 'vitest';
import {
  advanceActiveSessionTime,
  changeSessionLimit,
  createSessionLimitState,
  decideSessionLaunch,
  getSessionBoundary,
  validateSessionLimitState
} from '../src/experience/sessionLimitPolicy';

describe('parent session limit policy', () => {
  it('counts only active deltas supplied by the app and never wall-clock time', () => {
    const initial = createSessionLimitState(10);
    const afterActiveMinute = advanceActiveSessionTime(initial, 60_000);
    expect(afterActiveMinute.activeElapsedMs).toBe(60_000);

    // Background time is deliberately represented by no call to advanceActiveSessionTime.
    const afterBackgroundPeriod = validateSessionLimitState(JSON.parse(JSON.stringify(afterActiveMinute)));
    expect(afterBackgroundPeriod.activeElapsedMs).toBe(60_000);
    expect(getSessionBoundary(afterBackgroundPeriod)).toBe('within_limit');
  });

  it('lets a bounded interaction finish after the limit instead of interrupting the child', () => {
    const atBoundary = advanceActiveSessionTime(createSessionLimitState(10), 10 * 60_000);
    expect(getSessionBoundary(atBoundary)).toBe('limit_reached');
    expect(decideSessionLaunch(atBoundary, { currentInteractionActive: true })).toBe('finish_current_then_stop');
    expect(decideSessionLaunch(atBoundary, { currentInteractionActive: false })).toBe('stop_before_next');
  });

  it('does not launch a long next activity when its estimate exceeds remaining active time', () => {
    const state = advanceActiveSessionTime(createSessionLimitState(15), 14 * 60_000);
    expect(decideSessionLaunch(state, { currentInteractionActive: false, estimatedNextActivityMs: 30_000 })).toBe('allow');
    expect(decideSessionLaunch(state, { currentInteractionActive: false, estimatedNextActivityMs: 90_000 })).toBe('stop_before_next');
  });

  it('survives persistence without storing a wall-clock or timer origin', () => {
    const state = advanceActiveSessionTime(createSessionLimitState(20), 123_456);
    const restored = validateSessionLimitState(JSON.parse(JSON.stringify(state)));
    expect(restored).toEqual(state);
    expect(Object.keys(restored).sort()).toEqual(['activeElapsedMs', 'limitMinutes', 'schemaVersion']);
  });

  it('supports disabling the limit without resetting already-accounted active time', () => {
    const limited = advanceActiveSessionTime(createSessionLimitState(10), 11 * 60_000);
    const unlimited = changeSessionLimit(limited, 'unlimited');
    expect(unlimited.activeElapsedMs).toBe(limited.activeElapsedMs);
    expect(getSessionBoundary(unlimited)).toBe('unrestricted');
    expect(decideSessionLaunch(unlimited, { currentInteractionActive: false, estimatedNextActivityMs: 99_000_000 })).toBe('allow');
  });

  it('fails closed on corrupt persisted state before any transition or launch decision', () => {
    const corrupt = { schemaVersion: 1, limitMinutes: 10, activeElapsedMs: -1 } as const;
    expect(() => validateSessionLimitState(corrupt)).toThrow(/non-negative/);
    expect(() => advanceActiveSessionTime(corrupt, 1)).toThrow(/non-negative/);
    expect(() => changeSessionLimit(corrupt, 20)).toThrow(/non-negative/);
    expect(() => decideSessionLaunch(corrupt, { currentInteractionActive: false })).toThrow(/non-negative/);
  });

  it('rejects non-boolean activity state and finite-counter overflow', () => {
    const malformedInput = { currentInteractionActive: 'yes' } as unknown as Parameters<typeof decideSessionLaunch>[1];
    expect(() => decideSessionLaunch(createSessionLimitState(10), malformedInput)).toThrow(/must be boolean/);
    expect(() => advanceActiveSessionTime({
      schemaVersion: 1,
      limitMinutes: 10,
      activeElapsedMs: Number.MAX_VALUE
    }, Number.MAX_VALUE)).toThrow(/overflowed/);
  });
});
