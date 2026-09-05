/** Source-local projection, not a story engine or a second sequence evaluator. */
export function projectStoryStudio(story, binding) {
  const fail = (message) => { throw new Error(`Story studio: ${message}`); };
  const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
  const ref = (value) => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,159}$/.test(value);
  if (!object(binding) || Object.keys(binding).some((key) => !['questionId','storyId','revision','conceptRef','language','seed'].includes(key))) fail('bindings contain references and projection settings only');
  if (!ref(binding.questionId) || !ref(binding.storyId) || !ref(binding.conceptRef) || !Number.isSafeInteger(binding.revision) || binding.revision < 1 || !Number.isSafeInteger(binding.seed) || typeof binding.language !== 'string' || !/^[a-z]{2}(?:-[A-Z]{2})?$/.test(binding.language)) fail('invalid binding identity or version');
  if (!object(story) || story.schemaVersion !== 1 || story.storyId !== binding.storyId || !['draft','reviewed'].includes(story.editorialStatus) || story.assessmentPolicy !== 'none' || story.masteryWritesAllowed !== false) fail('requires a non-assessing story manifest');
  if (typeof story.childTitle !== 'string' || !story.childTitle.trim() || story.childTitle.length > 100 || !Array.isArray(story.beats) || story.beats.length < 2 || story.beats.length > 8) fail('requires a title and 2–8 short beats');
  // Enforce the existing story/no-quiz boundary in the build path as well as CI.
  const forbidden = new Set(['questions','question','answer','answers','correctOption','correctOptionId','score','accuracy','streak','mastery','rewardCurrency','xp']);
  function nonAssessing(value) {
    if (Array.isArray(value)) { for (const item of value) nonAssessing(item); }
    else if (object(value)) for (const [key,item] of Object.entries(value)) {
      if (forbidden.has(key)) fail(`story contains assessment field ${key}`);
      nonAssessing(item);
    }
  }
  nonAssessing(story);
  const ids = new Set();
  const texts = new Set();
  for (const beat of story.beats) {
    if (!object(beat) || !ref(beat.beatId) || ids.has(beat.beatId) || typeof beat.text !== 'string' || !beat.text.trim() || beat.text.length > 180 || texts.has(beat.text.trim())) fail('beats must be short, distinct and uniquely identified');
    ids.add(beat.beatId); texts.add(beat.text.trim());
  }
  const items = story.beats.map((beat) => ({ id: beat.beatId, label: beat.text }));
  return {
    id: binding.questionId, revision: binding.revision, schemaVersion: 1,
    conceptIds: [binding.conceptRef], knowledgeRefs: [], evidencePolicy: 'practice_only',
    difficulty: 2, language: binding.language,
    prompt: { text: `Read “${story.childTitle}” in Show me, then arrange its events. This order belongs to the story, not to every real-life visit.` },
    interaction: { type: 'sequence_order', version: 1, seed: binding.seed, items },
    solution: { type: 'ordered_items', orderedItemIds: items.map(({ id }) => id) },
    feedback: { correct: 'You put the events in this story in their original order.', incorrect: 'Keep your cards. Read this story again in Show me, then compare its events with your order.' },
    // A reviewed story does not approve this new teaching adaptation.
    authoring: { status: 'draft', source: `story:${story.storyId}`, compiledBy: 'story-manifest->sequence_order@1' }
  };
}
