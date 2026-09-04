import type {
  LearnAboutDepthBand,
  LearnAboutRecipeFamily,
  LearnAboutTopic
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
const STABLE_REF = /^[a-z0-9]+(?:[._:#-][a-z0-9]+)*$/i;

function depthAtOrBelow(candidate: LearnAboutDepthBand, selected: LearnAboutDepthBand): boolean {
  return DEPTH_ORDER.indexOf(candidate) <= DEPTH_ORDER.indexOf(selected);
}

function authorityRefSet(refs: readonly string[], context: string): Set<string> {
  if (!Array.isArray(refs)) throw new Error(`${context} must be an array`);
  for (let index = 0; index < refs.length; index += 1) {
    const ref = refs[index];
    if (typeof ref !== 'string' || !STABLE_REF.test(ref)) {
      throw new Error(`${context}[${index}] must be a stable ref`);
    }
  }
  if (new Set(refs).size !== refs.length) throw new Error(`${context} contains duplicates`);
  return new Set(refs);
}

/**
 * Projects contract-validated topic metadata into non-evaluative child activities
 * while failing closed around canonical truth. It never copies fact prose or answer
 * keys into Learn About. Topic schema validation remains a test/content gate while
 * authority inputs are still validated at the runtime boundary.
 */
export function projectLearnAboutActivities(
  topic: LearnAboutTopic,
  selectedDepth: LearnAboutDepthBand,
  authority: LearnAboutProjectionAuthority
): ProjectedLearnAboutActivity[] {
  const admitted = authorityRefSet(authority.admittedKnowledgeRefs, 'admittedKnowledgeRefs');
  const supportedRelationships = authorityRefSet(authority.supportedRelationshipRefs ?? [], 'supportedRelationshipRefs');

  return topic.sections.flatMap((section) => {
    if (!section.depthBands.some((band) => depthAtOrBelow(band, selectedDepth))) return [];
    const admittedSectionRefs = section.knowledgeRefs.filter((ref) => admitted.has(ref));
    const relationshipRefs = admittedSectionRefs.filter((ref) => supportedRelationships.has(ref));

    return section.recipeFamilies.flatMap((family): ProjectedLearnAboutActivity[] => {
      if (family === 'guess' || family === 'practice') return [];
      if (family === 'did_you_know' && admittedSectionRefs.length === 0) return [];
      if ((family === 'compare' || family === 'try_it') && relationshipRefs.length === 0) return [];

      return [{
        topicId: topic.topicId,
        sectionId: section.sectionId,
        family,
        depthBand: selectedDepth,
        rootConceptRefs: topic.rootConceptRefs,
        knowledgeRefs: family === 'compare' || family === 'try_it' ? relationshipRefs : admittedSectionRefs,
        affectsMastery: false
      }];
    });
  });
}
