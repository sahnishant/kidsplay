import { readFileSync, readdirSync } from 'node:fs';
import { validateVisualRecipes } from './visual-recipe-validation-core.mjs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));

const visualFiles = readdirSync(new URL('content/visuals/', root)).filter((name) => name.endsWith('.json')).sort();
const visualIds = new Set(visualFiles.flatMap((file) => readJson(`content/visuals/${file}`)).map((visual) => visual.id));
const recipeFiles = readdirSync(new URL('content/visual-recipes/', root)).filter((name) => name.endsWith('.json')).sort();
const recipes = recipeFiles.flatMap((file) => readJson(`content/visual-recipes/${file}`));
const { errors, stats } = validateVisualRecipes(recipes, visualIds);

if (errors.length) {
  console.error(`Visual recipe validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Visual recipes OK: ${stats.recipes} recipe(s) across ${recipeFiles.length} pack(s), ${stats.allowedTemplates} allowed template(s), ${stats.identityOnlySurfaces} identity-only surface mapping(s), ${stats.fullRelationSurfaces} full-relation surface mapping(s).`);
