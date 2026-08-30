export function membershipMap(memberships) {
  return new Map(memberships.map((membership) => [membership.profileRef, membership]));
}

export function resolveMembership(membershipByRef, profileRef, stack = []) {
  const membership = membershipByRef.get(profileRef);
  if (!membership) throw new Error(`Unknown profile membership ${profileRef}`);
  if (stack.includes(profileRef)) {
    throw new Error(`Profile membership composition cycle: ${[...stack, profileRef].join(' -> ')}`);
  }

  const directMembers = Array.isArray(membership.members) ? membership.members : [];
  const membersByRow = new Map(directMembers.map((member) => [member.rowId, {
    ...member,
    membershipOrigin: 'direct',
    membershipSourceProfileRef: profileRef
  }]));

  for (const include of membership.includeProfiles ?? []) {
    const source = membershipByRef.get(include.profileRef);
    if (!source) throw new Error(`${profileRef}: unknown included profile ${include.profileRef}`);
    if (include.mode && include.mode !== 'direct') {
      throw new Error(`${profileRef}: unsupported include mode ${include.mode}; only direct membership reuse is currently allowed`);
    }
    const sourceMembers = Array.isArray(source.members) ? source.members : [];
    for (const sourceMember of sourceMembers) {
      if (membersByRow.has(sourceMember.rowId)) continue;
      membersByRow.set(sourceMember.rowId, {
        ...sourceMember,
        fit: include.fit ?? sourceMember.fit,
        membershipOrigin: 'included',
        membershipSourceProfileRef: include.profileRef,
        inclusionReason: include.reason ?? null
      });
    }
  }

  return {
    ...membership,
    members: [...membersByRow.values()]
  };
}

export function resolveAllMemberships(memberships) {
  const byRef = membershipMap(memberships);
  return memberships.map((membership) => resolveMembership(byRef, membership.profileRef));
}
