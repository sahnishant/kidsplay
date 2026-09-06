/** A bounded content projection, not a spelling evaluator or another word bank. */
export function projectStudioWord(source, refs) {
  const fail = (message) => { throw new Error(`Invalid studio word projection: ${message}`); };
  if (!source || source.interaction?.type !== 'word_search' || source.solution?.type !== 'found_terms') fail('source must be a word-search question');
  if (typeof source.id !== 'string' || !Number.isInteger(source.revision) || source.revision < 1) fail('source identity/revision is required');
  if (!refs || typeof refs.termId !== 'string' || !/^[a-z][a-z0-9-]{0,47}$/.test(refs.termId)) fail('safe term reference is required');
  const matches = source.interaction.terms?.filter((term) => term.id === refs.termId);
  if (!matches || matches.length !== 1 || !source.solution.requiredTermIds?.includes(refs.termId)) fail('term must be uniquely present and required in the source');
  const term = matches[0];
  if (typeof term.word !== 'string' || !/^[A-Z]{2,8}$/.test(term.word)) fail('V1 supports explicit 2–8 letter uppercase A–Z words only');
  if (!source.conceptIds?.includes(refs.conceptRef) || !source.knowledgeRefs?.includes(refs.knowledgeRef)) fail('concept and knowledge references must belong to the source');
  const items = Array.from(term.word, (label, index) => ({ id: `${term.id}-letter-${index + 1}`, label }));
  return {
    id: `${source.id}.letters.${term.id}.v1`,
    revision: source.revision,
    schemaVersion: 1,
    conceptIds: [refs.conceptRef],
    // Source denotation is context, not a fact tested by copying letter order.
    knowledgeRefs: [],
    evidencePolicy: 'practice_only',
    difficulty: source.difficulty,
    language: source.language,
    prompt: { text: `Rebuild ${term.word} with these letters.` },
    interaction: { type: 'sequence_order', version: 1, seed: source.interaction.seed, items },
    solution: { type: 'ordered_items', orderedItemIds: items.map(({ id }) => id) },
    feedback: { correct: `The letters spell ${term.word}.`, incorrect: 'Look at the printed word. Put its letters in the same order.' },
    authoring: { status: 'draft', source: `studio-word-projection@1:${source.id}@${source.revision}#${term.id}` }
  };
}
