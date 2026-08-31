import { readFileSync } from 'node:fs';
import { normalizeData } from '../normalizers/registry.mjs';
import { formatAssociationSet, associationSetSupportedEngines } from './associationSet.mjs';
import { formatChoiceItem, choiceItemSupportedEngines } from './choiceItem.mjs';
import { formatProcess, processSupportedEngines } from './process.mjs';
import { assertRecipeUnitMode } from './recipeUnitMode.mjs';

const dataTypeRegistry = JSON.parse(readFileSync(new URL('../../content/data-types/registry.json', import.meta.url), 'utf8'));

const formatterImplementations = new Map([
  ['association_set@1', { format: formatAssociationSet, supportedEngines: associationSetSupportedEngines }],
  ['choice_item@1', { format: formatChoiceItem, supportedEngines: choiceItemSupportedEngines }],
  ['process@1', { format: formatProcess, supportedEngines: processSupportedEngines }]
]);

const dataTypes = new Map((dataTypeRegistry.dataTypes ?? []).map((dataType) => [`${dataType.id}@${dataType.version}`, dataType]));
const sourceKeyFor = (data) => data.datatype ?? `${data.kind}@${data.version}`;
const asNormalized = (data) => Array.isArray(data.units) && data.datatype ? data : normalizeData(data);

export function getDataType(data) {
  const sourceKey = sourceKeyFor(data);
  const definition = dataTypes.get(sourceKey);
  if (!definition) throw new Error(`Unknown data type ${sourceKey}`);
  return definition;
}

export function getCompatibleEngines(data) {
  return [...(getDataType(data).compatibleEngines ?? [])];
}

const meetsRequirements = (data, requirements = {}) => {
  if (requirements.minUnits !== undefined && data.units.length < requirements.minUnits) return false;
  if (requirements.minChoices !== undefined) {
    if (!data.units.some((unit) => Array.isArray(unit.choices) && unit.choices.length >= requirements.minChoices)) return false;
  }
  return true;
};

const selectedUnitsForRecipe = (normalized, recipe) => {
  const units = normalized.units;
  let selected = units;
  if (recipe.rowIds?.length) {
    const byRowId = new Map(units.map((unit) => [unit.rowId, unit]));
    selected = recipe.rowIds.map((id) => {
      const unit = byRowId.get(id);
      if (!unit) throw new Error(`${recipe.id}: cannot resolve knowledge row ${id}`);
      return unit;
    });
  } else if (recipe.entryIds?.length) {
    const byLocalId = new Map(units.map((unit) => [unit.localId, unit]));
    selected = recipe.entryIds.map((id) => {
      const unit = byLocalId.get(id);
      if (!unit) throw new Error(`${recipe.id}: cannot resolve knowledge row for entry ${id}`);
      return unit;
    });
  }

  const hasOffset = recipe.entryOffset !== undefined;
  const hasLimit = recipe.entryLimit !== undefined;
  if (!hasOffset && !hasLimit) return selected;
  const offset = hasOffset ? Number(recipe.entryOffset) : 0;
  const limit = hasLimit ? Number(recipe.entryLimit) : selected.length - offset;
  if (!Number.isInteger(offset) || offset < 0) throw new Error(`${recipe.id}: entryOffset must be a non-negative integer`);
  if (!Number.isInteger(limit) || limit < 1) throw new Error(`${recipe.id}: entryLimit must be a positive integer`);
  if (offset >= selected.length) throw new Error(`${recipe.id}: entryOffset ${offset} is outside ${normalized.sourceRef}`);
  return selected.slice(offset, offset + limit);
};

const attachKnowledgeRefs = (result, knowledgeRefs) => ({
  ...result,
  questions: (result.questions ?? []).map((question) => ({ ...question, knowledgeRefs })),
  crosswordAuthoring: (result.crosswordAuthoring ?? []).map((question) => ({ ...question, knowledgeRefs }))
});

export function getUsableEngines(data) {
  const normalized = asNormalized(data);
  const definition = getDataType(normalized);
  return getCompatibleEngines(normalized).filter((engine) => meetsRequirements(normalized, definition.engineRequirements?.[engine]));
}

export function getFormatterCapabilities() {
  return Object.fromEntries([...formatterImplementations.entries()].map(([datatype, implementation]) => [datatype, [...implementation.supportedEngines]]));
}

export function formatDataForEngine(data, engine, recipe = {}) {
  const normalized = asNormalized(data);
  const sourceKey = sourceKeyFor(normalized);
  const definition = getDataType(normalized);
  const implementation = formatterImplementations.get(sourceKey);
  if (!implementation) throw new Error(`No formatter implementation registered for ${sourceKey}`);
  if (!(definition.compatibleEngines ?? []).includes(engine)) throw new Error(`${normalized.sourceRef}: datatype ${sourceKey} is not compatible with ${engine}`);
  if (!implementation.supportedEngines.includes(engine)) throw new Error(`${normalized.sourceRef}: formatter ${sourceKey} does not implement ${engine}`);
  const requirements = definition.engineRequirements?.[engine];
  if (!meetsRequirements(normalized, requirements)) throw new Error(`${normalized.sourceRef}: record does not meet ${engine} requirements for datatype ${sourceKey}`);
  const selectedUnits = selectedUnitsForRecipe(normalized, recipe);
  assertRecipeUnitMode({
    sourceRef: normalized.sourceRef,
    recipeId: recipe.id,
    engine,
    mode: requirements?.recipeUnitMode,
    selectedCount: selectedUnits.length,
    totalCount: normalized.units.length
  });
  const result = implementation.format(normalized, { ...recipe, engine });
  return attachKnowledgeRefs(result, [...new Set(selectedUnits.map((unit) => unit.rowId))]);
}
