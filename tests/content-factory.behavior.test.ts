import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));

describe('reusable higher-grade content factory', () => {
  it('resolves Class 3 direct rows plus direct-only Class 2 inheritance without freezing the seed count', () => {
    const class2 = readJson('content/profile-memberships/SOF_INDIA_CLASS2.json');
    const authored = readJson('content/profile-memberships/SOF_INDIA_CLASS3.json');
    const resolvedMembership = readJson('content/index/__generated-profile-memberships.json')
      .find((membership: { profileRef: string }) => membership.profileRef === 'SOF_INDIA_CLASS3');

    expect(authored.members.length).toBeGreaterThan(56);
    expect(authored.inherits).toEqual([
      expect.objectContaining({
        profileRef: 'SOF_INDIA_CLASS2',
        memberScope: 'direct',
        fit: 'review'
      })
    ]);
    expect(resolvedMembership).toBeTruthy();

    const directRows = new Set(authored.members.map((member: { rowId: string }) => member.rowId));
    const inheritedRows = class2.members
      .map((member: { rowId: string }) => member.rowId)
      .filter((rowId: string) => !directRows.has(rowId));
    const effectiveRows = new Set([
      ...class2.members.map((member: { rowId: string }) => member.rowId),
      ...directRows
    ]);

    expect(resolvedMembership.members.filter((member: { origin: string }) => member.origin === 'direct'))
      .toHaveLength(authored.members.length);
    expect(resolvedMembership.members.filter((member: { origin: string }) => member.origin === 'inherited'))
      .toHaveLength(inheritedRows.length);
    expect(resolvedMembership.members).toHaveLength(effectiveRows.size);
    expect(new Set(resolvedMembership.members.map((member: { rowId: string }) => member.rowId)).size)
      .toBe(effectiveRows.size);
  });

  it('expands reusable Class 3 per-entry recipes with deterministic one-row question ids', () => {
    const questions = readJson('content/questions/__generated-from-knowledge.json');
    const expanded = questions.filter((question: { id: string }) => question.id.includes('.mcq.each.generated.001.'));
    const ids = expanded.map((question: { id: string }) => question.id);

    expect(ids).toEqual(expect.arrayContaining([
      'sof3.life-community.mcq.each.generated.001.bird-beak',
      'sof3.life-community.mcq.each.generated.001.bird-wings',
      'sof3.life-adaptations.mcq.each.generated.001.herbivore',
      'sof3.measurement-space.mcq.each.generated.001.temperature'
    ]));
    expect(expanded.length).toBeGreaterThan(30);
    expect(new Set(ids).size).toBe(ids.length);
    expect(expanded.every((question: { knowledgeRefs?: string[] }) => question.knowledgeRefs?.length === 1)).toBe(true);
  });

  it('keeps inherited rows as canonical references rather than copied knowledge objects', () => {
    const index = readJson('content/index/__generated-learning-index.json');
    const inheritedDog = index.find((row: { rowId: string }) => row.rowId === 'kr.animals.dog.domestic');
    const class3Profile = inheritedDog.profiles.find((profile: { profileRef: string }) => profile.profileRef === 'SOF_INDIA_CLASS3');

    expect(class3Profile).toMatchObject({
      membershipOrigin: 'inherited',
      inheritedFromProfileRef: 'SOF_INDIA_CLASS2',
      fit: 'review'
    });
    expect(index.filter((row: { rowId: string }) => row.rowId === 'kr.animals.dog.domestic')).toHaveLength(1);
  });
});
