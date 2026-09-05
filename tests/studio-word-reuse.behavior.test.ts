import { describe, expect, it } from 'vitest';
import document from '../content/experience/learning-studios.json';
import { getBicycleWorkshopQuestionBank } from '../src/experience/bicycleWorkshopRuntime';
import { projectStudioWord } from '../src/experience/studioWordProjection.mjs';
import { getLearningStudioActivity, loadLearningStudioQuestion, getWorkshopStudioActivityRefs, validateLearningStudioRegistry, createStudioWorkspace, restoreStudioWorkspace } from '../src/experience/learningStudios';
import { evaluate } from '../src/evaluation/evaluate';

const source = getBicycleWorkshopQuestionBank().find((question) => question.id === 'bicycle.workshop.word-search.parts.001')!;
const words = [{ term: 'pedal', word: 'PEDAL', valid: 1 }, { term: 'brake', word: 'BRAKE', valid: 1 }, { term: 'bell', word: 'BELL', valid: 2 }, { term: 'tyre', word: 'TYRE', valid: 1 }];
const permutations = (ids: string[]): string[][] => ids.length === 0 ? [[]] : ids.flatMap((id, index) => permutations(ids.filter((_, position) => position !== index)).map((rest) => [id, ...rest]));

describe('#264 Bicycle word reconstruction using sequence_order', () => {
  it.each(words)('projects $word from the existing term and checks every tile permutation centrally', async ({ term, word, valid }) => {
    const activityId = `studio.words.${term}`;
    const activity = getLearningStudioActivity(activityId);
    const original = structuredClone(source);
    const question = await loadLearningStudioQuestion(activityId);
    if (question.interaction.type !== 'sequence_order' || question.solution.type !== 'ordered_items') throw new Error('Expected letter sequence');
    expect(question.id).toBe(`${source.id}.letters.${term}.v1`);
    expect(question.revision).toBe(source.revision);
    expect(question.conceptIds).toEqual([`english.vocabulary.${term}`]);
    expect(source.knowledgeRefs).toContain(activity.source.wordProjection!.knowledgeRef);
    expect(question.knowledgeRefs).toEqual([]); // Copying a word does not assess its denotation.
    expect(question.evidencePolicy).toBe('practice_only');
    expect(question.authoring?.status).toBe('draft');
    expect(question.prompt.text).toContain(word); // Reconstruction from a model, not unaided spelling/phonics.
    expect(question.interaction.items.map(({ label }) => label).join('')).toBe(word);
    const labels = new Map(question.interaction.items.map(({ id, label }) => [id, label]));
    let accepted = 0;
    for (const ids of permutations(question.solution.orderedItemIds)) {
      const correct = ids.map((id) => labels.get(id)).join('') === word;
      const result = evaluate(question, { orderedItemIds: ids });
      expect(result.correct).toBe(correct);
      accepted += Number(result.correct);
    }
    expect(accepted).toBe(valid); // Both interchangeable L tile orders must pass for BELL.
    const workspace = createStudioWorkspace(activityId, question, { orderedItemIds: question.solution.orderedItemIds });
    expect(restoreStudioWorkspace(activityId, { ...question, revision: question.revision + 1 }, workspace)).toBeUndefined();
    expect(source).toEqual(original);
    expect(getWorkshopStudioActivityRefs('bicycle-workshop', 'words')).toContain(activityId);
  });

  it('rejects missing terms, unrelated references and unsupported spellings instead of guessing', () => {
    const refs = getLearningStudioActivity('studio.words.bell').source.wordProjection!;
    expect(() => projectStudioWord(source, { ...refs, termId: 'missing' })).toThrow();
    expect(() => projectStudioWord(source, { ...refs, conceptRef: 'foreign' })).toThrow();
    expect(() => projectStudioWord(source, { ...refs, knowledgeRef: 'foreign' })).toThrow();
    for (const word of ['', 'A', 'TOOLONGWORD', 'B3LL', 'bell']) {
      const changed = structuredClone(source);
      if (changed.interaction.type !== 'word_search') throw new Error('Expected source word search');
      changed.interaction.terms.find((term) => term.id === 'bell')!.word = word;
      expect(() => projectStudioWord(changed, refs)).toThrow();
    }
    const duplicate = structuredClone(source);
    if (duplicate.interaction.type !== 'word_search') throw new Error('Expected source word search');
    duplicate.interaction.terms.push({ ...duplicate.interaction.terms.find((term) => term.id === 'bell')! });
    expect(() => projectStudioWord(duplicate, refs)).toThrow();
  });

  it('keeps projection bindings reference-only and rejects a projection on a fraction activity', () => {
    const bad = structuredClone(document) as unknown as { activities: Array<{ family: string; source: Record<string, unknown> }> };
    const activity = bad.activities.find((item) => item.source.wordProjection)!;
    (activity.source.wordProjection as Record<string, unknown>).answer = 'BELL';
    expect(() => validateLearningStudioRegistry(bad)).toThrow();
    delete (activity.source.wordProjection as Record<string, unknown>).answer;
    activity.family = 'fraction_studio';
    expect(() => validateLearningStudioRegistry(bad)).toThrow();
  });
});
