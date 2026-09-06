import document from '../../content/experience/learning-studios.json';
import type { LearnAboutDepthBand } from './learnAboutContract';
import type { CollectionCountQuestion, DragToTargetQuestion, EqualPartsQuestion, Question, SequenceOrderQuestion } from '../contracts/question';
import type { StudioWordReferences } from './studioWordProjection.mjs';
import { assertEqualPartsQuestion } from '../mechanics/equalParts.mjs';
import { studioQuestionSignature } from './studioWorkspace.mjs';
export { createStudioWorkspace, restoreStudioWorkspace } from './studioWorkspace.mjs';
export type { StudioWorkspace } from './studioWorkspace.mjs';

export type StudioQuestion = EqualPartsQuestion | SequenceOrderQuestion | DragToTargetQuestion | CollectionCountQuestion;
export type LearningStudioFamily = 'fraction_studio' | 'sequence_studio' | 'matching_studio' | 'collection_studio';
export interface LearningStudioActivity {
  activityId: string;
  family: LearningStudioFamily;
  childTitle: string;
  source: { kind: 'question_bank' | 'bicycle_workshop'; questionId: string; wordProjection?: StudioWordReferences };
}
const STUDIO_DEPTHS = ['d0_first_play', 'd1_preschool', 'd2_early_primary', 'd3_deeper_primary'] as const;

