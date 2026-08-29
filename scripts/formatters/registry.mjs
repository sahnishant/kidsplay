import { readFileSync } from 'node:fs';
import { formatAssociationSet } from './associationSet.mjs';
import { formatChoiceItem } from './choiceItem.mjs';

const dataTypeRegistry = JSON.parse(
  readFileSync(new URL('../../content/data-types/registry.json', import.meta.url), 'utf8')
);

const formatterImplementations = new Map([
  ['association_set@1', formatAssociationSet],
  ['choice_item@1', formatChoiceItem]
]);

const dataTypes = new Map(
  (dataTypeRegistry.dataTypes ?? []).map((dataType) => [
    `${dataType.id}@${dataType.version}`,
    dataType
  ])
);

const sourceKeyFor = (data) => `${data.kind}@${data.version}`;

export function getDataType(data) {
  const sourceKey = sourceKeyFor(data);
  const definition = dataTypes.get(sourceKey);
  if (!definition) throw new Error(`Unknown data type ${sourceKey}`);
  return definition;
}

/** Master engine list stored once per datatype, never repeated on every data record. */
export function getCompatibleEngines(data) {
  return [...(getDataType(data).compatibleEngines ?? [])];
}

const meetsRequirements = (data, requirements = {}) => {
  if (requirements.minEntries !== undefined) {
    if (!Array.isArray(data.entries) || data.entries.length < requirements.minEntries) return false;
  }
  if (requirements.minChoices !== undefined) {
    if (!Array.isArray(data.choices) || data.choices.length < requirements.minChoices) return false;
  }
  return true;
};

/** Datatype-compatible engines for which this particular record is rich enough. */
export function getUsableEngines(data) {
  const definition = getDataType(data);
  return getCompatibleEngines(data).filter((engine) =>
    meetsRequirements(data, definition.engineRequirements?.[engine])
  );
}

export function formatDataForEngine(data, engine, recipe = {}) {
  const sourceKey = sourceKeyFor(data);
  const definition = getDataType(data);
  const formatter = formatterImplementations.get(sourceKey);
  if (!formatter) throw new Error(`No formatter implementation registered for ${sourceKey}`);

  if (!(definition.compatibleEngines ?? []).includes(engine)) {
    throw new Error(`${data.id}: datatype ${sourceKey} is not compatible with ${engine}`);
  }

  if (!meetsRequirements(data, definition.engineRequirements?.[engine])) {
    throw new Error(`${data.id}: record does not meet ${engine} requirements for datatype ${sourceKey}`);
  }

  return formatter(data, { ...recipe, engine });
}
