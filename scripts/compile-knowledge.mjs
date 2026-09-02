import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { formatDataForEngine } from './formatters/registry.mjs';

const root = new URL('../', import.meta.url);
const knowledgeDirectory = new URL('content/knowledge/', root);
const recipeDirectory = new URL('content/recipes/', root);
const questionOutput = new URL('content/questions/__generated-from-knowledge.json', root);
const crosswordOutput = new URL('content/authoring/crosswords/__generated-from-knowledge.json', root);

// Reviewed vocabulary knowledge is generated only from checked-in human-editor review
// handoffs. Run the guarded importer before reading knowledge sources so every normal
// content build (Windows, browser and Android included) materializes the exact same
// accepted review batches without a second runtime or a hand-maintained question bank.
for (const script of [
  'scripts/lexicon/import-primary-vocabulary-reviews.mjs',
  'scripts/lexicon/materialize-primary-vocabulary-review-delivery.mjs'
]) {
  execFileSync(process.execPath, [fileURLToPath(new URL(script, root))], {
    cwd: fileURLToPath(root),
    stdio: 'inherit'
  });
}

const readJson = (url) => JSON.parse(readFileSync(url, 'utf8'));

const readObjects = (directory) => readdirSync(directory)
  .filter((name) => name.endsWith('.json'))
  .sort()
  .flatMap((name) => {
    const value = readJson(new URL(name, directory));
    return Array.isArray(value) ? value : [value];
  });

const sources = readObjects(knowledgeDirectory);
const recipes = readObjects(recipeDirectory);
const sourceById = new Map();
for (const source of sources) {
  if (!source?.id) throw new Error('Knowledge source is missing id');
  if (sourceById.has(source.id)) throw new Error(`Duplicate knowledge source id ${source.id}`);
  sourceById.set(source.id, source);
}

function expandRecipe(recipe, source) {
  if (!recipe.forEachEntry) return [recipe];
  if (recipe.entryIds?.length || recipe.rowIds?.length) {
    throw new Error(`${recipe.id}: forEachEntry cannot be combined with entryIds or rowIds`);
  }
  if (source.kind !== 'association_set' || !Array.isArray(source.entries) || source.entries.length === 0) {
    throw new Error(`${recipe.id}: forEachEntry requires a non-empty association_set source`);
  }

  const excluded = new Set((recipe.excludeEntryIds ?? []).map(String));
  const included = recipe.includeEntryIds?.length
    ? new Set(recipe.includeEntryIds.map(String))
    : null;
  const knownEntryIds = new Set(source.entries.map((entry) => String(entry.id)));
  for (const id of excluded) if (!knownEntryIds.has(id)) throw new Error(`${recipe.id}: unknown excludeEntryId ${id}`);
  for (const id of included ?? []) if (!knownEntryIds.has(id)) throw new Error(`${recipe.id}: unknown includeEntryId ${id}`);

  const selectedEntries = source.entries.filter((entry) => {
    const id = String(entry.id);
    return !excluded.has(id) && (!included || included.has(id));
  });
  if (!selectedEntries.length) throw new Error(`${recipe.id}: forEachEntry selected no entries`);

  return selectedEntries.map((entry) => {
    const { forEachEntry, excludeEntryIds, includeEntryIds, ...base } = recipe;
    return {
      ...base,
      id: `${recipe.id}.${entry.id}`,
      entryIds: [entry.id]
    };
  });
}

const generatedQuestions = [];
const generatedCrosswords = [];
const recipeTemplateIds = new Set();
const generatedIds = new Set();
let expandedRecipeCount = 0;

for (const recipe of recipes) {
  if (!recipe?.id || !recipe?.sourceRef || !recipe?.engine) {
    throw new Error('Activity recipe requires id, sourceRef and engine');
  }
  if (recipeTemplateIds.has(recipe.id)) throw new Error(`Duplicate activity recipe id ${recipe.id}`);
  recipeTemplateIds.add(recipe.id);

  const source = sourceById.get(recipe.sourceRef);
  if (!source) throw new Error(`${recipe.id}: unknown knowledge source ${recipe.sourceRef}`);

  const expandedRecipes = expandRecipe(recipe, source);
  expandedRecipeCount += expandedRecipes.length;
  for (const expandedRecipe of expandedRecipes) {
    if (generatedIds.has(expandedRecipe.id)) throw new Error(`Duplicate generated recipe id ${expandedRecipe.id}`);
    generatedIds.add(expandedRecipe.id);
    const result = formatDataForEngine(source, expandedRecipe.engine, expandedRecipe);
    generatedQuestions.push(...(result.questions ?? []));
    generatedCrosswords.push(...(result.crosswordAuthoring ?? []));
  }
}

writeFileSync(questionOutput, `${JSON.stringify(generatedQuestions, null, 2)}\n`, 'utf8');
writeFileSync(crosswordOutput, `${JSON.stringify(generatedCrosswords, null, 2)}\n`, 'utf8');
console.log(
  `Formatted ${sources.length} knowledge source(s) through ${recipes.length} recipe template(s) / ` +
  `${expandedRecipeCount} expanded recipe(s): ${generatedQuestions.length} direct question(s), ` +
  `${generatedCrosswords.length} crossword authoring item(s).`
);
