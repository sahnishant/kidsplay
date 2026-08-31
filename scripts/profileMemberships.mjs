import { readdirSync, readFileSync } from 'node:fs';

export const allowedInheritanceScopes = new Set(['direct']);

export function readMembershipCollections(root) {
  const directory = new URL('content/profile-memberships/', root);
  return readdirSync(directory)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => ({
      name,
      value: JSON.parse(readFileSync(new URL(name, directory), 'utf8'))
    }));
}

export function createMembershipResolver(collections, allowedFits = null) {
  const byProfile = new Map();
  for (const { name, value } of collections) {
    if (!value?.profileRef) throw new Error(`${name}: profileRef is required`);
    if (byProfile.has(value.profileRef)) throw new Error(`Duplicate membership collection for ${value.profileRef}`);
    byProfile.set(value.profileRef, value);
  }

  const validateInheritance = (profileRef, inheritance) => {
    if (!inheritance || typeof inheritance !== 'object') throw new Error(`${profileRef}: inheritance entry must be an object`);
    if (!String(inheritance.profileRef ?? '').trim()) throw new Error(`${profileRef}: inheritance requires profileRef`);
    if (inheritance.profileRef === profileRef) throw new Error(`${profileRef}: cannot inherit itself`);
    if (!byProfile.has(inheritance.profileRef)) throw new Error(`${profileRef}: unknown inherited profile ${inheritance.profileRef}`);
    const scope = inheritance.memberScope ?? 'direct';
    if (!allowedInheritanceScopes.has(scope)) throw new Error(`${profileRef}: unsupported inheritance memberScope ${scope}`);
    if (allowedFits && !allowedFits.has(inheritance.fit)) throw new Error(`${profileRef}: inheritance from ${inheritance.profileRef} has unsupported fit ${inheritance.fit}`);
  };

  const directMembers = (profileRef) => {
    const membership = byProfile.get(profileRef);
    if (!membership) throw new Error(`Unknown profile membership ${profileRef}`);
    return membership.members ?? [];
  };

  const resolve = (profileRef) => {
    const membership = byProfile.get(profileRef);
    if (!membership) throw new Error(`Unknown profile membership ${profileRef}`);

    const resolvedByRow = new Map();
    for (const inheritance of membership.inherits ?? []) {
      validateInheritance(profileRef, inheritance);
      const sourceRows = directMembers(inheritance.profileRef);
      for (const member of sourceRows) {
        if (resolvedByRow.has(member.rowId)) continue;
        resolvedByRow.set(member.rowId, {
          rowId: member.rowId,
          fit: inheritance.fit,
          origin: 'inherited',
          inheritedFromProfileRef: inheritance.profileRef,
          inheritanceBasis: inheritance.basis ?? null
        });
      }
    }

    for (const member of membership.members ?? []) {
      resolvedByRow.set(member.rowId, {
        ...member,
        origin: 'direct',
        inheritedFromProfileRef: null,
        inheritanceBasis: null
      });
    }

    return {
      ...membership,
      members: [...resolvedByRow.values()]
    };
  };

  return {
    byProfile,
    directMembers,
    resolve
  };
}
