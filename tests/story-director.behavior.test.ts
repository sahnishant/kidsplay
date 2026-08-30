import { describe, expect, it } from 'vitest';
import type { MasteryCounter } from '../src/runtime/localProgress';
import {
  createStoryMissionLaunch,
  getAllStoryMissions,
  getStoryLocations,
  getStoryMissions
} from '../src/story/storyDirector';

function masteredCounter(): MasteryCounter {
  return {
    attempts: 4,
    correct: 4,
    totalWeight: 4,
    correctWeight: 4,
    lastResult: 'correct',
    lastSeenAt: '2026-08-30T00:00:00.000Z'
  };
}

describe('story mission director', () => {
  it('keeps the free story world broad, location-distinct and buildable from shipped questions', () => {
    const missions = getStoryMissions();
    const locationIds = new Set(getStoryLocations().map((location) => location.id));

    expect(missions.length).toBeGreaterThanOrEqual(4);
    expect(missions.every((mission) => mission.access === 'free')).toBe(true);
    expect(getAllStoryMissions().length).toBeGreaterThanOrEqual(missions.length);
    expect(new Set(missions.map((mission) => mission.id)).size).toBe(missions.length);
    expect(new Set(missions.map((mission) => mission.locationRef)).size).toBe(missions.length);
    expect(new Set(missions.map((mission) => mission.reward.id)).size).toBe(missions.length);

    for (const mission of missions) {
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

  it('accepts prior mastery on replay without sacrificing any declared mission coverage', () => {
    for (const mission of getStoryMissions()) {
      const mastery = Object.fromEntries(
        mission.knowledgeRefs.slice(1).map((rowId) => [rowId, masteredCounter()])
      );
      const launch = createStoryMissionLaunch(mission.id, mastery);
      const coveredRefs = new Set(
        launch.session.questions.flatMap((question) => question.knowledgeRefs ?? [])
      );

      expect(launch.session.questions).toHaveLength(mission.questionCount);
      for (const rowId of mission.knowledgeRefs) expect(coveredRefs.has(rowId)).toBe(true);
    }
  });

  it('uses story scenes only as presentation references, never as answer contracts', () => {
    for (const mission of getAllStoryMissions()) {
      expect(mission.openingSceneRef?.startsWith('scene.')).toBe(true);
      expect(mission.successSceneRef?.startsWith('scene.')).toBe(true);
      expect(mission.reward.stars).toBeGreaterThan(0);
    }
  });
});
