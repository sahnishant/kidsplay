export const VISUAL_RECIPE_TEMPLATES = new Set([
  'entity.single',
  'contrast.pair',
  'state.before-after',
  'process.sequence',
  'process.transform',
  'container.fill',
  'orbit',
  'rotation',
  'relation.source-target',
  'comparison',
  'classification',
  'measurement'
]);

export const VISUAL_RECIPE_SURFACES = new Set([
  'option',
  'word-bank',
  'drag-item',
  'drag-target',
  'feedback',
  'dashboard',
  'memory-card',
  'sequence-item',
  'scene'
]);

const exposures = new Set(['hidden', 'identity_only', 'full_relation']);
const slotExposures = new Set(['identity', 'context', 'relation']);
const costClasses = new Set(['low', 'medium', 'high']);

export function validateVisualRecipes(recipes, visualIds) {
  const ids = new Set();
  const semantics = new Set();
  const errors = [];
  let identityOnlySurfaces = 0;
  let fullRelationSurfaces = 0;

  for (const recipe of recipes) {
    const context = recipe?.id || '<missing recipe id>';
    if (typeof recipe?.id !== 'string' || !recipe.id.trim()) errors.push(`${context}: id is required`);
    else if (ids.has(recipe.id)) errors.push(`${context}: duplicate recipe id`);
    else ids.add(recipe.id);

    if (typeof recipe?.semanticRef !== 'string' || !recipe.semanticRef.trim()) {
      errors.push(`${context}: semanticRef is required`);
    } else if (semantics.has(recipe.semanticRef)) {
      errors.push(`${context}: duplicate semanticRef ${recipe.semanticRef}`);
    } else semantics.add(recipe.semanticRef);

    if (!VISUAL_RECIPE_TEMPLATES.has(recipe?.template)) errors.push(`${context}: unsupported template ${String(recipe?.template)}`);
    if (typeof recipe?.ariaLabel !== 'string' || !recipe.ariaLabel.trim()) errors.push(`${context}: ariaLabel is required`);
    if (recipe?.costClass !== undefined && !costClasses.has(recipe.costClass)) errors.push(`${context}: invalid costClass ${recipe.costClass}`);

    if (!Array.isArray(recipe?.slots) || !recipe.slots.length) {
      errors.push(`${context}: at least one slot is required`);
    } else {
      const slotRoles = new Set();
      for (const slot of recipe.slots) {
        if (typeof slot?.role !== 'string' || !slot.role.trim()) errors.push(`${context}: every slot requires a role`);
        else if (slotRoles.has(slot.role)) errors.push(`${context}: duplicate slot role ${slot.role}`);
        else slotRoles.add(slot.role);
        if (!visualIds.has(slot?.visualRef)) errors.push(`${context}/${slot?.role ?? '?'}: unknown visualRef ${String(slot?.visualRef)}`);
        if (!slotExposures.has(slot?.exposure)) errors.push(`${context}/${slot?.role ?? '?'}: invalid slot exposure ${String(slot?.exposure)}`);
      }
    }

    if (!recipe?.surfaces || typeof recipe.surfaces !== 'object' || Array.isArray(recipe.surfaces)) {
      errors.push(`${context}: surfaces map is required`);
    } else {
      for (const [surface, exposure] of Object.entries(recipe.surfaces)) {
        if (!VISUAL_RECIPE_SURFACES.has(surface)) errors.push(`${context}: unsupported surface ${surface}`);
        if (!exposures.has(exposure)) errors.push(`${context}/${surface}: invalid exposure ${String(exposure)}`);
        if (exposure === 'identity_only') {
          identityOnlySurfaces += 1;
          if (!recipe.slots?.some((slot) => slot.exposure === 'identity')) {
            errors.push(`${context}/${surface}: identity_only requires at least one identity slot`);
          }
        }
        if (exposure === 'full_relation') fullRelationSurfaces += 1;
      }
    }
  }

  return {
    errors,
    stats: {
      recipes: recipes.length,
      allowedTemplates: VISUAL_RECIPE_TEMPLATES.size,
      identityOnlySurfaces,
      fullRelationSurfaces
    }
  };
}
