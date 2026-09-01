import type { StoryLocation, StoryMission } from './storyTypes';

export interface StoryMissionProgress {
  missionId: string;
  completedAt: string;
  completions: number;
  rewardId: string;
  starsAwarded: number;
}

export interface StoryLocationProgress {
  locationId: string;
  completedAt: string;
  completions: number;
}

export interface StoryProgressSnapshot {
  version: 1;
  completedMissions: Record<string, StoryMissionProgress>;
  /** Completion for open expeditions that are not represented by a story mission. */
  completedLocations: Record<string, StoryLocationProgress>;
  completedSessionIds: string[];
  updatedAt: string | null;
}

const STORY_PROGRESS_KEY = 'kidsplay.story-progress.v1';
const MAX_COMPLETED_SESSION_IDS = 100;

function emptyStoryProgress(): StoryProgressSnapshot {
  return {
    version: 1,
    completedMissions: {},
    completedLocations: {},
    completedSessionIds: [],
    updatedAt: null
  };
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && Number.isFinite(Date.parse(value));
}

function readStored(): unknown {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORY_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStored(snapshot: StoryProgressSnapshot): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORY_PROGRESS_KEY, JSON.stringify(snapshot));
  } catch {
    // Story rewards are optional local state; restricted storage must not break learning.
  }
}

function isMissionProgress(value: unknown, missionId: string): value is StoryMissionProgress {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<StoryMissionProgress>;
  return item.missionId === missionId
    && isTimestamp(item.completedAt)
    && Number.isInteger(item.completions)
    && Number(item.completions) >= 1
    && typeof item.rewardId === 'string'
    && item.rewardId.length > 0
    && Number.isInteger(item.starsAwarded)
    && Number(item.starsAwarded) >= 0;
}

function isLocationProgress(value: unknown, locationId: string): value is StoryLocationProgress {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<StoryLocationProgress>;
  return item.locationId === locationId
    && isTimestamp(item.completedAt)
    && Number.isInteger(item.completions)
    && Number(item.completions) >= 1;
}

export function loadStoryProgress(): StoryProgressSnapshot {
  const value = readStored();
  if (!value || typeof value !== 'object') return emptyStoryProgress();
  const candidate = value as Partial<StoryProgressSnapshot>;
  const completedMissions: Record<string, StoryMissionProgress> = {};
  const completedLocations: Record<string, StoryLocationProgress> = {};

  if (candidate.completedMissions && typeof candidate.completedMissions === 'object') {
    for (const [missionId, progress] of Object.entries(candidate.completedMissions)) {
      if (missionId && isMissionProgress(progress, missionId)) completedMissions[missionId] = progress;
    }
  }

  if (candidate.completedLocations && typeof candidate.completedLocations === 'object') {
    for (const [locationId, progress] of Object.entries(candidate.completedLocations)) {
      if (locationId && isLocationProgress(progress, locationId)) completedLocations[locationId] = progress;
    }
  }

  const completedSessionIds = Array.isArray(candidate.completedSessionIds)
    ? candidate.completedSessionIds
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
      .slice(-MAX_COMPLETED_SESSION_IDS)
    : [];

  return {
    version: 1,
    completedMissions,
    completedLocations,
    completedSessionIds: [...new Set(completedSessionIds)],
    updatedAt: isTimestamp(candidate.updatedAt) ? candidate.updatedAt : null
  };
}

export function recordStoryMissionCompletion(
  mission: StoryMission,
  sessionId: string,
  completedAt: string = new Date().toISOString()
): StoryProgressSnapshot {
  if (!sessionId) throw new Error('Story mission completion requires a session id');
  if (!isTimestamp(completedAt)) throw new Error('Story mission completion requires a valid timestamp');

  const snapshot = loadStoryProgress();
  if (snapshot.completedSessionIds.includes(sessionId)) return snapshot;

  const existing = snapshot.completedMissions[mission.id];
  snapshot.completedMissions[mission.id] = existing
    ? { ...existing, completedAt, completions: existing.completions + 1 }
    : {
      missionId: mission.id,
      completedAt,
      completions: 1,
      rewardId: mission.reward.id,
      starsAwarded: mission.reward.stars
    };
  snapshot.completedSessionIds = [...snapshot.completedSessionIds, sessionId].slice(-MAX_COMPLETED_SESSION_IDS);
  snapshot.updatedAt = completedAt;
  writeStored(snapshot);
  return snapshot;
}

export function recordStoryLocationCompletion(
  location: StoryLocation,
  sessionId: string,
  completedAt: string = new Date().toISOString()
): StoryProgressSnapshot {
  if (!sessionId) throw new Error('Story location completion requires a session id');
  if (!isTimestamp(completedAt)) throw new Error('Story location completion requires a valid timestamp');

  const snapshot = loadStoryProgress();
  if (snapshot.completedSessionIds.includes(sessionId)) return snapshot;

  const existing = snapshot.completedLocations[location.id];
  snapshot.completedLocations[location.id] = existing
    ? { ...existing, completedAt, completions: existing.completions + 1 }
    : { locationId: location.id, completedAt, completions: 1 };
  snapshot.completedSessionIds = [...snapshot.completedSessionIds, sessionId].slice(-MAX_COMPLETED_SESSION_IDS);
  snapshot.updatedAt = completedAt;
  writeStored(snapshot);
  return snapshot;
}

export function isStoryMissionComplete(snapshot: StoryProgressSnapshot, missionId: string): boolean {
  return Boolean(snapshot.completedMissions[missionId]);
}

export function isStoryLocationComplete(
  snapshot: StoryProgressSnapshot,
  location: StoryLocation,
  mission?: StoryMission
): boolean {
  return Boolean(snapshot.completedLocations[location.id])
    || Boolean(mission && snapshot.completedMissions[mission.id]);
}

/** Story-map unlocks depend only on stable story mission ids, never curriculum/mastery state. */
export function isStoryLocationUnlocked(snapshot: StoryProgressSnapshot, location: StoryLocation): boolean {
  return location.unlock.type === 'start'
    || isStoryMissionComplete(snapshot, location.unlock.missionRef);
}

export function storyUnlockedLocationCount(
  snapshot: StoryProgressSnapshot,
  locations: StoryLocation[]
): number {
  return locations.filter((location) => isStoryLocationUnlocked(snapshot, location)).length;
}

export function storyStarTotal(snapshot: StoryProgressSnapshot): number {
  return Object.values(snapshot.completedMissions)
    .reduce((sum, mission) => sum + mission.starsAwarded, 0);
}