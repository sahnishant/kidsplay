import {
  validateLearnAboutTopic,
  type LearnAboutDepthBand,
  type LearnAboutRecipeFamily,
  type LearnAboutTopic
} from './learnAboutContract';

export interface LearnAboutProjectionAuthority {
  /** Canonical knowledge rows already reviewed/admitted by the existing knowledge pipeline. */
  admittedKnowledgeRefs: readonly string[];
  /** Existing relationship/mechanics refs that can support compare/try-it recipes. */
  supportedRelationshipRefs?: readonly string[];
}

export interface ProjectedLearnAboutActivity {
  topicId: string;
  sectionId: string;
  family: LearnAboutRecipeFamily;
  depthBand: LearnAboutDepthBand;
  rootConceptRefs: readonly string[];
  knowledgeRefs: readonly string[];
  affectsMastery: false;
}

const DEPTH_ORDER: readonly LearnAboutDepthBand[] = [
  'd0_first_play',
  'd1_preschool',
  'd2_early_primary',
  'd3_deeper_primary'
];

function depthAtOrBelow(candidate: LearnAboutDepthBand, selected: LearnAboutDepthBand): boolean {
  return DEPTH_ORDER.indexOf(candidate) <= DEPTH_ORDER.indexOf(selected);
}

/**
 * Projects topic navigation into non-evaluative activities while failing closed
 * around canonical truth. It never copies fact prose or answer keys into Learn About.
 */
export function projectLearnAboutActivities(
  rawTopic: LearnAboutTopic,
  selectedDepth: LearnAboutDepthBand,
  authority: LearnAboutProjectionAuthority
): ProjectedLearnAboutActivity[] {
  const topic = validateLearnAboutTopic(rawTopic);
  if (!DEPTH_ORDER.includes(selectedDepth)) throw new Error(`Invalid Learn About depth ${String(selectedDepth)}`);
  const admitted = new Set(authority.admittedKnowledgeRefs);
  const supportedRelationships = new Set(authority.supportedRelationshipRefs ?? []);

  return topic.sections.flatMap((section) => {
    const activeAtDepth = section.depthBands.some((band) => depthAtOrBelow(band, selectedDepth));
    if (!activeAtDepth) return [];
    const admittedSectionRefs = section.knowledgeRefs.filter((ref) => admitted.has(ref));

    return section.recipeFamilies.flatMap((family): ProjectedLearnAboutActivity[] => {
      if (family === 'guess' || family === 'practice') return [];
      if (family === 'did_you_know' && admittedSectionRefs.length === 0) return [];
      if ((family === 'compare' || family === 'try_it') && !section.knowledgeRefs.some((ref) => supportedRelationships.has(ref))) {
        return [];
      }

      return [{
        topicId: topic.topicId,
        sectionId: section.sectionId,
        family,
        depthBand: selectedDepth,
        rootConceptRefs: [...topic.rootConceptRefs],
        knowledgeRefs: admittedSectionRefs,
        affectsMastery: false
      }];
    });
  });
}
