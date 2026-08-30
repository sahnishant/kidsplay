import { beforeEach, describe, expect, it } from 'vitest';
import { getStoryMission } from '../src/story/storyDirector';
import {
  isStoryMissionComplete,
  loadStoryProgress,
  recordStoryMissionCompletion,
  storyStarTotal
} from '../src/story/storyProgress';

const MISSION_ID = 'mission.puppy-by-pond';

beforeEach(() => {
  window.localStorage.clear();
});

describe('story progress persistence', () => {
  it('stores story completion separately and awards a mission reward once', () => {
    const mission = getStoryMission(MISSION_ID);
    const first = recordStoryMissionCompletion(mission, 'story-session-1', '2026-08-30T14:00:00.000Z');
    const replay = recordStoryMissionCompletion(mission, 'story-session-2', '2026-08-30T15:00:00.000Z');

    expect(isStoryMissionComplete(first, MISSION_ID)).toBe(true);
    expect(first.completedMissions[MISSION_ID].completions).toBe(1);
    expect(replay.completedMissions[MISSION_ID].completions).toBe(2);
    expect(storyStarTotal(replay)).toBe(mission.reward.stars);
  });

  it('is idempotent for duplicate completion callbacks from the same session', () => {
    const mission = getStoryMission(MISSION_ID);
    recordStoryMissionCompletion(mission, 'same-session', '2026-08-30T14:00:00.000Z');
    const duplicate = recordStoryMissionCompletion(mission, 'same-session', '2026-08-30T14:00:01.000Z');

    expect(duplicate.completedMissions[MISSION_ID].completions).toBe(1);
    expect(duplicate.completedSessionIds).toEqual(['same-session']);
  });

  it('fails closed around corrupt local story state', () => {
    window.localStorage.setItem('kidsplay.story-progress.v1', JSON.stringify({
      version: 1,
      completedMissions: {
        [MISSION_ID]: {
          missionId: MISSION_ID,
          completedAt: 'not-a-date',
          completions: -5,
          rewardId: '',
          starsAwarded: 999
        }
      },
      completedSessionIds: [42, '', 'valid-session'],
      updatedAt: 'bad-date'
    }));

    const loaded = loadStoryProgress();
    expect(loaded.completedMissions).toEqual({});
    expect(loaded.completedSessionIds).toEqual(['valid-session']);
    expect(loaded.updatedAt).toBeNull();
    expect(storyStarTotal(loaded)).toBe(0);
  });
});
