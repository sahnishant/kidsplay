import type { TopicProgressSummary } from '../runtime/localProgress';
import { isStoryLocationComplete, isStoryLocationUnlocked, type StoryProgressSnapshot } from './storyProgress';
import type { StoryLocation, StoryMission } from './storyTypes';

export type StoryLocationVisualState = 'complete' | 'current' | 'available' | 'locked';

export interface StoryLocationPresentation {
  location: StoryLocation;
  mission?: StoryMission;
  state: StoryLocationVisualState;
  recommended: boolean;
}

function missionForLocation(missions: StoryMission[], locationId: string): StoryMission | undefined {
  return missions.find((mission) => mission.locationRef === locationId);
}

function isRecommended(location: StoryLocation, recommendedTopics: TopicProgressSummary[]): boolean {
  return recommendedTopics.some((topic) => location.topicGroups.includes(topic.id));
}

/**
 * Presentation-only route resolver. Child-facing Level N is a stable authored route:
 * curriculum recommendations may decorate an already-unlocked expedition, but they
 * never skip the first incomplete level or alter story unlock semantics.
 */
export function buildStoryLocationPresentation(
  locations: StoryLocation[],
  missions: StoryMission[],
  snapshot: StoryProgressSnapshot,
  recommendedTopics: TopicProgressSummary[] = []
): StoryLocationPresentation[] {
  const ordered = [...locations].sort((left, right) => left.progression.order - right.progression.order);
  const current = ordered.find((location) => {
    const mission = missionForLocation(missions, location.id);
    return isStoryLocationUnlocked(snapshot, location) && !isStoryLocationComplete(snapshot, location, mission);
  }) ?? ordered.find((location) => isStoryLocationUnlocked(snapshot, location));

  return locations.map((location) => {
    const mission = missionForLocation(missions, location.id);
    const unlocked = isStoryLocationUnlocked(snapshot, location);
    const complete = isStoryLocationComplete(snapshot, location, mission);
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