/** Bindings may contain references, never executable logic or a second answer key. */
export function validateLearningStudioRegistry(value: unknown): void {
  const record = (item: unknown): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item);
  const ref = (item: unknown): item is string => typeof item === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:@/-]{0,159}$/.test(item);
  const only = (item: Record<string, unknown>, keys: readonly string[]) => Object.keys(item).every((key) => keys.includes(key));
  if (!record(value) || value.schemaVersion !== 1 || !only(value, ['schemaVersion','activities','topicBindings','workshopBindings']) || !Array.isArray(value.activities) || !value.activities.length || value.activities.length > 256) throw new Error('Learning studios require a bounded schemaVersion 1 registry');
  const ids = new Set<string>();
  for (const activity of value.activities) {
    if (!record(activity) || !ref(activity.activityId) || !activity.activityId.startsWith('studio.') || ids.has(activity.activityId)) throw new Error('Invalid or duplicate studio activity ID');
    ids.add(activity.activityId);
    if (!['fraction_studio','sequence_studio','matching_studio','collection_studio'].includes(String(activity.family)) || typeof activity.childTitle !== 'string' || !activity.childTitle.trim() || activity.childTitle.length > 96) throw new Error(`${activity.activityId}: invalid studio family/title`);
    if (!record(activity.source) || (activity.source.kind !== 'question_bank' && activity.source.kind !== 'bicycle_workshop') || !ref(activity.source.questionId)) throw new Error(`${activity.activityId}: invalid source binding`);
    if (!only(activity, ['activityId','family','childTitle','source']) || !only(activity.source, ['kind','questionId','wordProjection'])) throw new Error(`${activity.activityId}: studio bindings must not embed answers or content`);
    const projection = activity.source.wordProjection;
    if (projection !== undefined && (activity.family !== 'sequence_studio' || !record(projection) || !ref(projection.termId) || !ref(projection.conceptRef) || !ref(projection.knowledgeRef) || !only(projection, ['termId','conceptRef','knowledgeRef']))) throw new Error(`${activity.activityId}: word projection must contain only source references and use sequence_studio`);
  }
  const used = new Set<string>();
  for (const name of ['topicBindings','workshopBindings'] as const) {
    const bindings = value[name];
    if (!Array.isArray(bindings) || bindings.length > 256) throw new Error(`${name} must be a bounded array`);
    const placements = new Set<string>();
    const owner = name === 'topicBindings' ? 'topicId' : 'workshopId';
    for (const binding of bindings) {
      if (!record(binding) || !ref(binding.sectionId) || !ref(binding[owner]) || !only(binding, name === 'topicBindings' ? ['topicId','sectionId','minDepth','activityRefs'] : ['workshopId','sectionId','activityRefs'])) throw new Error(`${name}: invalid or authority-bearing placement`);
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

function normalizedVisibleLabel(value: string): string { return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en'); }

function validateMatchingQuestion(question: DragToTargetQuestion): void {
  if (question.solution.type !== 'target_assignment') throw new Error('Matching studio requires target_assignment');
  if (question.authoring.status !== 'reviewed') throw new Error('Matching studio requires a reviewed source question');
  const items = question.interaction.items, targets = question.interaction.targets;
  if (items.length < 2 || items.length > 8 || targets.length < 2 || targets.length > 8) throw new Error('Matching studio requires 2 to 8 items and targets');
  if (items.length !== targets.length) throw new Error('Matching studio requires the same number of items and targets for one-to-one pairing');
  const itemIds = items.map((item) => item.id), targetIds = new Set(targets.map((target) => target.id));
  const itemLabels = items.map((item) => normalizedVisibleLabel(item.label)), targetLabels = targets.map((target) => normalizedVisibleLabel(target.label));
  if (new Set(itemIds).size !== itemIds.length || targetIds.size !== targets.length || items.some((item) => !item.id.trim() || !item.label.trim()) || targets.some((target) => !target.id.trim() || !target.label.trim())) throw new Error('Matching studio requires uniquely identified labelled items and targets');
  if (new Set(itemLabels).size !== itemLabels.length || new Set(targetLabels).size !== targetLabels.length) throw new Error('Matching studio requires visibly distinct item and target labels; ambiguous grouping belongs in a different mechanic');
  const assignments = question.solution.assignments;
  const assignedTargetIds = itemIds.map((itemId) => assignments[itemId]);
  if (Object.keys(assignments).length !== itemIds.length || assignedTargetIds.some((targetId) => typeof targetId !== 'string' || !targetIds.has(targetId)) || new Set(assignedTargetIds).size !== itemIds.length) throw new Error('Matching studio source needs a complete one-to-one assignment map');
}

function validateCollectionQuestion(question: CollectionCountQuestion): void {
  if (question.solution.type !== 'collection_counts') throw new Error('Collection studio requires collection_counts');
  const items = question.interaction.items, targets = question.interaction.targets;
  if (items.length < 2 || items.length > 16 || targets.length < 2 || targets.length > 6) throw new Error('Collection studio requires 2 to 16 objects and 2 to 6 destinations');
  const itemIds = items.map((item) => item.id), targetIds = targets.map((target) => target.id);
  if (new Set(itemIds).size !== itemIds.length || new Set(targetIds).size !== targetIds.length || itemIds.some((id) => !id.trim()) || targetIds.some((id) => !id.trim())) throw new Error('Collection studio requires unique object and destination IDs');
  const counts = question.solution.counts;
  if (Object.keys(counts).length !== targetIds.length || targetIds.some((id) => !Number.isSafeInteger(counts[id]) || counts[id] < 1) || Object.values(counts).reduce((sum, count) => sum + count, 0) !== items.length) throw new Error('Collection studio counts must exactly allocate every object');
}

function validateSequenceQuestion(question: SequenceOrderQuestion): void {
  if (question.solution.type !== 'ordered_items') throw new Error('Sequence studio requires ordered_items');
  const items = question.interaction.items, ids = items.map(({ id }) => id), ordered = question.solution.orderedItemIds;
  if (ids.length < 2 || ids.length > 8 || items.some((item) => typeof item.id !== 'string' || !item.id.trim() || typeof item.label !== 'string' || !item.label.trim()) || new Set(ids).size !== ids.length || ordered.length !== ids.length || new Set(ordered).size !== ids.length || ordered.some((id) => !ids.includes(id))) throw new Error('Sequence studio requires 2 to 8 uniquely identified stages and a complete source order');
  if (question.interaction.version === 1) {
    if (question.solution.prerequisites !== undefined) throw new Error('sequence_order@1 must retain one exact source order');
    return;
  }
  const prerequisites = question.solution.prerequisites;
  if (!prerequisites || Object.keys(prerequisites).length !== ids.length) throw new Error('sequence_order@2 requires a complete prerequisite map');
  for (const id of ids) {
    const required = prerequisites[id];
    if (!Array.isArray(required) || new Set(required).size !== required.length || required.some((before) => !ids.includes(before) || before === id)) throw new Error('sequence_order@2 has invalid prerequisites');
  }
  const position = new Map(ordered.map((id, index) => [id, index]));
  if (ids.some((id) => prerequisites[id].some((before) => position.get(before)! >= position.get(id)!))) throw new Error('sequence_order@2 example order must satisfy its prerequisites');
}

/** Practice clones the source; it cannot refresh mastery or mutate its answer authority. */
export function asStudioPracticeQuestion(question: Question, activity: LearningStudioActivity): StudioQuestion {
  const expected = activity.family === 'fraction_studio' ? 'equal_parts' : activity.family === 'matching_studio' ? 'drag_to_target' : activity.family === 'collection_studio' ? 'collection_count' : 'sequence_order';
  if (question.interaction.type !== expected) throw new Error(`${activity.activityId}: source does not support ${expected}`);
  if (question.interaction.type === 'equal_parts') assertEqualPartsQuestion(question);
  if (question.interaction.type === 'drag_to_target') validateMatchingQuestion(question as DragToTargetQuestion);
  if (question.interaction.type === 'collection_count') validateCollectionQuestion(question as CollectionCountQuestion);
  if (question.interaction.type === 'sequence_order') validateSequenceQuestion(question as SequenceOrderQuestion);
  const copy = { ...structuredClone(question), evidencePolicy: 'practice_only' } as StudioQuestion;
  studioQuestionSignature(copy);
  return copy;
}

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
