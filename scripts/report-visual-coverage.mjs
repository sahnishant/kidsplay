import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const normalize = (value) => String(value ?? '')
  .toLowerCase()
  .replace(/[’']/g, '')
  .replace(/[-_]+/g, ' ')
  .replace(/[.,!?;:()]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const visualFiles = readdirSync(new URL('content/visuals/', root)).filter((name) => name.endsWith('.json')).sort();
const visuals = visualFiles.flatMap((file) => readJson(`content/visuals/${file}`));
const visualIds = new Set(visuals.map((visual) => visual.id));
const byAlias = new Map();
const bySemantic = new Map();

for (const visual of visuals) {
  for (const alias of visual.aliases ?? []) {
    const key = normalize(alias);
    if (!byAlias.has(key)) byAlias.set(key, visual.id);
    if (!bySemantic.has(key)) bySemantic.set(key, visual.id);
  }
  const parts = String(visual.id).split('.');
  const key = normalize(parts[parts.length - 1]);
  if (key && !bySemantic.has(key)) bySemantic.set(key, visual.id);
}

const resolveLabel = (label) => {
  const direct = byAlias.get(normalize(label));
  if (direct) return [direct];
  const normalized = normalize(label);
  if (!normalized || normalized.length > 48) return [];
  const parts = String(label).split(/\s*(?:\+|&|\band\b)\s*/i).map(normalize).filter(Boolean);
  if (parts.length < 2 || parts.length > 3) return [];
  const refs = parts.map((part) => byAlias.get(part));
  return refs.some((ref) => !ref) ? [] : [...new Set(refs)];
};

const resolveItem = (item, allowLabelInference) => {
  if (Array.isArray(item.visualRefs) && item.visualRefs.some((ref) => visualIds.has(ref))) return 'authored';
  const semantic = item.semanticRef ? bySemantic.get(normalize(item.semanticRef)) : null;
  if (semantic) return 'semantic';
  if (allowLabelInference && resolveLabel(item.label).length) return 'label';
  return 'text';
};

const visibleItems = (question) => {
  const interaction = question?.interaction;
  if (!interaction) return [];
  switch (interaction.type) {
    case 'single_choice': return (interaction.options ?? []).map((item) => ({ item, allowLabelInference: true }));
    case 'word_bank_fill': return (interaction.wordBank ?? []).map((item) => ({ item, allowLabelInference: true }));
    case 'memory_pairs': return (interaction.cards ?? []).map((item) => ({ item, allowLabelInference: true }));
    case 'sequence_order': return (interaction.items ?? []).map((item) => ({ item, allowLabelInference: true }));
    case 'hotspot': return (interaction.board?.regions ?? []).map((item) => ({ item, allowLabelInference: true }));
    case 'drag_to_target': return [
      ...(interaction.items ?? []).map((item) => ({ item, allowLabelInference: false })),
      ...(interaction.targets ?? []).map((item) => ({ item, allowLabelInference: false }))
    ];
    default: return [];
  }
};

const questionFiles = readdirSync(new URL('content/questions/', root)).filter((name) => name.endsWith('.json')).sort();
const questions = questionFiles.flatMap((file) => {
  const value = readJson(`content/questions/${file}`);
  return Array.isArray(value) ? value : [];
});

const emptyTotals = () => ({ authored: 0, semantic: 0, label: 0, text: 0 });
const totals = emptyTotals();
const visualFriendlyTotals = emptyTotals();
const byEngine = new Map();
const unresolvedByEngine = new Map();

for (const question of questions) {
  const entries = visibleItems(question);
  if (!entries.length) continue;
  const engine = question.interaction.type;
  const engineTotals = byEngine.get(engine) ?? emptyTotals();
  const engineUnresolved = unresolvedByEngine.get(engine) ?? [];
  for (const { item, allowLabelInference } of entries) {
    const resolution = resolveItem(item, allowLabelInference);
    totals[resolution] += 1;
    engineTotals[resolution] += 1;
    if (engine !== 'drag_to_target') visualFriendlyTotals[resolution] += 1;
    if (resolution === 'text') {
      engineUnresolved.push({ questionId: question.id, itemId: item.id, label: item.label, semanticRef: item.semanticRef ?? null });
    }
  }
  byEngine.set(engine, engineTotals);
  unresolvedByEngine.set(engine, engineUnresolved);
}

const summarize = (values) => {
  const total = Object.values(values).reduce((sum, value) => sum + value, 0);
  const visual = total - values.text;
  const percent = total ? Math.round((visual / total) * 1000) / 10 : 0;
  return { total, visual, percent };
};

const overall = summarize(totals);
const friendly = summarize(visualFriendlyTotals);

console.log(`Semantic visual library: ${visuals.length} registered entities across ${visualFiles.length} pack(s).`);
console.log(`Visual-friendly question items (excluding match/drag policy): ${friendly.visual}/${friendly.total} (${friendly.percent}%) resolve to SVG visuals.`);
console.log(`All supported card/region items including matching: ${overall.visual}/${overall.total} (${overall.percent}%).`);
console.log(`Resolution on visual-friendly surfaces: authored ${visualFriendlyTotals.authored}, semantic ${visualFriendlyTotals.semantic}, exact-label ${visualFriendlyTotals.label}, text-only ${visualFriendlyTotals.text}.`);

for (const [engine, values] of [...byEngine.entries()].sort(([left], [right]) => left.localeCompare(right))) {
  const summary = summarize(values);
  const policy = engine === 'drag_to_target' ? ' (matching is explicit-visual only)' : '';
  console.log(`- ${engine}: ${summary.visual}/${summary.total} (${summary.percent}%) visual; ${values.text} text-only${policy}.`);
}

for (const [engine, entries] of [...unresolvedByEngine.entries()].sort(([left], [right]) => left.localeCompare(right))) {
  if (!entries.length || engine === 'drag_to_target') continue;
  console.log(`Top unresolved ${engine} items:`);
  for (const entry of entries.slice(0, 10)) {
    console.log(`- ${entry.questionId}/${entry.itemId}: ${entry.label}${entry.semanticRef ? ` [${entry.semanticRef}]` : ''}`);
  }
}
