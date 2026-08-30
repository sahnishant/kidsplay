import { describe, expect, it } from 'vitest';
import { getStoryLocations, getStoryMission } from '../src/story/storyDirector';
import {
  isStoryLocationUnlocked,
  storyUnlockedLocationCount,
  type StoryProgressSnapshot
} from '../src/story/storyProgress';

function progressWith(...missionIds: string[]): StoryProgressSnapshot {
  return {
    version: 1,
    completedMissions: Object.fromEntries(missionIds.map((missionId, index) => {
      const mission = getStoryMission(missionId);
      return [missionId, {
        missionId,
        completedAt: `2026-08-30T1${index}:00:00.000Z`,
        completions: 1,
        rewardId: mission.reward.id,
        starsAwarded: mission.reward.stars
      }];
    })),
    completedSessionIds: missionIds.map((missionId, index) => `${missionId}.session.${index}`),
    updatedAt: missionIds.length ? '2026-08-30T14:00:00.000Z' : null
  };
}

describe('story-only world arc', () => {
  it('opens locations in a persistent mission sequence without consulting curriculum mastery', () => {
    const locations = getStoryLocations();
    const lab = locations.find((location) => location.id === 'scientu-lab')!;
    const hideout = locations.find((location) => location.id === 'shaitanu-hideout')!;
    const observatory = locations.find((location) => location.id === 'observatory')!;
    const town = locations.find((location) => location.id === 'town-square')!;

    const start = progressWith();
    expect(storyUnlockedLocationCount(start, locations)).toBe(5);
    expect(isStoryLocationUnlocked(start, lab)).toBe(false);

    const pondComplete = progressWith('mission.puppy-by-pond');
    expect(storyUnlockedLocationCount(pondComplete, locations)).toBe(6);
    expect(isStoryLocationUnlocked(pondComplete, lab)).toBe(true);
    expect(isStoryLocationUnlocked(pondComplete, hideout)).toBe(false);

    const airComplete = progressWith('mission.puppy-by-pond', 'mission.invisible-air');
    expect(storyUnlockedLocationCount(airComplete, locations)).toBe(7);
    expect(isStoryLocationUnlocked(airComplete, hideout)).toBe(true);

    const rockComplete = progressWith('mission.puppy-by-pond', 'mission.invisible-air', 'mission.rock-lookalikes');
    expect(storyUnlockedLocationCount(rockComplete, locations)).toBe(8);
    expect(isStoryLocationUnlocked(rockComplete, observatory)).toBe(true);

    const skyComplete = progressWith(
      'mission.puppy-by-pond',
      'mission.invisible-air',
      'mission.rock-lookalikes',
      'mission.night-sky-mixup'
    );
    expect(storyUnlockedLocationCount(skyComplete, locations)).toBe(9);
    expect(isStoryLocationUnlocked(skyComplete, town)).toBe(true);
  });
});
