export interface ReplayActivityHistory {
  activityRef: string;
  available: boolean;
  playCount: number;
  voluntaryReplayCount: number;
  completionCount: number;
  /** Existing local use evidence that is not being claimed as completion. */
  observedActivityCount?: number;
  /** Monotonic local sequence supplied by existing activity history; larger is newer. */
  lastPlayedSequence: number;
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
  const observedActivityCount = row.observedActivityCount === undefined ? 0 : assertCount(row.observedActivityCount, `${row.activityRef}.observedActivityCount`);
  const lastPlayedSequence = assertCount(row.lastPlayedSequence, `${row.activityRef}.lastPlayedSequence`);
  if (voluntaryReplayCount > playCount) throw new Error(`${row.activityRef}.voluntaryReplayCount may not exceed playCount`);
  if (completionCount > playCount) throw new Error(`${row.activityRef}.completionCount may not exceed playCount`);
  return { activityRef: row.activityRef, available: row.available, playCount, voluntaryReplayCount, completionCount, observedActivityCount, lastPlayedSequence };
}

function reasonFor(row: ReplayActivityHistory): FreeExploreReplayTile['reason'] | undefined {
  if (row.voluntaryReplayCount > 0) return 'voluntary_replay';
  if (row.playCount >= 3) return 'repeated_play';
  if (row.completionCount > 0) return 'recent_completion';
  if ((row.observedActivityCount ?? 0) > 0) return 'recent_play';
  return undefined;
}

/** Pure projection only: no recommendation store, mastery evidence or reward ledger. */
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
      const priority = { voluntary_replay: 4, repeated_play: 3, recent_completion: 2, recent_play: 1 } as const;
      return priority[right.reason] - priority[left.reason]
        || right.row.voluntaryReplayCount - left.row.voluntaryReplayCount
        || right.row.playCount - left.row.playCount
        || right.row.lastPlayedSequence - left.row.lastPlayedSequence
        || left.row.activityRef.localeCompare(right.row.activityRef);
    })
    .slice(0, maximumTiles)
    .map(({ row, reason }) => ({ activityRef: row.activityRef, reason, oneTimeRewardEligible: false }));
}
