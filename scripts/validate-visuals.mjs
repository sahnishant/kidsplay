import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const errors = [];

const visualFiles = readdirSync(new URL('content/visuals/', root)).filter((name) => name.endsWith('.json')).sort();
const questionFiles = readdirSync(new URL('content/questions/', root)).filter((name) => name.endsWith('.json')).sort();
const visuals = visualFiles.flatMap((file) => {
  const value = readJson(`content/visuals/${file}`);
  if (!Array.isArray(value)) {
    errors.push(`content/visuals/${file}: expected a JSON array`);
    return [];
  }
  return value;
});

const allowedRenderers = new Set([
  'scene-icon', 'entity-icon', 'utility-icon', 'nature-space-icon',
  'everyday-icon', 'process-icon', 'animal-expansion-icon', 'concept-icon',
  'curriculum-icon', 'learning-icon'
]);
const allowedMotions = new Set([
  'idle', 'wag', 'swim', 'flap', 'hop', 'float', 'sway', 'pulse',
  'blink', 'chomp', 'breathe', 'flex', 'drift', 'spin', 'flicker', 'wiggle'
]);
const visualIds = new Set();
const aliasOwners = new Map();
const semanticOwners = new Map();

const normalizeAlias = (value) => String(value ?? '')
  .toLowerCase()
  .replace(/[’']/g, '')
  .replace(/[-_]+/g, ' ')
  .replace(/[.,!?;:()]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const registerSemanticOwner = (rawKey, visualId) => {
  const key = normalizeAlias(rawKey);
  if (!key) return;
  const existing = semanticOwners.get(key);
  if (existing && existing !== visualId) errors.push(`Semantic visual key "${rawKey}" is owned by both ${existing} and ${visualId}`);
  else semanticOwners.set(key, visualId);
};

for (const visual of visuals) {
  const prefix = visual?.id ?? '<unknown visual>';
  if (!visual?.id || typeof visual.id !== 'string') errors.push('Visual entity is missing a string id');
  if (visualIds.has(visual.id)) errors.push(`Duplicate visual id: ${visual.id}`);
  visualIds.add(visual.id);
  if (!allowedRenderers.has(visual.renderer)) errors.push(`${prefix}: unsupported renderer ${visual.renderer}`);
  if (!allowedMotions.has(visual.motion)) errors.push(`${prefix}: unsupported motion ${visual.motion}`);
  if (!visual.glyph || typeof visual.glyph !== 'string') errors.push(`${prefix}: glyph must be a non-empty string`);
  if (!visual.label || typeof visual.label !== 'string') errors.push(`${prefix}: label must be a non-empty string`);
  if (!Array.isArray(visual.aliases) || !visual.aliases.length) errors.push(`${prefix}: aliases must be a non-empty array`);

  const idParts = String(visual.id ?? '').split('.');
  registerSemanticOwner(idParts[idParts.length - 1], visual.id);

  for (const alias of visual.aliases ?? []) {
    const normalized = normalizeAlias(alias);
    if (!normalized) {
      errors.push(`${prefix}: aliases cannot be blank`);
      continue;
    }
    const existing = aliasOwners.get(normalized);
    if (existing && existing !== visual.id) errors.push(`Visual alias "${alias}" is owned by both ${existing} and ${visual.id}`);
    aliasOwners.set(normalized, visual.id);
    registerSemanticOwner(alias, visual.id);
  }
}

const presentableItems = (question) => {
  const interaction = question?.interaction;
  if (!interaction) return [];
  if (interaction.type === 'single_choice') return interaction.options ?? [];
  if (interaction.type === 'word_bank_fill') return interaction.wordBank ?? [];
  if (interaction.type === 'drag_to_target') return [...(interaction.items ?? []), ...(interaction.targets ?? [])];
  if (interaction.type === 'word_search') return interaction.terms ?? [];
  if (interaction.type === 'memory_pairs') return interaction.cards ?? [];
  if (interaction.type === 'sequence_order') return interaction.items ?? [];
  if (interaction.type === 'hotspot') return interaction.board?.regions ?? [];
  return [];
};

for (const file of questionFiles) {
  const questions = readJson(`content/questions/${file}`);
  if (!Array.isArray(questions)) continue;
  for (const question of questions) {
    for (const item of presentableItems(question)) {
      if (item.semanticRef !== undefined && (typeof item.semanticRef !== 'string' || !item.semanticRef.trim())) {
        errors.push(`${question.id}/${item.id}: semanticRef must be a non-empty string when provided`);
      }
      if (item.visualRefs === undefined) continue;
      if (!Array.isArray(item.visualRefs) || !item.visualRefs.length) {
        errors.push(`${question.id}/${item.id}: visualRefs must be a non-empty array when provided`);
        continue;
      }
      for (const visualRef of item.visualRefs) {
        if (typeof visualRef !== 'string') errors.push(`${question.id}/${item.id}: visualRef must be a string`);
        else if (!visualIds.has(visualRef)) errors.push(`${question.id}/${item.id}: unknown visualRef ${visualRef}`);
      }
    }
  }
}

if (errors.length) {
  console.error('Visual validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Visual validation passed (${visualIds.size} entities, ${aliasOwners.size} aliases, ${semanticOwners.size} semantic keys).`);
