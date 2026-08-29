export function normalizeChoiceItem(source) {
  if (!String(source.rowId ?? '').trim()) {
    throw new Error(`${source.id}: choice_item requires stable rowId`);
  }
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
      rowId: source.rowId,
      localId: source.id,
      unitType: 'choice_item',
      prompt: source.prompt,
      choices: source.choices ?? [],
      correctChoiceId: source.correctChoiceId,
      conceptIds: source.conceptIds ?? [],
      meta: source.meta ?? {},
      mediaRefs: source.mediaRefs ?? []
    }]
  };
}
