/** Presentation-only decoration. Never owns wording, order, solution, concepts or evidence. */
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const exactKeys = (value, keys) => record(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
const fail = (message) => { throw new Error(`Studio illustration binding: ${message}`); };

export function validateStudioSceneBindings(bindings, visuals) {
  if (!Array.isArray(bindings) || !Array.isArray(visuals)) fail('expected arrays');
  const known = new Set(visuals.filter((visual) => visual?.renderer === 'studio-scene' && visual.editorialStatus === 'draft').map((visual) => visual.id));
  const ids = new Set();
  for (const binding of bindings) {
    if (!exactKeys(binding, ['questionId', 'source', 'items']) || typeof binding.questionId !== 'string' || !binding.questionId.trim() || ids.has(binding.questionId) || typeof binding.source !== 'string' || !binding.source.trim() || !record(binding.items)) fail('invalid/duplicate question binding');
    ids.add(binding.questionId);
    const entries = Object.entries(binding.items);
    if (entries.length < 2 || entries.length > 8) fail('requires 2–8 explicitly bound items');
    for (const [id, item] of entries) {
      if (!id.trim() || !exactKeys(item, ['expectedLabel', 'visualRef']) || typeof item.expectedLabel !== 'string' || !item.expectedLabel.trim() || !known.has(item.visualRef)) fail('unknown illustration or invalid label guard');
    }
  }
  return bindings;
}

export function bindStudioScene(question, binding) {
  if (!binding) return question;
  if (!exactKeys(binding, ['questionId', 'source', 'items']) || !record(binding.items)) fail('invalid binding fields');
  if (question?.id !== binding.questionId || question.authoring?.source !== binding.source || question.evidencePolicy !== 'practice_only' || question.authoring?.status !== 'draft' || question.interaction?.type !== 'sequence_order') fail(`${binding.questionId}: source or practice-only boundary changed`);
  const items = question.interaction.items;
  if (!Array.isArray(items) || items.length !== Object.keys(binding.items).length || !Array.from(items).every((item) => record(item) && typeof item.id === 'string') || new Set(items.map((item) => item.id)).size !== items.length) fail(`${question.id}: incomplete or duplicate stage coverage`);
  const decorated = items.map((item) => {
    const appearance = binding.items[item.id];
    if (!exactKeys(appearance, ['expectedLabel', 'visualRef']) || appearance.expectedLabel !== item.label) fail(`${question.id}/${item.id}: source wording changed; review the illustration`);
    if (item.visualRefs !== undefined && JSON.stringify(item.visualRefs) !== JSON.stringify([appearance.visualRef])) fail(`${question.id}/${item.id}: cannot silently replace authored artwork`);
    return { ...item, visualRefs: [appearance.visualRef] };
  });
  return { ...question, interaction: { ...question.interaction, items: decorated } };
}
