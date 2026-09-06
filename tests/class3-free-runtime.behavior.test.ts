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

const INTEGRATED_LIVING_ROWS = [
  'kr.sof3.living.need.food',
  'kr.sof3.living.need.water',
  'kr.sof3.living.characteristic.grow',
  'kr.sof3.living.characteristic.reproduce'
];

const DIET_ROWS = [
  'kr.sof3.animals.feeding.herbivore',
  'kr.sof3.animals.feeding.carnivore',
  'kr.sof3.animals.feeding.omnivore'
];

const CAMOUFLAGE_ROW = 'kr.sof3.animals.adaptation.camouflage';

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

  it('keeps every direct Class 3 row in free content without forcing semantically bad one-row choices', () => {
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
    for (const rowId of DIET_ROWS) expect(oneRowSingleChoiceRows.has(rowId)).toBe(true);

    const integratedLiving = pool.find((question) => question.id === 'sof3.living.integrated.needs-characteristics.001');
    expect(integratedLiving).toBeTruthy();
    expect(new Set(integratedLiving?.knowledgeRefs ?? [])).toEqual(new Set(INTEGRATED_LIVING_ROWS));

    const camouflagePractice = pool.filter((question) =>
      question.knowledgeRefs?.includes(CAMOUFLAGE_ROW)
      && ['memory_pairs', 'drag_to_target'].includes(question.interaction.type)
    );
    expect(camouflagePractice.length).toBeGreaterThanOrEqual(2);

    const semanticExceptions = new Set([...INTEGRATED_LIVING_ROWS, CAMOUFLAGE_ROW]);
    const class3ScienceRows = directMembershipRows.filter((rowId) => rowId.startsWith('kr.sof3.'));
    const missingOneRowSingleChoiceRows = class3ScienceRows.filter((rowId) => !oneRowSingleChoiceRows.has(rowId));
    expect(missingOneRowSingleChoiceRows.filter((rowId) => !semanticExceptions.has(rowId))).toEqual([]);
    expect(new Set(missingOneRowSingleChoiceRows)).toEqual(semanticExceptions);
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
