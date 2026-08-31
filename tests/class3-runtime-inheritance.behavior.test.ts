import { describe, expect, it } from 'vitest';
import { getGoalReadiness, getProfileQuestions } from '../src/content';

const PROFILE_REF = 'SOF_INDIA_CLASS3';

describe('Class 3 runtime profile inheritance', () => {
  it('uses the resolved 56-current + 182-previous membership at runtime', () => {
    const readiness = getGoalReadiness(PROFILE_REF, {});
    expect(readiness.totalRows).toBe(238);
  });

  it('selects both inherited Class 2 truth and direct Class 3 truth without copying knowledge rows', () => {
    const questions = getProfileQuestions(PROFILE_REF, { count: 500 });
    const refs = new Set(questions.flatMap((question) => question.knowledgeRefs ?? []));

    expect(refs.has('kr.animals.dog.domestic')).toBe(true);
    expect(refs.has('kr.sof3.birds.beak.eating')).toBe(true);
    expect(refs.has('kr.sof3.water.cycle.repeats')).toBe(true);
    expect(refs.has('kr.sof3.measurement.temperature.thermometer')).toBe(true);
    expect(refs.has('kr.reasoning.pattern.symbols.next')).toBe(true);
    expect([...refs].some((rowId) => rowId.startsWith('kr.sof4.'))).toBe(false);
  });

  it('keeps current-class HOTS inside the same profile-safe runtime pool', () => {
    const questions = getProfileQuestions(PROFILE_REF, { count: 500 });
    const hots = questions.filter((question) => question.authoring.source === 'kidsplay-editorial-hots');
    const class3Hots = hots.filter((question) => question.id.startsWith('sof3.hots.'));

    expect(class3Hots).toHaveLength(5);
    expect(class3Hots.every((question) =>
      (question.knowledgeRefs ?? []).every((rowId) => rowId.startsWith('kr.sof3.'))
    )).toBe(true);
  });
});
