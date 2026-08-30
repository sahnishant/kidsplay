export function packMap(packs) {
  return new Map(packs.map((pack) => [pack.id, pack]));
}

export function resolvePackQuestionRefs(packById, packId, stack = []) {
  const pack = packById.get(packId);
  if (!pack) throw new Error(`Unknown learning pack ${packId}`);
  if (stack.includes(packId)) {
    throw new Error(`Learning-pack composition cycle: ${[...stack, packId].join(' -> ')}`);
  }

  const refs = [];
  const seen = new Set();
  const add = (questionId) => {
    if (seen.has(questionId)) return;
    seen.add(questionId);
    refs.push(questionId);
  };

  for (const includedPackId of pack.includePackRefs ?? []) {
    for (const questionId of resolvePackQuestionRefs(packById, includedPackId, [...stack, packId])) add(questionId);
  }
  for (const questionId of pack.questionRefs ?? []) add(questionId);
  return refs;
}
