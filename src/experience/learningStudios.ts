import document from '../../content/experience/learning-studios.json';
import type { LearnAboutDepthBand } from './learnAboutContract';
import type { EqualPartsQuestion, Question, SequenceOrderQuestion } from '../contracts/question';
import type { StudioWordReferences } from './studioWordProjection.mjs';
import { assertEqualPartsQuestion } from '../mechanics/equalParts.mjs';
import { studioQuestionSignature } from './studioWorkspace.mjs';
export { createStudioWorkspace, restoreStudioWorkspace } from './studioWorkspace.mjs';
export type { StudioWorkspace } from './studioWorkspace.mjs';

export type StudioQuestion = EqualPartsQuestion | SequenceOrderQuestion;
export interface LearningStudioActivity {
  activityId: string;
  family: 'fraction_studio' | 'sequence_studio';
  childTitle: string;
  source: { kind: 'question_bank' | 'bicycle_workshop'; questionId: string; wordProjection?: StudioWordReferences };
}
const STUDIO_DEPTHS = ['d0_first_play', 'd1_preschool', 'd2_early_primary', 'd3_deeper_primary'] as const;

/** Bindings may contain references, never executable logic or a second answer key. */
export function validateLearningStudioRegistry(value: unknown): void {
  const record = (item: unknown): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item);
  const ref = (item: unknown): item is string => typeof item === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:@/-]{0,159}$/.test(item);
  const only = (item: Record<string, unknown>, keys: readonly string[]) => Object.keys(item).every((key) => keys.includes(key));
  if (!record(value) || value.schemaVersion !== 1 || !only(value, ['schemaVersion','activities','topicBindings','workshopBindings'])
    || !Array.isArray(value.activities) || !value.activities.length || value.activities.length > 256) throw new Error('Learning studios require a bounded schemaVersion 1 registry');
  const ids = new Set<string>();
  for (const activity of value.activities) {
    if (!record(activity) || !ref(activity.activityId) || !activity.activityId.startsWith('studio.') || ids.has(activity.activityId)) throw new Error('Invalid or duplicate studio activity ID');
    ids.add(activity.activityId);
    if ((activity.family !== 'fraction_studio' && activity.family !== 'sequence_studio') || typeof activity.childTitle !== 'string' || !activity.childTitle.trim() || activity.childTitle.length > 96) throw new Error(`${activity.activityId}: invalid studio family/title`);
    if (!record(activity.source) || (activity.source.kind !== 'question_bank' && activity.source.kind !== 'bicycle_workshop') || !ref(activity.source.questionId)) throw new Error(`${activity.activityId}: invalid source binding`);
    if (!only(activity, ['activityId','family','childTitle','source']) || !only(activity.source, ['kind','questionId','wordProjection'])) throw new Error(`${activity.activityId}: studio bindings must not embed answers or content`);
    const projection = activity.source.wordProjection;
    if (projection !== undefined && (activity.family !== 'sequence_studio' || !record(projection)
      || !ref(projection.termId) || !ref(projection.conceptRef) || !ref(projection.knowledgeRef)
      || !only(projection, ['termId','conceptRef','knowledgeRef']))) throw new Error(`${activity.activityId}: word projection must contain only source references and use sequence_studio`);
  }
  const used = new Set<string>();
  for (const name of ['topicBindings', 'workshopBindings'] as const) {
    const bindings = value[name];
    if (!Array.isArray(bindings) || bindings.length > 256) throw new Error(`${name} must be a bounded array`);
    const placements = new Set<string>();
    const owner = name === 'topicBindings' ? 'topicId' : 'workshopId';
    for (const binding of bindings) {
      if (!record(binding) || !ref(binding.sectionId) || !ref(binding[owner])
        || !only(binding, name === 'topicBindings' ? ['topicId','sectionId','minDepth','activityRefs'] : ['workshopId','sectionId','activityRefs'])) throw new Error(`${name}: invalid or authority-bearing placement`);
      const key = `${binding[owner]}:${binding.sectionId}`;
      if (placements.has(key)) throw new Error(`${name}: duplicate placement ${key}`);
      placements.add(key);
      if (!Array.isArray(binding.activityRefs) || !binding.activityRefs.length || binding.activityRefs.length > 64) throw new Error(`${name}: invalid activity references`);
      const refs: unknown[] = Array.from(binding.activityRefs);
      if (new Set(refs).size !== refs.length || refs.some((item) => !ref(item) || !ids.has(item))) throw new Error(`${name}: unresolved or duplicate activity references`);
      refs.forEach((item) => used.add(item as string));
      if (name === 'topicBindings' && !(STUDIO_DEPTHS as readonly unknown[]).includes(binding.minDepth)) throw new Error(`${name}: invalid minimum depth`);
    }
  }
  if ([...ids].some((item) => !used.has(item))) throw new Error('Studio activities must have a reachable placement');
}
validateLearningStudioRegistry(document);
export const LEARNING_STUDIO_ACTIVITIES = document.activities as LearningStudioActivity[];

