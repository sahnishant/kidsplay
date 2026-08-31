export const FORBIDDEN_EDITORIAL_FIELDS = new Set([
  'definition',
  'definitions',
  'gloss',
  'sourceGloss',
  'example',
  'examples',
  'childDefinition',
  'childExample'
]);

export const normalizeLemma = (value) => String(value ?? '')
  .normalize('NFKC')
  .toLocaleLowerCase('en-US')
  .trim();

const maturityRank = (registry, id) => registry.maturityRanks.get(id);

export function validateStrategyItem(item, registry, visualIds = new Set()) {
  const errors = [];
  const lemma = normalizeLemma(item?.lemma);
  const senseKey = String(item?.senseKey ?? '').trim();
  const prefix = senseKey || lemma || '<unknown-vocabulary-visual-item>';

  if (!lemma || lemma !== item?.lemma) errors.push(`${prefix}: lemma must be normalized lowercase NFKC`);
  if (!/^[a-z]+(?:['-][a-z]+)?$/.test(lemma)) errors.push(`${prefix}: lemma has unsupported characters`);
  if (!senseKey || !senseKey.startsWith(`${lemma}#`) || senseKey.length <= lemma.length + 1) {
    errors.push(`${prefix}: senseKey must be an explicit ${lemma}#... sense identifier`);
  }
  if (!String(item?.partOfSpeech ?? '').trim()) errors.push(`${prefix}: partOfSpeech is required`);
  if (!registry.strategyIds.has(item?.strategy)) errors.push(`${prefix}: unknown strategy ${item?.strategy}`);
  if (!registry.maturityRanks.has(item?.maturity)) errors.push(`${prefix}: unknown maturity ${item?.maturity}`);
  if (!registry.motionPolicies.has(item?.motionPolicy)) errors.push(`${prefix}: unknown motionPolicy ${item?.motionPolicy}`);
  if (!registry.answerSafety.has(item?.answerSafety)) errors.push(`${prefix}: unknown answerSafety ${item?.answerSafety}`);
  if (item?.parameters !== undefined && (!item.parameters || typeof item.parameters !== 'object' || Array.isArray(item.parameters))) {
    errors.push(`${prefix}: parameters must be an object when provided`);
  }
  for (const field of FORBIDDEN_EDITORIAL_FIELDS) {
    if (Object.hasOwn(item ?? {}, field)) errors.push(`${prefix}: visual strategy data must not carry editorial field ${field}`);
  }

  const rank = maturityRank(registry, item?.maturity);
  const template = item?.sceneTemplate ? registry.templateById.get(item.sceneTemplate) : null;
  const sceneStrategy = !['direct_entity', 'textual_only', 'sense_unresolved'].includes(item?.strategy);

  if (item?.sceneTemplate && !template) errors.push(`${prefix}: unknown sceneTemplate ${item.sceneTemplate}`);
  if (template && template.strategy !== item?.strategy) {
    errors.push(`${prefix}: sceneTemplate ${item.sceneTemplate} belongs to ${template.strategy}, not ${item?.strategy}`);
  }
  if (sceneStrategy && !item?.sceneTemplate) errors.push(`${prefix}: ${item?.strategy} requires a sceneTemplate`);
  if (item?.strategy === 'direct_entity') {
    if (!item?.visualRef) errors.push(`${prefix}: direct_entity requires visualRef`);
    if (item?.visualRef && !visualIds.has(item.visualRef)) errors.push(`${prefix}: unknown visualRef ${item.visualRef}`);
    if (rank !== undefined && rank < 2) errors.push(`${prefix}: direct_entity cannot claim maturity below V2`);
  } else if (item?.visualRef) {
    errors.push(`${prefix}: visualRef is reserved for direct_entity in the control-plane batch`);
  }

  if (item?.strategy === 'sense_unresolved') {
    if (item?.sceneTemplate || item?.visualRef) errors.push(`${prefix}: unresolved senses cannot select visuals/templates`);
    if (rank !== undefined && rank > 1) errors.push(`${prefix}: unresolved senses cannot claim maturity beyond V1`);
  }
  if (item?.strategy === 'textual_only' && (item?.sceneTemplate || item?.visualRef)) {
    errors.push(`${prefix}: textual_only cannot carry visual implementation`);
  }
  if (rank !== undefined && rank >= 3 && sceneStrategy && !template) {
    errors.push(`${prefix}: V3+ scene maturity requires a registered scene template`);
  }
  return errors;
}

const BEATS_BY_STRATEGY = {
  place_scene: ['establish', 'focus'],
  person_role: ['establish', 'focus'],
  action_scene: ['establish', 'act', 'result'],
  state_scene: ['establish', 'focus'],
  expression_scene: ['establish', 'focus'],
  attribute_contrast: ['establish', 'compare', 'highlight'],
  spatial_relation: ['establish', 'highlight'],
  quantity_scene: ['establish', 'compare', 'highlight'],
  sequence_scene: ['establish', 'compare', 'highlight'],
  process_scene: ['establish', 'transform', 'result'],
  part_whole: ['establish', 'focus', 'highlight'],
  cause_effect: ['establish', 'act', 'result'],
  comparison_scene: ['establish', 'compare', 'highlight'],
  diagrammatic: ['establish', 'focus', 'highlight'],
  symbolic: ['establish', 'focus']
};

export function planVocabularyScene(item, { phase = 'explanation' } = {}) {
  if (item?.strategy === 'sense_unresolved') {
    return { status: 'blocked', reason: 'sense_unresolved', senseKey: item.senseKey };
  }
  if (item?.strategy === 'textual_only') {
    return { status: 'textual_only', senseKey: item.senseKey };
  }
  if (phase === 'assessment_pre_answer' && item?.answerSafety !== 'neutral_safe') {
    return {
      status: 'suppressed',
      reason: 'answer_safety',
      senseKey: item.senseKey,
      answerSafety: item.answerSafety
    };
  }
  if (item?.strategy === 'direct_entity') {
    return {
      status: 'ready',
      type: 'direct_entity',
      senseKey: item.senseKey,
      visualRef: item.visualRef,
      motionPolicy: item.motionPolicy,
      staticEquivalent: { type: 'direct_entity', visualRef: item.visualRef }
    };
  }

  const beats = BEATS_BY_STRATEGY[item?.strategy] ?? ['establish'];
  return {
    status: 'ready',
    type: 'semantic_scene',
    senseKey: item.senseKey,
    strategy: item.strategy,
    sceneTemplate: item.sceneTemplate,
    parameters: item.parameters ?? {},
    motionPolicy: item.motionPolicy,
    beats,
    staticEquivalent: {
      type: 'semantic_scene',
      sceneTemplate: item.sceneTemplate,
      parameters: item.parameters ?? {},
      beats: beats.filter((beat) => !['move', 'act', 'transform', 'reset'].includes(beat))
    }
  };
}
