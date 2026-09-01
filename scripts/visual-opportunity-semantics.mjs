export function normalizeVisualSemantic(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[-_]+/g, ' ')
    .replace(/[.,!?;:()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildVisualSemanticRoleSets(knowledgeDocuments) {
  const subjectSemanticRefs = new Set();
  const objectSemanticRefs = new Set();
  const vocabularySemanticRefs = new Set();

  for (const { file, value } of knowledgeDocuments) {
    const sources = Array.isArray(value) ? value : [value];
    for (const source of sources) {
      if (source?.kind !== 'association_set' || !Array.isArray(source.entries)) continue;
      const vocabularySource = file === 'english-vocabulary-foundation.json';
      for (const entry of source.entries) {
        const subjectId = typeof entry?.subject?.id === 'string' ? normalizeVisualSemantic(entry.subject.id) : '';
        const objectId = typeof entry?.object?.id === 'string' ? normalizeVisualSemantic(entry.object.id) : '';
        if (subjectId) subjectSemanticRefs.add(subjectId);
        if (objectId) objectSemanticRefs.add(objectId);
        if (vocabularySource) {
          if (subjectId) vocabularySemanticRefs.add(subjectId);
          if (objectId) vocabularySemanticRefs.add(objectId);
        }
      }
    }
  }

  return { subjectSemanticRefs, objectSemanticRefs, vocabularySemanticRefs };
}

export function classifyVisualSemantic(semanticRef, roleSets) {
  if (!semanticRef) return 'label_only';
  const key = normalizeVisualSemantic(semanticRef);
  if (roleSets.vocabularySemanticRefs.has(key)) return 'vocabulary_review';
  if (roleSets.objectSemanticRefs.has(key) && !roleSets.subjectSemanticRefs.has(key)) return 'predicate_review';
  return 'concrete_or_authored';
}

export function recommendVisualRecipeTemplate(entry) {
  const key = normalizeVisualSemantic(entry.semanticRef || entry.label);
  const category = entry.category ?? 'label_only';

  // Vocabulary meanings and object-side predicates need semantic review before
  // a picture can become runtime authority. Frequency alone must never promote
  // them into the automatic production lane.
  if (category === 'vocabulary_review' || category === 'predicate_review' || category === 'label_only') {
    return { template: 'review_required', costClass: 'high', automaticEligible: false };
  }

  if (/\b(length|mass|capacity|temperature|volume|weight)\b/.test(key)) {
    return { template: 'measurement', costClass: 'low', automaticEligible: true };
  }
  if (/\b(transparent|opaque|hot|cold|heavy|light|rough|smooth|hard|soft)\b/.test(key)) {
    return { template: 'contrast.pair', costClass: 'low', automaticEligible: true };
  }
  if (/\b(orbit|revolution|satellite)\b/.test(key)) {
    return { template: 'orbit', costClass: 'low', automaticEligible: true };
  }
  if (/\b(living|nonliving|source|group|type|class)\b/.test(key)) {
    return { template: 'classification', costClass: 'low', automaticEligible: true };
  }
  if (/\b(open|closed|full|empty|state)\b/.test(key)) {
    return { template: 'state.before-after', costClass: 'low', automaticEligible: true };
  }
  if (/\b(grow|melt|freeze|fill|cycle|sequence|stage)\b/.test(key)) {
    return { template: 'process.sequence', costClass: 'medium', automaticEligible: true };
  }
  if (/\b(part|root|stem|leaf|organ)\b/.test(key)) {
    return { template: 'relation.source-target', costClass: 'medium', automaticEligible: true };
  }
  if (/\b(reduce|reuse|recycle|shadow|reflect|absorb|flow|move)\b/.test(key)) {
    return { template: 'relation.source-target', costClass: 'medium', automaticEligible: true };
  }
  return { template: 'entity.single', costClass: 'medium', automaticEligible: true };
}
