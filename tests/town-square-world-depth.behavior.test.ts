import { describe, expect, it } from 'vitest';
import { projectDheuDiscoveryBook } from '../src/experience/discoveryBookProduction';
import { getWorldDepthAdventure } from '../src/experience/worldDepthRegistry';
import { commitAssemblyPlacement, createAssemblyInteractionState } from '../src/mechanics/assemblyInteraction';
import type { ProgressSnapshot, ProgressSummary, StoredAttempt } from '../src/runtime/localProgress';
import { createStoryMissionLaunch, getStoryLocations, getStoryMissions } from '../src/story/storyDirector';
import { buildStoryLocationPresentation } from '../src/story/storyPresentation';
import type { StoryProgressSnapshot } from '../src/story/storyProgress';
import { deriveWorldRewardState } from '../src/story/worldRewards';
import { projectTownDiscoveries } from '../src/town/townDiscoveries';
import { getTownAssemblyProof, getTownWorldDepthAdventures, selectTownAdaptiveReview } from '../src/town/townWorldDepth';
import { mergeTownWorldDepthState } from '../src/town/townWorldProjection';

const when = '2026-09-05T08:00:00.000Z';
const emptyLearning: ProgressSummary = {
  totalAttempts: 0,
  correctAttempts: 0,
  accuracy: 0,
  practicedKnowledge: 0,
  masteredKnowledge: 0,
  topics: [],
  recommendedTopics: []
};
const emptyProgress: ProgressSnapshot = { version: 1, attempts: [], knowledge: {}, concepts: {}, updatedAt: null };

function storySnapshot(completedMissionIds: string[]): StoryProgressSnapshot {
  return {
    version: 1,
    completedMissions: Object.fromEntries(completedMissionIds.map((missionId) => [missionId, {
      missionId,
      completedAt: when,
      completions: 1,
      rewardId: `reward.${missionId}`,
      starsAwarded: 3
    }])),
    completedLocations: {},
    completedSessionIds: completedMissionIds.map((missionId) => `session.${missionId}`),
    updatedAt: completedMissionIds.length ? when : null
  };
}

function attempt(
  knowledgeRef: string,
  submittedAt: string,
  correct: boolean,
  assisted = false
): StoredAttempt {
  return {
    sessionId: `session.${knowledgeRef}`,
    questionId: `question.${knowledgeRef}`,
    submittedAt,
    durationMs: 1000,
    correct,
    score: correct ? 1 : 0,
    maxScore: 1,
    knowledgeRefs: [knowledgeRef],
    conceptIds: [`concept.${knowledgeRef}`],
    attemptNumber: 1,
    attemptKind: 'independent',
    assistanceKinds: assisted ? ['visual_scaffold'] : [],
    countsTowardAccuracy: true,
    masteryWeight: 1
  };
}

