export type StoryCharacterId = 'dheu' | 'scientu' | 'shaitanu';

export type StoryCharacterAngle =
  | 'front'
  | 'three-quarter-left'
  | 'three-quarter-right'
  | 'side-left'
  | 'side-right';

export type StoryCharacterPose =
  | 'neutral'
  | 'inspect'
  | 'help'
  | 'action'
  | 'proud'
  | 'thinking';

export type StoryCharacterExpression =
  | 'neutral'
  | 'curious'
  | 'confused'
  | 'excited'
  | 'happy-laugh'
  | 'wicked-laugh'
  | 'helping'
  | 'proud'
  | 'worried'
  | 'surprised'
  | 'thinking'
  | 'aha'
  | 'sly'
  | 'fake-innocent'
  | 'mock-shock'
  | 'sulky'
  | 'admiring'
  | 'determined'
  | 'wonder'
  | 'retry-confident';

export type StoryCharacterMotion =
  | 'idle'
  | 'bob'
  | 'bounce'
  | 'head-tilt'
  | 'lean-in'
  | 'wiggle'
  | 'chuckle'
  | 'cape-swish'
  | 'sneak'
  | 'pop-in'
  | 'clap'
  | 'jump'
  | 'point'
  | 'inspect'
  | 'help'
  | 'recoil'
  | 'celebrate'
  | 'float'
  | 'think';

export type StoryBeatIntent =
  | 'provoke'
  | 'wonder'
  | 'tease'
  | 'reassure'
  | 'hypothesize'
  | 'react'
  | 'callback'
  | 'celebrate'
  | 'invite'
  | 'observe';

export type StoryBeatDelivery =
  | 'plain'
  | 'whisper'
  | 'gasp'
  | 'boast'
  | 'mutter'
  | 'excited'
  | 'suspicious'
  | 'gentle'
  | 'reluctant';

export interface StoryCharacterPersona {
  tagline: string;
  traits: string[];
  wants: string;
  notices: string[];
  speech: {
    rhythm: string;
    signatures: string[];
    avoids: string[];
  };
  visual: {
    palette: {
      primary: string;
      secondary: string;
      accent: string;
    };
    signatureFeatures: string[];
    supportedAngles: StoryCharacterAngle[];
    supportedPoses: StoryCharacterPose[];
    supportedExpressions: StoryCharacterExpression[];
    supportedMotions: StoryCharacterMotion[];
    defaultAngle: StoryCharacterAngle;
    defaultPose: StoryCharacterPose;
    defaultExpression: StoryCharacterExpression;
    defaultMotion: StoryCharacterMotion;
  };
  relationships: Partial<Record<StoryCharacterId, string>>;
}

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
  persona: StoryCharacterPersona;
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
  intent?: StoryBeatIntent;
  delivery?: StoryBeatDelivery;
  expression?: StoryCharacterExpression;
  pose?: StoryCharacterPose;
  angle?: StoryCharacterAngle;
  motion?: StoryCharacterMotion;
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
  /** Zero only for a bounded authored world-action mission using worldActionRef. */
  questionCount: number;
  knowledgeRefs: string[];
  questionPackRef?: string;
  /** Existing story shell may launch this generic world-action adventure instead of a quiz session. */
  worldActionRef?: string;
  /** Sub-level inside one story location; it does not alter global story-map level numbering. */
  worldDepthLevel?: number;
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
