import { existsSync, readFileSync, readdirSync } from 'node:fs';
import {
  buildVisualSemanticRoleSets,
  classifyVisualSemantic,
  normalizeVisualSemantic as normalize
} from './visual-opportunity-semantics.mjs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const failOnUnreviewedConcrete = args.includes('--fail-on-unreviewed-concrete');
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const profileArg = args.find((arg) => arg.startsWith('--profile='));
const limit = Math.max(1, Number(limitArg?.split('=')[1] ?? 30) || 30);
const profileRef = profileArg?.split('=')[1]?.trim() || null;

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

const recipeFiles = readdirSync(new URL('content/visual-recipes/', root))
  .filter((name) => name.endsWith('.json'))
  .sort();
const recipes = recipeFiles.flatMap((file) => readJson(`content/visual-recipes/${file}`));
const recipeBySemantic = new Map();
for (const recipe of recipes) {
  for (const key of [recipe.semanticRef, ...(recipe.aliases ?? [])].map(normalize).filter(Boolean)) {
    if (!recipeBySemantic.has(key)) recipeBySemantic.set(key, recipe);
  }
}

const recipeSurfaceForEngine = (engine) => {
  switch (engine) {
    case 'word_bank_fill': return 'word-bank';
    case 'memory_pairs': return 'memory-card';
    case 'sequence_order': return 'sequence-item';
    default: return 'option';
  }
};

const recipeResolves = (semanticRef, engine) => {
  if (!semanticRef) return false;
  const recipe = recipeBySemantic.get(normalize(semanticRef));
  if (!recipe) return false;
  const exposure = recipe.surfaces?.[recipeSurfaceForEngine(engine)] ?? 'hidden';
  if (exposure === 'hidden') return false;
  if (exposure === 'identity_only') return recipe.slots?.some((slot) => slot.exposure === 'identity');
  return Array.isArray(recipe.slots) && recipe.slots.length > 0;
};

// Learn which semantic ids are concrete/subject-side versus relationship/object-side
// from the canonical association data instead of guessing from English wording.
const knowledgeFiles = readdirSync(new URL('content/knowledge/', root))
  .filter((name) => name.endsWith('.json'))
  .sort();
const knowledgeDocuments = knowledgeFiles.map((file) => ({ file, value: readJson(`content/knowledge/${file}`) }));
const semanticRoleSets = buildVisualSemanticRoleSets(knowledgeDocuments);

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

const isResolved = (item, allowLabelInference, engine) => {
  if (Array.isArray(item.visualRefs) && item.visualRefs.some((ref) => visualIds.has(ref))) return true;
  if (item.semanticRef && bySemantic.has(normalize(item.semanticRef))) return true;
  if (recipeResolves(item.semanticRef, engine)) return true;
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
  const category = classifyVisualSemantic(semanticRef, semanticRoleSets);
  if (category === 'label_only') return 'label';
  if (category === 'vocabulary_review') return 'vocabulary';
  if (category === 'predicate_review') return 'relationship_or_predicate';
  return 'concrete_or_authored';
};

const questionFiles = readdirSync(new URL('content/questions/', root))
  .filter((name) => name.endsWith('.json'))
  .sort();
const allQuestions = questionFiles.flatMap((file) => {
  const value = readJson(`content/questions/${file}`);
  return Array.isArray(value) ? value : [];
});

let questions = allQuestions;
const reviewDecisionBySemantic = new Map();
if (profileRef) {
  let membership;
  try {
    membership = readJson(`content/profile-memberships/${profileRef}.json`);
  } catch {
    console.error(`Unknown profileRef for visual opportunity report: ${profileRef}`);
    process.exit(2);
  }
  const profileRows = new Set((membership.members ?? []).map((member) => member.rowId));
  questions = allQuestions.filter((question) => {
    const refs = question.knowledgeRefs ?? [];
    return refs.length > 0 && refs.every((rowId) => profileRows.has(rowId));
  });

  const reviewPath = `content/visual-reviews/${profileRef}.json`;
  if (existsSync(new URL(reviewPath, root))) {
    const review = readJson(reviewPath);
    if (review?.profileRef !== profileRef || !Array.isArray(review?.decisions)) {
      console.error(`${reviewPath}: invalid profileRef or decisions array`);
      process.exit(2);
    }
    for (const decision of review.decisions) {
      const semanticRef = typeof decision?.semanticRef === 'string' ? normalize(decision.semanticRef) : '';
      if (!semanticRef || decision?.status !== 'keep_text' || typeof decision?.reason !== 'string' || !decision.reason.trim()) {
        console.error(`${reviewPath}: every decision requires semanticRef, status=keep_text and a non-empty reason`);
        process.exit(2);
      }
      if (reviewDecisionBySemantic.has(semanticRef)) {
        console.error(`${reviewPath}: duplicate decision for ${decision.semanticRef}`);
        process.exit(2);
      }
      reviewDecisionBySemantic.set(semanticRef, decision);
    }
  }
}

