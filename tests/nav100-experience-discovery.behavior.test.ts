import { describe, expect, it } from 'vitest';
import bicycleGuideJson from '../content/experience/bicycle-workshop-guided.json';
import studioDocument from '../content/experience/learning-studios.json';
import { getCatalogEntries } from '../src/content';
import { LEARN_ABOUT_TOPICS } from '../src/experience/learnAboutCatalog';
import { LEARNING_STUDIO_ACTIVITIES } from '../src/experience/learningStudios';
import {
  SOUND_TRAIL_ADVENTURE_ID,
  SOUND_TRAIL_TITLE
} from '../src/experience/phonicsAdventureProduction';
import { PUBLISHED_STORIES_V1 } from '../src/experience/storyCatalog';
import { getStoryMissions } from '../src/story/storyDirector';
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
} from '../src/experienceDiscovery/adapters';
import {
  buildExperienceDiscovery,
  filterExperienceDiscovery,
  resolveExperienceDiscoveryReference,
  type ExperienceDiscoveryRecord
} from '../src/experienceDiscovery/projection';

function studioPlacements(activityId: string): LearningStudioPlacement[] {
  const topicPlacements = studioDocument.topicBindings
    .filter((binding) => binding.activityRefs.includes(activityId))
    .map((binding) => ({
      surface: 'topic_section' as const,
      ownerRef: binding.topicId,
      sectionRef: binding.sectionId
    }));
  const workshopPlacements = studioDocument.workshopBindings
    .filter((binding) => binding.activityRefs.includes(activityId))
    .map((binding) => ({
      surface: 'workshop_section' as const,
      ownerRef: binding.workshopId,
      sectionRef: binding.sectionId
    }));
  return [...topicPlacements, ...workshopPlacements];
}

function currentRecords(): ExperienceDiscoveryRecord[] {
  const bicycleGuide = bicycleGuideJson as GuidedWorkshopDiscoverySource;
  return [
    ...getCatalogEntries().map(adaptCatalogEntry),
    ...LEARN_ABOUT_TOPICS.map(adaptLearnAboutTopic),
    ...LEARNING_STUDIO_ACTIVITIES.flatMap((activity) =>
      adaptLearningStudioActivity(activity, studioPlacements(activity.activityId))
    ),
    adaptGuidedWorkshop(bicycleGuide),
    adaptPhonicsAdventure(SOUND_TRAIL_ADVENTURE_ID, SOUND_TRAIL_TITLE),
    ...PUBLISHED_STORIES_V1.map(adaptStory),
    ...getStoryMissions().map(adaptStoryMission)
  ];
}

function syntheticRecords(count: number): ExperienceDiscoveryRecord[] {
  return Array.from({ length: count }, (_, index) => {
    const id = `synthetic.nav100.test.${String(index).padStart(4, '0')}`;
    return {
      canonicalId: id,
      kind: 'catalog_entry',
      childTitle: `Synthetic ${index}`,
      launch: { owner: 'catalog', ref: id },
      entryPoint: { surface: 'catalog' },
      sourceRefs: [id],
      availability: 'available',
      progress: { owner: 'none', resume: 'none' }
    };
  });
}

