import { describe, expect, it } from 'vitest';
import document from '../content/experience/learning-studios.json';
import guide from '../content/experience/bicycle-workshop-guided.json';
import { LEARN_ABOUT_TOPICS } from '../src/experience/learnAboutCatalog';
import { validateLearnAboutTopic } from '../src/experience/learnAboutContract';
import {
  LEARNING_STUDIO_ACTIVITIES,
  asStudioPracticeQuestion,
  loadLearningStudioQuestion,
  getTopicStudioActivityRefs,
  createStudioWorkspace,
  restoreStudioWorkspace,
  validateLearningStudioRegistry,
  type LearningStudioActivity
} from '../src/experience/learningStudios';
import { evaluate } from '../src/evaluation/evaluate';
import { restoreSequenceOrder } from '../src/mechanics/sequenceStudio';

function expectedInteraction(activity: LearningStudioActivity): string {
  if (activity.family === 'fraction_studio') return 'equal_parts';
  if (activity.family === 'matching_studio') return 'drag_to_target';
  if (activity.family === 'collection_studio') return 'collection_count';
  return 'sequence_order';
}

describe('reusable learning studios and existing topic placements', () => {
  it('validates the reference-only registry and all canonical topics', () => {
    expect(() => validateLearningStudioRegistry(document)).not.toThrow();
    for (const topic of LEARN_ABOUT_TOPICS) expect(() => validateLearnAboutTopic(topic)).not.toThrow();
    for (const binding of document.topicBindings) {
      const topic = LEARN_ABOUT_TOPICS.find((t) => t.topicId === binding.topicId);
      expect(topic?.sections.some((s) => s.sectionId === binding.sectionId)).toBe(true);
    }
    for (const binding of document.workshopBindings) expect(guide.sections.some((s) => s.id === binding.sectionId)).toBe(true);
    const used = [...document.topicBindings,...document.workshopBindings].flatMap((b) => b.activityRefs);
    for (const activity of LEARNING_STUDIO_ACTIVITIES) expect(used).toContain(activity.activityId);
  });

  it.each(LEARNING_STUDIO_ACTIVITIES)('loads the actual source for $activityId without duplicating an answer key', async (activity) => {
    const question = await loadLearningStudioQuestion(activity.activityId);
    const projection = activity.source.wordProjection;
    expect(question.id).toBe(projection ? `${activity.source.questionId}.letters.${projection.termId}.v1` : activity.source.questionId);
    expect(question.evidencePolicy).toBe('practice_only');
    expect(question.interaction.type).toBe(expectedInteraction(activity));
  });

  it('places exactly fourteen guided matches across seven topic homes and keeps plant-type sorting out', () => {
    const matching = LEARNING_STUDIO_ACTIVITIES.filter((activity) => activity.family === 'matching_studio');
    expect(matching).toHaveLength(14);
    expect(new Set(matching.map((activity) => activity.source.questionId)).size).toBe(14);
    expect(matching.map((activity) => activity.source.questionId)).not.toContain('plants.types.match.generated.001');
    const matchingIds = new Set(matching.map((activity) => activity.activityId));
    const homes = new Set(document.topicBindings.filter((binding) => binding.activityRefs.some((activityId) => matchingIds.has(activityId))).map((binding) => binding.topicId));
    expect([...homes].sort()).toEqual(['learn.earth','learn.food','learn.healthy-safe','learn.homes-clothes','learn.human-body','learn.lion','learn.plants']);
  });

  it('keeps deeper fraction examples out of the introductory depth', () => {
    expect(getTopicStudioActivityRefs('learn.fractions','fractions.make-and-share','d1_preschool')).toEqual([]);
    expect(getTopicStudioActivityRefs('learn.fractions','fractions.make-and-share','d2_early_primary')).toHaveLength(2);
    expect(getTopicStudioActivityRefs('learn.fractions','fractions.equal-shares','d2_early_primary')).toHaveLength(1);
  });

  it('restores a partial matching work product without grading it', async () => {
    const id = 'studio.match.human-senses';
    const question = await loadLearningStudioQuestion(id);
    if (question.interaction.type !== 'drag_to_target') throw new Error('Expected matching source');
    const item = question.interaction.items[0], target = question.interaction.targets[1];
    const state = { assignments: { [item.id]: target.id } };
    const workspace = createStudioWorkspace(id, question, state);
    expect(restoreStudioWorkspace(id, question, workspace)).toEqual(state);
    expect(restoreStudioWorkspace(id, question, { ...workspace, state: { assignments: { foreign: target.id } } })).toBeUndefined();
    expect(restoreStudioWorkspace(id, question, { ...workspace, state: { assignments: { [item.id]: 'foreign' } } })).toBeUndefined();
  });

  it('keeps matching practice out of mastery and knowledge evidence', async () => {
    const question = await loadLearningStudioQuestion('studio.match.animal-homes');
    if (question.interaction.type !== 'drag_to_target') throw new Error('Expected matching source');
    const result = evaluate(question, { assignments: structuredClone(question.solution.assignments) });
    expect(result.correct).toBe(true); expect(result.knowledgeEvidence).toEqual([]); expect(result.masteryEvidence).toEqual([]);
  });

  it('refuses visually ambiguous one-to-one matching even when IDs are distinct', async () => {
    const activity = LEARNING_STUDIO_ACTIVITIES.find((item) => item.activityId === 'studio.match.human-senses');
    if (!activity) throw new Error('Missing matching activity');
    const source = await loadLearningStudioQuestion(activity.activityId);
    if (source.interaction.type !== 'drag_to_target') throw new Error('Expected matching source');
    const ambiguous = structuredClone(source); ambiguous.interaction.targets[1].label = ambiguous.interaction.targets[0].label;
    expect(() => asStudioPracticeQuestion(ambiguous, activity)).toThrow(/visibly distinct/);
  });

  it('requires true one-to-one source pairings rather than many-to-one target assignments', async () => {
    const activity = LEARNING_STUDIO_ACTIVITIES.find((item) => item.activityId === 'studio.match.human-senses');
    if (!activity) throw new Error('Missing matching activity');
    const source = await loadLearningStudioQuestion(activity.activityId);
    if (source.interaction.type !== 'drag_to_target') throw new Error('Expected matching source');
    const duplicateTarget = structuredClone(source);
    const [firstItem, secondItem] = duplicateTarget.interaction.items;
    duplicateTarget.solution.assignments[secondItem.id] = duplicateTarget.solution.assignments[firstItem.id];
    expect(() => asStudioPracticeQuestion(duplicateTarget, activity)).toThrow(/one-to-one/);
    const unequalSides = structuredClone(source); unequalSides.interaction.targets.pop();
    expect(() => asStudioPracticeQuestion(unequalSides, activity)).toThrow(/same number of items and targets/);
  });

  it('binds workspace snapshots to activity, question revision and engine version', async () => {
    const id = 'studio.fractions.equal-shares';
    const question = await loadLearningStudioQuestion(id);
    const workspace = createStudioWorkspace(id,question,{assignments:['gold',null,'teal',null]});
    expect(restoreStudioWorkspace(id,question,workspace)).toEqual(workspace.state);
    expect(restoreStudioWorkspace('studio.fractions.dosa',question,workspace)).toBeUndefined();
    expect(restoreStudioWorkspace(id,{...question,revision:question.revision+1},workspace)).toBeUndefined();
    expect(restoreStudioWorkspace(id,question,{...workspace,engineKey:'equal_parts@99'})).toBeUndefined();
  });

  it('rejects duplicate registry IDs and embedded answer authority', () => {
    const duplicate = structuredClone(document); duplicate.activities.push(duplicate.activities[0]);
    expect(() => validateLearningStudioRegistry(duplicate)).toThrow();
    const contaminated = structuredClone(document) as unknown as {activities:Array<Record<string,unknown>>}; contaminated.activities[0].solution = {alwaysCorrect:true};
    expect(() => validateLearningStudioRegistry(contaminated)).toThrow();
  });

  it('restores only valid permutations, without consulting correctness', () => {
    const items = [{id:'a',label:'A'},{id:'b',label:'B'},{id:'c',label:'C'}];
    expect(restoreSequenceOrder(items,{orderedItemIds:['c','a','b']})?.map((i)=>i.id)).toEqual(['c','a','b']);
    expect(restoreSequenceOrder(items,{orderedItemIds:['a','a','b']})).toBeNull();
    expect(restoreSequenceOrder(items,{orderedItemIds:['a','b','foreign']})).toBeNull();
  });
});
