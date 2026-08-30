export interface ComposableMembershipMember<TFit extends string> {
  rowId: string;
  fit: TFit;
}

export interface ComposableMembership<TFit extends string> {
  profileRef: string;
  members: ComposableMembershipMember<TFit>[];
  includeProfiles?: Array<{
    profileRef: string;
    mode?: 'direct';
    fit?: TFit;
    reason?: string;
  }>;
}

export interface ComposableLearningPack {
  id: string;
  questionRefs: string[];
  includePackRefs?: string[];
}

export function resolveRuntimeMembership<TFit extends string>(
  memberships: ComposableMembership<TFit>[],
  profileRef: string
): ComposableMembership<TFit> {
  const membershipByRef = new Map(memberships.map((membership) => [membership.profileRef, membership]));
  const membership = membershipByRef.get(profileRef);
  if (!membership) throw new Error(`Unknown profile membership ${profileRef}`);

  const membersByRow = new Map(
    membership.members.map((member) => [member.rowId, { ...member }])
  );
  const seenProfiles = new Set<string>();
  for (const include of membership.includeProfiles ?? []) {
    if (seenProfiles.has(include.profileRef)) {
      throw new Error(`${profileRef}: duplicate included profile ${include.profileRef}`);
    }
    seenProfiles.add(include.profileRef);
    if (include.mode && include.mode !== 'direct') {
      throw new Error(`${profileRef}: unsupported include mode ${include.mode}`);
    }
    const source = membershipByRef.get(include.profileRef);
    if (!source) throw new Error(`${profileRef}: unknown included profile ${include.profileRef}`);
    for (const member of source.members) {
      if (membersByRow.has(member.rowId)) continue;
      membersByRow.set(member.rowId, {
        ...member,
        fit: include.fit ?? member.fit
      });
    }
  }

  return {
    profileRef: membership.profileRef,
    members: [...membersByRow.values()]
  };
}

export function resolveRuntimePackQuestionRefs(
  packs: ComposableLearningPack[],
  packId: string,
  stack: string[] = []
): string[] {
  const packById = new Map(packs.map((pack) => [pack.id, pack]));
  const pack = packById.get(packId);
  if (!pack) throw new Error(`Unknown learning pack ${packId}`);
  if (stack.includes(packId)) {
    throw new Error(`Learning-pack composition cycle: ${[...stack, packId].join(' -> ')}`);
  }

  const refs: string[] = [];
  const seen = new Set<string>();
  const add = (questionId: string): void => {
    if (seen.has(questionId)) return;
    seen.add(questionId);
    refs.push(questionId);
  };
  for (const includedPackId of pack.includePackRefs ?? []) {
    for (const questionId of resolveRuntimePackQuestionRefs(packs, includedPackId, [...stack, packId])) add(questionId);
  }
  for (const questionId of pack.questionRefs) add(questionId);
  return refs;
}
