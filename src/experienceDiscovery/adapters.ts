import type { CatalogEntry } from '../content';
import type { LearnAboutTopic } from '../experience/learnAboutContract';
import type { LearningStudioActivity } from '../experience/learningStudios';
import type { StoryManifest } from '../experience/storiesContract';
import type { StoryMission } from '../story/storyTypes';
import type { ExperienceDiscoveryRecord } from './projection';

export interface LearningStudioPlacement {
  surface: 'topic_section' | 'workshop_section';
  ownerRef: string;
  sectionRef: string;
}

export interface GuidedWorkshopDiscoverySource {
  experienceId: string;
  moduleRef: string;
  childTitle: string;
  practicePackRef: string;
  chapterCheckPackRef: string;
  sourcePolicyRef?: string;
}

export function adaptCatalogEntry(entry: CatalogEntry): ExperienceDiscoveryRecord {
  return {
    canonicalId: entry.id,
    kind: 'catalog_entry',
    childTitle: entry.title,
    launch: { owner: 'catalog', ref: entry.id, mode: entry.kind },
    entryPoint: { surface: 'catalog' },
    sourceRefs: [entry.id],
    profileRefs: entry.profileRef ? [entry.profileRef] : [],
    availability: entry.status === 'ready' ? 'available' : 'partial',
    progress: { owner: 'mastery_evidence', resume: 'none' }
  };
}

export function adaptLearnAboutTopic(topic: LearnAboutTopic): ExperienceDiscoveryRecord {
  return {
    canonicalId: topic.topicId,
    kind: 'learn_about_topic',
    childTitle: topic.childTitle,
    launch: { owner: 'learn_about', ref: topic.topicId },
    entryPoint: { surface: 'learn_about' },
    sourceRefs: [...topic.rootConceptRefs],
    presentationRefs: [`archetype:${topic.archetype}`],
    availability: 'available',
    progress: { owner: 'none', resume: 'none' }
  };
}

export function adaptLearningStudioActivity(
  activity: LearningStudioActivity,
  placements: readonly LearningStudioPlacement[]
): ExperienceDiscoveryRecord[] {
  if (!placements.length) {
    throw new Error(`${activity.activityId}: discovery requires at least one existing studio placement`);
  }

  const sourceRefs = [activity.source.questionId];
  if (activity.source.wordProjection) {
    sourceRefs.push(
      activity.source.wordProjection.termId,
      activity.source.wordProjection.conceptRef,
      activity.source.wordProjection.knowledgeRef
    );
  }

  return placements.map((placement) => ({
    canonicalId: activity.activityId,
    kind: 'learning_studio',
    childTitle: activity.childTitle,
    launch: { owner: 'learning_studio', ref: activity.activityId },
    entryPoint: {
      surface: placement.surface,
      ownerRef: placement.ownerRef,
      sectionRef: placement.sectionRef
    },
    sourceRefs,
    presentationRefs: [activity.family],
    availability: 'available',
    progress: { owner: 'studio_workspace', resume: 'workspace' }
  }));
}

export function adaptGuidedWorkshop(source: GuidedWorkshopDiscoverySource): ExperienceDiscoveryRecord {
  return {
    canonicalId: source.experienceId,
    kind: 'guided_workshop',
    childTitle: source.childTitle,
    launch: { owner: 'bicycle_workshop', ref: source.experienceId },
    entryPoint: { surface: 'home_direct' },
    sourceRefs: [
      source.moduleRef,
      source.practicePackRef,
      source.chapterCheckPackRef,
      ...(source.sourcePolicyRef ? [source.sourcePolicyRef] : [])
    ],
    availability: 'available',
    progress: { owner: 'mastery_evidence', resume: 'none' }
  };
}

export function adaptPhonicsAdventure(adventureId: string, childTitle: string): ExperienceDiscoveryRecord {
  return {
    canonicalId: adventureId,
    kind: 'phonics_adventure',
    childTitle,
    launch: { owner: 'phonics', ref: adventureId },
    entryPoint: { surface: 'home_direct' },
    sourceRefs: [adventureId],
    presentationRefs: ['sound_first_literacy'],
    availability: 'available',
    progress: { owner: 'mastery_evidence', resume: 'none' }
  };
}

export function adaptStory(manifest: StoryManifest): ExperienceDiscoveryRecord {
  return {
    canonicalId: manifest.storyId,
    kind: 'story',
    childTitle: manifest.childTitle,
    launch: { owner: 'stories', ref: manifest.storyId },
    entryPoint: { surface: 'story_library' },
    sourceRefs: [
      manifest.lexicalProfileRef,
      ...(manifest.seriesId ? [manifest.seriesId] : [])
    ],
    presentationRefs: [...manifest.supportedModes],
    availability: manifest.editorialStatus === 'reviewed' ? 'available' : 'partial',
    progress: { owner: 'story_reading', resume: 'exact' }
  };
}

export function adaptStoryMission(mission: StoryMission): ExperienceDiscoveryRecord {
  const sourceRefs = [
    mission.id,
    mission.locationRef,
    ...(mission.questionPackRef ? [mission.questionPackRef] : []),
    ...(mission.worldActionRef ? [mission.worldActionRef] : [])
  ];

  if (mission.worldActionRef) {
    return {
      canonicalId: mission.worldActionRef,
      kind: 'world_action',
      childTitle: mission.title,
      launch: { owner: 'story_world', ref: mission.id, mode: 'world_action' },
      entryPoint: {
        surface: 'story_world',
        ownerRef: mission.locationRef,
        sectionRef: mission.id
      },
      sourceRefs,
      availability: mission.status === 'reviewed' ? 'available' : 'partial',
      progress: { owner: 'story_progress', resume: 'completion_only' }
    };
  }

  return {
    canonicalId: mission.id,
    kind: 'story_mission',
    childTitle: mission.title,
    launch: { owner: 'story_world', ref: mission.id, mode: 'mission' },
    entryPoint: {
      surface: 'story_world',
      ownerRef: mission.locationRef,
      sectionRef: mission.id
    },
    sourceRefs,
    availability: mission.status === 'reviewed' ? 'available' : 'partial',
    progress: { owner: 'story_progress', resume: 'completion_only' }
  };
}
