import { projectForestDiscoveries } from '../forest/forestDiscoveries';
import type { ProgressSnapshot, StoredAttempt } from '../runtime/localProgress';
import type { StoryProgressSnapshot } from '../story/storyProgress';
import { projectTownDiscoveries } from '../town/townDiscoveries';

export const DISCOVERY_BOOK_COLLECTIONS = [
  { id: 'animals', label: 'Animals' },
  { id: 'plants', label: 'Plants' },
  { id: 'places', label: 'Places' },
  { id: 'science', label: 'Science' },
  { id: 'words_sounds', label: 'Words & Sounds' },
  { id: 'mail', label: 'Adventure Mail' }
] as const;

export type DiscoveryBookCollectionId = (typeof DISCOVERY_BOOK_COLLECTIONS)[number]['id'];

export interface DiscoveryBookItem {
  id: string;
  collection: DiscoveryBookCollectionId;
  title: string;
  canonicalRefs: string[];
  discoveredFrom: {
    source: 'progress_attempt' | 'story_mission';
    sourceId: string;
  };
  unlockedAt: string;
  pronunciationText?: string;
  fieldNote?: string;
}

export interface DheuDiscoveryBook {
  items: DiscoveryBookItem[];
  collections: Record<DiscoveryBookCollectionId, DiscoveryBookItem[]>;
}

interface PresentationRule {
  canonicalRef: string;
  collection: Exclude<DiscoveryBookCollectionId, 'mail' | 'places'>;
  title: string;
  pronunciationText: string;
}

const PRACTICE_PRESENTATION_RULES: readonly PresentationRule[] = [
  {
    canonicalRef: 'kr.plants.roots.function.absorb-water',
    collection: 'plants',
    title: 'Roots',
    pronunciationText: 'roots'
  },
  {
    canonicalRef: 'kr.animals.butterfly.lifecycle.egg-to-butterfly',
    collection: 'animals',
    title: 'Butterfly life cycle',
    pronunciationText: 'butterfly'
  },
  {
    canonicalRef: 'kr.ecology.food-chain',
    collection: 'science',
    title: 'Food chain',
    pronunciationText: 'food chain'
  },
  {
    canonicalRef: 'sense.under.below-reference',
    collection: 'words_sounds',
    title: 'Under',
    pronunciationText: 'under'
  }
];

const FOREST_L2 = 'mission.forest-creek-rescue';
const FOREST_L3 = 'mission.forest-busy-grove';
const TOWN_MISSION = 'mission.town-square-helper';

