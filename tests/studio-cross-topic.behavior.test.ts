import { describe, expect, it } from 'vitest';
import processes from '../content/knowledge/vocabulary-processes.json';
import { LEARNING_STUDIO_ACTIVITIES, loadLearningStudioQuestion, getTopicStudioActivityRefs, createStudioWorkspace, restoreStudioWorkspace } from '../src/experience/learningStudios';
import { getLearnAboutTopic } from '../src/experience/learnAboutCatalog';
import { evaluate } from '../src/evaluation/evaluate';
import type { SequenceOrderQuestion } from '../src/contracts/question';

const placements = [
  ['learn.earth','earth.day-and-night','studio.earth.day-sequence'],
  ['learn.earth','earth.water-changes','studio.earth.ice-melting'],
  ['learn.earth','earth.water-changes','studio.earth.water-freezing'],
  ['learn.lion','lion.family','studio.lion.growth'],
  ['learn.fire-station','fire-station.engine','studio.fire-station.visit-story'],
  ['learn.plants','plants.seed-growth','studio.plants.seed-growth']
] as const;
function permutations<T>(items: T[]): T[][] { return items.length ? items.flatMap((item,i) => permutations(items.filter((_,j) => i !== j)).map((rest) => [item,...rest])) : [[]]; }

describe('one sequence studio across four topic destinations', () => {
  it.each(placements)('places %s / %s / %s without early-depth leakage', async (topicId,sectionId,activityId) => {
    expect(getLearnAboutTopic(topicId)?.sections.some((section) => section.sectionId === sectionId)).toBe(true);
    expect(getTopicStudioActivityRefs(topicId,sectionId,'d1_preschool')).not.toContain(activityId);
    expect(getTopicStudioActivityRefs(topicId,sectionId,'d2_early_primary')).toContain(activityId);
    expect(getTopicStudioActivityRefs(topicId,sectionId,'d3_deeper_primary')).toContain(activityId);
    expect(LEARNING_STUDIO_ACTIVITIES.find((activity) => activity.activityId === activityId)?.family).toBe('sequence_studio');
    const question = await loadLearningStudioQuestion(activityId) as SequenceOrderQuestion;
    const results = permutations(question.solution.orderedItemIds).map((orderedItemIds) => evaluate(question,{orderedItemIds}));
    expect(results.filter((result) => result.correct)).toHaveLength(1);
    expect(results.every((result) => !result.masteryEvidence.length && !result.knowledgeEvidence.length)).toBe(true);
    const state = {orderedItemIds:[...question.solution.orderedItemIds].reverse()};
    const saved = createStudioWorkspace(activityId,question,state);
    expect(restoreStudioWorkspace(activityId,question,saved)).toEqual(state);
    expect(restoreStudioWorkspace(`${activityId}.other`,question,saved)).toBeUndefined();
    expect(restoreStudioWorkspace(activityId,{...question,revision:question.revision+1},saved)).toBeUndefined();
  });
  it('reuses the germination stages and does not assert that every seed grows', async () => {
    const source = processes.find((item) => item.id === 'knowledge.science.process.germination.001')!;
    const question = await loadLearningStudioQuestion('studio.plants.seed-growth') as SequenceOrderQuestion;
    expect(question.interaction.items.map((item) => item.label)).toEqual(source.stages.map((stage) => stage.label));
    expect(question.knowledgeRefs).toEqual([source.rowId]);
    expect(question.prompt.text).toContain('a seed that is beginning to grow');
  });
  it('refuses to interchange melting and freezing work despite the same two materials', async () => {
    const melt = await loadLearningStudioQuestion('studio.earth.ice-melting') as SequenceOrderQuestion;
    const freeze = await loadLearningStudioQuestion('studio.earth.water-freezing') as SequenceOrderQuestion;
    const saved = createStudioWorkspace('studio.earth.ice-melting',melt,{orderedItemIds:melt.solution.orderedItemIds});
    expect(restoreStudioWorkspace('studio.earth.water-freezing',freeze,saved)).toBeUndefined();
    expect(melt.knowledgeRefs).not.toEqual(freeze.knowledgeRefs);
  });
  it('keeps original story order outside the shared factual graph', async () => {
    const question = await loadLearningStudioQuestion('studio.fire-station.visit-story');
    expect(question.knowledgeRefs).toEqual([]);
    expect(question.authoring.source).toBe('story:story.studio.fire-station-visit');
    expect(question.evidencePolicy).toBe('practice_only');
    expect(question.authoring.status).toBe('draft');
  });
});
