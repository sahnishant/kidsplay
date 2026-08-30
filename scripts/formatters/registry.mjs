import { readFileSync } from 'node:fs';
import { normalizeData } from '../normalizers/registry.mjs';
import { formatAssociationSet, associationSetSupportedEngines } from './associationSet.mjs';
import { formatChoiceItem, choiceItemSupportedEngines } from './choiceItem.mjs';

const dataTypeRegistry = JSON.parse(readFileSync(new URL('../../content/data-types/registry.json', import.meta.url), 'utf8'));

const formatterImplementations = new Map([
  ['association_set@1', { format: formatAssociationSet, supportedEngines: associationSetSupportedEngines }],
  ['choice_item@1', { format: formatChoiceItem, supportedEngines: choiceItemSupportedEngines }]
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

const knowledgeRefsForRecipe = (normalized, recipe) => {
  if (recipe.rowIds?.length) return [...new Set(recipe.rowIds)];
  if (recipe.entryIds?.length) {
    const byLocalId = new Map(normalized.units.map((unit) => [unit.localId, unit.rowId]));
    return [...new Set(recipe.entryIds.map((id) => {
      const rowId = byLocalId.get(id);
      if (!rowId) throw new Error(`${recipe.id}: cannot resolve knowledge row for entry ${id}`);
      return rowId;
    }))];
  }
  return [...new Set(normalized.units.map((unit) => unit.rowId))];
};

const attachKnowledgeRefs = (result, knowledgeRefs) => ({
  ...result,
  questions: (result.questions ?? []).map((question) => ({
    ...question,
    knowledgeRefs: question.knowledgeRefs ?? knowledgeRefs
  })),
  crosswordAuthoring: (result.crosswordAuthoring ?? []).map((question) => ({
    ...question,
    knowledgeRefs: question.knowledgeRefs ?? knowledgeRefs
  }))
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
  if (!meetsRequirements(normalized, definition.engineRequirements?.[engine])) throw new Error(`${normalized.sourceRef}: record does not meet ${engine} requirements for datatype ${sourceKey}`);
  const result = implementation.format(normalized, { ...recipe, engine });
  return attachKnowledgeRefs(result, knowledgeRefsForRecipe(normalized, recipe));
}
