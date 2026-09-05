import { describe, expect, it } from 'vitest';
import document from '../content/experience/learning-studios.json';
import guide from '../content/experience/bicycle-workshop-guided.json';
import { LEARN_ABOUT_TOPICS } from '../src/experience/learnAboutCatalog';
import { validateLearnAboutTopic } from '../src/experience/learnAboutContract';
import { LEARNING_STUDIO_ACTIVITIES, loadLearningStudioQuestion, getTopicStudioActivityRefs, createStudioWorkspace, restoreStudioWorkspace, validateLearningStudioRegistry } from '../src/experience/learningStudios';
import { restoreSequenceOrder } from '../src/mechanics/sequenceStudio';

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
    expect(question.interaction.type).toBe(activity.family === 'fraction_studio' ? 'equal_parts' : 'sequence_order');
  });
  it('keeps deeper fraction examples out of the introductory depth', () => {
    expect(getTopicStudioActivityRefs('learn.fractions','fractions.make-and-share','d1_preschool')).toEqual([]);
    expect(getTopicStudioActivityRefs('learn.fractions','fractions.make-and-share','d2_early_primary')).toHaveLength(2);
    expect(getTopicStudioActivityRefs('learn.fractions','fractions.equal-shares','d2_early_primary')).toHaveLength(1);
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
    const contaminated = structuredClone(document) as unknown as {activities:Array<Record<string,unknown>>};
    contaminated.activities[0].solution = {alwaysCorrect:true};
    expect(() => validateLearningStudioRegistry(contaminated)).toThrow();
  });
  it('restores only valid permutations, without consulting correctness', () => {
    const items = [{id:'a',label:'A'},{id:'b',label:'B'},{id:'c',label:'C'}];
    expect(restoreSequenceOrder(items,{orderedItemIds:['c','a','b']})?.map((i)=>i.id)).toEqual(['c','a','b']);
    expect(restoreSequenceOrder(items,{orderedItemIds:['a','a','b']})).toBeNull();
    expect(restoreSequenceOrder(items,{orderedItemIds:['a','b','foreign']})).toBeNull();
  });
});
