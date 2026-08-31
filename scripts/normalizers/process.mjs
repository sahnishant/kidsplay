export function normalizeProcess(source) {
  const rowId = String(source.rowId ?? '').trim();
  if (!rowId) throw new Error(`${source.id}: process requires stable rowId`);

  const stages = Array.isArray(source.stages) ? source.stages : [];
  if (stages.length < 2) throw new Error(`${source.id}: process requires at least two ordered stages`);
  const stageIds = new Set();
  const normalizedStages = stages.map((stage, index) => {
    const id = String(stage?.id ?? '').trim();
    const label = String(stage?.label ?? '').trim();
    if (!id || stageIds.has(id)) throw new Error(`${source.id}: duplicate/missing process stage id ${id || '<empty>'}`);
    if (!label) throw new Error(`${source.id}/${id}: process stage requires label`);
    stageIds.add(id);
    const semanticRef = String(stage?.semanticRef ?? '').trim();
    return {
      id,
      label,
      order: index,
      ...(semanticRef ? { semanticRef } : {})
    };
  });

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
    units: [{
      rowId,
      localId: source.localId ?? source.id,
      unitType: 'process',
      prompt: source.label ?? source.id,
      stages: normalizedStages,
      conceptIds: source.conceptIds ?? [],
      meta: source.meta ?? {}
    }]
  };
}
