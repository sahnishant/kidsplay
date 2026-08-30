import { describe, expect, it } from 'vitest';
import {
  createSessionForCatalogEntry,
  getCatalogEntries,
  getFreeAnimalsQuestions,
  getFreeExploreQuestions,
  getGoalReadiness,
  getProfileMockQuestions,
  getProfilePatternMockQuestions,
  getProfileQuestions
} from '../src/content';
import type { Question } from '../src/contracts/question';
import type { MasteryCounter } from '../src/runtime/localProgress';
import sofMembership from '../content/profile-memberships/SOF_INDIA_CLASS2.json';

const PROFILE_REF = 'SOF_INDIA_CLASS2';

function masteredCounter(): MasteryCounter {
  return {
    attempts: 3,
    correct: 3,
    totalWeight: 3,
    correctWeight: 3,
    lastResult: 'correct',
    lastSeenAt: '2026-08-29T12:00:00.000Z'
  };
}

function activityFamily(question: Question): string {
  if (question.authoring.source.startsWith('knowledge:')) return question.authoring.source;
  return question.id.split('.').slice(0, 3).join('.');
}

function activityFamilyCount(questions: Question[]): number {
  return new Set(questions.map(activityFamily)).size;
}

function knowledgeGroupCount(questions: Question[]): number {
  return new Set(
    questions
      .flatMap((question) => question.knowledgeRefs ?? [])
      .map((rowId) => rowId.split('.')[1])
      .filter(Boolean)
  ).size;
}

function knowledgeGroupForRow(rowId: string): string {
  const parts = rowId.split('.');
  return parts[1] === 'choice' && parts[2] ? parts[2] : parts[1] ?? 'general';
}

function hasTopic(refs: string[], topic: string): boolean {
  return refs.some((rowId) => rowId.startsWith(`kr.${topic}.`));
}

function isLogicalReasoning(question: Question): boolean {
  const refs = question.knowledgeRefs ?? [];
  return refs.length > 0 && refs.every((rowId) => knowledgeGroupForRow(rowId) === 'reasoning');
}

