import type { TopicProgressSummary } from '../runtime/localProgress';
import {
  isStoryLocationUnlocked,
  isStoryMissionComplete,
  type StoryProgressSnapshot
} from './storyProgress';
import type { StoryLocation, StoryMission } from './storyTypes';

export type StoryLocationVisualState = 'complete' | 'current' | 'available' | 'locked';

export interface StoryLocationPresentation {
  location: StoryLocation;
  mission?: StoryMission;
  state: StoryLocationVisualState;
  recommended: boolean;
}

function missionsForLocation(missions: StoryMission[], locationId: string): StoryMission[] {
  return missions.filter((mission) => mission.locationRef === locationId);
}

function nextMissionForLocation(
  missions: StoryMission[],
  locationId: string,
  snapshot: StoryProgressSnapshot
): StoryMission | undefined {
  const locationMissions = missionsForLocation(missions, locationId);
  return locationMissions.find((mission) => !isStoryMissionComplete(snapshot, mission.id))
    ?? locationMissions.at(-1);
}

function locationComplete(
  missions: StoryMission[],
  location: StoryLocation,
  snapshot: StoryProgressSnapshot
): boolean {
  if (snapshot.completedLocations[location.id]) return true;
  const locationMissions = missionsForLocation(missions, location.id);
  return locationMissions.length > 0 && locationMissions.every((mission) => isStoryMissionComplete(snapshot, mission.id));
}

function isRecommended(location: StoryLocation, recommendedTopics: TopicProgressSummary[]): boolean {
  return recommendedTopics.some((topic) => location.topicGroups.includes(topic.id));
}

/**
 * Presentation-only route resolver. A location may contain an ordered chain of authored
 * missions; the map exposes only the next incomplete one. Existing single-mission
 * locations therefore retain identical behaviour, while Forest can deepen without
 * creating duplicate locations or a second story engine.
 */
export function buildStoryLocationPresentation(
  locations: StoryLocation[],
  missions: StoryMission[],
  snapshot: StoryProgressSnapshot,
  recommendedTopics: TopicProgressSummary[] = []
): StoryLocationPresentation[] {
  const ordered = [...locations].sort((left, right) => left.progression.order - right.progression.order);
  const current = ordered.find((location) =>
    isStoryLocationUnlocked(snapshot, location) && !locationComplete(missions, location, snapshot)
  ) ?? ordered.find((location) => isStoryLocationUnlocked(snapshot, location));

  return locations.map((location) => {
    const mission = nextMissionForLocation(missions, location.id, snapshot);
    const unlocked = isStoryLocationUnlocked(snapshot, location);
    const complete = locationComplete(missions, location, snapshot);
    const recommended = unlocked && isRecommended(location, recommendedTopics);
    const state: StoryLocationVisualState = !unlocked
      ? 'locked'
      : complete
        ? 'complete'
        : current?.id === location.id
          ? 'current'
          : 'available';
    return { location, mission, state, recommended };
  });
}

export function currentStoryLocation(
  locations: StoryLocation[],
  missions: StoryMission[],
  snapshot: StoryProgressSnapshot,
  recommendedTopics: TopicProgressSummary[] = []
): StoryLocation | null {
  return buildStoryLocationPresentation(locations, missions, snapshot, recommendedTopics)
    .find((item) => item.state === 'current')?.location ?? null;
}
