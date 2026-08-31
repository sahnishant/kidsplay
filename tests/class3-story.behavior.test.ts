import { describe, expect, it } from 'vitest';
import { createStoryMissionLaunch, getStoryMission } from '../src/story/storyDirector';

const MISSION_ID = 'mission.class3-farm-clues';
const PACK_ID = 'free-class3-foundation';

describe('Class 3 story reuse', () => {
  it('builds a representative mission from the reusable Class 3 free pack', () => {
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
