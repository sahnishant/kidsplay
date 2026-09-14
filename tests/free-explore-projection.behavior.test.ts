import { describe, expect, it } from 'vitest';
import {
  deriveReplayActivityHistory,
  projectFreeExploreReplayTiles
} from '../src/experience/freeExploreProjection';
import type { ProgressSnapshot } from '../src/runtime/localProgress';
import type { AdaptiveActivityInterestSignal } from '../src/runtime/adaptiveInterest';

function progressWithSessions(sessionIds: readonly string[]): ProgressSnapshot {
  return {
    version: 1,
    attempts: sessionIds.map((sessionId, index) => ({
      sessionId,
      questionId: `question.${index}`,
      submittedAt: new Date(Date.UTC(2026, 8, 4, 10, index)).toISOString(),
      durationMs: 1000,
      correct: true,
      score: 1,
      maxScore: 1,
      knowledgeRefs: [`knowledge.${index}`],
      conceptIds: [`concept.${index}`],
      attemptNumber: 1,
      attemptKind: 'independent' as const,
      assistanceKinds: [],
      countsTowardAccuracy: true,
      masteryWeight: 1
    })),
    knowledge: {},
    concepts: {},
    updatedAt: sessionIds.length ? '2026-09-04T10:00:00.000Z' : null
  };
}

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

  it('derives recent play from canonical attempts without pretending a question attempt completed the activity', () => {
    const progress = progressWithSessions(['session.activity.a', 'session.activity.b']);
    const history = deriveReplayActivityHistory([
      { activityRef: 'activity.a', sessionId: 'session.activity.a', available: true },
      { activityRef: 'activity.b', sessionId: 'session.activity.b', available: true },
      { activityRef: 'activity.c', sessionId: 'session.activity.c', available: true }
    ], progress, []);

    expect(history.map(({ activityRef, completionCount, observedActivityCount }) => ({
      activityRef,
      completionCount,
      observedActivityCount
    }))).toEqual([
      { activityRef: 'activity.a', completionCount: 0, observedActivityCount: 1 },
      { activityRef: 'activity.b', completionCount: 0, observedActivityCount: 1 },
      { activityRef: 'activity.c', completionCount: 0, observedActivityCount: 0 }
    ]);
    expect(projectFreeExploreReplayTiles(history)).toEqual([
      { activityRef: 'activity.b', reason: 'recent_play', oneTimeRewardEligible: false },
      { activityRef: 'activity.a', reason: 'recent_play', oneTimeRewardEligible: false }
    ]);
  });

  it('prioritizes an explicit voluntary replay stored in the existing adaptive-interest history', () => {
    const progress = progressWithSessions(['session.activity.a', 'session.activity.b']);
    const signals: AdaptiveActivityInterestSignal[] = [{
      kind: 'voluntary_replay',
      observedAt: '2026-09-04T11:00:00.000Z',
      activityRef: 'activity.a'
    }];
    const history = deriveReplayActivityHistory([
      { activityRef: 'activity.a', sessionId: 'session.activity.a', available: true },
      { activityRef: 'activity.b', sessionId: 'session.activity.b', available: true }
    ], progress, signals);

    expect(projectFreeExploreReplayTiles(history)[0]).toEqual({
      activityRef: 'activity.a',
      reason: 'voluntary_replay',
      oneTimeRewardEligible: false
    });
    expect(history[0].completionCount).toBe(0);
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

  it('rejects duplicate activity descriptors instead of deriving duplicate shelves', () => {
    const progress = progressWithSessions([]);
    const duplicate = { activityRef: 'activity.same', sessionId: 'session.activity.same', available: true };
    expect(() => deriveReplayActivityHistory([duplicate, duplicate], progress, [])).toThrow(/duplicate replay activity/);
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
