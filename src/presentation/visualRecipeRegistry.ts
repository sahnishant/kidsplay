import type {
  ResolvedVisualRecipe,
  VisualRecipe,
  VisualRecipeSurface
} from './visualRecipeTypes';

const recipeModules = import.meta.glob('../../content/visual-recipes/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, unknown>;

const recipes = Object.entries(recipeModules)
  .sort(([left], [right]) => left.localeCompare(right))
  .flatMap(([, value]) => (Array.isArray(value) ? (value as VisualRecipe[]) : []));

const recipeById = new Map<string, VisualRecipe>();
const recipeBySemanticKey = new Map<string, VisualRecipe>();

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[-_]+/g, ' ')
    .replace(/[.,!?;:()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function registerSemanticKey(key: string, recipe: VisualRecipe): void {
  const normalized = normalize(key);
  if (!normalized || recipeBySemanticKey.has(normalized)) return;
  recipeBySemanticKey.set(normalized, recipe);
}

for (const recipe of recipes) {
  if (!recipeById.has(recipe.id)) recipeById.set(recipe.id, recipe);
  registerSemanticKey(recipe.semanticRef, recipe);
  for (const alias of recipe.aliases ?? []) registerSemanticKey(alias, recipe);
}

function resolveRecipe(recipe: VisualRecipe | undefined, surface: VisualRecipeSurface): ResolvedVisualRecipe | null {
  if (!recipe) return null;
  const exposure = recipe.surfaces?.[surface] ?? 'hidden';
  if (exposure === 'hidden') return null;
  const slots = exposure === 'identity_only'
    ? recipe.slots.filter((slot) => slot.exposure === 'identity')
    : [...recipe.slots];
  if (!slots.length) return null;
  return { ...recipe, exposure, slots };
}

export function getVisualRecipe(recipeId: string): VisualRecipe | null {
  return recipeById.get(recipeId) ?? null;
}

export function resolveVisualRecipeById(
  recipeId: string,
  surface: VisualRecipeSurface
): ResolvedVisualRecipe | null {
  return resolveRecipe(recipeById.get(recipeId), surface);
}

export function resolveVisualRecipeForSemantic(
  semanticRef: string | undefined,
  surface: VisualRecipeSurface
): ResolvedVisualRecipe | null {
  if (!semanticRef) return null;
  return resolveRecipe(recipeBySemanticKey.get(normalize(semanticRef)), surface);
}

export function resolveVisualRecipeRefs(
  semanticRef: string | undefined,
  surface: VisualRecipeSurface
): string[] {
  const recipe = resolveVisualRecipeForSemantic(semanticRef, surface);
  if (!recipe) return [];
  return [...new Set(recipe.slots.map((slot) => slot.visualRef))];
}

export function getVisualRecipes(): VisualRecipe[] {
  return recipes.map((recipe) => ({
    ...recipe,
    aliases: recipe.aliases ? [...recipe.aliases] : undefined,
    slots: recipe.slots.map((slot) => ({ ...slot })),
    surfaces: { ...recipe.surfaces }
  }));
}
