import { describe, expect, it } from 'vitest';
import missionsJson from '../content/story/missions.json';
import {
  createStoryMissionLaunch,
  getHeroDisplayName,
  getStoryCharacters,
  getStoryLocations,
  getStoryMission,
  getStoryMissions
} from '../src/story/storyDirector';
import { createStoryLocationLaunch } from '../src/story/storyLocationDirector';

const MISSION_ID = 'mission.puppy-by-pond';

function rowKnowledgeGroup(rowId: string): string {
  const parts = rowId.split('.');
  if (parts[1] === 'choice' && parts[2]) return parts[2];
  return parts[1] || 'general';
}

describe('Dheu story-world director', () => {
  it('keeps the durable cast and explicit child progression data-driven', () => {
    expect(getStoryCharacters().map((character) => character.id)).toEqual(['dheu', 'scientu', 'shaitanu']);
    const locations = getStoryLocations();
    expect(locations).toHaveLength(9);
    expect(locations.some((location) => location.id === 'river-pond')).toBe(true);
    expect(getStoryMissions().map((mission) => mission.id)).toContain(MISSION_ID);

    const levels = locations.map((location) => location.progression.level).sort((left, right) => left - right);
    const orders = locations.map((location) => location.progression.order).sort((left, right) => left - right);
    expect(levels).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(locations.every((location) => location.expeditionTitle.trim().length > 0)).toBe(true);
    expect(locations.find((location) => location.id === 'town-square')?.expeditionTitle).toBe('Town Square Expedition');
  });

  it('uses the saved child name for Dheu and fails back to Dheu', () => {
    expect(getHeroDisplayName(' Mira ')).toBe('Mira');
    expect(getHeroDisplayName('   ')).toBe('Dheu');
  });

  it('builds The Puppy by the Pond entirely from the existing reusable free question bank', () => {
    const mission = getStoryMission(MISSION_ID);
    const launch = createStoryMissionLaunch(MISSION_ID);
    const desired = new Set(mission.knowledgeRefs);
    const covered = new Set(
      launch.session.questions.flatMap((question) =>
        (question.knowledgeRefs ?? []).filter((rowId) => desired.has(rowId))
      )
    );

    expect(launch.session.mode).toBe('free_explore');
    expect(launch.session.questions).toHaveLength(mission.questionCount);
    expect(new Set(launch.session.questions.map((question) => question.id)).size).toBe(mission.questionCount);
    expect(new Set(launch.session.questions.map((question) => question.interaction.type)).size).toBeGreaterThanOrEqual(2);
    expect(launch.session.questions.every((question) =>
      (question.knowledgeRefs ?? []).some((rowId) => desired.has(rowId))
    )).toBe(true);
    expect([...desired].filter((rowId) => !covered.has(rowId))).toEqual([]);
  });

  it('makes every story location a targeted expedition through the existing free question bank', () => {
    for (const location of getStoryLocations()) {
      const launch = createStoryLocationLaunch(location.id);
      const allowedTopics = new Set(location.topicGroups);

      expect(launch.session.mode).toBe('free_explore');
      expect(launch.session.title).toBe(location.expeditionTitle);
      expect(launch.session.questions).toHaveLength(6);
      expect(new Set(launch.session.questions.map((question) => question.id)).size).toBe(6);
      expect(launch.session.questions.every((question) => {
        const refs = question.knowledgeRefs ?? [];
        return refs.length > 0 && refs.every((rowId) => allowedTopics.has(rowKnowledgeGroup(rowId)));
      })).toBe(true);
    }
  });

  it('keeps story authoring free of answer/evaluator contracts', () => {
    const serialized = JSON.stringify(missionsJson);
    expect(serialized).not.toContain('"solution"');
    expect(serialized).not.toContain('"correctOptionIds"');
    expect(serialized).not.toContain('"interaction"');
  });
});