export function getLearningStudioActivity(id: string): LearningStudioActivity {
  const activity = LEARNING_STUDIO_ACTIVITIES.find((item) => item.activityId === id);
  if (!activity) throw new Error(`Unknown learning studio activity ${id}`);
  return activity;
}
export function getWorkshopStudioActivityRefs(workshopId: string, sectionId: string): string[] {
  return document.workshopBindings.filter((binding) => binding.workshopId === workshopId && binding.sectionId === sectionId).flatMap((binding) => binding.activityRefs);
}

/** Practice clones the source; it cannot refresh mastery or mutate its answer authority. */
export function asStudioPracticeQuestion(question: Question, activity: LearningStudioActivity): StudioQuestion {
  const expected = activity.family === 'fraction_studio' ? 'equal_parts' : 'sequence_order';
  if (question.interaction.type !== expected) throw new Error(`${activity.activityId}: source does not support ${expected}`);
  if (question.interaction.type === 'equal_parts') assertEqualPartsQuestion(question);
  if (question.interaction.type === 'sequence_order') {
    if (question.solution.type !== 'ordered_items') throw new Error('Sequence studio requires ordered_items');
    const items = question.interaction.items;
    const ids = items.map(({ id }) => id);
    const ordered = question.solution.orderedItemIds;
    if (ids.length < 2 || ids.length > 8 || items.some((item) => typeof item.id !== 'string' || !item.id.trim() || typeof item.label !== 'string' || !item.label.trim())
      || new Set(ids).size !== ids.length || ordered.length !== ids.length || new Set(ordered).size !== ids.length || ordered.some((id) => !ids.includes(id))) throw new Error('Sequence studio requires 2 to 8 uniquely identified stages and a complete source order');
  }
  const copy = { ...structuredClone(question), evidencePolicy: 'practice_only' } as StudioQuestion;
  studioQuestionSignature(copy);
  return copy;
}

/** Lazy source adapters; no chapter-owned copies of sequence answers. */
export async function loadLearningStudioQuestion(activityId: string): Promise<StudioQuestion> {
  const activity = getLearningStudioActivity(activityId);
  let question: Question | undefined;
  if (activity.source.kind === 'bicycle_workshop') {
    const { getBicycleWorkshopQuestionBank } = await import('./bicycleWorkshopRuntime');
    question = getBicycleWorkshopQuestionBank().find((item) => item.id === activity.source.questionId);
  } else {
    const catalog = await import('../runtime/questionCatalog');
    question = catalog.resolveQuestionIds([activity.source.questionId])[0];
  }
  if (!question) throw new Error(`${activityId}: the source activity could not be loaded`);
  if (activity.source.wordProjection) {
    const { projectStudioWord } = await import('./studioWordProjection.mjs');
    question = projectStudioWord(question, activity.source.wordProjection);
  }
  return asStudioPracticeQuestion(question, activity);
}
export function getTopicStudioActivityRefs(topicId: string, sectionId: string, depth: LearnAboutDepthBand): string[] {
  const depths: readonly string[] = STUDIO_DEPTHS;
  const rank = depths.indexOf(depth);
  if (rank < 0) return [];
  return document.topicBindings.filter((binding) => binding.topicId === topicId && binding.sectionId === sectionId && depths.indexOf(binding.minDepth) <= rank).flatMap((binding) => binding.activityRefs);
}
