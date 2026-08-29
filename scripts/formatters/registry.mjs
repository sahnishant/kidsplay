import { formatAssociationSet } from './associationSet.mjs';

const formatters = new Map([
  ['association_set@1', formatAssociationSet]
]);

export function formatDataForEngine(data, engine, recipe = {}) {
  const sourceKey = `${data.kind}@${data.version}`;
  const formatter = formatters.get(sourceKey);
  if (!formatter) throw new Error(`No formatter registered for ${sourceKey}`);

  if (!Array.isArray(data.canGenerate) || !data.canGenerate.includes(engine)) {
    throw new Error(`${data.id}: ${engine} is not declared in canGenerate`);
  }

  return formatter(data, { ...recipe, engine });
}
