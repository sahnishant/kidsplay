import { readFileSync, readdirSync } from 'node:fs';
import {
  buildVisualSemanticRoleSets,
  classifyVisualSemantic,
  normalizeVisualSemantic as normalize,
  recommendVisualRecipeTemplate
} from './visual-opportunity-semantics.mjs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const limit = Math.max(1, Number(limitArg?.split('=')[1] ?? 30) || 30);

const visualFiles = readdirSync(new URL('content/visuals/', root)).filter((name) => name.endsWith('.json')).sort();
const visuals = visualFiles.flatMap((file) => readJson(`content/visuals/${file}`));
const visualIds = new Set(visuals.map((visual) => visual.id));
const semanticVisuals = new Set();
const aliases = new Set();
for (const visual of visuals) {
  for (const alias of visual.aliases ?? []) {
    aliases.add(normalize(alias));
    semanticVisuals.add(normalize(alias));
  }
  const tail = String(visual.id).split('.').at(-1);
  if (tail) semanticVisuals.add(normalize(tail));
}

const recipeFiles = readdirSync(new URL('content/visual-recipes/', root)).filter((name) => name.endsWith('.json')).sort();
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

const knowledgeFiles = readdirSync(new URL('content/knowledge/', root)).filter((name) => name.endsWith('.json')).sort();
const knowledgeDocuments = knowledgeFiles.map((file) => ({ file, value: readJson(`content/knowledge/${file}`) }));
const semanticRoleSets = buildVisualSemanticRoleSets(knowledgeDocuments);

const profileFiles = readdirSync(new URL('content/profile-memberships/', root)).filter((name) => name.endsWith('.json')).sort();
const profileRows = new Map();
for (const file of profileFiles) {
  const membership = readJson(`content/profile-memberships/${file}`);
  const profileRef = membership.profileRef ?? file.replace(/\.json$/, '');
  profileRows.set(profileRef, new Set((membership.members ?? []).map((member) => member.rowId)));
}

const visibleItems = (question) => {
  const interaction = question?.interaction;
  if (!interaction) return [];
  switch (interaction.type) {
    case 'single_choice': return interaction.options ?? [];
    case 'word_bank_fill': return interaction.wordBank ?? [];
    case 'memory_pairs': return interaction.cards ?? [];
    case 'sequence_order': return interaction.items ?? [];
    case 'hotspot': return interaction.board?.regions ?? [];
    default: return [];
  }
};

const skipReason = (item) => {
  const raw = String(item?.label ?? '').trim();
  const normalized = normalize(raw);
  const semanticRef = typeof item?.semanticRef === 'string' && item.semanticRef.trim() ? item.semanticRef.trim() : null;
  if (!normalized) return 'blank';
  if (normalized.length > 48) return 'long_or_predicate';
  if (/^[+-]?\d+(?:[.:/-]\d+)*(?:\s*(?:cm|m|km|g|kg|ml|l|°c|%))?$/i.test(raw)) return 'numeric_or_measurement';
  if (/^[A-Z0-9]{1,3}$/.test(raw) && !semanticRef) return 'short_code';
  if (/^[●○■□▲△★☆◆◇](?:\s*[●○■□▲△★☆◆◇])*$/u.test(raw)) return 'reasoning_symbol_stimulus';
  if (/^(?:both|neither|only)\b.*\b(?:i|ii)\b/i.test(raw)) return 'logical_answer_phrase';
  return null;
};

const isResolved = (item, engine) => {
  if (Array.isArray(item?.visualRefs) && item.visualRefs.some((ref) => visualIds.has(ref))) return true;
  const semantic = normalize(item?.semanticRef);
  if (semantic && semanticVisuals.has(semantic)) return true;
  if (recipeResolves(item?.semanticRef, engine)) return true;
  return aliases.has(normalize(item?.label));
};

const questionFiles = readdirSync(new URL('content/questions/', root)).filter((name) => name.endsWith('.json')).sort();
const questions = questionFiles.flatMap((file) => {
  const value = readJson(`content/questions/${file}`);
  return Array.isArray(value) ? value : [];
});

