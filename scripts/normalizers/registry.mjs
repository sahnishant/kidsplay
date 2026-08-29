import { normalizeAssociationSet } from './associationSet.mjs';
import { normalizeChoiceItem } from './choiceItem.mjs';

const normalizers = new Map([
  ['association_set@1', normalizeAssociationSet],
  ['choice_item@1', normalizeChoiceItem]
]);

export function normalizeData(source) {
  const key = `${source.kind}@${source.version}`;
  const normalizer = normalizers.get(key);
  if (!normalizer) throw new Error(`No datatype normalizer registered for ${key}`);
  const normalized = normalizer(source);
  if (!Array.isArray(normalized.units) || !normalized.units.length) {
    throw new Error(`${source.id}: normalized datatype ${key} must expose at least one knowledge unit`);
  }
  return normalized;
}

export function getNormalizerDataTypes() {
  return [...normalizers.keys()];
}
