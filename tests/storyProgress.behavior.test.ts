import { beforeEach, describe, expect, it } from 'vitest';
import { getStoryLocations, getStoryMission } from '../src/story/storyDirector';
import {
  isStoryLocationComplete,
  isStoryMissionComplete,
  loadStoryProgress,
  recordStoryLocationCompletion,
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

  it('stores open-expedition completion without inventing story stars', () => {
    const forest = getStoryLocations().find((location) => location.id === 'forest');
    expect(forest).toBeTruthy();

    const first = recordStoryLocationCompletion(forest!, 'forest-session-1', '2026-09-01T07:00:00.000Z');
    const replay = recordStoryLocationCompletion(forest!, 'forest-session-2', '2026-09-01T08:00:00.000Z');

    expect(isStoryLocationComplete(first, forest!)).toBe(true);
    expect(first.completedLocations[forest!.id].completions).toBe(1);
    expect(replay.completedLocations[forest!.id].completions).toBe(2);
    expect(storyStarTotal(replay)).toBe(0);
  });

  it('is idempotent for duplicate completion callbacks from the same session', () => {
    const mission = getStoryMission(MISSION_ID);
    recordStoryMissionCompletion(mission, 'same-session', '2026-08-30T14:00:00.000Z');
    const duplicate = recordStoryMissionCompletion(mission, 'same-session', '2026-08-30T14:00:01.000Z');

    expect(duplicate.completedMissions[MISSION_ID].completions).toBe(1);
    expect(duplicate.completedSessionIds).toEqual(['same-session']);
  });

  it('loads older v1 story snapshots without location-completion data', () => {
    window.localStorage.setItem('kidsplay.story-progress.v1', JSON.stringify({
      version: 1,
      completedMissions: {},
      completedSessionIds: ['legacy-session'],
      updatedAt: '2026-08-30T14:00:00.000Z'
    }));

    const loaded = loadStoryProgress();
    expect(loaded.completedLocations).toEqual({});
    expect(loaded.completedSessionIds).toEqual(['legacy-session']);
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
      completedLocations: {
        forest: {
          locationId: 'wrong-location',
          completedAt: 'bad-date',
          completions: 0
        }
      },
      completedSessionIds: [42, '', 'valid-session'],
      updatedAt: 'bad-date'
    }));

    const loaded = loadStoryProgress();
    expect(loaded.completedMissions).toEqual({});
    expect(loaded.completedLocations).toEqual({});
    expect(loaded.completedSessionIds).toEqual(['valid-session']);
    expect(loaded.updatedAt).toBeNull();
    expect(storyStarTotal(loaded)).toBe(0);
  });
});