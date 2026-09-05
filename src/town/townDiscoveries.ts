import {
  projectDiscoveries,
  type DiscoveryEntry,
  type DiscoveryProjectionRule
} from '../experience/discoveryProjection';
import type { StoryProgressSnapshot } from '../story/storyProgress';

export const TOWN_DISCOVERY_RULES: readonly DiscoveryProjectionRule[] = [
  {
    ruleId: 'rule.town.square.place',
    sourceEventRef: 'event.town.square.safe-restored',
    discoveryId: 'discovery.town.square-place',
    kind: 'place',
    canonicalRefs: ['story.location.town-square'],
    foundAtRef: 'town-square'
  },
  {
    ruleId: 'rule.town.square.adventure-mail',
    sourceEventRef: 'event.town.square.adventure-mail',
    discoveryId: 'discovery.town.square-adventure-mail',
    kind: 'field_note',
    canonicalRefs: ['kr.safety.road.crossing.zebra', 'kr.safety.traffic.red.stop'],
    foundAtRef: 'town-square'
  }
];

export function townCompletedEventRefs(snapshot: StoryProgressSnapshot): string[] {
  return snapshot.completedMissions['mission.town-square-helper']
    ? ['event.town.square.safe-restored', 'event.town.square.adventure-mail']
    : [];
}

/** Replay-safe Town-to-Discovery projection driven only by the existing story progress snapshot. */
export function projectTownDiscoveries(snapshot: StoryProgressSnapshot): DiscoveryEntry[] {
  return projectDiscoveries(TOWN_DISCOVERY_RULES, townCompletedEventRefs(snapshot));
}
