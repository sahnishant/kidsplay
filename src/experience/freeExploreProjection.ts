import type { ProgressSnapshot } from '../runtime/localProgress';
import type { AdaptiveActivityInterestSignal } from '../runtime/adaptiveInterest';

export interface ReplayActivityHistory {
  activityRef: string;
  available: boolean;
  playCount: number;
  voluntaryReplayCount: number;
  completionCount: number;
  /** Existing local activity evidence without pretending it was a completed session. */
  observedActivityCount?: number;
  /** Monotonic local sequence supplied by existing activity history; larger is newer. */
  lastPlayedSequence: number;
}

export interface ReplayActivityDescriptor {
  activityRef: string;
  sessionId: string;
  available: boolean;
}

export interface FreeExploreReplayTile {
  activityRef: string;
  reason: 'voluntary_replay' | 'repeated_play' | 'recent_completion' | 'recent_play';
  oneTimeRewardEligible: false;
}

const STABLE_REF = /^[a-z0-9]+(?:[._:#-][a-z0-9]+)*$/i;

function assertCount(value: number, context: string): number {
  if (!Number.isInteger(value) || value < 0) throw new Error(`${context} must be a non-negative integer`);
  return value;
}

function validateHistory(row: ReplayActivityHistory): ReplayActivityHistory {
  if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('Replay activity history must be an object');
  if (typeof row.activityRef !== 'string' || !STABLE_REF.test(row.activityRef)) throw new Error('activityRef must be a stable ref');
  if (typeof row.available !== 'boolean') throw new Error(`${row.activityRef}.available must be boolean`);
  const playCount = assertCount(row.playCount, `${row.activityRef}.playCount`);
  const voluntaryReplayCount = assertCount(row.voluntaryReplayCount, `${row.activityRef}.voluntaryReplayCount`);
  const completionCount = assertCount(row.completionCount, `${row.activityRef}.completionCount`);
  const observedActivityCount = row.observedActivityCount === undefined
    ? 0
    : assertCount(row.observedActivityCount, `${row.activityRef}.observedActivityCount`);
  const lastPlayedSequence = assertCount(row.lastPlayedSequence, `${row.activityRef}.lastPlayedSequence`);
  if (voluntaryReplayCount > playCount) throw new Error(`${row.activityRef}.voluntaryReplayCount may not exceed playCount`);
  if (completionCount > playCount) throw new Error(`${row.activityRef}.completionCount may not exceed playCount`);
  return {
    activityRef: row.activityRef,
    available: row.available,
    playCount,
    voluntaryReplayCount,
    completionCount,
    observedActivityCount,
    lastPlayedSequence
  };
}

function reasonFor(row: ReplayActivityHistory): FreeExploreReplayTile['reason'] | undefined {
  if (row.voluntaryReplayCount > 0) return 'voluntary_replay';
  if (row.playCount >= 3) return 'repeated_play';
  if (row.completionCount > 0) return 'recent_completion';
  if ((row.observedActivityCount ?? 0) > 0) return 'recent_play';
  return undefined;
}

function safeTimestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

/**
 * Builds replay input from authorities that already exist: canonical attempt
 * history plus the bounded adaptive-interest store. A question attempt proves
 * only that an activity was used; it is deliberately not promoted to a
 * completed activity. Explicit replay signals are presentation preference only.
 */
export function deriveReplayActivityHistory(
  activities: readonly ReplayActivityDescriptor[],
  progress: ProgressSnapshot,
  interestSignals: readonly AdaptiveActivityInterestSignal[]
): ReplayActivityHistory[] {
  if (!Array.isArray(activities)) throw new Error('Replay activity descriptors must be an array');
  if (!progress || typeof progress !== 'object' || !Array.isArray(progress.attempts)) {
    throw new Error('Replay projection requires canonical progress attempts');
  }
  if (!Array.isArray(interestSignals)) throw new Error('Replay projection requires interest signals');

  const seen = new Set<string>();
  return activities.map((activity) => {
    if (!activity || typeof activity !== 'object' || Array.isArray(activity)) {
      throw new Error('Replay activity descriptor must be an object');
    }
    if (typeof activity.activityRef !== 'string' || !STABLE_REF.test(activity.activityRef)) {
      throw new Error('activityRef must be a stable ref');
    }
    if (seen.has(activity.activityRef)) throw new Error(`duplicate replay activity ${activity.activityRef}`);
    seen.add(activity.activityRef);
    if (typeof activity.sessionId !== 'string' || activity.sessionId.length === 0) {
      throw new Error(`${activity.activityRef}.sessionId must be non-empty`);
    }
    if (typeof activity.available !== 'boolean') throw new Error(`${activity.activityRef}.available must be boolean`);

    const attempts = progress.attempts.filter((attempt) => attempt.sessionId === activity.sessionId);
    const replaySignals = interestSignals.filter((signal) =>
      signal.kind === 'voluntary_replay' && signal.activityRef === activity.activityRef
    );
    const timestamps = [
      ...attempts.map((attempt) => safeTimestamp(attempt.submittedAt)),
      ...replaySignals.map((signal) => safeTimestamp(signal.observedAt))
    ].filter((value) => value > 0);
    const observedActivityCount = attempts.length > 0 ? 1 : 0;
    const voluntaryReplayCount = replaySignals.length;
    const playCount = Math.max(
      observedActivityCount,
      voluntaryReplayCount > 0 ? voluntaryReplayCount + 1 : 0
    );

    return {
      activityRef: activity.activityRef,
      available: activity.available,
      playCount,
      voluntaryReplayCount,
      completionCount: 0,
      observedActivityCount,
      lastPlayedSequence: timestamps.length ? Math.max(...timestamps) : 0
    };
  });
}

/**
 * Pure projection from existing local play history. It creates no recommendation
 * store, mastery evidence or replay-reward ledger of its own.
 */
export function projectFreeExploreReplayTiles(
  history: readonly ReplayActivityHistory[],
  maximumTiles = 3
): FreeExploreReplayTile[] {
  if (!Array.isArray(history)) throw new Error('Replay activity history must be an array');
  if (!Number.isInteger(maximumTiles) || maximumTiles < 0) throw new Error('maximumTiles must be a non-negative integer');

  const validated = history.map(validateHistory);
  const seen = new Set<string>();
  for (const row of validated) {
    if (seen.has(row.activityRef)) throw new Error(`duplicate activity history for ${row.activityRef}`);
    seen.add(row.activityRef);
  }

  return validated
    .filter((row) => row.available)
    .map((row) => ({ row, reason: reasonFor(row) }))
    .filter((item): item is { row: ReplayActivityHistory; reason: FreeExploreReplayTile['reason'] } => Boolean(item.reason))
    .sort((left, right) => {
      const reasonPriority = { voluntary_replay: 4, repeated_play: 3, recent_completion: 2, recent_play: 1 } as const;
      return reasonPriority[right.reason] - reasonPriority[left.reason]
        || right.row.voluntaryReplayCount - left.row.voluntaryReplayCount
        || right.row.playCount - left.row.playCount
        || right.row.lastPlayedSequence - left.row.lastPlayedSequence
        || left.row.activityRef.localeCompare(right.row.activityRef);
    })
    .slice(0, maximumTiles)
    .map(({ row, reason }) => ({
      activityRef: row.activityRef,
      reason,
      oneTimeRewardEligible: false
    }));
}