function stableRefs(refs: readonly string[]): string[] {
  return [...new Set(refs.map((ref) => String(ref ?? '').trim()).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
}

function semanticKey(item: DiscoveryBookItem): string {
  return `${item.collection}:${stableRefs(item.canonicalRefs).join('|')}`;
}

function progressItem(
  attempt: StoredAttempt,
  rule: PresentationRule
): DiscoveryBookItem {
  return {
    id: `discovery.progress.${rule.collection}.${rule.canonicalRef.replace(/[^a-z0-9]+/gi, '-')}`,
    collection: rule.collection,
    title: rule.title,
    canonicalRefs: [rule.canonicalRef],
    discoveredFrom: { source: 'progress_attempt', sourceId: attempt.questionId },
    unlockedAt: attempt.submittedAt,
    pronunciationText: rule.pronunciationText
  };
}

function progressDiscoveries(progress: ProgressSnapshot): DiscoveryBookItem[] {
  const items: DiscoveryBookItem[] = [];
  const attempts = [...progress.attempts]
    .filter((attempt) => attempt.correct)
    .sort((left, right) => left.submittedAt.localeCompare(right.submittedAt) || left.questionId.localeCompare(right.questionId));

  for (const attempt of attempts) {
    const refs = new Set(attempt.knowledgeRefs);
    for (const rule of PRACTICE_PRESENTATION_RULES) {
      if (refs.has(rule.canonicalRef)) items.push(progressItem(attempt, rule));
    }
  }
  return items;
}

function missionTime(snapshot: StoryProgressSnapshot, missionId: string): string | null {
  return snapshot.completedMissions[missionId]?.completedAt ?? null;
}

function storyItem(
  missionId: string,
  unlockedAt: string,
  item: Omit<DiscoveryBookItem, 'discoveredFrom' | 'unlockedAt'>
): DiscoveryBookItem {
  return {
    ...item,
    canonicalRefs: stableRefs(item.canonicalRefs),
    discoveredFrom: { source: 'story_mission', sourceId: missionId },
    unlockedAt
  };
}

function forestStoryDiscoveries(snapshot: StoryProgressSnapshot): DiscoveryBookItem[] {
  const items: DiscoveryBookItem[] = [];
  const l2At = missionTime(snapshot, FOREST_L2);
  const l3At = missionTime(snapshot, FOREST_L3);

  for (const entry of projectForestDiscoveries(snapshot)) {
    const at = entry.sourceEventRef.includes('.l2.') ? l2At : l3At;
    if (!at) continue;
    if (entry.discoveryId === 'discovery.forest.creek-bank-nature') {
      items.push(storyItem(FOREST_L2, at, {
        id: entry.discoveryId,
        collection: 'plants',
        title: 'Roots',
        canonicalRefs: entry.canonicalRefs,
        pronunciationText: 'roots'
      }));
    } else if (entry.discoveryId === 'discovery.forest.word-habitat') {
      items.push(storyItem(FOREST_L2, at, {
        id: entry.discoveryId,
        collection: 'words_sounds',
        title: 'Habitat',
        canonicalRefs: entry.canonicalRefs,
        pronunciationText: 'habitat'
      }));
    } else if (entry.discoveryId === 'discovery.forest.field-note-busy-grove') {
      items.push(storyItem(FOREST_L3, at, {
        id: entry.discoveryId,
        collection: 'mail',
        title: 'Busy Grove field note',
        canonicalRefs: entry.canonicalRefs,
        fieldNote: 'Scientu saved this note from the grove you restored together.'
      }));
    }
  }

  if (l2At) {
    items.push(storyItem(FOREST_L2, l2At, {
      id: 'discovery.forest.place',
      collection: 'places',
      title: 'Forest',
      canonicalRefs: ['story.location.forest'],
      pronunciationText: 'forest'
    }));
  }
  if (l3At) {
    items.push(
      storyItem(FOREST_L3, l3At, {
        id: 'discovery.forest.butterfly',
        collection: 'animals',
        title: 'Butterfly life cycle',
        canonicalRefs: ['kr.animals.butterfly.lifecycle.egg-to-butterfly'],
        pronunciationText: 'butterfly'
      }),
      storyItem(FOREST_L3, l3At, {
        id: 'discovery.forest.food-chain',
        collection: 'science',
        title: 'Food chain',
        canonicalRefs: ['kr.ecology.food-chain'],
        pronunciationText: 'food chain'
      })
    );
  }
  return items;
}

function townStoryDiscoveries(snapshot: StoryProgressSnapshot): DiscoveryBookItem[] {
  const completedAt = missionTime(snapshot, TOWN_MISSION);
  if (!completedAt) return [];
  const items: DiscoveryBookItem[] = [];

  for (const entry of projectTownDiscoveries(snapshot)) {
    if (entry.discoveryId === 'discovery.town.square-place') {
      items.push(storyItem(TOWN_MISSION, completedAt, {
        id: entry.discoveryId,
        collection: 'places',
        title: 'Town Square',
        canonicalRefs: entry.canonicalRefs,
        pronunciationText: 'town square'
      }));
    } else if (entry.discoveryId === 'discovery.town.square-adventure-mail') {
      items.push(storyItem(TOWN_MISSION, completedAt, {
        id: entry.discoveryId,
        collection: 'mail',
        title: 'Town helper mail',
        canonicalRefs: entry.canonicalRefs,
        fieldNote: 'Scientu saved this note from the crossing, recycling corner and help station you restored.'
      }));
    }
  }
  return items;
}

/**
 * Child-facing Discovery Book is a deterministic projection only. It never writes
 * progress, mints currency, or increments an inventory counter. Replays simply
 * reproduce the same semantic keys and are collapsed here.
 */
export function projectDheuDiscoveryBook(
  progress: ProgressSnapshot,
  storyProgress: StoryProgressSnapshot
): DheuDiscoveryBook {
  const projected = [
    ...progressDiscoveries(progress),
    ...forestStoryDiscoveries(storyProgress),
    ...townStoryDiscoveries(storyProgress)
  ];
  const bySemanticKey = new Map<string, DiscoveryBookItem>();

  for (const candidate of projected) {
    const normalized = { ...candidate, canonicalRefs: stableRefs(candidate.canonicalRefs) };
    const key = semanticKey(normalized);
    const existing = bySemanticKey.get(key);
    if (!existing
      || normalized.unlockedAt < existing.unlockedAt
      || (normalized.unlockedAt === existing.unlockedAt && normalized.id < existing.id)) {
      bySemanticKey.set(key, normalized);
    }
  }

  const items = [...bySemanticKey.values()].sort((left, right) =>
    left.unlockedAt.localeCompare(right.unlockedAt)
      || left.collection.localeCompare(right.collection)
      || left.id.localeCompare(right.id)
  );
  const collections = Object.fromEntries(
    DISCOVERY_BOOK_COLLECTIONS.map(({ id }) => [id, items.filter((item) => item.collection === id)])
  ) as Record<DiscoveryBookCollectionId, DiscoveryBookItem[]>;

  return { items, collections };
}
