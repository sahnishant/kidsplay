export type LearnAboutTopicArchetype =
  | 'animal'
  | 'celestial_system'
  | 'community_place'
  | 'nature_system'
  | 'body_system'
  | 'how_it_works';

export type LearnAboutDepthBand = 'd0_first_play' | 'd1_preschool' | 'd2_early_primary' | 'd3_deeper_primary';

export type LearnAboutRecipeFamily =
  | 'explore'
  | 'did_you_know'
  | 'guess'
  | 'compare'
  | 'try_it'
  | 'practice'
  | 'character_beat';

export interface LearnAboutSection {
  sectionId: string;
  /** Child-facing navigation label only; educational truth remains in knowledgeRefs. */
  childTitle: string;
  knowledgeRefs: readonly string[];
  depthBands: readonly LearnAboutDepthBand[];
  recipeFamilies: readonly LearnAboutRecipeFamily[];
}

export interface LearnAboutTopic {
  schemaVersion: 1;
  topicId: string;
  childTitle: string;
  archetype: LearnAboutTopicArchetype;
  rootConceptRefs: readonly string[];
  sections: readonly LearnAboutSection[];
  relatedTopicIds?: readonly string[];
}

export interface LearnAboutNavigationState {
  schemaVersion: 1;
  lastTopicId?: string;
  lastSectionId?: string;
  visitedDiscoveryRefs: readonly string[];
  favouriteTopicIds: readonly string[];
}

const VALID_ARCHETYPES = new Set<LearnAboutTopicArchetype>([
  'animal',
  'celestial_system',
  'community_place',
  'nature_system',
  'body_system',
  'how_it_works'
]);
const VALID_DEPTHS = new Set<LearnAboutDepthBand>([
  'd0_first_play',
  'd1_preschool',
  'd2_early_primary',
  'd3_deeper_primary'
]);
const VALID_RECIPES = new Set<LearnAboutRecipeFamily>([
  'explore',
  'did_you_know',
  'guess',
  'compare',
  'try_it',
  'practice',
  'character_beat'
]);

