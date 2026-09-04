export type SessionLimitMinutes = 10 | 15 | 20 | 30 | 'unlimited';

export interface SessionLimitState {
  schemaVersion: 1;
  limitMinutes: SessionLimitMinutes;
  activeElapsedMs: number;
}

export type SessionBoundary = 'unrestricted' | 'within_limit' | 'limit_reached';
export type SessionLaunchDecision = 'allow' | 'finish_current_then_stop' | 'stop_before_next';

const MINUTE_MS = 60_000;

function assertFiniteNonNegative(value: number, context: string): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${context} must be a finite non-negative number`);
  return value;
}

function isSessionLimitMinutes(value: unknown): value is SessionLimitMinutes {
  return value === 'unlimited' || value === 10 || value === 15 || value === 20 || value === 30;
}

export function createSessionLimitState(limitMinutes: SessionLimitMinutes): SessionLimitState {
  if (!isSessionLimitMinutes(limitMinutes)) throw new Error('Unsupported session limit');
  return { schemaVersion: 1, limitMinutes, activeElapsedMs: 0 };
}

/** A persistence-safe snapshot: no Date.now() or monotonic clock origin is stored. */
export function validateSessionLimitState(value: unknown): SessionLimitState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Session limit state must be an object');
  const raw = value as Record<string, unknown>;
  if (raw.schemaVersion !== 1) throw new Error('Session limit state must use schemaVersion 1');
  if (!isSessionLimitMinutes(raw.limitMinutes)) throw new Error('Unsupported session limit');
  if (typeof raw.activeElapsedMs !== 'number') throw new Error('activeElapsedMs must be a number');
  return {
    schemaVersion: 1,
    limitMinutes: raw.limitMinutes,
    activeElapsedMs: assertFiniteNonNegative(raw.activeElapsedMs, 'activeElapsedMs')
  };
}

/**
 * Adds foreground/active time only. Background and hidden time must not call
 * this function, so wall-clock time never leaks into session accounting.
 */
export function advanceActiveSessionTime(state: SessionLimitState, activeDeltaMs: number): SessionLimitState {
  const current = validateSessionLimitState(state);
  const delta = assertFiniteNonNegative(activeDeltaMs, 'activeDeltaMs');
  const activeElapsedMs = current.activeElapsedMs + delta;
  if (!Number.isFinite(activeElapsedMs)) throw new Error('activeElapsedMs overflowed the finite session counter');
  return {
    ...current,
    activeElapsedMs
  };
}

export function getSessionLimitMs(state: SessionLimitState): number | undefined {
  const current = validateSessionLimitState(state);
  return current.limitMinutes === 'unlimited' ? undefined : current.limitMinutes * MINUTE_MS;
}

export function getSessionBoundary(state: SessionLimitState): SessionBoundary {
  const current = validateSessionLimitState(state);
  if (current.limitMinutes === 'unlimited') return 'unrestricted';
  const limitMs = current.limitMinutes * MINUTE_MS;
  return current.activeElapsedMs >= limitMs ? 'limit_reached' : 'within_limit';
}

/**
 * Existing bounded child work is always allowed to finish. New work is gated
 * against remaining active time rather than interrupted at an arbitrary wall-clock second.
 */
export function decideSessionLaunch(
  state: SessionLimitState,
  input: { currentInteractionActive: boolean; estimatedNextActivityMs?: number }
): SessionLaunchDecision {
  const current = validateSessionLimitState(state);
  if (!input || typeof input.currentInteractionActive !== 'boolean') {
    throw new Error('currentInteractionActive must be boolean');
  }
  if (current.limitMinutes === 'unlimited') return 'allow';
  const limitMs = current.limitMinutes * MINUTE_MS;
  if (input.currentInteractionActive) {
    return current.activeElapsedMs >= limitMs ? 'finish_current_then_stop' : 'allow';
  }
  if (current.activeElapsedMs >= limitMs) return 'stop_before_next';

  if (input.estimatedNextActivityMs !== undefined) {
    const estimate = assertFiniteNonNegative(input.estimatedNextActivityMs, 'estimatedNextActivityMs');
    if (current.activeElapsedMs + estimate > limitMs) return 'stop_before_next';
  }
  return 'allow';
}

export function changeSessionLimit(state: SessionLimitState, limitMinutes: SessionLimitMinutes): SessionLimitState {
  const current = validateSessionLimitState(state);
  if (!isSessionLimitMinutes(limitMinutes)) throw new Error('Unsupported session limit');
  return { ...current, limitMinutes };
}
