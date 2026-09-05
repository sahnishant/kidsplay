import document from '../../content/experience/learning-studios.json';
import type { LearnAboutDepthBand } from './learnAboutContract';
import type { EqualPartsQuestion, Question, SequenceOrderQuestion } from '../contracts/question';
import { assertEqualPartsQuestion } from '../mechanics/equalParts.mjs';

export type StudioQuestion = EqualPartsQuestion | SequenceOrderQuestion;
export interface LearningStudioActivity {
  activityId: string;
  family: 'fraction_studio' | 'sequence_studio';
  childTitle: string;
  source: { kind: 'question_bank' | 'bicycle_workshop'; questionId: string };
}
export interface StudioWorkspace {
  schemaVersion: 1;
  activityId: string;
  questionId: string;
  questionRevision: number;
  engineKey: string;
  state: unknown;
}

const STUDIO_DEPTHS = ['d0_first_play', 'd1_preschool', 'd2_early_primary', 'd3_deeper_primary'] as const;

/** Structural gate. Cross-catalog references are also checked by the integration tests. */
export function validateLearningStudioRegistry(value: unknown): void {
  const record = (item: unknown): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item);
  const ref = (item: unknown): item is string => typeof item === 'string' && item.length > 0 && !/\s/.test(item);
  if (!record(value) || value.schemaVersion !== 1 || !Array.isArray(value.activities) || value.activities.length === 0) throw new Error('Learning studios require schemaVersion 1 and activities');
  const ids = new Set<string>();
  for (const activity of value.activities) {
    if (!record(activity) || !ref(activity.activityId) || !activity.activityId.startsWith('studio.') || ids.has(activity.activityId)) throw new Error('Invalid or duplicate studio activity ID');
    ids.add(activity.activityId);
    if (!['fraction_studio', 'sequence_studio'].includes(String(activity.family)) || typeof activity.childTitle !== 'string' || !activity.childTitle.trim()) throw new Error(`${activity.activityId}: invalid studio family/title`);
    if (!record(activity.source) || !['question_bank', 'bicycle_workshop'].includes(String(activity.source.kind)) || !ref(activity.source.questionId)) throw new Error(`${activity.activityId}: invalid source binding`);
    if (Object.keys(activity).some((key) => !['activityId', 'family', 'childTitle', 'source'].includes(key)) || Object.keys(activity.source).some((key) => !['kind', 'questionId'].includes(key))) throw new Error(`${activity.activityId}: studio bindings must not embed answers or content`);
  }
  for (const name of ['topicBindings', 'workshopBindings'] as const) {
    const bindings = value[name];
    if (!Array.isArray(bindings)) throw new Error(`${name} must be an array`);
    const placements = new Set<string>();
    for (const binding of bindings) {
      if (!record(binding) || !ref(binding.sectionId) || !ref(binding[name === 'topicBindings' ? 'topicId' : 'workshopId'])) throw new Error(`${name}: invalid placement`);
      const key = `${binding.topicId ?? binding.workshopId}:${binding.sectionId}`;
      if (placements.has(key)) throw new Error(`${name}: duplicate placement ${key}`);
      placements.add(key);
      if (!Array.isArray(binding.activityRefs) || !binding.activityRefs.length || new Set(binding.activityRefs).size !== binding.activityRefs.length || binding.activityRefs.some((id) => !ref(id) || !ids.has(id))) throw new Error(`${name}: unresolved or duplicate activity references`);
      if (name === 'topicBindings' && !(STUDIO_DEPTHS as readonly string[]).includes(String(binding.minDepth))) throw new Error(`${name}: invalid minimum depth`);
    }
  }
}
validateLearningStudioRegistry(document);
export const LEARNING_STUDIO_ACTIVITIES = document.activities as LearningStudioActivity[];

export function getLearningStudioActivity(id: string): LearningStudioActivity {
  const activity = LEARNING_STUDIO_ACTIVITIES.find((item) => item.activityId === id);
  if (!activity) throw new Error(`Unknown learning studio activity ${id}`);
  return activity;
}

export function getWorkshopStudioActivityRefs(workshopId: string, sectionId: string): string[] {
  return document.workshopBindings
    .filter((binding) => binding.workshopId === workshopId && binding.sectionId === sectionId)
    .flatMap((binding) => binding.activityRefs);
}

/** All studio teaching/practice is deliberately excluded from mastery, including copied source questions. */
export function asStudioPracticeQuestion(question: Question, activity: LearningStudioActivity): StudioQuestion {
  const expected = activity.family === 'fraction_studio' ? 'equal_parts' : 'sequence_order';
  if (question.interaction.type !== expected) throw new Error(`${activity.activityId}: source does not support ${expected}`);
  if (question.interaction.type === 'equal_parts') assertEqualPartsQuestion(question);
  if (question.interaction.type === 'sequence_order') {
    if (question.solution.type !== 'ordered_items') throw new Error('Sequence studio requires ordered_items');
    const ids = question.interaction.items.map(({ id }) => id);
    const ordered = question.solution.orderedItemIds;
    if (ids.length < 2 || ids.length > 8 || new Set(ids).size !== ids.length || ordered.length !== ids.length || new Set(ordered).size !== ids.length || ordered.some((id) => !ids.includes(id))) throw new Error('Sequence studio requires 2 to 8 uniquely identified stages and a complete source order');
  }
  return { ...structuredClone(question), evidencePolicy: 'practice_only' } as StudioQuestion;
}

/** Lazy adapters reference the existing catalog and curriculum bank; no chapter copies or answer arrays here. */
export async function loadLearningStudioQuestion(activityId: string): Promise<StudioQuestion> {
  const activity = getLearningStudioActivity(activityId);
  let question: Question | undefined;
  if (activity.source.kind === 'bicycle_workshop') {
    const { getBicycleWorkshopQuestionBank } = await import('./bicycleWorkshopRuntime');
    const id = activity.source.questionId;
    question = getBicycleWorkshopQuestionBank().find((item) => item.id === id);
  } else {
    const catalog = await import('../runtime/questionCatalog');
    question = catalog.resolveQuestionIds([activity.source.questionId])[0];
  }
  if (!question) throw new Error(`${activityId}: the source activity could not be loaded`);
  return asStudioPracticeQuestion(question, activity);
}

export function createStudioWorkspace(activityId: string, question: StudioQuestion, state: unknown): StudioWorkspace {
  return { schemaVersion: 1, activityId, questionId: question.id, questionRevision: question.revision, engineKey: `${question.interaction.type}@${question.interaction.version}`, state: structuredClone(state) };
}

export function restoreStudioWorkspace(activityId: string, question: StudioQuestion, workspace?: StudioWorkspace): unknown {
  if (!workspace || workspace.schemaVersion !== 1 || workspace.activityId !== activityId || workspace.questionId !== question.id || workspace.questionRevision !== question.revision || workspace.engineKey !== `${question.interaction.type}@${question.interaction.version}`) return undefined;
  return structuredClone(workspace.state);
}

export function getTopicStudioActivityRefs(topicId: string, sectionId: string, depth: LearnAboutDepthBand): string[] {
  const depths: readonly string[] = STUDIO_DEPTHS;
  return document.topicBindings
    .filter((binding) => binding.topicId === topicId && binding.sectionId === sectionId && depths.indexOf(binding.minDepth) <= depths.indexOf(depth))
    .flatMap((binding) => binding.activityRefs);
}
