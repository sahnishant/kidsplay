import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readJson = (path: string) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));

describe('reusable higher-grade content factory', () => {
  it('resolves Class 3 as 24 direct rows plus direct-only Class 2 inheritance', () => {
    const authored = readJson('content/profile-memberships/SOF_INDIA_CLASS3.json');
    const resolved = readJson('content/index/__generated-profile-memberships.json')
      .find((membership: { profileRef: string }) => membership.profileRef === 'SOF_INDIA_CLASS3');

    expect(authored.members).toHaveLength(24);
    expect(authored.inherits).toEqual([
      expect.objectContaining({
        profileRef: 'SOF_INDIA_CLASS2',
        memberScope: 'direct',
        fit: 'review'
      })
    ]);
    expect(resolved).toBeTruthy();
    expect(resolved.members.filter((member: { origin: string }) => member.origin === 'direct')).toHaveLength(24);
    expect(resolved.members.filter((member: { origin: string }) => member.origin === 'inherited')).toHaveLength(182);
    expect(resolved.members).toHaveLength(206);
    expect(new Set(resolved.members.map((member: { rowId: string }) => member.rowId)).size).toBe(206);
  });

  it('expands three Class 3 recipe templates into the missing per-row MCQs without duplicating existing target rows', () => {
    const questions = readJson('content/questions/__generated-from-knowledge.json');
    const ids = questions.map((question: { id: string }) => question.id);
    const expanded = ids.filter((id: string) => id.includes('.mcq.each.generated.001.'));

    expect(expanded).toHaveLength(21);
    expect(expanded).not.toContain('sof3.life-community.mcq.each.generated.001.bird-feathers');
    expect(expanded).not.toContain('sof3.materials-forces.mcq.each.generated.001.transparent');
    expect(expanded).not.toContain('sof3.environment-safety.mcq.each.generated.001.reduce');
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
