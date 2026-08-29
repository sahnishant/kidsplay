import { formatAssociationSet } from './associationSet.mjs';

const formatterDefinitions = new Map([
  ['association_set@1', {
    format: formatAssociationSet,
    compatibleEngines: [
      'single_choice@1',
      'word_bank_fill@1',
      'drag_to_target@1',
      'memory_pairs@1',
      'word_search@1',
      'crossword@1'
    ]
  }]
]);

const sourceKeyFor = (data) => `${data.kind}@${data.version}`;

const definitionFor = (data) => {
  const sourceKey = sourceKeyFor(data);
  const definition = formatterDefinitions.get(sourceKey);
  if (!definition) throw new Error(`No formatter registered for ${sourceKey}`);
  return definition;
};

/** Engines the formatter can technically derive from this data shape. */
export function getCompatibleEngines(data) {
  return [...definitionFor(data).compatibleEngines];
}

/** Engines explicitly approved by this specific knowledge record. */
export function getApprovedEngines(data) {
  const compatible = new Set(getCompatibleEngines(data));
  return (Array.isArray(data.canGenerate) ? data.canGenerate : [])
    .filter((engine) => compatible.has(engine));
}

/** Newly introduced formatter capabilities that this older data has not approved yet. */
export function getCandidateEngines(data) {
  const approved = new Set(Array.isArray(data.canGenerate) ? data.canGenerate : []);
  return getCompatibleEngines(data).filter((engine) => !approved.has(engine));
}

export function formatDataForEngine(data, engine, recipe = {}) {
  const definition = definitionFor(data);

  if (!definition.compatibleEngines.includes(engine)) {
    throw new Error(`${data.id}: ${sourceKeyFor(data)} formatter is not compatible with ${engine}`);
  }

  if (!Array.isArray(data.canGenerate) || !data.canGenerate.includes(engine)) {
    throw new Error(`${data.id}: ${engine} is formatter-compatible but is not approved in canGenerate`);
  }

  return definition.format(data, { ...recipe, engine });
}
