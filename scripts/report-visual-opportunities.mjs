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
const limit = Math.max(1, Number(limitArg?.split('=')[1] ?? 30) || 30);

const visualFiles = readdirSync(new URL('content/visuals/', root))
  .filter((name) => name.endsWith('.json'))
  .sort();
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

// Learn which semantic ids are concrete/subject-side versus relationship/object-side
// from the canonical association data instead of guessing from English wording.
const knowledgeFiles = readdirSync(new URL('content/knowledge/', root))
  .filter((name) => name.endsWith('.json'))
  .sort();
const subjectSemanticRefs = new Set();
const objectSemanticRefs = new Set();
const vocabularySemanticRefs = new Set();

for (const file of knowledgeFiles) {
  const value = readJson(`content/knowledge/${file}`);
  const sources = Array.isArray(value) ? value : [value];
  for (const source of sources) {
    if (source?.kind !== 'association_set' || !Array.isArray(source.entries)) continue;
    const vocabularySource = file === 'english-vocabulary-foundation.json';
    for (const entry of source.entries) {
      const subjectId = typeof entry?.subject?.id === 'string' ? normalize(entry.subject.id) : '';
      const objectId = typeof entry?.object?.id === 'string' ? normalize(entry.object.id) : '';
      if (subjectId) subjectSemanticRefs.add(subjectId);
      if (objectId) objectSemanticRefs.add(objectId);
      if (vocabularySource) {
        if (subjectId) vocabularySemanticRefs.add(subjectId);
        if (objectId) vocabularySemanticRefs.add(objectId);
      }
    }
  }
}

const resolveLabel = (label) => {
  const direct = byAlias.get(normalize(label));
  if (direct) return [direct];
  const normalized = normalize(label);
  if (!normalized || normalized.length > 48) return [];
  const parts = String(label)
    .split(/\s*(?:\+|&|\band\b)\s*/i)
    .map(normalize)
    .filter(Boolean);
  if (parts.length < 2 || parts.length > 3) return [];
  const refs = parts.map((part) => byAlias.get(part));
  return refs.some((ref) => !ref) ? [] : [...new Set(refs)];
};

const isResolved = (item, allowLabelInference) => {
  if (Array.isArray(item.visualRefs) && item.visualRefs.some((ref) => visualIds.has(ref))) return true;
  if (item.semanticRef && bySemantic.has(normalize(item.semanticRef))) return true;
  return allowLabelInference && resolveLabel(item.label).length > 0;
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
    default: return [];
  }
};

const skipReason = (label, semanticRef) => {
  const raw = String(label ?? '').trim();
  const normalized = normalize(raw);
  if (!normalized) return 'blank';
  if (normalized.length > 48) return 'long_or_predicate';
  if (/^[+-]?\d+(?:[.:/-]\d+)*(?:\s*(?:cm|m|km|g|kg|ml|l|°c|%))?$/i.test(raw)) return 'numeric_or_measurement';
  if (/^[a-z]\s*(?:,|→|->|-)\s*[a-z](?:\s*(?:,|→|->|-)\s*[a-z])*$/i.test(raw)) return 'coded_sequence';
  if (/^[A-Z0-9]{1,3}$/.test(raw) && !semanticRef) return 'short_code';
  if (/^[●○■□▲△★☆◆◇](?:\s*[●○■□▲△★☆◆◇])*$/u.test(raw)) return 'reasoning_symbol_stimulus';
  if (/^(?:both|neither|only)\b.*\b(?:i|ii)\b/i.test(raw)) return 'logical_answer_phrase';
  return null;
};

const semanticCategory = (semanticRef) => {
  if (!semanticRef) return 'label';
  const key = normalize(semanticRef);
  if (vocabularySemanticRefs.has(key)) return 'vocabulary';
  if (objectSemanticRefs.has(key) && !subjectSemanticRefs.has(key)) return 'relationship_or_predicate';
  return 'concrete_or_authored';
};

const questionFiles = readdirSync(new URL('content/questions/', root))
  .filter((name) => name.endsWith('.json'))
  .sort();
const questions = questionFiles.flatMap((file) => {
  const value = readJson(`content/questions/${file}`);
  return Array.isArray(value) ? value : [];
});

const opportunities = new Map();
const skipped = new Map();
let unresolvedInstances = 0;

