import { describe, expect, it } from 'vitest';
import { projectForestDiscoveries } from '../src/forest/forestDiscoveries';
import {
  getForestAssemblyProof,
  getForestWorldDepthAdventures
} from '../src/forest/forestWorldDepth';
import { mergeForestWorldDepthState } from '../src/forest/forestWorldProjection';
import { commitAssemblyPlacement, createAssemblyInteractionState } from '../src/mechanics/assemblyInteraction';
import type { ProgressSummary } from '../src/runtime/localProgress';
import { createStoryMissionLaunch, getStoryLocations, getStoryMissions } from '../src/story/storyDirector';
import { buildStoryLocationPresentation } from '../src/story/storyPresentation';
import type { StoryProgressSnapshot } from '../src/story/storyProgress';
import { deriveWorldRewardState } from '../src/story/worldRewards';

const when = '2026-09-04T07:30:00.000Z';
const emptyLearning: ProgressSummary = {
  totalAttempts: 0,
  correctAttempts: 0,
  accuracy: 0,
  practicedKnowledge: 0,
  masteredKnowledge: 0,
  topics: [],
  recommendedTopics: []
};

function snapshot(completedMissionIds: string[]): StoryProgressSnapshot {
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

describe('Forest Explorer L2/L3 world depth', () => {
  it('authors two genuinely different four-action arcs with three reusable interaction families each', () => {
    const adventures = getForestWorldDepthAdventures();
    expect(adventures.map((adventure) => adventure.level)).toEqual([2, 3]);
    expect(adventures.every((adventure) => adventure.steps.length >= 4)).toBe(true);
    for (const adventure of adventures) {
      expect(new Set(adventure.steps.map((step) => step.interactionFamily)).size).toBeGreaterThanOrEqual(3);
      expect(adventure.worldProblem.length).toBeGreaterThan(20);
      expect(adventure.characterSetup).toMatch(/Shaitanu|Scientu|Dheu/);
      expect(adventure.ending).not.toBe(adventure.worldProblem);
    }
    expect(adventures[0].persistentChangeId).not.toBe(adventures[1].persistentChangeId);
  });

  it('uses G2 assembly at least three times across multiple semantic domains', () => {
    const proof = getForestAssemblyProof();
    expect(proof.length).toBeGreaterThanOrEqual(3);
    expect(new Set(proof.map((item) => item.semanticDomain)).size).toBeGreaterThanOrEqual(2);
    expect(proof.map((item) => item.definition.operation)).toEqual(expect.arrayContaining(['repair_restore', 'connect_parts']));
  });

  it('preserves first-attempt failure through honest in-place assembly retry and auto-submits final placement', () => {
    const definition = getForestAssemblyProof()[0].definition;
    const firstPart = definition.parts[0].partId;
    const expectedSlot = definition.requiredAssignments.find((item) => item.partId === firstPart)!.slotId;
    const wrongSlot = definition.slots.find((slot) => slot.slotId !== expectedSlot)!.slotId;

    const miss = commitAssemblyPlacement(definition, createAssemblyInteractionState(), {
      partId: firstPart,
      slotId: wrongSlot
    });
    expect(miss.feedback).toBe('retry_in_place');
    expect(miss.state.firstAttemptCorrect).toBe(false);
    expect(miss.autoSubmitted).toBe(false);

    let state = miss.state;
    let lastAutoSubmitted = false;
    for (const assignment of definition.requiredAssignments) {
      const result = commitAssemblyPlacement(definition, state, assignment);
      state = result.state;
      lastAutoSubmitted = result.autoSubmitted;
    }
    expect(state.completed).toBe(true);
    expect(state.firstAttemptCorrect).toBe(false);
    expect(lastAutoSubmitted).toBe(true);
  });

  it('uses practical-life and cause/effect world-action contracts without freeform physics', () => {
    const steps = getForestWorldDepthAdventures().flatMap((adventure) => adventure.steps);
    expect(steps.some((step) => step.worldAction.family === 'practical_life')).toBe(true);
    expect(steps.some((step) => step.worldAction.family === 'cause_effect')).toBe(true);
    expect(steps.filter((step) => step.worldAction.family === 'cause_effect')
      .every((step) => Boolean(step.worldAction.stateTransition))).toBe(true);
    expect(steps.filter((step) => step.worldAction.evidenceClass === 'evaluative')
      .every((step) => step.worldAction.retryPolicy === 'reset_for_retry_preserve_first_attempt')).toBe(true);
  });

  it('chains Forest L1 -> L2 -> L3 through the existing story presentation instead of duplicate map locations', () => {
    const locations = getStoryLocations();
    const missions = getStoryMissions();

    const afterL1 = buildStoryLocationPresentation(locations, missions, snapshot(['mission.forest-explorer-trail']));
    expect(afterL1.find((item) => item.location.id === 'forest')?.mission?.id).toBe('mission.forest-creek-rescue');

    const afterL2 = buildStoryLocationPresentation(locations, missions, snapshot([
      'mission.forest-explorer-trail',
      'mission.forest-creek-rescue'
    ]));
    expect(afterL2.find((item) => item.location.id === 'forest')?.mission?.id).toBe('mission.forest-busy-grove');

    const afterL3 = buildStoryLocationPresentation(locations, missions, snapshot([
      'mission.forest-explorer-trail',
      'mission.forest-creek-rescue',
      'mission.forest-busy-grove'
    ]));
    expect(afterL3.find((item) => item.location.id === 'forest')?.state).toBe('complete');
    expect(locations.filter((location) => location.id === 'forest')).toHaveLength(1);
  });

  it('keeps world-action missions out of the quiz evaluator surface', () => {
    for (const missionId of ['mission.forest-creek-rescue', 'mission.forest-busy-grove']) {
      const launch = createStoryMissionLaunch(missionId);
      expect(launch.mission.worldActionRef).toBeTruthy();
      expect(launch.session.questions).toEqual([]);
      expect(launch.mission.questionCount).toBe(0);
    }
  });

  it('derives persistent Forest consequences from canonical story progress after relaunch', () => {
    const afterL2 = mergeForestWorldDepthState(
      deriveWorldRewardState(emptyLearning),
      snapshot(['mission.forest-explorer-trail', 'mission.forest-creek-rescue'])
    );
    expect(afterL2.locations.forest.changes.map((change) => change.id)).toContain('forest-creek-restored');

    const afterL3 = mergeForestWorldDepthState(
      deriveWorldRewardState(emptyLearning),
      snapshot(['mission.forest-explorer-trail', 'mission.forest-creek-rescue', 'mission.forest-busy-grove'])
    );
    expect(afterL3.locations.forest.changes.map((change) => change.id)).toEqual(expect.arrayContaining([
      'forest-creek-restored',
      'forest-busy-grove-restored'
    ]));
  });

  it('projects one nature, one vocabulary and one field-note discovery deterministically without replay farming', () => {
    const completed = snapshot([
      'mission.forest-explorer-trail',
      'mission.forest-creek-rescue',
      'mission.forest-busy-grove'
    ]);
    const first = projectForestDiscoveries(completed);
    const replayed = projectForestDiscoveries({
      ...completed,
      completedMissions: {
        ...completed.completedMissions,
        'mission.forest-creek-rescue': {
          ...completed.completedMissions['mission.forest-creek-rescue'],
          completions: 9
        }
      }
    });

    expect(first.map((entry) => entry.kind)).toEqual([
      'animal_nature',
      'field_note',
      'vocabulary_semantic'
    ]);
    expect(replayed).toEqual(first);
    expect(new Set(first.map((entry) => entry.discoveryId)).size).toBe(3);
  });
});
