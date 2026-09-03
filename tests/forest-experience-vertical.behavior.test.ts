import { describe, expect, it } from 'vitest';
import freeAnimalsPack from '../content/packs/free-animals.json';
import sequenceHotspotQuestions from '../content/questions/sequence-hotspot.json';
import animalLifecycleKnowledge from '../content/knowledge/animal-lifecycles.json';
import lifecycleRecipes from '../content/recipes/animal-lifecycle-activities.json';
import { resolveExperienceRecipe, type ExperienceRecipe } from '../src/experience/experienceRecipes';
import type { ProgressSummary } from '../src/runtime/localProgress';
import { createStoryMissionLaunch, getStoryMission } from '../src/story/storyDirector';
import { deriveWorldRewardState } from '../src/story/worldRewards';

const FOREST_MISSION_ID = 'mission.forest-explorer-trail';

describe('Forest Explorer Trail experience vertical', () => {
  it('owns butterfly lifecycle truth in canonical knowledge, not a manual question', () => {
    expect(animalLifecycleKnowledge.rowId).toBe('kr.animals.butterfly.lifecycle.egg-to-butterfly');
    expect(animalLifecycleKnowledge.kind).toBe('process');
    expect(animalLifecycleKnowledge.stages.map((stage) => stage.id)).toEqual([
      'egg', 'caterpillar', 'chrysalis', 'butterfly'
    ]);
    expect(lifecycleRecipes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'animals.butterfly.lifecycle.sequence.generated.001',
        sourceRef: 'knowledge.animals.butterfly.lifecycle.001',
        engine: 'sequence_order@1'
      })
    ]));
    expect(sequenceHotspotQuestions.some((question) => question.id === 'animals.butterfly.lifecycle.sequence.001')).toBe(false);
    expect(freeAnimalsPack.questionRefs).toContain('animals.butterfly.lifecycle.sequence.generated.001');
    expect(freeAnimalsPack.questionRefs).not.toContain('animals.butterfly.lifecycle.sequence.001');
  });

  it('builds Level 1 as a seven-clue curated mission from canonical rows', () => {
    const mission = getStoryMission(FOREST_MISSION_ID);
    const launch = createStoryMissionLaunch(FOREST_MISSION_ID);
    const desired = new Set(mission.knowledgeRefs);
    const covered = new Set(
      launch.session.questions.flatMap((question) =>
        (question.knowledgeRefs ?? []).filter((rowId) => desired.has(rowId))
      )
    );

    expect(mission.locationRef).toBe('forest');
    expect(mission.questionPackRef).toBe('free.animals-foundation.1');
    expect(mission.questionCount).toBe(7);
    expect(launch.session.mode).toBe('free_explore');
    expect(launch.session.questions).toHaveLength(7);
    expect(new Set(launch.session.questions.map((question) => question.id)).size).toBe(7);
    expect([...desired].filter((rowId) => !covered.has(rowId))).toEqual([]);
    expect(launch.session.questions.every((question) => (question.knowledgeRefs?.length ?? 0) > 0)).toBe(true);
  });

  it('keeps story matching and memory boards child-sized while Free Play retains the larger canonical variants', () => {
    const launch = createStoryMissionLaunch(FOREST_MISSION_ID);
    const questionIds = launch.session.questions.map((question) => question.id);

    expect(questionIds).toContain('plants.parts.match.story-trio.generated.001');
    expect(questionIds).toContain('plants.parts.memory.story-trio.generated.001');
    expect(questionIds).not.toContain('plants.parts.match.generated.001');
    expect(questionIds).not.toContain('plants.parts.memory.generated.001');

    const matching = launch.session.questions.find((question) => question.id === 'plants.parts.match.story-trio.generated.001');
    expect(matching?.interaction.type).toBe('drag_to_target');
    if (matching?.interaction.type === 'drag_to_target') {
      expect(matching.interaction.items).toHaveLength(3);
      expect(matching.interaction.targets).toHaveLength(3);
    }

    const memory = launch.session.questions.find((question) => question.id === 'plants.parts.memory.story-trio.generated.001');
    expect(memory?.interaction.type).toBe('memory_pairs');
    if (memory?.interaction.type === 'memory_pairs') {
      expect(memory.interaction.cards).toHaveLength(6);
    }

    expect(freeAnimalsPack.questionRefs).toContain('plants.parts.match.generated.001');
    expect(freeAnimalsPack.questionRefs).toContain('plants.parts.memory.generated.001');
  });

  it('projects the first Forest learning attempt into the existing persistent world state', () => {
    const afterFirstMissionAttempt: ProgressSummary = {
      totalAttempts: 1,
      correctAttempts: 1,
      accuracy: 1,
      practicedKnowledge: 1,
      masteredKnowledge: 0,
      topics: [],
      recommendedTopics: []
    };

    const forest = deriveWorldRewardState(afterFirstMissionAttempt).locations.forest;
    expect(forest.stage).toBe(1);
    expect(forest.changes.map((change) => change.id)).toContain('forest-trail-sign');
    expect(forest.changes.find((change) => change.id === 'forest-trail-sign')?.childLine).toBe(
      'The forest trail sign is standing again.'
    );
  });

  it('selects all five reusable experience families without a question-id recipe registry', () => {
    const launch = createStoryMissionLaunch(FOREST_MISSION_ID);
    const resolved = launch.session.questions
      .map((question) => resolveExperienceRecipe(question, 'story'))
      .filter((recipe): recipe is ExperienceRecipe => recipe !== null);
    const families = new Set(resolved.map((recipe) => recipe.family));

    expect(families).toEqual(new Set([
      'guide_to_home',
      'sort_or_match',
      'observe_choose',
      'sequence_process',
      'cause_effect_discovery'
    ]));
    expect(resolved.every((recipe) => !('questionId' in recipe))).toBe(true);
  });

  it('keeps structured assessment outside the Forest pre-answer recipe surface', () => {
    const launch = createStoryMissionLaunch(FOREST_MISSION_ID);
    expect(launch.session.questions.every((question) => resolveExperienceRecipe(question, 'assessment') === null)).toBe(true);
  });
});
