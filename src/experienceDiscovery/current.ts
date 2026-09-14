import {
  adaptCatalogEntry,
  adaptGuidedWorkshop,
  adaptLearnAboutTopic,
  adaptLearningStudioActivity,
  adaptPhonicsAdventure,
  adaptStory,
  adaptStoryMission,
  type GuidedWorkshopDiscoverySource,
  type LearningStudioPlacement
} from './adapters';
import { buildExperienceDiscovery, type ExperienceDiscoveryDescriptor } from './projection';

interface StudioBindingDocument {
  topicBindings: Array<{
    topicId: string;
    sectionId: string;
    activityRefs: string[];
  }>;
  workshopBindings: Array<{
    workshopId: string;
    sectionId: string;
    activityRefs: string[];
  }>;
}

function placementsForActivity(
  document: StudioBindingDocument,
  activityId: string
): LearningStudioPlacement[] {
  const topicPlacements = document.topicBindings
    .filter((binding) => binding.activityRefs.includes(activityId))
    .map((binding) => ({
      surface: 'topic_section' as const,
      ownerRef: binding.topicId,
      sectionRef: binding.sectionId
    }));
  const workshopPlacements = document.workshopBindings
    .filter((binding) => binding.activityRefs.includes(activityId))
    .map((binding) => ({
      surface: 'workshop_section' as const,
      ownerRef: binding.workshopId,
      sectionRef: binding.sectionId
    }));
  return [...topicPlacements, ...workshopPlacements];
}

/**
 * Lazily reads the current canonical owners and projects them into one neutral
 * discovery catalogue. Importing this module does not import child viewports or
 * eager-load those owners; the registry modules are requested only when a
 * discovery consumer actually asks for the catalogue.
 */
export async function loadCurrentExperienceDiscovery(): Promise<ExperienceDiscoveryDescriptor[]> {
  const [
    content,
    learnAbout,
    studios,
    phonics,
    stories,
    storyWorld,
    bicycleGuideModule,
    studioDocumentModule
  ] = await Promise.all([
    import('../content'),
    import('../experience/learnAboutCatalog'),
    import('../experience/learningStudios'),
    import('../experience/phonicsAdventureProduction'),
    import('../experience/storyCatalog'),
    import('../story/storyDirector'),
    import('../../content/experience/bicycle-workshop-guided.json'),
    import('../../content/experience/learning-studios.json')
  ]);

  const bicycleGuide = bicycleGuideModule.default as GuidedWorkshopDiscoverySource;
  const studioDocument = studioDocumentModule.default as StudioBindingDocument;

  return buildExperienceDiscovery([
    ...content.getCatalogEntries().map(adaptCatalogEntry),
    ...learnAbout.LEARN_ABOUT_TOPICS.map(adaptLearnAboutTopic),
    ...studios.LEARNING_STUDIO_ACTIVITIES.flatMap((activity) =>
      adaptLearningStudioActivity(activity, placementsForActivity(studioDocument, activity.activityId))
    ),
    adaptGuidedWorkshop(bicycleGuide),
    adaptPhonicsAdventure(phonics.SOUND_TRAIL_ADVENTURE_ID, phonics.SOUND_TRAIL_TITLE),
    ...stories.PUBLISHED_STORIES_V1.map(adaptStory),
    ...storyWorld.getStoryMissions().map(adaptStoryMission)
  ]);
}
