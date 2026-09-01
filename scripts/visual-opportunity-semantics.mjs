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

const production = (template, costClass, familyKey) => ({
  template,
  costClass,
  familyKey,
  automaticEligible: true
});
const review = () => ({
  template: 'review_required',
  costClass: 'high',
  familyKey: null,
  automaticEligible: false
});

export function recommendVisualRecipeTemplate(entry) {
  const key = normalizeVisualSemantic(entry.semanticRef || entry.label);
  const category = entry.category ?? 'label_only';

  // Frequency is prioritization evidence, never semantic authority. Review-only
  // semantics never get a familyKey, so aggregation cannot promote them.
  if (category === 'vocabulary_review' || category === 'predicate_review' || category === 'label_only') return review();

  if (/\b(length|mass|capacity|temperature|volume|weight)\b/.test(key)) return production('measurement', 'low', 'measurement');
  if (/\b(transparent|opaque)\b/.test(key)) return production('contrast.pair', 'low', 'material-contrast');
  if (/\b(hot|cold)\b/.test(key)) return production('contrast.pair', 'low', 'temperature-contrast');
  if (/\b(heavy|light)\b/.test(key)) return production('contrast.pair', 'low', 'mass-contrast');
  if (/\b(rough|smooth)\b/.test(key)) return production('contrast.pair', 'low', 'texture-contrast');
  if (/\b(hard|soft)\b/.test(key)) return production('contrast.pair', 'low', 'hardness-contrast');
  if (/\b(orbit|revolution|satellite)\b/.test(key)) return production('orbit', 'low', 'orbit');
  if (/\b(living|nonliving|source|group|type|class)\b/.test(key)) return production('classification', 'low', 'classification');
  if (/\b(open|closed|full|empty|state)\b/.test(key)) return production('state.before-after', 'low', 'state-change');
  if (/\b(condensation|evaporation|germination|grow|melt|freeze|fill|cycle|sequence|stage)\b/.test(key)) return production('process.transform', 'medium', 'process-change');
  if (/\b(clay soil|sandy soil|loamy soil|humus)\b/.test(key)) return production('entity.single', 'medium', 'soil-family');
  if (/\b(part|root|stem|leaf|organ)\b/.test(key)) return production('relation.source-target', 'medium', 'part-whole');
  if (/\b(reduce|reuse|recycle)\b/.test(key)) return production('process.sequence', 'medium', 'environmental-actions');

  // A shared recipe template is not enough to establish a reusable production
  // family. Keep these relation families semantically narrow so aggregate ROI
  // reflects actual reusable art/scene leverage rather than coincidental syntax.
  if (/\bshadow\b/.test(key)) return production('relation.source-target', 'medium', 'shadow-formation');
  if (/\b(reflect|absorb)\b/.test(key)) return production('relation.source-target', 'medium', 'light-behavior');
  if (/\bflow\b/.test(key)) return production('relation.source-target', 'medium', 'flow-process');
  if (/\bexercise\b/.test(key)) return production('relation.source-target', 'medium', 'body-exercise');
  if (/\b(gas spreads|gas spread)\b/.test(key)) return production('process.sequence', 'medium', 'gas-process');

  return review();
}
