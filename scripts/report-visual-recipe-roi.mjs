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
const recipeSemantics = new Set(recipes.map((recipe) => normalize(recipe.semanticRef)));

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

const isResolved = (item) => {
  if (Array.isArray(item?.visualRefs) && item.visualRefs.some((ref) => visualIds.has(ref))) return true;
  const semantic = normalize(item?.semanticRef);
  if (semantic && (semanticVisuals.has(semantic) || recipeSemantics.has(semantic))) return true;
  return aliases.has(normalize(item?.label));
};

const recommend = (entry) => {
  const key = normalize(entry.semanticRef || entry.label);
  if (/\b(length|mass|capacity|temperature|volume|weight)\b/.test(key)) return { template: 'measurement', costClass: 'low' };
  if (/\b(transparent|opaque|hot|cold|heavy|light|rough|smooth|hard|soft)\b/.test(key)) return { template: 'contrast.pair', costClass: 'low' };
  if (/\b(orbit|revolution|satellite)\b/.test(key)) return { template: 'orbit', costClass: 'low' };
  if (/\b(living|nonliving|source|group|type|class)\b/.test(key)) return { template: 'classification', costClass: 'low' };
  if (/\b(open|closed|full|empty|state)\b/.test(key)) return { template: 'state.before-after', costClass: 'low' };
  if (/\b(grow|melt|freeze|fill|cycle|sequence|stage)\b/.test(key)) return { template: 'process.sequence', costClass: 'medium' };
  if (/\b(part|root|stem|leaf|organ)\b/.test(key)) return { template: 'relation.source-target', costClass: 'medium' };
  if (/\b(reduce|reuse|recycle|shadow|reflect|absorb|flow|move)\b/.test(key)) return { template: 'relation.source-target', costClass: 'medium' };
  return { template: 'entity.single', costClass: 'medium' };
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
    if (isResolved(item) || skipReason(item)) continue;
    unresolvedInstances += 1;
    const label = String(item?.label ?? '').trim();
    const semanticRef = typeof item?.semanticRef === 'string' && item.semanticRef.trim() ? item.semanticRef.trim() : null;
    const key = semanticRef ? `semantic:${normalize(semanticRef)}` : `label:${normalize(label)}`;
    const existing = opportunities.get(key) ?? {
      key,
      semanticRef,
      label,
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
const ranked = [...opportunities.values()].map((entry) => {
  const recommendation = recommend(entry);
  const engineBreadth = Math.max(1, entry.engines.size);
  const profileBreadth = Math.max(1, entry.profiles.size);
  const roiScore = Math.round((entry.count * engineBreadth * profileBreadth / costWeight[recommendation.costClass]) * 10) / 10;
  return {
    key: entry.key,
    semanticRef: entry.semanticRef,
    label: entry.label,
    occurrenceCount: entry.count,
    engineBreadth,
    engines: [...entry.engines].sort(),
    profileBreadth,
    profiles: [...entry.profiles].sort(),
    suggestedTemplate: recommendation.template,
    costClass: recommendation.costClass,
    roiScore,
    exampleQuestionIds: [...entry.questionIds].slice(0, 5)
  };
}).sort((left, right) => right.roiScore - left.roiScore || right.occurrenceCount - left.occurrenceCount || left.key.localeCompare(right.key));

const result = {
  recipes: recipes.length,
  unresolvedInstances,
  uniqueOpportunities: ranked.length,
  queue: ranked.slice(0, limit)
};

if (jsonMode) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Semantic visual recipe ROI queue: ${recipes.length} authored recipe(s); ${unresolvedInstances} unresolved visual-friendly instance(s) across ${ranked.length} unique opportunity key(s).`);
  for (const entry of ranked.slice(0, limit)) {
    console.log(`- ${entry.semanticRef ?? entry.label}: score=${entry.roiScore}; ×${entry.occurrenceCount}; engines=${entry.engineBreadth}; profiles=${entry.profileBreadth}; template=${entry.suggestedTemplate}; cost=${entry.costClass}`);
  }
}
