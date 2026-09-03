import recipesJson from '../../content/experience/recipes.json';
import type { Question } from '../contracts/question';
import type { StoryCharacterId } from '../story/storyTypes';

export type ExperienceSurface = 'story' | 'free_play' | 'assessment';
export type ExperienceRecipeFamily =
  | 'guide_to_home'
  | 'sort_or_match'
  | 'observe_choose'
  | 'sequence_process'
  | 'cause_effect_discovery';

export type ExperienceSituation =
  | 'guide_subject_to_destination'
  | 'place_related_things_together'
  | 'observe_world_then_choose'
  | 'arrange_steps_then_reveal_process'
  | 'trigger_then_observe_result';

export interface ExperienceRecipeSelector {
  surfaces: Exclude<ExperienceSurface, 'assessment'>[];
  interactionTypes: Question['interaction']['type'][];
  conceptAny?: string[];
  knowledgeRefPrefixes?: string[];
}

export interface ExperienceChoreography {
  situation: ExperienceSituation;
  leadCharacter: StoryCharacterId;
  audioCue: 'prompt_and_reaction' | 'reaction_only' | 'none';
  /** Refers only to the existing deterministic progress projector. */
  worldConsequence: 'progress_projection' | 'none';
}

export interface ExperienceRecipe {
  id: string;
  family: ExperienceRecipeFamily;
  priority: number;
  selector: ExperienceRecipeSelector;
  choreography: ExperienceChoreography;
  assessmentPolicy: 'suppress_pre_answer';
}

export interface ExperienceRecipeDocument {
  schemaVersion: 1;
  recipes: ExperienceRecipe[];
}

const validFamilies = new Set<ExperienceRecipeFamily>([
  'guide_to_home',
  'sort_or_match',
  'observe_choose',
  'sequence_process',
  'cause_effect_discovery'
]);
const validSurfaces = new Set<Exclude<ExperienceSurface, 'assessment'>>(['story', 'free_play']);
const validInteractions = new Set<Question['interaction']['type']>([
  'single_choice',
  'word_bank_fill',
  'drag_to_target',
  'word_search',
  'memory_pairs',
  'sequence_order',
  'hotspot',
  'crossword',
  'maze_path'
]);
const validSituations = new Set<ExperienceSituation>([
  'guide_subject_to_destination',
  'place_related_things_together',
  'observe_world_then_choose',
  'arrange_steps_then_reveal_process',
  'trigger_then_observe_result'
]);
const validCharacters = new Set<StoryCharacterId>(['dheu', 'scientu', 'shaitanu']);
const forbiddenAuthorityKeys = new Set([
  'questionId',
  'questionIds',
  'solution',
  'answer',
  'answers',
  'correctOptionId',
  'correctOptionIds',
  'correctRegionIds',
  'assignments',
  'orderedItemIds'
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertStringArray(value: unknown, context: string): string[] {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || item.length === 0)) {
    throw new Error(`${context} must be a non-empty string array`);
  }
  return value;
}

function rejectAnswerAuthority(value: unknown, path = 'registry'): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectAnswerAuthority(item, `${path}[${index}]`));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenAuthorityKeys.has(key)) {
      throw new Error(`${path}.${key} is forbidden: experience recipes may not own answer/question authority`);
    }
    rejectAnswerAuthority(child, `${path}.${key}`);
  }
}

