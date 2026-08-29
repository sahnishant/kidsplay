export function normalizeAssociationSet(source) {
  const entries = Array.isArray(source.entries) ? source.entries : [];
  return {
    sourceRef: source.id,
    sourceRevision: source.revision ?? 1,
    datatype: `${source.kind}@${source.version}`,
    kind: source.kind,
    version: source.version,
    language: source.language ?? 'en',
    subject: source.subject ?? null,
    topic: source.topic ?? null,
    authoring: source.authoring ?? {},
    units: entries.map((entry) => {
      if (!String(entry.rowId ?? '').trim()) {
        throw new Error(`${source.id}/${entry.id ?? '<unknown>'}: association entry requires stable rowId`);
      }
      return {
        rowId: entry.rowId,
        localId: entry.id,
        unitType: 'association',
        subject: entry.subject,
        relation: entry.relation,
        object: entry.object,
        conceptIds: entry.conceptIds ?? [],
        meta: entry.meta ?? {},
        mediaRefs: entry.mediaRefs ?? []
      };
    })
  };
}