for (const question of questions) {
  const engine = question?.interaction?.type;
  for (const { item, allowLabelInference } of visibleItems(question)) {
    if (isResolved(item, allowLabelInference)) continue;
    unresolvedInstances += 1;

    const label = String(item?.label ?? '').trim();
    const semanticRef = typeof item?.semanticRef === 'string' && item.semanticRef.trim()
      ? item.semanticRef.trim()
      : null;
    const reason = skipReason(label, semanticRef);
    const category = semanticCategory(semanticRef);
    const key = semanticRef ? `semantic:${normalize(semanticRef)}` : `label:${normalize(label)}`;
    const target = reason ? skipped : opportunities;
    const existing = target.get(key) ?? {
      key,
      label,
      semanticRef,
      category,
      reason,
      count: 0,
      engines: new Set(),
      questionIds: new Set()
    };
    existing.count += 1;
    if (engine) existing.engines.add(engine);
    if (question.id) existing.questionIds.add(question.id);
    target.set(key, existing);
  }
}

const serialize = (entry) => ({
  key: entry.key,
  label: entry.label,
  semanticRef: entry.semanticRef,
  category: entry.category,
  count: entry.count,
  engines: [...entry.engines].sort(),
  exampleQuestionIds: [...entry.questionIds].slice(0, 5),
  ...(entry.reason ? { reason: entry.reason } : {})
});

const sortEntries = (entries) => entries.sort((left, right) => {
  if (right.count !== left.count) return right.count - left.count;
  return (left.semanticRef ?? left.label).localeCompare(right.semanticRef ?? right.label);
});

const ranked = sortEntries([...opportunities.values()]).map(serialize);
const notRecommended = sortEntries([...skipped.values()]).map(serialize);
const concreteCandidates = ranked.filter((entry) => entry.category === 'concrete_or_authored');
const vocabularyReview = ranked.filter((entry) => entry.category === 'vocabulary');
const predicateReview = ranked.filter((entry) => entry.category === 'relationship_or_predicate');
const labelCandidates = ranked.filter((entry) => entry.category === 'label');

const result = {
  summary: {
    unresolvedInstances,
    concreteCandidates: concreteCandidates.length,
    vocabularyReview: vocabularyReview.length,
    predicateReview: predicateReview.length,
    labelCandidates: labelCandidates.length,
    deliberatelySkippedIdentities: notRecommended.length
  },
  concreteCandidates: concreteCandidates.slice(0, limit),
  vocabularyReview: vocabularyReview.slice(0, limit),
  predicateReview: predicateReview.slice(0, limit),
  labelCandidates: labelCandidates.slice(0, limit),
  notRecommended: notRecommended.slice(0, limit)
};

if (jsonMode) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

console.log(`Visual opportunity queue: ${unresolvedInstances} unresolved visual-friendly item instance(s).`);
console.log(`${concreteCandidates.length} concrete/authored semantic candidate(s); ${vocabularyReview.length} vocabulary concept(s); ${predicateReview.length} relation/predicate concept(s); ${labelCandidates.length} label-only candidate(s); ${notRecommended.length} deliberately skipped.`);

console.log('\nConcrete/authored semantic candidates (highest-value review):');
if (!concreteCandidates.length) console.log('- none');
for (const entry of concreteCandidates.slice(0, limit)) {
  console.log(`- ${entry.semanticRef}: ${entry.label} ×${entry.count} [${entry.engines.join(', ')}]`);
}

console.log('\nVocabulary semantics (illustrate only when the picture is unambiguous):');
if (!vocabularyReview.length) console.log('- none');
for (const entry of vocabularyReview.slice(0, Math.min(limit, 8))) {
  console.log(`- ${entry.semanticRef}: ${entry.label} ×${entry.count}`);
}

console.log('\nRelationship/predicate semantics (usually keep textual):');
if (!predicateReview.length) console.log('- none');
for (const entry of predicateReview.slice(0, Math.min(limit, 8))) {
  console.log(`- ${entry.semanticRef}: ${entry.label} ×${entry.count}`);
}

console.log('\nRepeated exact-label candidates (author review required):');
if (!labelCandidates.length) console.log('- none');
for (const entry of labelCandidates.slice(0, Math.min(limit, 8))) {
  console.log(`- ${entry.label} ×${entry.count} [${entry.engines.join(', ')}]`);
}

console.log('\nNot recommended for automatic visual expansion:');
if (!notRecommended.length) console.log('- none');
for (const entry of notRecommended.slice(0, Math.min(limit, 8))) {
  console.log(`- ${entry.label} ×${entry.count}: ${entry.reason}`);
}
