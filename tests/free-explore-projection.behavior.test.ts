import { describe, expect, it } from 'vitest';
import { projectFreeExploreReplayTiles } from '../src/experience/freeExploreProjection';

describe('Free Explore replay projection', () => {
  it('projects at most three child replay tiles from existing local behavior', () => {
    const tiles = projectFreeExploreReplayTiles([
      { activityRef: 'activity.a', available: true, playCount: 4, voluntaryReplayCount: 2, completionCount: 1, lastPlayedSequence: 10 },
      { activityRef: 'activity.b', available: true, playCount: 5, voluntaryReplayCount: 0, completionCount: 1, lastPlayedSequence: 12 },
      { activityRef: 'activity.c', available: true, playCount: 1, voluntaryReplayCount: 0, completionCount: 1, lastPlayedSequence: 13 },
      { activityRef: 'activity.d', available: true, playCount: 9, voluntaryReplayCount: 0, completionCount: 5, lastPlayedSequence: 14 }
    ]);

    expect(tiles).toEqual([
      { activityRef: 'activity.a', reason: 'voluntary_replay', oneTimeRewardEligible: false },
      { activityRef: 'activity.d', reason: 'repeated_play', oneTimeRewardEligible: false },
      { activityRef: 'activity.b', reason: 'repeated_play', oneTimeRewardEligible: false }
    ]);
  });

  it('never recommends unavailable activities', () => {
    expect(projectFreeExploreReplayTiles([
      { activityRef: 'activity.old', available: false, playCount: 99, voluntaryReplayCount: 99, completionCount: 99, lastPlayedSequence: 99 }
    ])).toEqual([]);
  });

  it('does not manufacture a favourite from one unfinished accidental play', () => {
    expect(projectFreeExploreReplayTiles([
      { activityRef: 'activity.once', available: true, playCount: 1, voluntaryReplayCount: 0, completionCount: 0, lastPlayedSequence: 20 }
    ])).toEqual([]);
  });

  it('is deterministic for ties and cannot enable one-time reward farming', () => {
    const input = [
      { activityRef: 'activity.z', available: true, playCount: 3, voluntaryReplayCount: 0, completionCount: 1, lastPlayedSequence: 5 },
      { activityRef: 'activity.a', available: true, playCount: 3, voluntaryReplayCount: 0, completionCount: 1, lastPlayedSequence: 5 }
    ] as const;
    expect(projectFreeExploreReplayTiles(input, 2).map((tile) => tile.activityRef)).toEqual(['activity.a', 'activity.z']);
    expect(projectFreeExploreReplayTiles(input, 2).every((tile) => tile.oneTimeRewardEligible === false)).toBe(true);
  });

  it('rejects duplicate history rows instead of double-counting behavior', () => {
    const duplicate = { activityRef: 'activity.same', available: true, playCount: 3, voluntaryReplayCount: 1, completionCount: 1, lastPlayedSequence: 1 };
    expect(() => projectFreeExploreReplayTiles([duplicate, duplicate])).toThrow(/duplicate activity history/);
  });

  it('rejects non-boolean availability instead of treating malformed state as unavailable', () => {
    const malformed = [{
      activityRef: 'activity.malformed',
      available: 'yes',
      playCount: 3,
      voluntaryReplayCount: 1,
      completionCount: 1,
      lastPlayedSequence: 1
    }] as unknown as Parameters<typeof projectFreeExploreReplayTiles>[0];
    expect(() => projectFreeExploreReplayTiles(malformed)).toThrow(/available must be boolean/);
  });

  it('rejects impossible completion or voluntary-replay counts', () => {
    expect(() => projectFreeExploreReplayTiles([{
      activityRef: 'activity.bad-replays', available: true, playCount: 1, voluntaryReplayCount: 2, completionCount: 0, lastPlayedSequence: 1
    }])).toThrow(/voluntaryReplayCount may not exceed playCount/);
    expect(() => projectFreeExploreReplayTiles([{
      activityRef: 'activity.bad-completions', available: true, playCount: 1, voluntaryReplayCount: 0, completionCount: 2, lastPlayedSequence: 1
    }])).toThrow(/completionCount may not exceed playCount/);
  });
});
