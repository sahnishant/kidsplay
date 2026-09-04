import { describe, expect, it } from 'vitest';
import {
  DISCOVERY_BOOK_COLLECTIONS,
  projectDheuDiscoveryBook
} from '../src/experience/discoveryBookProduction';
import type { ProgressSnapshot, StoredAttempt } from '../src/runtime/localProgress';
import type { StoryProgressSnapshot } from '../src/story/storyProgress';

const when = '2026-09-04T08:00:00.000Z';

function progress(attempts: StoredAttempt[] = []): ProgressSnapshot {
  return { version: 1, attempts, knowledge: {}, concepts: {}, updatedAt: attempts.at(-1)?.submittedAt ?? null };
}

function attempt(overrides: Partial<StoredAttempt> = {}): StoredAttempt {
  return {
    sessionId: 'session.discovery-proof',
    questionId: 'question.discovery-proof',
    submittedAt: when,
    durationMs: 900,
    correct: true,
    score: 1,
    maxScore: 1,
    knowledgeRefs: ['kr.plants.roots.function.absorb-water'],
    conceptIds: ['concept.roots'],
    attemptNumber: 1,
    attemptKind: 'independent',
    assistanceKinds: [],
    countsTowardAccuracy: true,
    masteryWeight: 1,
    ...overrides
  };
}

function story(completions = 1): StoryProgressSnapshot {
  const l2 = 'mission.forest-creek-rescue';
  const l3 = 'mission.forest-busy-grove';
  return {
    version: 1,
    completedMissions: {
      [l2]: { missionId: l2, completedAt: when, completions, rewardId: 'reward.forest.l2', starsAwarded: 3 },
      [l3]: { missionId: l3, completedAt: '2026-09-04T09:00:00.000Z', completions, rewardId: 'reward.forest.l3', starsAwarded: 3 }
    },
    completedLocations: {},
    completedSessionIds: ['session.forest.l2', 'session.forest.l3'],
    updatedAt: '2026-09-04T09:00:00.000Z'
  };
}

const emptyStory: StoryProgressSnapshot = {
  version: 1,
  completedMissions: {},
  completedLocations: {},
  completedSessionIds: [],
  updatedAt: null
};

describe('Dheu Discovery Book production projection', () => {
  it('exposes the six child collections without pre-filling an inventory', () => {
    const book = projectDheuDiscoveryBook(progress(), emptyStory);
    expect(Object.keys(book.collections)).toEqual(DISCOVERY_BOOK_COLLECTIONS.map((collection) => collection.id));
    expect(book.items).toEqual([]);
  });

  it('projects Forest progress into Animals, Plants, Places, Science, Words/Sounds and Adventure Mail', () => {
    const book = projectDheuDiscoveryBook(progress(), story());
    for (const collection of DISCOVERY_BOOK_COLLECTIONS) {
      expect(book.collections[collection.id].length, collection.label).toBeGreaterThan(0);
    }
    expect(book.collections.mail[0]).toMatchObject({
      collection: 'mail',
      discoveredFrom: { source: 'story_mission', sourceId: 'mission.forest-busy-grove' }
    });
    expect(book.items.every((item) => item.canonicalRefs.length > 0)).toBe(true);
  });

  it('uses successful #173 attempt evidence and ignores a miss until a real recovery succeeds', () => {
    const missed = projectDheuDiscoveryBook(progress([attempt({ correct: false, score: 0, masteryWeight: 0 })]), emptyStory);
    expect(missed.collections.plants).toEqual([]);

    const recovered = projectDheuDiscoveryBook(progress([
      attempt({ correct: false, score: 0, masteryWeight: 0 }),
      attempt({
        submittedAt: '2026-09-04T08:02:00.000Z',
        correct: true,
        attemptNumber: 2,
        attemptKind: 'retry',
        countsTowardAccuracy: false,
        masteryWeight: 0.5
      })
    ]), emptyStory);
    expect(recovered.collections.plants).toHaveLength(1);
    expect(recovered.collections.plants[0].discoveredFrom.source).toBe('progress_attempt');
  });

  it('does not mint duplicates from replay completions or repeated correct practice', () => {
    const first = projectDheuDiscoveryBook(progress([attempt()]), story(1));
    const replayed = projectDheuDiscoveryBook(progress([
      attempt(),
      attempt({ sessionId: 'session.replay', submittedAt: '2026-09-05T08:00:00.000Z' })
    ]), story(9));

    expect(replayed.items).toEqual(first.items);
    expect(new Set(replayed.items.map((item) => `${item.collection}:${item.canonicalRefs.join('|')}`)).size)
      .toBe(replayed.items.length);
  });

  it('keeps canonical provenance instead of storing duplicate facts or reward counters', () => {
    const book = projectDheuDiscoveryBook(progress(), story());
    expect(book.items.every((item) => item.discoveredFrom.sourceId.length > 0)).toBe(true);
    expect(JSON.stringify(book)).not.toMatch(/coin|ticket|xp|currency|balance|inventoryCount/i);
  });
});
