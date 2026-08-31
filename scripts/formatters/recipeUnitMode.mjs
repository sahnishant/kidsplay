export function assertRecipeUnitMode({ sourceRef, recipeId, engine, mode, selectedCount, totalCount }) {
  if (!mode) return;
  if (!['single', 'set', 'all'].includes(mode)) {
    throw new Error(`${sourceRef}: unsupported recipeUnitMode ${mode} for ${engine}`);
  }
  if (mode === 'single' && selectedCount !== 1) {
    throw new Error(`${recipeId}: ${engine} requires exactly one selected knowledge unit; got ${selectedCount}`);
  }
  if (mode === 'set' && selectedCount < 2) {
    throw new Error(`${recipeId}: ${engine} requires at least two selected knowledge units; got ${selectedCount}`);
  }
  if (mode === 'all' && selectedCount !== totalCount) {
    throw new Error(`${recipeId}: ${engine} requires the complete knowledge record; selected ${selectedCount}/${totalCount}`);
  }
}
