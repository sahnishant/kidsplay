/** Work products only: no correctness, curriculum truth, audio or mastery writes. */
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const id = (value) => typeof value === 'string' && value.length > 0 && value.length <= 160 && /^[a-zA-Z0-9][a-zA-Z0-9._:@/-]*$/.test(value);
const integer = (value, max) => Number.isSafeInteger(value) && value >= 0 && value <= max;
const ownKeys = (value, allowed) => record(value) && Object.keys(value).every((key) => allowed.includes(key));

function canonical(value, depth = 0) {
  if (depth > 16) throw new Error('Studio configuration is too deeply nested');
  if (Array.isArray(value)) return value.map((item) => canonical(item, depth + 1));
  if (record(value)) return Object.fromEntries(Object.keys(value).sort().filter((key) => value[key] !== undefined).map((key) => [key, canonical(value[key], depth + 1)]));
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return value;
  throw new Error('Studio configuration must be JSON data');
}

/** Exact canonical descriptor, not a lossy hash; catches a forgotten revision bump. */
export function studioQuestionSignature(question) {
  if (!record(question) || !id(question.id) || !Number.isSafeInteger(question.revision) || question.revision < 1 || !record(question.interaction) || !record(question.solution)) throw new Error('Invalid studio source identity');
  const signature = JSON.stringify(canonical([question.id, question.revision, question.interaction, question.solution]));
  if (signature.length > 16000) throw new Error('Studio source exceeds the workspace bound');
  return signature;
}

export function isStudioResponse(question, state) {
  if (!record(state)) return false;
  const interaction = question.interaction;
  if (interaction.type === 'equal_parts') {
    if (!ownKeys(state, ['assignments']) || !Array.isArray(state.assignments) || state.assignments.length !== interaction.partCount) return false;
    const ids = new Set(interaction.categories.map((category) => category.id));
    return Array.from(state.assignments).every((value) => value === null || (typeof value === 'string' && ids.has(value)));
  }
  if (interaction.type === 'sequence_order') {
    if (!ownKeys(state, ['orderedItemIds']) || !Array.isArray(state.orderedItemIds)) return false;
    const ids = new Set(interaction.items.map((item) => item.id));
    const actual = Array.from(state.orderedItemIds);
    return ids.size === interaction.items.length && actual.length === ids.size && new Set(actual).size === ids.size && actual.every((value) => typeof value === 'string' && ids.has(value));
  }
  return false;
}

export const INITIAL_STUDIO_LEARNING = Object.freeze({ mode: 'explore', demonstrationSeen: false, checkCount: 0, stepIndex: 0, checked: false });
function validLearning(value, question) {
  const length = question.interaction.type === 'sequence_order' ? question.interaction.items.length : question.interaction.categories.length;
  return ownKeys(value, Object.keys(INITIAL_STUDIO_LEARNING))
    && ['explore', 'watch', 'practice'].includes(value.mode)
    && typeof value.demonstrationSeen === 'boolean'
    && integer(value.checkCount, 1000000)
    && integer(value.stepIndex, Math.max(0, length - 1))
    && typeof value.checked === 'boolean'
    && (!value.checked || (value.mode === 'practice' && value.checkCount > 0))
    && (value.mode !== 'watch' || value.demonstrationSeen);
}

export function createStudioWorkspace(activityId, question, state, learning = INITIAL_STUDIO_LEARNING) {
  if (!id(activityId) || !activityId.startsWith('studio.')) throw new Error('Invalid studio activity ID');
  if (state !== undefined && state !== null && !isStudioResponse(question, state)) throw new Error('Invalid studio work product');
  if (!validLearning(learning, question)) throw new Error('Invalid studio teaching state');
  if (learning.checked && (state === undefined || state === null)) throw new Error('Checked work needs a response');
  return {
    schemaVersion: 2, activityId, questionId: question.id, questionRevision: question.revision,
    engineKey: `${question.interaction.type}@${question.interaction.version}`,
    signature: studioQuestionSignature(question), state: state == null ? null : structuredClone(state),
    learning: structuredClone(learning)
  };
}

/** Old V1 work had no durable format. Refuse it rather than guess its semantics. */
export function readStudioWorkspace(activityId, question, value) {
  try {
    if (!ownKeys(value, ['schemaVersion', 'activityId', 'questionId', 'questionRevision', 'engineKey', 'signature', 'state', 'learning'])
      || value.schemaVersion !== 2 || value.activityId !== activityId || value.questionId !== question.id
      || value.questionRevision !== question.revision || value.engineKey !== `${question.interaction.type}@${question.interaction.version}`
      || value.signature !== studioQuestionSignature(question) || !validLearning(value.learning, question)
      || !Object.hasOwn(value, 'state') || (value.state !== null && !isStudioResponse(question, value.state))
      || (value.learning.checked && value.state === null)) return null;
    return structuredClone(value);
  } catch { return null; }
}

export function restoreStudioWorkspace(activityId, question, value) {
  const workspace = readStudioWorkspace(activityId, question, value);
  return workspace?.state ?? undefined;
}
