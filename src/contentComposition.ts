export interface ComposableMembershipMember<TFit extends string> {
  rowId: string;
  fit: TFit;
}

export interface ComposableMembership<TFit extends string> {
  profileRef: string;
  members: ComposableMembershipMember<TFit>[];
  inherits?: Array<{
    profileRef: string;
    memberScope?: 'direct';
    fit: TFit;
    basis?: string;
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

  const membersByRow = new Map<string, ComposableMembershipMember<TFit>>();
  const seenProfiles = new Set<string>();
  for (const inheritance of membership.inherits ?? []) {
    if (seenProfiles.has(inheritance.profileRef)) {
      throw new Error(`${profileRef}: duplicate inherited profile ${inheritance.profileRef}`);
    }
    seenProfiles.add(inheritance.profileRef);
    if (inheritance.memberScope && inheritance.memberScope !== 'direct') {
      throw new Error(`${profileRef}: unsupported inheritance scope ${inheritance.memberScope}`);
    }
    const source = membershipByRef.get(inheritance.profileRef);
    if (!source) throw new Error(`${profileRef}: unknown inherited profile ${inheritance.profileRef}`);
    for (const member of source.members) {
      if (membersByRow.has(member.rowId)) continue;
      membersByRow.set(member.rowId, {
        ...member,
        fit: inheritance.fit ?? member.fit
      });
    }
  }

  for (const member of membership.members) {
    membersByRow.set(member.rowId, { ...member });
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