describe('Town Square world-depth transfer', () => {
  it('authors one coherent five-action Town arc with three reusable interaction families', () => {
    const [adventure] = getTownWorldDepthAdventures();
    expect(adventure.adventureRef).toBe('town.world-depth.l1.safe-square');
    expect(adventure.steps).toHaveLength(5);
    expect(new Set(adventure.steps.map((step) => step.interactionFamily)).size).toBeGreaterThanOrEqual(3);
    expect(adventure.worldProblem.length).toBeGreaterThan(30);
    expect(adventure.characterSetup).toMatch(/Shaitanu|Scientu|Dheu/);
    expect(adventure.steps.map((step) => step.worldAction.action)).toEqual(expect.arrayContaining([
      'help', 'safety_choice', 'sort', 'pack', 'empty'
    ]));
  });

  it('reuses G2 assembly and preserves first-attempt evidence on a wrong repair placement', () => {
    const definition = getTownAssemblyProof()[0].definition;
    const firstPart = definition.parts[0].partId;
    const expectedSlot = definition.requiredAssignments.find((item) => item.partId === firstPart)!.slotId;
    const wrongSlot = definition.slots.find((slot) => slot.slotId !== expectedSlot)!.slotId;
    const miss = commitAssemblyPlacement(definition, createAssemblyInteractionState(), { partId: firstPart, slotId: wrongSlot });
    expect(miss.feedback).toBe('retry_in_place');
    expect(miss.state.firstAttemptCorrect).toBe(false);
  });

  it('weaves the weaker assisted safety clue into the Town mission without another progress store', () => {
    const progress: ProgressSnapshot = {
      ...emptyProgress,
      attempts: [
        attempt('kr.safety.road.crossing.zebra', '2026-09-05T06:00:00.000Z', true, false),
        attempt('kr.safety.traffic.red.stop', '2026-09-05T07:00:00.000Z', true, true)
      ],
      updatedAt: '2026-09-05T07:00:00.000Z'
    };
    const selected = selectTownAdaptiveReview('town.world-depth.l1.safe-square', progress);
    expect(selected.knowledgeRef).toBe('kr.safety.traffic.red.stop');
    expect(selected.reason).toBe('assisted');
    expect(getWorldDepthAdventure('town.world-depth.l1.safe-square', progress).adaptiveReview).toEqual(selected);
  });

  it('routes Town through the existing world-action story shell and keeps it out of the quiz evaluator', () => {
    const launch = createStoryMissionLaunch('mission.town-square-helper');
    expect(launch.mission.worldActionRef).toBe('town.world-depth.l1.safe-square');
    expect(launch.mission.status).toBe('prototype');
    expect(launch.mission.questionCount).toBe(0);
    expect(launch.session.questions).toEqual([]);

    const missions = getStoryMissions();
    const beforeTown = missions.filter((mission) => mission.id !== 'mission.town-square-helper').map((mission) => mission.id);
    const presentation = buildStoryLocationPresentation(getStoryLocations(), missions, storySnapshot(beforeTown));
    expect(presentation.find((item) => item.location.id === 'town-square')?.mission?.id).toBe('mission.town-square-helper');
    expect(getStoryLocations().filter((location) => location.id === 'town-square')).toHaveLength(1);
  });

  it('derives visible Town consequences from canonical story progress after serialization/relaunch', () => {
    const persisted = JSON.parse(JSON.stringify(storySnapshot(['mission.town-square-helper']))) as StoryProgressSnapshot;
    const world = mergeTownWorldDepthState(deriveWorldRewardState(emptyLearning), persisted);
    expect(world.locations['town-square'].changes.map((change) => change.id)).toEqual(expect.arrayContaining([
      'town-square-crossing-restored',
      'town-square-community-corner-ready'
    ]));
    expect(world.locations['town-square'].stage).toBe(3);
  });

  it('projects Town place + Adventure Mail discoveries deterministically without replay farming', () => {
    const completed = storySnapshot(['mission.town-square-helper']);
    const first = projectTownDiscoveries(completed);
    const replayed = projectTownDiscoveries({
      ...completed,
      completedMissions: {
        ...completed.completedMissions,
        'mission.town-square-helper': {
          ...completed.completedMissions['mission.town-square-helper'],
          completions: 9
        }
      }
    });
    expect(first.map((entry) => entry.kind)).toEqual(['field_note', 'place']);
    expect(replayed).toEqual(first);

    const book = projectDheuDiscoveryBook(emptyProgress, completed);
    expect(book.collections.places.some((item) => item.id === 'discovery.town.square-place')).toBe(true);
    expect(book.collections.mail.some((item) => item.id === 'discovery.town.square-adventure-mail')).toBe(true);
  });

  it('keeps Scientu Lab pass 112 closed until Town human acceptance is explicitly completed', () => {
    expect(() => getWorldDepthAdventure('lab.world-depth.l1.prediction-bench', emptyProgress)).toThrow(/Unknown world-depth adventure/);
    expect(getTownWorldDepthAdventures()[0].level).toBe(1);
  });
});