const opportunities = new Map();
const skipped = new Map();
let unresolvedInstances = 0;

for (const question of questions) {
  const engine = question?.interaction?.type;
  for (const { item, allowLabelInference } of visibleItems(question)) {
    if (isResolved(item, allowLabelInference, engine)) continue;
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
const allConcreteCandidates = ranked.filter((entry) => entry.category === 'concrete_or_authored');
const reviewedDeferredConcrete = allConcreteCandidates
  .filter((entry) => entry.semanticRef && reviewDecisionBySemantic.has(normalize(entry.semanticRef)))
  .map((entry) => ({
    ...entry,
    review: reviewDecisionBySemantic.get(normalize(entry.semanticRef))
  }));
const concreteCandidates = allConcreteCandidates.filter(
  (entry) => !entry.semanticRef || !reviewDecisionBySemantic.has(normalize(entry.semanticRef))
);
const vocabularyReview = ranked.filter((entry) => entry.category === 'vocabulary');
const predicateReview = ranked.filter((entry) => entry.category === 'relationship_or_predicate');
const labelCandidates = ranked.filter((entry) => entry.category === 'label');

const result = {
  scope: profileRef ? { type: 'profile', profileRef, questions: questions.length } : { type: 'all_questions', questions: questions.length },
  recipes: { count: recipes.length, packs: recipeFiles.length },
  summary: {
    unresolvedInstances,
    concreteCandidates: concreteCandidates.length,
    reviewedDeferredConcrete: reviewedDeferredConcrete.length,
    vocabularyReview: vocabularyReview.length,
    predicateReview: predicateReview.length,
    labelCandidates: labelCandidates.length,
    deliberatelySkippedIdentities: notRecommended.length
  },
  concreteCandidates: concreteCandidates.slice(0, limit),
  reviewedDeferredConcrete: reviewedDeferredConcrete.slice(0, limit),
  vocabularyReview: vocabularyReview.slice(0, limit),
  predicateReview: predicateReview.slice(0, limit),
  labelCandidates: labelCandidates.slice(0, limit),
  notRecommended: notRecommended.slice(0, limit)
};

const shouldFail = failOnUnreviewedConcrete && concreteCandidates.length > 0;

if (jsonMode) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(shouldFail ? 1 : 0);
}

console.log(profileRef
  ? `Visual opportunity queue for ${profileRef}: ${questions.length} runnable profile-safe question(s).`
  : `Visual opportunity queue across all ${questions.length} question(s).`);
console.log(`${recipes.length} semantic recipe(s) are removed from this queue when their surface policy resolves the item.`);
console.log(`${unresolvedInstances} unresolved visual-friendly item instance(s).`);
console.log(`${concreteCandidates.length} unreviewed concrete/authored semantic candidate(s); ${reviewedDeferredConcrete.length} reviewed text-only concrete concept(s); ${vocabularyReview.length} vocabulary concept(s); ${predicateReview.length} relation/predicate concept(s); ${labelCandidates.length} label-only candidate(s); ${notRecommended.length} deliberately skipped.`);

console.log('\nConcrete/authored semantic candidates requiring review:');
if (!concreteCandidates.length) console.log('- none');
for (const entry of concreteCandidates.slice(0, limit)) {
  console.log(`- ${entry.semanticRef}: ${entry.label} ×${entry.count} [${entry.engines.join(', ')}]`);
}

console.log('\nReviewed concrete concepts intentionally kept textual:');
if (!reviewedDeferredConcrete.length) console.log('- none');
for (const entry of reviewedDeferredConcrete.slice(0, limit)) {
  console.log(`- ${entry.semanticRef}: ${entry.review.reason}`);
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

if (shouldFail) {
  console.error(`Visual opportunity gate failed: ${concreteCandidates.length} concrete ${profileRef ?? 'all-question'} semantic candidate(s) still need a visual or reviewed keep_text decision.`);
  process.exit(1);
}
