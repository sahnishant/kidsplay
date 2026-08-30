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

const MISSION_ID = 'mission.puppy-by-pond';

describe('Dheu story-world director', () => {
  it('keeps the durable cast and initial world data-driven', () => {
    expect(getStoryCharacters().map((character) => character.id)).toEqual(['dheu', 'scientu', 'shaitanu']);
    expect(getStoryLocations()).toHaveLength(9);
    expect(getStoryLocations().some((location) => location.id === 'river-pond')).toBe(true);
    expect(getStoryMissions().map((mission) => mission.id)).toContain(MISSION_ID);
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

  it('keeps story authoring free of answer/evaluator contracts', () => {
    const serialized = JSON.stringify(missionsJson);
    expect(serialized).not.toContain('"solution"');
    expect(serialized).not.toContain('"correctOptionIds"');
    expect(serialized).not.toContain('"interaction"');
  });
});