const opportunities = new Map();
let unresolvedInstances = 0;
for (const question of questions) {
  const engine = question?.interaction?.type;
  if (!engine || engine === 'drag_to_target') continue;
  const questionProfiles = [];
  const knowledgeRefs = question.knowledgeRefs ?? [];
  if (knowledgeRefs.length) {
    for (const [profileRef, rows] of profileRows) {
      if (knowledgeRefs.every((rowId) => rows.has(rowId))) questionProfiles.push(profileRef);
    }
  }

  for (const item of visibleItems(question)) {
    if (isResolved(item, engine) || skipReason(item)) continue;
    unresolvedInstances += 1;
    const label = String(item?.label ?? '').trim();
    const semanticRef = typeof item?.semanticRef === 'string' && item.semanticRef.trim() ? item.semanticRef.trim() : null;
    const key = semanticRef ? `semantic:${normalize(semanticRef)}` : `label:${normalize(label)}`;
    const existing = opportunities.get(key) ?? {
      key,
      semanticRef,
      label,
      category: classifyVisualSemantic(semanticRef, semanticRoleSets),
      count: 0,
      engines: new Set(),
      profiles: new Set(),
      questionIds: new Set()
    };
    existing.count += 1;
    existing.engines.add(engine);
    for (const profileRef of questionProfiles) existing.profiles.add(profileRef);
    existing.questionIds.add(question.id);
    opportunities.set(key, existing);
  }
}

const costWeight = { low: 1, medium: 2, high: 4 };
const scored = [...opportunities.values()].map((entry) => {
  const recommendation = recommendVisualRecipeTemplate(entry);
  const engineBreadth = Math.max(1, entry.engines.size);
  const profileBreadth = Math.max(1, entry.profiles.size);
  const roiScore = Math.round((entry.count * engineBreadth * profileBreadth / costWeight[recommendation.costClass]) * 10) / 10;
  return {
    key: entry.key,
    semanticRef: entry.semanticRef,
    label: entry.label,
    category: entry.category,
    occurrenceCount: entry.count,
    engineBreadth,
    engines: [...entry.engines].sort(),
    profileBreadth,
    profiles: [...entry.profiles].sort(),
    suggestedTemplate: recommendation.template,
    costClass: recommendation.costClass,
    automaticEligible: recommendation.automaticEligible,
    roiScore,
    exampleQuestionIds: [...entry.questionIds].slice(0, 5)
  };
}).sort((left, right) => right.roiScore - left.roiScore || right.occurrenceCount - left.occurrenceCount || left.key.localeCompare(right.key));

const productionQueue = scored.filter((entry) => entry.automaticEligible);
const reviewQueue = scored.filter((entry) => !entry.automaticEligible);
const result = {
  recipes: recipes.length,
  unresolvedInstances,
  uniqueOpportunities: scored.length,
  productionCandidates: productionQueue.length,
  reviewCandidates: reviewQueue.length,
  queue: productionQueue.slice(0, limit),
  reviewQueue: reviewQueue.slice(0, limit)
};

if (jsonMode) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Semantic visual recipe ROI queue: ${recipes.length} authored recipe(s); ${unresolvedInstances} unresolved visual-friendly instance(s) across ${scored.length} unique opportunity key(s).`);
  console.log(`${productionQueue.length} production candidate(s); ${reviewQueue.length} semantic-review candidate(s) kept out of automatic production.`);
  console.log('\nProduction queue:');
  for (const entry of productionQueue.slice(0, limit)) {
    console.log(`- ${entry.semanticRef ?? entry.label}: score=${entry.roiScore}; ×${entry.occurrenceCount}; engines=${entry.engineBreadth}; profiles=${entry.profileBreadth}; template=${entry.suggestedTemplate}; cost=${entry.costClass}; category=${entry.category}`);
  }
  console.log('\nHuman semantic-review queue:');
  for (const entry of reviewQueue.slice(0, Math.min(limit, 10))) {
    console.log(`- ${entry.semanticRef ?? entry.label}: score=${entry.roiScore}; ×${entry.occurrenceCount}; category=${entry.category}; automatic=no`);
  }
}
