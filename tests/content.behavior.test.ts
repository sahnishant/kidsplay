import { describe, expect, it } from 'vitest';
import {
  createSessionForCatalogEntry,
  getCatalogEntries,
  getFreeExploreQuestions,
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

function hasTopic(refs: string[], topic: string): boolean {
  return refs.some((rowId) => rowId.startsWith(`kr.${topic}.`));
}

describe('catalog and profile-driven sessions', () => {
  it('separates broad free exploration from the profile-driven goal program', () => {
    const catalog = getCatalogEntries();
    const freeEntry = catalog.find((entry) => entry.kind === 'free_explore');
    const goalEntry = catalog.find((entry) => entry.kind === 'goal_learning');

    expect(freeEntry?.access.type).toBe('free');
    expect(freeEntry?.title).toContain('Body & Food');
    expect(goalEntry?.access.type).toBe('purchase');
    expect(goalEntry?.title).toContain('Body & Food');
    expect(goalEntry?.profileRef).toBe(PROFILE_REF);
    expect(goalEntry?.status).toBe('prototype');
  });

  it('launches a short free session that mixes all current topics, engines and activity families', () => {
    const session = getFreeExploreQuestions({ count: 8 });
    const refs = session.flatMap((question) => question.knowledgeRefs ?? []);

    expect(session).toHaveLength(8);
    expect(hasTopic(refs, 'animals')).toBe(true);
    expect(hasTopic(refs, 'plants')).toBe(true);
    expect(hasTopic(refs, 'human')).toBe(true);
    expect(hasTopic(refs, 'food')).toBe(true);
    expect(new Set(session.map((question) => question.interaction.type)).size).toBeGreaterThanOrEqual(4);
    expect(activityFamilyCount(session)).toBeGreaterThanOrEqual(6);
  });

  it('only launches diverse profile-safe questions and includes genuine multi-row reasoning', () => {
    const goalEntry = getCatalogEntries().find((entry) => entry.kind === 'goal_learning');
    expect(goalEntry).toBeTruthy();

    const session = createSessionForCatalogEntry(goalEntry!.id, {});
    const allowedRows = new Set(sofMembership.members.map((member) => member.rowId));
    const sessionRefs = session.questions.flatMap((question) => question.knowledgeRefs ?? []);

    expect(session.profileRef).toBe(PROFILE_REF);
    expect(session.questions).toHaveLength(8);
    expect(new Set(session.questions.map((question) => question.interaction.type)).size).toBeGreaterThanOrEqual(4);
    expect(hasTopic(sessionRefs, 'animals')).toBe(true);
    expect(hasTopic(sessionRefs, 'plants')).toBe(true);
    expect(hasTopic(sessionRefs, 'human')).toBe(true);
    expect(hasTopic(sessionRefs, 'food')).toBe(true);
    expect(activityFamilyCount(session.questions)).toBeGreaterThanOrEqual(6);
    expect(session.questions.some((question) =>
      (question.knowledgeRefs?.length ?? 0) >= 2 && question.difficulty >= 3
    )).toBe(true);

    for (const question of session.questions) {
      expect(question.knowledgeRefs?.length ?? 0).toBeGreaterThan(0);
      for (const rowId of question.knowledgeRefs ?? []) expect(allowedRows.has(rowId)).toBe(true);
    }
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
