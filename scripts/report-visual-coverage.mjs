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

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const failUnderArg = args.find((arg) => arg.startsWith('--fail-under='));
const unresolvedLimit = Math.max(1, Number(limitArg?.split('=')[1] ?? 20) || 20);
const failUnder = failUnderArg === undefined ? null : Number(failUnderArg.split('=')[1]);

if (failUnder !== null && (!Number.isFinite(failUnder) || failUnder < 0 || failUnder > 100)) {
  console.error('--fail-under must be a percentage between 0 and 100.');
  process.exit(2);
}

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

const skipReasonForVisualExpansion = (item) => {
  const raw = String(item?.label ?? '').trim();
  const normalized = normalize(raw);
  const semanticRef = typeof item?.semanticRef === 'string' && item.semanticRef.trim() ? item.semanticRef.trim() : null;
  if (!normalized) return 'blank';
  if (normalized.length > 48) return 'long_or_predicate';
  if (/^[+-]?\d+(?:[.:/-]\d+)*(?:\s*(?:cm|m|km|g|kg|ml|l|°c|%))?$/i.test(raw)) return 'numeric_or_measurement';
  if (/^[a-z]\s*(?:,|→|->|-)\s*[a-z](?:\s*(?:,|→|->|-)\s*[a-z])*$/i.test(raw)) return 'coded_sequence';
  if (/^[A-Z0-9]{1,3}$/.test(raw) && !semanticRef) return 'short_code';
  if (/^[●○■□▲△★☆◆◇](?:\s*[●○■□▲△★☆◆◇])*$/u.test(raw)) return 'reasoning_symbol_stimulus';
  if (/^(?:both|neither|only)\b.*\b(?:i|ii)\b/i.test(raw)) return 'logical_answer_phrase';
  return null;
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
let visualIneligible = 0;

for (const question of questions) {
  const entries = visibleItems(question);
  if (!entries.length) continue;
  const engine = question.interaction.type;
  const engineTotals = byEngine.get(engine) ?? emptyTotals();
  const engineUnresolved = unresolvedByEngine.get(engine) ?? [];
  for (const { item, allowLabelInference } of entries) {
    const resolution = resolveItem(item, allowLabelInference);
    const skipReason = skipReasonForVisualExpansion(item);
    totals[resolution] += 1;
    engineTotals[resolution] += 1;
    if (engine !== 'drag_to_target' && !skipReason) visualFriendlyTotals[resolution] += 1;
    else if (engine !== 'drag_to_target' && skipReason) visualIneligible += 1;
    if (resolution === 'text' && !skipReason) {
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
const engineReport = Object.fromEntries(
  [...byEngine.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([engine, values]) => [
    engine,
    { ...summarize(values), ...values, policy: engine === 'drag_to_target' ? 'explicit_visual_only' : 'visual_friendly' }
  ])
);
const unresolvedReport = Object.fromEntries(
  [...unresolvedByEngine.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([engine, entries]) => [
    engine,
    entries.slice(0, unresolvedLimit)
  ])
);

if (jsonMode) {
  console.log(JSON.stringify({
    library: { entities: visuals.length, packs: visualFiles.length },
    visualFriendly: { ...friendly, ...visualFriendlyTotals, excludedAsIneligible: visualIneligible },
    overall: { ...overall, ...totals },
    byEngine: engineReport,
    unresolved: unresolvedReport
  }, null, 2));
} else {
  console.log(`Semantic visual library: ${visuals.length} registered entities across ${visualFiles.length} pack(s).`);
  console.log(`Visual-friendly question items (excluding match/drag policy and clearly non-visual stimuli): ${friendly.visual}/${friendly.total} (${friendly.percent}%) resolve to SVG visuals.`);
  console.log(`Excluded ${visualIneligible} clearly non-visual item instance(s) from the visual-friendly denominator.`);
  console.log(`All supported card/region items including matching: ${overall.visual}/${overall.total} (${overall.percent}%).`);
  console.log(`Resolution on visual-friendly surfaces: authored ${visualFriendlyTotals.authored}, semantic ${visualFriendlyTotals.semantic}, exact-label ${visualFriendlyTotals.label}, text-only ${visualFriendlyTotals.text}.`);

  for (const [engine, values] of Object.entries(engineReport)) {
    const policy = engine === 'drag_to_target' ? ' (matching is explicit-visual only)' : '';
    console.log(`- ${engine}: ${values.visual}/${values.total} (${values.percent}%) visual; ${values.text} text-only${policy}.`);
  }

  for (const [engine, entries] of Object.entries(unresolvedReport)) {
    if (!entries.length || engine === 'drag_to_target') continue;
    console.log(`Top unresolved ${engine} items:`);
    for (const entry of entries) {
      console.log(`- ${entry.questionId}/${entry.itemId}: ${entry.label}${entry.semanticRef ? ` [${entry.semanticRef}]` : ''}`);
    }
  }
}

if (failUnder !== null && friendly.percent < failUnder) {
  console.error(`Visual-friendly coverage ${friendly.percent}% is below required ${failUnder}%.`);
  process.exit(1);
}
