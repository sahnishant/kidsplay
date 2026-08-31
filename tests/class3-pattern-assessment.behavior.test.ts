import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getProfileQuestions } from '../src/content';
import {
  buildProfilePatternAssessment,
  questionCurriculumOrigin,
  type AssessmentBlueprint,
  type EffectiveProfileMember
} from '../src/runtime/profileAssessment';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
const PROFILE_REF = 'SOF_INDIA_CLASS3';

function fixture() {
  const blueprint = readJson('content/assessment-blueprints/SOF_INDIA_CLASS3_2026-27.json') as AssessmentBlueprint;
  const membership = readJson('content/index/__generated-profile-memberships.json')
    .find((item: { profileRef: string }) => item.profileRef === PROFILE_REF) as { members: EffectiveProfileMember[] };
  const candidates = getProfileQuestions(PROFILE_REF, { count: 500 });
  return { blueprint, membership, candidates };
}

describe('Class 3 pattern assessment', () => {
  it('builds the 35-question / 40-mark structure with a 15-current + 10-previous science mix', () => {
    const { blueprint, membership, candidates } = fixture();
    const result = buildProfilePatternAssessment(candidates, blueprint, membership.members);
    const byRow = new Map(membership.members.map((member) => [member.rowId, member]));

    expect(result.questions).toHaveLength(35);
    expect(new Set(result.questions.map((question) => question.id)).size).toBe(35);
    expect(result.sections).toEqual([
      expect.objectContaining({ id: 'logical_reasoning', startIndex: 0, count: 5, marksPerQuestion: 1 }),
      expect.objectContaining({ id: 'science', startIndex: 5, count: 25, marksPerQuestion: 1 }),
      expect.objectContaining({ id: 'achievers', startIndex: 30, count: 5, marksPerQuestion: 2 })
    ]);

    const science = result.questions.slice(5, 30);
    expect(science.filter((question) => questionCurriculumOrigin(question, byRow) === 'current')).toHaveLength(15);
    expect(science.filter((question) => questionCurriculumOrigin(question, byRow) === 'previous')).toHaveLength(10);
    expect(science.filter((question) => questionCurriculumOrigin(question, byRow) === 'mixed')).toHaveLength(0);
  });

  it('uses five canonical current-class HOTS questions for the achievers section', () => {
    const { blueprint, membership, candidates } = fixture();
    const result = buildProfilePatternAssessment(candidates, blueprint, membership.members);
    const byRow = new Map(membership.members.map((member) => [member.rowId, member]));
    const achievers = result.questions.slice(30);

    expect(achievers).toHaveLength(5);
    expect(achievers.every((question) => question.authoring.source === 'kidsplay-editorial-hots')).toBe(true);
    expect(achievers.every((question) => (question.knowledgeRefs ?? []).every((rowId) => rowId.startsWith('kr.sof3.')))).toBe(true);
    expect(achievers.every((question) => questionCurriculumOrigin(question, byRow) === 'current')).toBe(true);
  });

  it('keeps the assessment within the effective Class 3 membership', () => {
    const { blueprint, membership, candidates } = fixture();
    const allowedRows = new Set(membership.members.map((member) => member.rowId));
    const result = buildProfilePatternAssessment(candidates, blueprint, membership.members);

    expect(result.questions.every((question) =>
      (question.knowledgeRefs ?? []).every((rowId) => allowedRows.has(rowId))
    )).toBe(true);
    expect(result.questions.flatMap((question) => question.knowledgeRefs ?? []).some((rowId) => rowId.startsWith('kr.sof4.'))).toBe(false);
  });
});
