import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { formatDataForEngine } from './formatters/registry.mjs';

const root = new URL('../', import.meta.url);
const knowledgeDirectory = new URL('content/knowledge/', root);
const recipeDirectory = new URL('content/recipes/', root);
const questionOutput = new URL('content/questions/__generated-from-knowledge.json', root);
const crosswordOutput = new URL('content/authoring/crosswords/__generated-from-knowledge.json', root);

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

const generatedQuestions = [];
const generatedCrosswords = [];
const generatedIds = new Set();

for (const recipe of recipes) {
  if (!recipe?.id || !recipe?.sourceRef || !recipe?.engine) {
    throw new Error('Activity recipe requires id, sourceRef and engine');
  }
  if (generatedIds.has(recipe.id)) throw new Error(`Duplicate generated recipe id ${recipe.id}`);
  generatedIds.add(recipe.id);

  const source = sourceById.get(recipe.sourceRef);
  if (!source) throw new Error(`${recipe.id}: unknown knowledge source ${recipe.sourceRef}`);

  const result = formatDataForEngine(source, recipe.engine, recipe);
  generatedQuestions.push(...(result.questions ?? []));
  generatedCrosswords.push(...(result.crosswordAuthoring ?? []));
}

writeFileSync(questionOutput, `${JSON.stringify(generatedQuestions, null, 2)}\n`, 'utf8');
writeFileSync(crosswordOutput, `${JSON.stringify(generatedCrosswords, null, 2)}\n`, 'utf8');
console.log(
  `Formatted ${sources.length} knowledge source(s) through ${recipes.length} recipe(s): ` +
  `${generatedQuestions.length} direct question(s), ${generatedCrosswords.length} crossword authoring item(s).`
);
