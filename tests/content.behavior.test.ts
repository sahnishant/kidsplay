import { describe, expect, it } from 'vitest';
import {
  createSessionForCatalogEntry,
  getCatalogEntries,
  getProfileQuestions
} from '../src/content';
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

describe('catalog and profile-driven sessions', () => {
  it('separates free exploration from the profile-driven goal program', () => {
    const catalog = getCatalogEntries();
    const freeEntry = catalog.find((entry) => entry.kind === 'free_explore');
    const goalEntry = catalog.find((entry) => entry.kind === 'goal_learning');

    expect(freeEntry?.access.type).toBe('free');
    expect(goalEntry?.access.type).toBe('purchase');
    expect(goalEntry?.profileRef).toBe(PROFILE_REF);
    expect(goalEntry?.status).toBe('prototype');
  });

  it('only launches questions whose complete knowledge reference set belongs to the profile', () => {
    const goalEntry = getCatalogEntries().find((entry) => entry.kind === 'goal_learning');
    expect(goalEntry).toBeTruthy();

    const session = createSessionForCatalogEntry(goalEntry!.id, {});
    const allowedRows = new Set(sofMembership.members.map((member) => member.rowId));

    expect(session.profileRef).toBe(PROFILE_REF);
    expect(session.questions.length).toBeGreaterThan(0);
    expect(new Set(session.questions.map((question) => question.interaction.type)).size).toBeGreaterThanOrEqual(4);

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
