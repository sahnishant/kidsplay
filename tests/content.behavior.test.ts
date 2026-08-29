import { describe, expect, it } from 'vitest';
import {
  createSessionForCatalogEntry,
  getCatalogEntries,
  getFreeAnimalsQuestions,
  getFreeExploreQuestions,
  getGoalReadiness,
  getProfileMockQuestions,
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

function hasTopic(refs: string[], topic: string): boolean {
  return refs.some((rowId) => rowId.startsWith(`kr.${topic}.`));
}

describe('catalog and profile-driven sessions', () => {
  it('separates broad free exploration from profile-driven practice and a mixed mock', () => {
    const catalog = getCatalogEntries();
    const freeEntry = catalog.find((entry) => entry.kind === 'free_explore');
    const practiceEntry = catalog.find((entry) => entry.id === 'goal.class2-evs-olympiad.prototype');
    const mockEntry = catalog.find((entry) => entry.id.endsWith('.mixed-mock'));

    expect(freeEntry?.access.type).toBe('free');
    expect(freeEntry?.title).toContain('Class 2 Science');
    expect(freeEntry?.description).toContain('logical-reasoning');
    expect(practiceEntry?.access.type).toBe('purchase');
    expect(practiceEntry?.title).toContain('Core Science');
    expect(practiceEntry?.profileRef).toBe(PROFILE_REF);
    expect(practiceEntry?.status).toBe('prototype');
    expect(mockEntry).toMatchObject({
      kind: 'goal_learning',
      profileRef: PROFILE_REF,
      status: 'prototype',
      actionLabel: 'Try mixed mock'
    });
  });

  it('keeps the broadened foundational topic pool free while launching short diverse sessions', () => {
    const pool = getFreeAnimalsQuestions();
    const poolRefs = pool.flatMap((question) => question.knowledgeRefs ?? []);
    const session = getFreeExploreQuestions({ count: 8 });

    for (const topic of [
      'animals', 'plants', 'human', 'food', 'housing', 'clothing', 'habits', 'safety',
      'transport', 'communication', 'air', 'water', 'rocks', 'universe', 'family', 'festivals',
      'reasoning'
    ]) {
      expect(hasTopic(poolRefs, topic)).toBe(true);
    }

    expect(session).toHaveLength(8);
    expect(knowledgeGroupCount(session)).toBeGreaterThanOrEqual(5);
    expect(new Set(session.map((question) => question.interaction.type)).size).toBeGreaterThanOrEqual(4);
    expect(activityFamilyCount(session)).toBeGreaterThanOrEqual(6);
  });

  it('only launches diverse profile-safe questions, covers the broader prototype and includes genuine multi-row reasoning', () => {
    const goalEntry = getCatalogEntries().find((entry) => entry.id === 'goal.class2-evs-olympiad.prototype');
    expect(goalEntry).toBeTruthy();

    const profilePool = getProfileQuestions(PROFILE_REF, { count: 250 });
    const profilePoolRefs = profilePool.flatMap((question) => question.knowledgeRefs ?? []);
    for (const topic of ['housing', 'safety', 'transport', 'air', 'water', 'rocks', 'universe', 'reasoning']) {
      expect(hasTopic(profilePoolRefs, topic)).toBe(true);
    }

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

  it('derives a transparent practice-readiness signal from profile evidence', () => {
    const empty = getGoalReadiness(PROFILE_REF, {});
    expect(empty).toMatchObject({ practicedRows: 0, readyRows: 0, score: 0, status: 'getting_started' });
    expect(empty.totalRows).toBe(sofMembership.members.length);

    const mastery: Record<string, MasteryCounter> = {};
    for (const member of sofMembership.members.slice(0, 20)) mastery[member.rowId] = masteredCounter();
    const ready = getGoalReadiness(PROFILE_REF, mastery);

    expect(ready.practicedRows).toBe(20);
    expect(ready.readyRows).toBe(20);
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
