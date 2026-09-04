import {
  projectDiscoveries,
  type DiscoveryEntry,
  type DiscoveryProjectionRule
} from '../experience/discoveryProjection';
import type { StoryProgressSnapshot } from '../story/storyProgress';

export const FOREST_DISCOVERY_RULES: readonly DiscoveryProjectionRule[] = [
  {
    ruleId: 'rule.forest.l2.creek-nature',
    sourceEventRef: 'event.forest.l2.creek-restored',
    discoveryId: 'discovery.forest.creek-bank-nature',
    kind: 'animal_nature',
    canonicalRefs: ['kr.plants.roots.function.absorb-water'],
    foundAtRef: 'forest'
  },
  {
    ruleId: 'rule.forest.l2.creek-word',
    sourceEventRef: 'event.forest.l2.creek-word-found',
    discoveryId: 'discovery.forest.word-habitat',
    kind: 'vocabulary_semantic',
    canonicalRefs: ['kr.animals.rabbit.home.burrow'],
    foundAtRef: 'forest'
  },
  {
    ruleId: 'rule.forest.l3.field-note',
    sourceEventRef: 'event.forest.l3.grove-restored',
    discoveryId: 'discovery.forest.field-note-busy-grove',
    kind: 'field_note',
    canonicalRefs: [
      'kr.animals.butterfly.lifecycle.egg-to-butterfly',
      'kr.plants.roots.function.absorb-water'
    ],
    foundAtRef: 'forest'
  }
];

export function forestCompletedEventRefs(snapshot: StoryProgressSnapshot): string[] {
  const refs: string[] = [];
  if (snapshot.completedMissions['mission.forest-creek-rescue']) {
    refs.push('event.forest.l2.creek-restored', 'event.forest.l2.creek-word-found');
  }
  if (snapshot.completedMissions['mission.forest-busy-grove']) {
    refs.push('event.forest.l3.grove-restored');
  }
  return refs;
}

/**
 * Deterministic Forest-to-Discovery projection. Story progress is the only persistence
 * authority; repeated completions/reloads feed the same stable event set into the
 * existing Discovery projection, so replay cannot mint duplicate entries.
 */
export function projectForestDiscoveries(snapshot: StoryProgressSnapshot): DiscoveryEntry[] {
  return projectDiscoveries(FOREST_DISCOVERY_RULES, forestCompletedEventRefs(snapshot));
}
