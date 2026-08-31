import { describe, expect, it } from 'vitest';
import { createStoryMissionLaunch, getStoryMission } from '../src/story/storyDirector';

const MISSION_ID = 'mission.class3-farm-food-chain';
const PACK_ID = 'free.sof-class3-science-foundation.1';

describe('Class 3 story reuse', () => {
  it('launches a Class 3 mission from its reusable profile-scoped free pack', () => {
    const mission = getStoryMission(MISSION_ID);
    const launch = createStoryMissionLaunch(MISSION_ID);
    const desired = new Set(mission.knowledgeRefs);
    const covered = new Set(
      launch.session.questions.flatMap((question) =>
        (question.knowledgeRefs ?? []).filter((rowId) => desired.has(rowId))
      )
    );

    expect(mission.questionPackRef).toBe(PACK_ID);
    expect(launch.session.mode).toBe('free_explore');
    expect(launch.session.questions).toHaveLength(mission.questionCount);
    expect(new Set(launch.session.questions.map((question) => question.id)).size).toBe(mission.questionCount);
    expect([...desired].filter((rowId) => !covered.has(rowId))).toEqual([]);
    expect(launch.session.questions.every((question) =>
      (question.knowledgeRefs ?? []).some((rowId) => desired.has(rowId))
    )).toBe(true);
  });
});
