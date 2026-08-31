import { describe, expect, it } from 'vitest';
import {
  createSessionForCatalogEntry,
  getCatalogEntries,
  getFreeExploreQuestionsForPack,
  getFreePackQuestions
} from '../src/content';
import class2Membership from '../content/profile-memberships/SOF_INDIA_CLASS2.json';
import class3Membership from '../content/profile-memberships/SOF_INDIA_CLASS3.json';

const PACK_ID = 'free.sof-class3-science-foundation.1';
const PROFILE_REF = 'SOF_INDIA_CLASS3';

describe('Class 3 free runtime', () => {
  it('surfaces the Class 3 foundation pack as a profile-scoped free catalog entry', () => {
    const entry = getCatalogEntries().find((item) => item.id === PACK_ID);

    expect(entry).toMatchObject({
      id: PACK_ID,
      kind: 'free_explore',
      profileRef: PROFILE_REF,
      access: { type: 'free' },
      status: 'prototype',
      actionLabel: 'Explore Class 3'
    });
    expect(entry?.title).toContain('Class 3 Science');
  });

  it('keeps every direct Class 3 row in free content while reusing the Class 2 free bank by composition', () => {
    const pool = getFreePackQuestions(PACK_ID);
    const freeRows = new Set(pool.flatMap((question) => question.knowledgeRefs ?? []));
    const directMembershipRows = class3Membership.members.map((member) => member.rowId);

    expect(pool.length).toBeGreaterThan(100);
    expect(pool.some((question) => question.id === 'plants.parts.memory.generated.001')).toBe(true);
    expect(directMembershipRows.filter((rowId) => !freeRows.has(rowId))).toEqual([]);

    const oneRowSingleChoiceRows = new Set(
      pool
        .filter((question) => question.interaction.type === 'single_choice' && question.knowledgeRefs?.length === 1)
        .map((question) => question.knowledgeRefs?.[0])
        .filter((rowId): rowId is string => Boolean(rowId))
    );
    const class3ScienceRows = directMembershipRows.filter((rowId) => rowId.startsWith('kr.sof3.'));
    const missingOneRowSingleChoiceRows = class3ScienceRows.filter((rowId) => !oneRowSingleChoiceRows.has(rowId));

    expect(missingOneRowSingleChoiceRows).toEqual([]);
  });

  it('launches an eight-question Class 3 free session inside its effective composed profile membership', () => {
    const allowedRows = new Set([
      ...class2Membership.members.map((member) => member.rowId),
      ...class3Membership.members.map((member) => member.rowId)
    ]);
    const launch = createSessionForCatalogEntry(PACK_ID, {});

    expect(launch.mode).toBe('free_explore');
    expect(launch.profileRef).toBe(PROFILE_REF);
    expect(launch.questions).toHaveLength(8);
    expect(new Set(launch.questions.map((question) => question.interaction.type)).size).toBeGreaterThanOrEqual(2);

    for (const question of launch.questions) {
      expect(question.knowledgeRefs?.length ?? 0).toBeGreaterThan(0);
      for (const rowId of question.knowledgeRefs ?? []) expect(allowedRows.has(rowId)).toBe(true);
    }
  });

  it('keeps generic free-pack selection callable independently of the legacy Class 2 helper', () => {
    const selected = getFreeExploreQuestionsForPack(PACK_ID, { count: 6 });
    expect(selected).toHaveLength(6);
    expect(new Set(selected.map((question) => question.id)).size).toBe(6);
  });
});
