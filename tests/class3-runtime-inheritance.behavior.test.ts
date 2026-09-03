import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getGoalReadiness, getProfileQuestions } from '../src/content';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
const PROFILE_REF = 'SOF_INDIA_CLASS3';
const FULL_PROFILE_POOL_LIMIT = 1000;

describe('Class 3 runtime profile inheritance', () => {
  it('uses the generated effective Class 3 membership at runtime after factory expansion', () => {
    const readiness = getGoalReadiness(PROFILE_REF, {});
    const resolvedMembership = readJson('content/index/__generated-profile-memberships.json')
      .find((membership: { profileRef: string }) => membership.profileRef === PROFILE_REF);

    expect(resolvedMembership).toBeTruthy();
    expect(readiness.totalRows).toBe(resolvedMembership.members.length);
    expect(readiness.totalRows).toBeGreaterThan(238);
  });

  it('selects both inherited Class 2 truth and direct Class 3 truth without copying knowledge rows', () => {
    const questions = getProfileQuestions(PROFILE_REF, { count: FULL_PROFILE_POOL_LIMIT });
    const refs = new Set(questions.flatMap((question) => question.knowledgeRefs ?? []));

    expect(refs.has('kr.animals.dog.domestic')).toBe(true);
    expect(refs.has('kr.sof3.birds.beak.eating')).toBe(true);
    expect(refs.has('kr.sof3.water.cycle.repeats')).toBe(true);
    expect(refs.has('kr.sof3.measurement.temperature.thermometer')).toBe(true);
    expect(refs.has('kr.reasoning.pattern.symbols.alternating')).toBe(true);
    expect(refs.has('kr.sof3.matter.occupies-space')).toBe(true);
    expect([...refs].some((rowId) => rowId.startsWith('kr.sof4.'))).toBe(false);
  });

  it('keeps expanded current-class HOTS inside the same profile-safe runtime pool', () => {
    const questions = getProfileQuestions(PROFILE_REF, { count: FULL_PROFILE_POOL_LIMIT });
    const class3Hots = questions.filter((question) =>
      question.authoring.source === 'kidsplay-editorial-hots'
        && (question.knowledgeRefs?.length ?? 0) > 0
        && (question.knowledgeRefs ?? []).every((rowId) => rowId.startsWith('kr.sof3.'))
    );

    expect(class3Hots.length).toBeGreaterThanOrEqual(10);
    expect(class3Hots.every((question) =>
      (question.knowledgeRefs ?? []).every((rowId) => rowId.startsWith('kr.sof3.'))
    )).toBe(true);
  });
});
