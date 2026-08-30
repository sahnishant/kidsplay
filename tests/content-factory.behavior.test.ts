import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readJson = (path: string) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));

describe('reusable higher-grade content factory', () => {
  it('resolves Class 3 as 56 direct rows plus direct-only Class 2 inheritance', () => {
    const authored = readJson('content/profile-memberships/SOF_INDIA_CLASS3.json');
    const resolved = readJson('content/index/__generated-profile-memberships.json')
      .find((membership: { profileRef: string }) => membership.profileRef === 'SOF_INDIA_CLASS3');

    expect(authored.members).toHaveLength(56);
    expect(authored.inherits).toEqual([
      expect.objectContaining({
        profileRef: 'SOF_INDIA_CLASS2',
        memberScope: 'direct',
        fit: 'review'
      })
    ]);
    expect(resolved).toBeTruthy();
    expect(resolved.members.filter((member: { origin: string }) => member.origin === 'direct')).toHaveLength(56);
    expect(resolved.members.filter((member: { origin: string }) => member.origin === 'inherited')).toHaveLength(182);
    expect(resolved.members).toHaveLength(238);
    expect(new Set(resolved.members.map((member: { rowId: string }) => member.rowId)).size).toBe(238);
  });

  it('expands an explicit Class 3 per-entry recipe sample with deterministic one-row question ids', () => {
    const questions = readJson('content/questions/__generated-from-knowledge.json');
    const ids = questions.map((question: { id: string }) => question.id);
    const expanded = ids.filter((id: string) => id.includes('.mcq.each.generated.001.'));

    expect(expanded).toEqual([
      'sof3.life-community.mcq.each.generated.001.bird-beak',
      'sof3.life-community.mcq.each.generated.001.bird-wings'
    ]);
    expect(new Set(expanded).size).toBe(expanded.length);
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