describe('catalog and profile-driven sessions', () => {
  it('separates broad free exploration from profile-driven practice and two mock depths', () => {
    const catalog = getCatalogEntries();
    const freeEntry = catalog.find((entry) => entry.kind === 'free_explore');
    const practiceEntry = catalog.find((entry) => entry.id === 'goal.class2-evs-olympiad.prototype');
    const mixedMockEntry = catalog.find((entry) => entry.id.endsWith('.mixed-mock'));
    const patternMockEntry = catalog.find((entry) => entry.id.includes('.pattern-mock-'));

    expect(freeEntry?.access.type).toBe('free');
    expect(freeEntry?.title).toContain('Class 2 Science');
    expect(freeEntry?.description).toContain('logical-reasoning');
    expect(practiceEntry?.access.type).toBe('purchase');
    expect(practiceEntry?.title).toContain('Core Science');
    expect(practiceEntry?.profileRef).toBe(PROFILE_REF);
    expect(practiceEntry?.status).toBe('prototype');
    expect(mixedMockEntry).toMatchObject({
      kind: 'goal_learning',
      profileRef: PROFILE_REF,
      status: 'prototype',
      actionLabel: 'Try mixed mock'
    });
    expect(patternMockEntry).toMatchObject({
      kind: 'goal_learning',
      profileRef: PROFILE_REF,
      status: 'prototype',
      actionLabel: 'Try 35-question mock'
    });
    expect(patternMockEntry?.description).toContain('5 Logical Reasoning, 25 Science and 5 Achievers');
    expect(patternMockEntry?.description).toContain('not an official SOF paper');
  });

  it('keeps every current profile fact in free exploration while launching short diverse sessions', () => {
    const pool = getFreeAnimalsQuestions();
    const poolRefs = pool.flatMap((question) => question.knowledgeRefs ?? []);
    const poolIds = new Set(pool.map((question) => question.id));
    const profileRows = new Set(sofMembership.members.map((member) => member.rowId));
    const freeRows = new Set(poolRefs);
    const session = getFreeExploreQuestions({ count: 8 });

    for (const topic of [
      'animals', 'plants', 'human', 'food', 'housing', 'clothing', 'habits', 'safety',
      'transport', 'communication', 'air', 'water', 'rocks', 'universe', 'family', 'festivals',
      'reasoning'
    ]) {
      expect(hasTopic(poolRefs, topic)).toBe(true);
    }
    expect([...profileRows].filter((rowId) => !freeRows.has(rowId))).toEqual([]);

    expect(poolIds.has('plants-water.passage.after-rain.001')).toBe(true);
    expect(poolIds.has('air.visual.balloon-candle.001')).toBe(true);
    expect(poolIds.has('rocks.visual.pumice-water.001')).toBe(true);
    expect(session).toHaveLength(8);
    expect(knowledgeGroupCount(session)).toBeGreaterThanOrEqual(5);
    expect(new Set(session.map((question) => question.interaction.type)).size).toBeGreaterThanOrEqual(4);
    expect(activityFamilyCount(session)).toBeGreaterThanOrEqual(6);
    expect(session.some((question) =>
      (question.knowledgeRefs?.length ?? 0) >= 2 && question.difficulty >= 3
    )).toBe(true);
  });

  it('only launches diverse profile-safe questions, covers the complete prototype scope and includes genuine multi-row reasoning', () => {
    const goalEntry = getCatalogEntries().find((entry) => entry.id === 'goal.class2-evs-olympiad.prototype');
    expect(goalEntry).toBeTruthy();

    const profilePool = getProfileQuestions(PROFILE_REF, { count: 300 });
    const profilePoolRefs = profilePool.flatMap((question) => question.knowledgeRefs ?? []);
    for (const topic of [
      'housing', 'clothing', 'habits', 'safety', 'transport', 'communication', 'air', 'water',
      'rocks', 'universe', 'family', 'festivals', 'reasoning'
    ]) {
      expect(hasTopic(profilePoolRefs, topic)).toBe(true);
    }

    expect(profilePool.some((question) => question.authoring.source === 'kidsplay-editorial-passage-reasoning')).toBe(true);
    expect(profilePool.some((question) => question.authoring.source === 'kidsplay-editorial-visual-reasoning')).toBe(true);

    const session = createSessionForCatalogEntry(goalEntry!.id, {});
    const allowedRows = new Set(sofMembership.members.map((member) => member.rowId));

    expect(session.profileRef).toBe(PROFILE_REF);
    expect(session.questions).toHaveLength(8);
    expect(knowledgeGroupCount(session.questions)).toBeGreaterThanOrEqual(5);
    expect(new Set(session.questions.map((question) => question.interaction.type)).size).toBeGreaterThanOrEqual(4);
    expect(activityFamilyCount(session.questions)).toBeGreaterThanOrEqual(6);
    expect(session.questions.some((question) =>
      (question.knowledgeRefs?.length ?? 0) >= 2 && question.difficulty >= 3
    )).toBe(true);

    for (const question of session.questions) {
      expect(question.knowledgeRefs?.length ?? 0).toBeGreaterThan(0);
      for (const rowId of question.knowledgeRefs ?? []) expect(allowedRows.has(rowId)).toBe(true);
    }
  });

  it('builds a 20-question profile-safe mixed mock with several reasoning questions', () => {
    const questions = getProfileMockQuestions(PROFILE_REF);
    const allowedRows = new Set(sofMembership.members.map((member) => member.rowId));
    const reasoningCount = questions.filter((question) =>
      (question.knowledgeRefs?.length ?? 0) >= 2 && question.difficulty >= 3
    ).length;

    expect(questions).toHaveLength(20);
    expect(knowledgeGroupCount(questions)).toBeGreaterThanOrEqual(7);
    expect(reasoningCount).toBeGreaterThanOrEqual(4);
    for (const question of questions) {
      for (const rowId of question.knowledgeRefs ?? []) expect(allowedRows.has(rowId)).toBe(true);
    }

    const mockEntry = getCatalogEntries().find((entry) => entry.id.endsWith('.mixed-mock'));
    expect(mockEntry).toBeTruthy();
    const launched = createSessionForCatalogEntry(mockEntry!.id, {});
    expect(launched.mode).toBe('goal_mock');
    expect(launched.questions).toHaveLength(20);
  });

  it('builds the published 2026-27 section counts and marks without presenting Kidsplay questions as an official paper', () => {
    const questions = getProfilePatternMockQuestions(PROFILE_REF);
    const logical = questions.slice(0, 5);
    const science = questions.slice(5, 30);
    const achievers = questions.slice(30, 35);

    expect(questions).toHaveLength(35);
    expect(new Set(questions.map((question) => question.id)).size).toBe(35);
    expect(logical).toHaveLength(5);
    expect(logical.every(isLogicalReasoning)).toBe(true);
    expect(science).toHaveLength(25);
    expect(science.every((question) => !isLogicalReasoning(question) && question.authoring.source !== 'kidsplay-editorial-hots')).toBe(true);
    expect(achievers).toHaveLength(5);
    expect(achievers.every((question) => question.authoring.source === 'kidsplay-editorial-hots')).toBe(true);

    const mockEntry = getCatalogEntries().find((entry) => entry.id.includes('.pattern-mock-'));
    expect(mockEntry).toBeTruthy();
    const launched = createSessionForCatalogEntry(mockEntry!.id, {});
    expect(launched.mode).toBe('goal_pattern_mock');
    expect(launched.questions).toHaveLength(35);
    expect(launched.sections).toEqual([
      { id: 'logical_reasoning', title: 'Logical Reasoning', startIndex: 0, count: 5, marksPerQuestion: 1 },
      { id: 'science', title: 'Science', startIndex: 5, count: 25, marksPerQuestion: 1 },
      { id: 'achievers', title: 'Achievers', startIndex: 30, count: 5, marksPerQuestion: 2 }
    ]);
    expect(launched.sections?.reduce((sum, section) => sum + section.count * section.marksPerQuestion, 0)).toBe(40);
  });

  it('derives practice readiness from repeated evidence and broad profile coverage', () => {
    const empty = getGoalReadiness(PROFILE_REF, {});
    expect(empty).toMatchObject({
      practicedRows: 0,
      readyRows: 0,
      practicedGroups: 0,
      score: 0,
      status: 'getting_started'
    });
    expect(empty.totalRows).toBe(sofMembership.members.length);
    expect(empty.totalGroups).toBeGreaterThanOrEqual(10);

    const narrowMastery: Record<string, MasteryCounter> = {};
    for (const member of sofMembership.members.slice(0, 20)) narrowMastery[member.rowId] = masteredCounter();
    const narrow = getGoalReadiness(PROFILE_REF, narrowMastery);

    expect(narrow.practicedRows).toBe(20);
    expect(narrow.readyRows).toBe(20);
    expect(narrow.accuracy).toBe(1);
    expect(narrow.score).toBeLessThan(100);
    expect(narrow.status).toBe('building');

    const broadMastery: Record<string, MasteryCounter> = {};
    const rowsPerGroup = new Map<string, number>();
    for (const member of sofMembership.members) {
      const group = knowledgeGroupForRow(member.rowId);
      const used = rowsPerGroup.get(group) ?? 0;
      if (used >= 3) continue;
      rowsPerGroup.set(group, used + 1);
      broadMastery[member.rowId] = masteredCounter();
    }
    const ready = getGoalReadiness(PROFILE_REF, broadMastery);

    expect(ready.practicedGroups).toBe(ready.totalGroups);
    expect(ready.practicedRows).toBeGreaterThanOrEqual(40);
    expect(ready.readyRows).toBe(ready.practicedRows);
    expect(ready.accuracy).toBe(1);
    expect(ready.score).toBe(100);
    expect(ready.status).toBe('mock_ready');
  });

  it('feeds mastery back into selection so a mastered first candidate is deprioritized', () => {
    const baseline = getProfileQuestions(PROFILE_REF, { count: 1 });
    expect(baseline).toHaveLength(1);
    expect(baseline[0].knowledgeRefs?.length ?? 0).toBeGreaterThan(0);

    const mastery: Record<string, MasteryCounter> = {};
    for (const rowId of baseline[0].knowledgeRefs ?? []) mastery[rowId] = masteredCounter();

    const adapted = getProfileQuestions(PROFILE_REF, { count: 1, mastery });
    expect(adapted).toHaveLength(1);
    expect(adapted[0].id).not.toBe(baseline[0].id);
  });
});