const FORBIDDEN_TRUTH_KEYS = new Set([
  'fact',
  'facts',
  'answer',
  'answers',
  'solution',
  'solutions',
  'definition',
  'definitions',
  'correctOption',
  'correctOptionId',
  'mastery',
  'accuracy',
  'score'
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertStableRef(value: unknown, context: string): string {
  if (typeof value !== 'string' || !value.trim() || /\s/.test(value)) {
    throw new Error(`${context} must be a stable ref without whitespace`);
  }
  return value;
}

function assertChildTitle(value: unknown, context: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${context} must be non-empty child-facing text`);
  return value.trim();
}

function assertUniqueStringArray(value: unknown, context: string): string[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`${context} must be a non-empty array`);
  const refs = value.map((item, index) => assertStableRef(item, `${context}[${index}]`));
  if (new Set(refs).size !== refs.length) throw new Error(`${context} contains duplicates`);
  return refs;
}

function rejectEmbeddedTruth(value: unknown, path = 'topic'): void {
  if (Array.isArray(value)) {
    value.forEach((child, index) => rejectEmbeddedTruth(child, `${path}[${index}]`));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_TRUTH_KEYS.has(key)) {
      throw new Error(`${path}.${key} is forbidden: Learn About navigation data may reference canonical truth but not own it`);
    }
    rejectEmbeddedTruth(child, `${path}.${key}`);
  }
}

function validateSection(value: unknown, index: number): LearnAboutSection {
  if (!isRecord(value)) throw new Error(`sections[${index}] must be an object`);
  const sectionId = assertStableRef(value.sectionId, `sections[${index}].sectionId`);
  const childTitle = assertChildTitle(value.childTitle, `${sectionId}.childTitle`);
  const knowledgeRefs = assertUniqueStringArray(value.knowledgeRefs, `${sectionId}.knowledgeRefs`);

  if (!Array.isArray(value.depthBands) || value.depthBands.length === 0) throw new Error(`${sectionId}.depthBands is required`);
  const depthBands = value.depthBands.map((band) => {
    if (typeof band !== 'string' || !VALID_DEPTHS.has(band as LearnAboutDepthBand)) {
      throw new Error(`${sectionId}: invalid depth band ${String(band)}`);
    }
    return band as LearnAboutDepthBand;
  });
  if (new Set(depthBands).size !== depthBands.length) throw new Error(`${sectionId}.depthBands contains duplicates`);

  if (!Array.isArray(value.recipeFamilies) || value.recipeFamilies.length === 0) {
    throw new Error(`${sectionId}.recipeFamilies is required`);
  }
  const recipeFamilies = value.recipeFamilies.map((family) => {
    if (typeof family !== 'string' || !VALID_RECIPES.has(family as LearnAboutRecipeFamily)) {
      throw new Error(`${sectionId}: invalid recipe family ${String(family)}`);
    }
    return family as LearnAboutRecipeFamily;
  });
  if (new Set(recipeFamilies).size !== recipeFamilies.length) throw new Error(`${sectionId}.recipeFamilies contains duplicates`);

  return { sectionId, childTitle, knowledgeRefs, depthBands, recipeFamilies };
}

export function validateLearnAboutTopic(value: unknown): LearnAboutTopic {
  rejectEmbeddedTruth(value);
  if (!isRecord(value) || value.schemaVersion !== 1) throw new Error('Learn About topic must use schemaVersion 1');
  const topicId = assertStableRef(value.topicId, 'topicId');
  const childTitle = assertChildTitle(value.childTitle, `${topicId}.childTitle`);
  if (typeof value.archetype !== 'string' || !VALID_ARCHETYPES.has(value.archetype as LearnAboutTopicArchetype)) {
    throw new Error(`${topicId}: invalid archetype`);
  }
  const rootConceptRefs = assertUniqueStringArray(value.rootConceptRefs, `${topicId}.rootConceptRefs`);
  if (!Array.isArray(value.sections) || value.sections.length === 0) throw new Error(`${topicId}: sections[] is required`);
  const sections = value.sections.map(validateSection);
  const sectionIds = sections.map((section) => section.sectionId);
  if (new Set(sectionIds).size !== sectionIds.length) throw new Error(`${topicId}: duplicate section ids`);

  let relatedTopicIds: string[] | undefined;
  if (value.relatedTopicIds !== undefined) {
    relatedTopicIds = assertUniqueStringArray(value.relatedTopicIds, `${topicId}.relatedTopicIds`);
    if (relatedTopicIds.includes(topicId)) throw new Error(`${topicId}: topic may not relate to itself`);
  }

  return {
    schemaVersion: 1,
    topicId,
    childTitle,
    archetype: value.archetype as LearnAboutTopicArchetype,
    rootConceptRefs,
    sections,
    ...(relatedTopicIds ? { relatedTopicIds } : {})
  };
}

export function validateLearnAboutNavigationState(value: unknown): LearnAboutNavigationState {
  if (!isRecord(value) || value.schemaVersion !== 1) throw new Error('Learn About state must use schemaVersion 1');
  const allowedKeys = new Set(['schemaVersion', 'lastTopicId', 'lastSectionId', 'visitedDiscoveryRefs', 'favouriteTopicIds']);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) throw new Error(`Learn About state may not own ${key}`);
  }

  const lastTopicId = value.lastTopicId === undefined ? undefined : assertStableRef(value.lastTopicId, 'lastTopicId');
  const lastSectionId = value.lastSectionId === undefined ? undefined : assertStableRef(value.lastSectionId, 'lastSectionId');
  const visitedDiscoveryRefs = Array.isArray(value.visitedDiscoveryRefs)
    ? value.visitedDiscoveryRefs.map((item, index) => assertStableRef(item, `visitedDiscoveryRefs[${index}]`))
    : [];
  const favouriteTopicIds = Array.isArray(value.favouriteTopicIds)
    ? value.favouriteTopicIds.map((item, index) => assertStableRef(item, `favouriteTopicIds[${index}]`))
    : [];

  return {
    schemaVersion: 1,
    ...(lastTopicId ? { lastTopicId } : {}),
    ...(lastSectionId ? { lastSectionId } : {}),
    visitedDiscoveryRefs: [...new Set(visitedDiscoveryRefs)],
    favouriteTopicIds: [...new Set(favouriteTopicIds)]
  };
}
