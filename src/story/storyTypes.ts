export type StoryCharacterId = 'dheu' | 'scientu' | 'shaitanu';

export interface StoryCharacter {
  id: StoryCharacterId;
  role: 'hero' | 'guide' | 'challenger';
  displayName: string;
  personalization: {
    useSavedChildName: boolean;
    fallbackName: string;
  };
  pedagogy: string;
  visualPolicy: 'kidsplay_original';
}

export type StoryLocationUnlock =
  | { type: 'start' }
  | { type: 'mission'; missionRef: string };

export interface StoryLocationProgression {
  /** Child-facing level number. Never derive this from question difficulty or unlock state. */
  level: number;
  /** Stable route order used to compare expeditions without relying on map coordinates. */
  order: number;
}

export interface StoryLocation {
  id: string;
  /** Compact map label. */
  label: string;
  /** Child-facing adventure name used in progress and mission-control surfaces. */
  expeditionTitle: string;
  progression: StoryLocationProgression;
  topicGroups: string[];
  position: { x: number; y: number };
  unlock: StoryLocationUnlock;
}

export interface StoryBeat {
  speakerRef: StoryCharacterId;
  mood: string;
  text: string;
}

export interface StoryReward {
  id: string;
  label: string;
  stars: number;
}

export interface StoryMission {
  id: string;
  title: string;
  locationRef: string;
  status: 'prototype' | 'reviewed';
  access: 'free' | 'goal';
  questionCount: number;
  knowledgeRefs: string[];
  questionPackRef?: string;
  openingSceneRef?: string;
  successSceneRef?: string;
  beats: StoryBeat[];
  successBeat: StoryBeat;
  reward: StoryReward;
}

export interface StoryCharacterDocument {
  schemaVersion: 1;
  characters: StoryCharacter[];
}

export interface StoryLocationDocument {
  schemaVersion: 1;
  locations: StoryLocation[];
}

export interface StoryMissionDocument {
  schemaVersion: 1;
  missions: StoryMission[];
}