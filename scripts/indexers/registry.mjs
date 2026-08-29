const indexers = new Map([
  ['association_set@1', (source) => (source.entries ?? []).map((entry) => ({
    rowRef: entry.id,
    label: entry.subject?.label ?? entry.id,
    meta: entry.meta ?? {}
  }))],
  ['choice_item@1', (source) => [{
    rowRef: '$root',
    label: source.prompt ?? source.id,
    meta: source.meta ?? {}
  }]]
]);

export function extractIndexRows(source) {
  const key = `${source.kind}@${source.version}`;
  const indexer = indexers.get(key);
  if (!indexer) return [];
  return indexer(source);
}
