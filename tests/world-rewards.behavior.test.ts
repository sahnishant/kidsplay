import { describe, expect, it } from 'vitest';
import type { ProgressSummary, TopicId, TopicProgressSummary } from '../src/runtime/localProgress';
import { deriveWorldRewardState, WORLD_LOCATION_IDS } from '../src/story/worldRewards';

function topic(
  id: TopicId,
  status: TopicProgressSummary['status'],
  practicedKnowledge = status === 'not_started' ? 0 : 3,
  strongKnowledge = status === 'strong' ? 3 : 0
): TopicProgressSummary {
  return {
    id,
    label: id,
    practicedKnowledge,
    strongKnowledge,
    accuracy: practicedKnowledge === 0 ? null : status === 'strong' ? 0.9 : 0.7,
    status
  };
}

function summary(overrides: Partial<ProgressSummary> = {}): ProgressSummary {
  return {
    totalAttempts: 0,
    correctAttempts: 0,
    accuracy: null,
    practicedKnowledge: 0,
    masteredKnowledge: 0,
    topics: [],
    recommendedTopics: [],
    ...overrides
  };
}

describe('progress-derived world rewards', () => {
  it('starts with an unchanged world when canonical learning progress is empty', () => {
    const world = deriveWorldRewardState(summary());

    expect(world.totalChanges).toBe(0);
    expect(world.collectibles).toEqual([]);
    expect(world.discoveries).toEqual([]);
    expect(world.trophies).toEqual([]);
    expect(WORLD_LOCATION_IDS.every((id) => world.locations[id].stage === 0)).toBe(true);
  });

  it('makes the first visible repair from the first recorded learning attempt', () => {
    const world = deriveWorldRewardState(summary({ totalAttempts: 1, correctAttempts: 1, accuracy: 1 }));

    expect(world.totalChanges).toBe(1);
    expect(world.locations.forest.changes.map((change) => change.id)).toEqual(['forest-trail-sign']);
    expect(world.locations.forest.stage).toBe(1);
    expect(world.repairs[0]?.title).toBe('Trail sign repaired');
  });

  it('projects mastery into repairs, living world changes, discoveries, backpack items, trophies and landmarks', () => {
    const richProgress = summary({
      totalAttempts: 20,
      correctAttempts: 18,
      accuracy: 0.9,
      practicedKnowledge: 20,
      masteredKnowledge: 12,
      topics: [
        topic('animals', 'growing'),
        topic('plants', 'strong'),
        topic('water', 'strong'),
        topic('safety', 'strong'),
        topic('transport', 'growing'),
        topic('air', 'growing'),
        topic('reasoning', 'strong'),
        topic('universe', 'strong')
      ]
    });

    const world = deriveWorldRewardState(richProgress);

    expect(world.repairs.length).toBeGreaterThan(0);
    expect(world.nature.length).toBeGreaterThan(0);
    expect(world.discoveries.length).toBeGreaterThan(0);
    expect(world.collectibles.length).toBeGreaterThan(0);
    expect(world.trophies.length).toBeGreaterThan(0);
    expect(world.landmarks.length).toBeGreaterThan(0);
    expect(world.locations['scientu-lab'].stage).toBe(3);
    expect(world.locations['shaitanu-hideout'].changes.some((change) => change.id === 'hideout-puzzle-trophy')).toBe(true);
    expect(world.locations.observatory.changes.some((change) => change.id === 'observatory-constellation')).toBe(true);
  });

  it('is deterministic and ignores adaptive recommendation ordering', () => {
    const animals = topic('animals', 'growing');
    const plants = topic('plants', 'strong');
    const canonical = summary({
      totalAttempts: 10,
      correctAttempts: 8,
      accuracy: 0.8,
      practicedKnowledge: 8,
      masteredKnowledge: 4,
      topics: [animals, plants],
      recommendedTopics: [animals]
    });

    const first = deriveWorldRewardState(canonical);
    const second = deriveWorldRewardState({ ...canonical, recommendedTopics: [plants, animals] });

    expect(second).toEqual(first);
    expect(Object.keys(first)).not.toContain('stars');
    expect(Object.keys(first)).not.toContain('currency');
    expect(Object.keys(first)).not.toContain('xp');
  });
});
