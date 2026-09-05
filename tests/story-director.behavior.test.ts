import { describe, expect, it } from 'vitest';
import type { DragToTargetQuestion } from '../src/contracts/question';
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
  it('keeps the free story world broad, mission-distinct and buildable from shipped questions or world actions', () => {
    const missions = getStoryMissions();
    const locationIds = new Set(getStoryLocations().map((location) => location.id));
    const locationCounts = new Map<string, number>();
    for (const mission of missions) locationCounts.set(mission.locationRef, (locationCounts.get(mission.locationRef) ?? 0) + 1);

    expect(missions.length).toBeGreaterThanOrEqual(4);
    expect(missions.every((mission) => mission.access === 'free')).toBe(true);
    expect(getAllStoryMissions().length).toBeGreaterThanOrEqual(missions.length);
    expect(new Set(missions.map((mission) => mission.id)).size).toBe(missions.length);
    expect([...locationCounts.entries()].filter(([, count]) => count > 1)).toEqual([['forest', 3]]);
    expect(new Set(missions.map((mission) => mission.reward.id)).size).toBe(missions.length);

    for (const mission of missions) {
      expect(locationIds.has(mission.locationRef)).toBe(true);
      expect(mission.knowledgeRefs.length).toBeGreaterThanOrEqual(2);
      expect(new Set(mission.knowledgeRefs).size).toBe(mission.knowledgeRefs.length);

      const launch = createStoryMissionLaunch(mission.id);
      expect(launch.mission.id).toBe(mission.id);
      expect(launch.session.mode).toBe('free_explore');

      if (mission.worldActionRef) {
        expect(mission.worldDepthLevel ?? 0).toBeGreaterThanOrEqual(2);
        expect(mission.questionCount).toBe(0);
        expect(launch.session.questions).toHaveLength(0);
        continue;
      }

      expect(launch.session.questions).toHaveLength(mission.questionCount);
      expect(new Set(launch.session.questions.map((question) => question.id)).size).toBe(mission.questionCount);

      const coveredRefs = new Set(
        launch.session.questions.flatMap((question) => question.knowledgeRefs ?? [])
      );
      for (const rowId of mission.knowledgeRefs) expect(coveredRefs.has(rowId)).toBe(true);
    }
  });

  it('prefers compact mission-focused home matching over the six-animal free-play board', () => {
    for (const missionId of ['mission.forest-explorer-trail', 'mission.puppy-by-pond']) {
      const launch = createStoryMissionLaunch(missionId);
      expect(launch.session.questions.map((question) => question.id)).toContain(
        'animals.homes.match.story-pair.generated.001'
      );
      expect(launch.session.questions.map((question) => question.id)).not.toContain(
        'animals.homes.match.generated.001'
      );

      const matching = launch.session.questions.find(
        (question): question is DragToTargetQuestion =>
          question.id === 'animals.homes.match.story-pair.generated.001'
          && question.interaction.type === 'drag_to_target'
      );
      expect(matching?.interaction.items).toHaveLength(2);
      expect(matching?.interaction.targets).toHaveLength(2);
    }
  });

  it('accepts prior mastery on quiz replay while keeping world-action missions quiz-free', () => {
    for (const mission of getStoryMissions()) {
      const mastery = Object.fromEntries(
        mission.knowledgeRefs.slice(1).map((rowId) => [rowId, masteredCounter()])
      );
      const launch = createStoryMissionLaunch(mission.id, mastery);

      if (mission.worldActionRef) {
        expect(launch.mission.worldActionRef).toBe(mission.worldActionRef);
        expect(launch.session.questions).toHaveLength(0);
        continue;
      }

      const coveredRefs = new Set(
        launch.session.questions.flatMap((question) => question.knowledgeRefs ?? [])
      );
      expect(launch.session.questions).toHaveLength(mission.questionCount);
      for (const rowId of mission.knowledgeRefs) expect(coveredRefs.has(rowId)).toBe(true);
    }
  });

  it('uses story scenes only as presentation references while world-action missions may use dedicated presentation', () => {
    for (const mission of getAllStoryMissions()) {
      if (!mission.worldActionRef) {
        expect(mission.openingSceneRef?.startsWith('scene.')).toBe(true);
        expect(mission.successSceneRef?.startsWith('scene.')).toBe(true);
      } else {
        if (mission.openingSceneRef) expect(mission.openingSceneRef.startsWith('scene.')).toBe(true);
        if (mission.successSceneRef) expect(mission.successSceneRef.startsWith('scene.')).toBe(true);
      }
      expect(mission.reward.stars).toBeGreaterThan(0);
    }
  });
});