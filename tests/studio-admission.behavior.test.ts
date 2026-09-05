import { describe, expect, it } from 'vitest';
import document from '../content/experience/learning-studios.json';
import { LEARNING_STUDIO_ACTIVITIES, createStudioWorkspace, restoreStudioWorkspace, loadLearningStudioQuestion, validateLearningStudioRegistry, getTopicStudioActivityRefs } from '../src/experience/learningStudios';
import type { LearnAboutDepthBand } from '../src/experience/learnAboutContract';

describe('studio authoring and workspace boundaries', () => {
  it.each(LEARNING_STUDIO_ACTIVITIES)('round-trips real consumer $activityId without grading its work', async (activity) => {
    const question = await loadLearningStudioQuestion(activity.activityId);
    const state = question.interaction.type === 'equal_parts'
      ? { assignments: Array(question.interaction.partCount).fill(null) }
      : { orderedItemIds: question.interaction.items.map((item) => item.id).reverse() };
    const saved = createStudioWorkspace(activity.activityId, question, state);
    expect(saved.schemaVersion).toBe(2);
    expect(restoreStudioWorkspace(activity.activityId, question, JSON.parse(JSON.stringify(saved)))).toEqual(state);
    expect(restoreStudioWorkspace(activity.activityId, { ...question, revision: question.revision + 1 }, saved)).toBeUndefined();
    expect(question.evidencePolicy).toBe('practice_only');
  });
  it.each(['solution','correct','onComplete','knowledgeRefs'])('rejects %s smuggled into a placement', (field) => {
    const value = structuredClone(document);
    Object.assign(value.topicBindings[0], { [field]: 'not allowed' });
    expect(() => validateLearningStudioRegistry(value)).toThrow();
  });
  it('rejects root-level answer authority', () => expect(() => validateLearningStudioRegistry({ ...document, solution: {} })).toThrow());
  it('rejects sparse reference arrays', () => {
    const value = structuredClone(document); delete value.topicBindings[0].activityRefs[0];
    expect(() => validateLearningStudioRegistry(value)).toThrow();
  });
  it('rejects unplaced activity records instead of losing them in a catalogue', () => {
    const value = structuredClone(document);
    value.activities.push({ ...value.activities[0], activityId: 'studio.unplaced' });
    expect(() => validateLearningStudioRegistry(value)).toThrow(/reachable placement/);
  });
  it('does not admit activities for an unknown depth', () => expect(getTopicStudioActivityRefs('learn.fractions','fractions.equal-shares','unknown' as LearnAboutDepthBand)).toEqual([]));
  it('rejects a source whose revision is invalid', async () => {
    const activity = LEARNING_STUDIO_ACTIVITIES[0];
    const question = await loadLearningStudioQuestion(activity.activityId);
    expect(() => createStudioWorkspace(activity.activityId, { ...question, revision: 0 }, null)).toThrow();
  });
});