function validateRecipe(value: unknown, index: number): ExperienceRecipe {
  if (!isRecord(value)) throw new Error(`Experience recipe ${index} must be an object`);
  const id = value.id;
  const family = value.family;
  const priority = value.priority;
  const selector = value.selector;
  const choreography = value.choreography;

  if (typeof id !== 'string' || !id.startsWith('experience.')) {
    throw new Error(`Experience recipe ${index} has invalid id`);
  }
  if (typeof family !== 'string' || !validFamilies.has(family as ExperienceRecipeFamily)) {
    throw new Error(`${id}: invalid family`);
  }
  if (typeof priority !== 'number' || !Number.isInteger(priority) || priority < 0) {
    throw new Error(`${id}: priority must be a non-negative integer`);
  }
  if (!isRecord(selector)) throw new Error(`${id}: selector is required`);
  if (!isRecord(choreography)) throw new Error(`${id}: choreography is required`);

  const surfaces = assertStringArray(selector.surfaces, `${id}.selector.surfaces`);
  if (surfaces.some((surface) => !validSurfaces.has(surface as Exclude<ExperienceSurface, 'assessment'>))) {
    throw new Error(`${id}: selector contains an invalid or assessment surface`);
  }
  const interactionTypes = assertStringArray(selector.interactionTypes, `${id}.selector.interactionTypes`);
  if (interactionTypes.some((interaction) => !validInteractions.has(interaction as Question['interaction']['type']))) {
    throw new Error(`${id}: selector contains an invalid interaction type`);
  }

  const conceptAny = selector.conceptAny === undefined
    ? undefined
    : assertStringArray(selector.conceptAny, `${id}.selector.conceptAny`);
  const knowledgeRefPrefixes = selector.knowledgeRefPrefixes === undefined
    ? undefined
    : assertStringArray(selector.knowledgeRefPrefixes, `${id}.selector.knowledgeRefPrefixes`);

  const situation = choreography.situation;
  const leadCharacter = choreography.leadCharacter;
  const audioCue = choreography.audioCue;
  const worldConsequence = choreography.worldConsequence;
  if (typeof situation !== 'string' || !validSituations.has(situation as ExperienceSituation)) {
    throw new Error(`${id}: invalid situation`);
  }
  if (typeof leadCharacter !== 'string' || !validCharacters.has(leadCharacter as StoryCharacterId)) {
    throw new Error(`${id}: invalid lead character`);
  }
  if (!['prompt_and_reaction', 'reaction_only', 'none'].includes(String(audioCue))) {
    throw new Error(`${id}: invalid audio cue`);
  }
  if (!['progress_projection', 'none'].includes(String(worldConsequence))) {
    throw new Error(`${id}: invalid world consequence policy`);
  }
  if (value.assessmentPolicy !== 'suppress_pre_answer') {
    throw new Error(`${id}: assessmentPolicy must suppress pre-answer choreography`);
  }

  return {
    id,
    family: family as ExperienceRecipeFamily,
    priority,
    selector: {
      surfaces: surfaces as Exclude<ExperienceSurface, 'assessment'>[],
      interactionTypes: interactionTypes as Question['interaction']['type'][],
      ...(conceptAny ? { conceptAny } : {}),
      ...(knowledgeRefPrefixes ? { knowledgeRefPrefixes } : {})
    },
    choreography: {
      situation: situation as ExperienceSituation,
      leadCharacter: leadCharacter as StoryCharacterId,
      audioCue: audioCue as ExperienceChoreography['audioCue'],
      worldConsequence: worldConsequence as ExperienceChoreography['worldConsequence']
    },
    assessmentPolicy: 'suppress_pre_answer'
  };
}

export function validateExperienceRecipeDocument(value: unknown): ExperienceRecipeDocument {
  rejectAnswerAuthority(value);
  if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.recipes)) {
    throw new Error('Experience recipe document must use schemaVersion 1 with recipes[]');
  }

  const recipes = value.recipes.map(validateRecipe);
  const ids = new Set<string>();
  for (const recipe of recipes) {
    if (ids.has(recipe.id)) throw new Error(`Duplicate experience recipe id ${recipe.id}`);
    ids.add(recipe.id);
  }

  for (const family of validFamilies) {
    if (!recipes.some((recipe) => recipe.family === family)) {
      throw new Error(`Experience recipe registry is missing required family ${family}`);
    }
  }

  return { schemaVersion: 1, recipes };
}

export const EXPERIENCE_RECIPE_DOCUMENT = validateExperienceRecipeDocument(recipesJson);

export function getExperienceRecipes(): ExperienceRecipe[] {
  return EXPERIENCE_RECIPE_DOCUMENT.recipes.map((recipe) => ({
    ...recipe,
    selector: {
      ...recipe.selector,
      surfaces: [...recipe.selector.surfaces],
      interactionTypes: [...recipe.selector.interactionTypes],
      ...(recipe.selector.conceptAny ? { conceptAny: [...recipe.selector.conceptAny] } : {}),
      ...(recipe.selector.knowledgeRefPrefixes
        ? { knowledgeRefPrefixes: [...recipe.selector.knowledgeRefPrefixes] }
        : {})
    },
    choreography: { ...recipe.choreography }
  }));
}

function selectorMatches(question: Question, recipe: ExperienceRecipe, surface: Exclude<ExperienceSurface, 'assessment'>): boolean {
  if (!recipe.selector.surfaces.includes(surface)) return false;
  if (!recipe.selector.interactionTypes.includes(question.interaction.type)) return false;

  if (recipe.selector.conceptAny?.length) {
    if (!question.conceptIds.some((conceptId) => recipe.selector.conceptAny?.includes(conceptId))) return false;
  }

  if (recipe.selector.knowledgeRefPrefixes?.length) {
    const refs = question.knowledgeRefs ?? [];
    if (!refs.some((rowId) => recipe.selector.knowledgeRefPrefixes?.some((prefix) => rowId.startsWith(prefix)))) return false;
  }

  return true;
}

/**
 * Resolves presentation choreography only. It intentionally does not read `question.solution`.
 * Structured assessment receives no pre-answer experience recipe.
 */
export function resolveExperienceRecipe(question: Question, surface: ExperienceSurface): ExperienceRecipe | null {
  if (surface === 'assessment') return null;
  const match = EXPERIENCE_RECIPE_DOCUMENT.recipes
    .filter((recipe) => selectorMatches(question, recipe, surface))
    .sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id))[0];
  if (!match) return null;
  return getExperienceRecipes().find((recipe) => recipe.id === match.id) ?? null;
}