describe('NAV100 read-only experience discovery projection', () => {
  it('projects the six audited real pilots by their existing canonical identities', () => {
    const discovery = buildExperienceDiscovery(currentRecords());
    const ids = new Set(discovery.map((item) => item.canonicalId));

    expect(ids).toContain('experience.bicycle-workshop.guided.v1');
    expect(ids).toContain('learn.earth');
    expect(ids).toContain('studio.fractions.equal-shares');
    expect(ids).toContain('phonics.sound-trail.v1');
    expect(ids).toContain('story.dheu.moonlit-leaf');
    expect(ids).toContain('forest.world-depth.l2.creek-rescue');
  });

  it('collapses repeated studio placements onto one identity instead of cloning achievement identity', () => {
    const discovery = buildExperienceDiscovery(currentRecords());
    const equalShares = discovery.filter((item) => item.canonicalId === 'studio.fractions.equal-shares');

    expect(equalShares).toHaveLength(1);
    expect(equalShares[0].entryPoints).toEqual([
      { surface: 'topic_section', ownerRef: 'learn.fractions', sectionRef: 'fractions.equal-shares' },
      { surface: 'topic_section', ownerRef: 'learn.fractions', sectionRef: 'fractions.same-half' }
    ]);
    expect(equalShares[0].progress).toEqual({ owner: 'studio_workspace', resume: 'workspace' });
  });

  it('keeps current reopen semantics truthful instead of inventing universal resume', () => {
    const discovery = buildExperienceDiscovery(currentRecords());
    const byId = new Map(discovery.map((item) => [item.canonicalId, item]));

    expect(byId.get('story.dheu.moonlit-leaf')?.progress).toEqual({ owner: 'story_reading', resume: 'exact' });
    expect(byId.get('studio.fractions.equal-shares')?.progress).toEqual({ owner: 'studio_workspace', resume: 'workspace' });
    expect(byId.get('experience.bicycle-workshop.guided.v1')?.progress.resume).toBe('none');
    expect(byId.get('phonics.sound-trail.v1')?.progress.resume).toBe('none');
    expect(byId.get('learn.earth')?.progress).toEqual({ owner: 'none', resume: 'none' });
    expect(byId.get('forest.world-depth.l2.creek-rescue')?.progress).toEqual({ owner: 'story_progress', resume: 'completion_only' });
  });

  it('uses the world action as canonical identity while preserving its existing story-mission launch context', () => {
    const discovery = buildExperienceDiscovery(currentRecords());
    const creek = discovery.find((item) => item.canonicalId === 'forest.world-depth.l2.creek-rescue');

    expect(creek?.kind).toBe('world_action');
    expect(creek?.launch).toEqual({ owner: 'story_world', ref: 'mission.forest-creek-rescue', mode: 'world_action' });
    expect(creek?.entryPoints).toContainEqual({
      surface: 'story_world',
      ownerRef: 'forest',
      sectionRef: 'mission.forest-creek-rescue'
    });
  });

  it('keeps curriculum/profile placement separate from presentation metadata', () => {
    const discovery = buildExperienceDiscovery(currentRecords());
    const profileEntry = discovery.find((item) => item.profileRefs.length > 0);
    const studio = discovery.find((item) => item.canonicalId === 'studio.fractions.equal-shares');

    expect(profileEntry?.profileRefs.length).toBeGreaterThan(0);
    expect(studio?.profileRefs).toEqual([]);
    expect(studio?.presentationRefs).toEqual(['fraction_studio']);
  });

  it('returns explicit no-result and stale-reference states', () => {
    const discovery = buildExperienceDiscovery(currentRecords());

    expect(filterExperienceDiscovery(discovery, { canonicalIds: ['missing.activity'] })).toEqual([]);
    expect(resolveExperienceDiscoveryReference(discovery, 'missing.activity')).toEqual({
      status: 'stale',
      canonicalId: 'missing.activity'
    });
    expect(resolveExperienceDiscoveryReference(discovery, 'learn.earth').status).toBe('found');
  });

  it('is deterministic and does not mutate adapter input', () => {
    const records = currentRecords();
    const before = structuredClone(records);
    const first = buildExperienceDiscovery(records);
    const second = buildExperienceDiscovery([...records].reverse());

    expect(records).toEqual(before);
    expect(second).toEqual(first);
    expect(first.map((item) => item.canonicalId)).toEqual(
      [...first.map((item) => item.canonicalId)].sort((left, right) => left.localeCompare(right))
    );
  });

  it.each([0, 1, 150, 1000])('handles a test-only synthetic catalogue of %i descriptors', (count) => {
    const discovery = buildExperienceDiscovery(syntheticRecords(count));
    expect(discovery).toHaveLength(count);
    expect(new Set(discovery.map((item) => item.canonicalId)).size).toBe(count);
  });

  it('never leaks test-only synthetic identities into the real projection', () => {
    const discovery = buildExperienceDiscovery(currentRecords());
    expect(discovery.some((item) => item.canonicalId.startsWith('synthetic.nav100.test.'))).toBe(false);
  });

  it('rejects conflicting metadata for one canonical identity', () => {
    const records = syntheticRecords(1);
    records.push({ ...structuredClone(records[0]), childTitle: 'A conflicting duplicate' });
    expect(() => buildExperienceDiscovery(records)).toThrow(/conflicting discovery metadata/);
  });
});
