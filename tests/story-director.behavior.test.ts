import { describe, expect, it } from 'vitest';
import {
  createStoryMissionLaunch,
  getStoryLocations,
  getStoryMissions
} from '../src/story/storyDirector';

describe('story mission director', () => {
  it('keeps the free story world broad, location-distinct and buildable from shipped questions', () => {
    const missions = getStoryMissions();
    const locationIds = new Set(getStoryLocations().map((location) => location.id));

    expect(missions.length).toBeGreaterThanOrEqual(4);
    expect(new Set(missions.map((mission) => mission.id)).size).toBe(missions.length);
    expect(new Set(missions.map((mission) => mission.locationRef)).size).toBe(missions.length);

    for (const mission of missions) {
      expect(mission.access).toBe('free');
      expect(locationIds.has(mission.locationRef)).toBe(true);
      expect(mission.knowledgeRefs.length).toBeGreaterThanOrEqual(4);
      expect(new Set(mission.knowledgeRefs).size).toBe(mission.knowledgeRefs.length);

      const launch = createStoryMissionLaunch(mission.id);
      expect(launch.mission.id).toBe(mission.id);
      expect(launch.session.mode).toBe('free_explore');
      expect(launch.session.questions).toHaveLength(mission.questionCount);
      expect(new Set(launch.session.questions.map((question) => question.id)).size).toBe(mission.questionCount);

      const coveredRefs = new Set(
        launch.session.questions.flatMap((question) => question.knowledgeRefs ?? [])
      );
      for (const rowId of mission.knowledgeRefs) expect(coveredRefs.has(rowId)).toBe(true);
    }
  });

  it('uses story scenes only as presentation references, never as answer contracts', () => {
    for (const mission of getStoryMissions()) {
      expect(mission.openingSceneRef?.startsWith('scene.')).toBe(true);
      expect(mission.successSceneRef?.startsWith('scene.')).toBe(true);
      expect(mission.reward.stars).toBeGreaterThan(0);
    }
  });
});
