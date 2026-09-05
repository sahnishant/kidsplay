import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import questionsJson from '../content/questions/studio-reuse.json';
import type { EqualPartsQuestion } from '../src/contracts/question';
import { evaluate } from '../src/evaluation/evaluate';
import { LEARNING_STUDIO_ACTIVITIES, loadLearningStudioQuestion, getTopicStudioActivityRefs } from '../src/experience/learningStudios';

const questions = questionsJson as EqualPartsQuestion[];

describe('#264 content-only studio reuse', () => {
  it('checks every complete and partial state against independent target counts', () => {
    const report = JSON.parse(execFileSync(process.execPath, ['scripts/test-studio-reuse.mjs'], { encoding: 'utf8', timeout: 30000 }));
    expect(report.totalStates).toBe(394721);
    expect(report.results.map((row: { validArrangements: number }) => row.validArrangements)).toEqual([90, 2520]);
  }, 35000);

  it.each(questions)('loads $id through the existing catalogue and evaluator without changing the source', async (source) => {
    const activity = LEARNING_STUDIO_ACTIVITIES.find((item) => item.source.questionId === source.id);
    if (!activity) throw new Error(`Missing activity for ${source.id}`);
    const original = structuredClone(source);
    const loaded = await loadLearningStudioQuestion(activity.activityId);
    expect(loaded).toEqual(source);
    expect(loaded).not.toBe(source);
    expect(loaded.evidencePolicy).toBe('practice_only');
    const assignments = source.interaction.categories.flatMap(({ id }) => {
      const goal = source.solution.fractions[id];
      return Array(source.interaction.partCount * goal.numerator / goal.denominator).fill(id);
    });
    expect(evaluate(loaded, { assignments }).correct).toBe(true);
    expect(evaluate(loaded, { assignments: [...assignments].reverse() }).correct).toBe(true);
    expect(evaluate(loaded, { assignments: Array(source.interaction.partCount).fill(null) }).correct).toBe(false);
    expect(source).toEqual(original);
  });

  it('keeps sharing with three or four friends out of introductory depth and reuses the Fractions topic', () => {
    const refs = ['studio.fractions.three-friends', 'studio.fractions.four-friends'];
    expect(getTopicStudioActivityRefs('learn.fractions', 'fractions.share-with-friends', 'd1_preschool')).toEqual([]);
    expect(getTopicStudioActivityRefs('learn.fractions', 'fractions.share-with-friends', 'd2_early_primary')).toEqual(refs);
    expect(getTopicStudioActivityRefs('learn.fractions', 'fractions.share-with-friends', 'd3_deeper_primary')).toEqual(refs);
    expect(getTopicStudioActivityRefs('learn.fractions', 'fractions.equal-shares', 'd1_preschool')).toEqual(['studio.fractions.equal-shares']);
  });
});
