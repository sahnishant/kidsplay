import { Buffer } from 'node:buffer';

export const VISUAL_PRESENTATION_SCHEMA_VERSION = 1;
export const VISUAL_PRESENTATION_MODE_IDS = Object.freeze([
  'asset',
  'compose',
  'compare',
  'transition',
  'scene',
  'text'
]);

const MODE_IDS = new Set(VISUAL_PRESENTATION_MODE_IDS);
const CHILD_FACING_MATURITIES = new Set(['V5', 'V6']);
const RENDERER_PROVEN_MATURITIES = new Set(['V3', 'V4', 'V5', 'V6']);
const RUNTIME_USAGES = new Set(['knowledge_reinforcement', 'template_proof']);
const BLOCKED_STRATEGIES = new Set(['sense_unresolved', 'textual_only']);

const text = (value) => String(value ?? '').trim();
const canonicalObject = (value = {}) => Object.fromEntries(
  Object.entries(value ?? {})
    .filter(([, entry]) => entry !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
);
const canonicalJson = (value) => JSON.stringify(canonicalObject(value));

function required(value, field) {
  const result = text(value);
  if (!result) throw new Error(`Visual presentation requires ${field}`);
  return result;
}

function presentationKeyFor(senseKey, compilerVersion) {
  return `visual-meaning:v${compilerVersion}:${senseKey}`;
}

function positiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function maturityRank(value) {
  const match = /^V(\d+)$/.exec(String(value ?? ''));
  return match ? Number(match[1]) : -1;
}

export function validatePresentationModeContract(contract, strategyIds = []) {
  const errors = [];
  if (contract?.schemaVersion !== VISUAL_PRESENTATION_SCHEMA_VERSION) {
    errors.push(`presentation mode contract schemaVersion must be ${VISUAL_PRESENTATION_SCHEMA_VERSION}`);
  }
  if (!Number.isInteger(contract?.compilerVersion) || contract.compilerVersion < 1) {
    errors.push('presentation mode contract compilerVersion must be a positive integer');
  }
  if (contract?.policy?.derivedOnly !== true) errors.push('presentation modes must remain derived-only');
  if (contract?.policy?.semanticAuthorityFromPresentationMode !== false) {
    errors.push('presentation modes cannot create semantic authority');
  }
  if (contract?.policy?.childFacingVisualRequiresRuntimeProof !== true) {
    errors.push('child-facing visuals must require runtime proof');
  }
  if (contract?.policy?.unresolvedSenseVisualAllowed !== false) {
    errors.push('unresolved senses must not receive visuals');
  }
  if (contract?.policy?.textualOnlyVisualAllowed !== false) {
    errors.push('textual-only senses must not receive visuals');
  }
  if (contract?.policy?.runtimeSelectionDeterministic !== true) {
    errors.push('runtime visual selection must be deterministic');
  }
  if (contract?.policy?.fullCorpusBrowserImportAllowed !== false) {
    errors.push('the full vocabulary corpus must not be imported by browser presentation');
  }
  if (contract?.policy?.boundedSliceRequired !== true) {
    errors.push('visual presentation must require bounded slices');
  }
  if (!positiveInteger(contract?.slicePolicy?.maxRequestedSenses)) {
    errors.push('visual presentation slicePolicy.maxRequestedSenses must be a positive integer');
  }
  if (!positiveInteger(contract?.slicePolicy?.maxPayloadBytes)) {
    errors.push('visual presentation slicePolicy.maxPayloadBytes must be a positive integer');
  }

  const seenModes = new Set();
  const strategyToMode = new Map();
  for (const mode of contract?.modes ?? []) {
    const modeId = text(mode?.id);
    if (!MODE_IDS.has(modeId)) errors.push(`unknown visual presentation mode ${modeId || '<empty>'}`);
    if (seenModes.has(modeId)) errors.push(`duplicate visual presentation mode ${modeId}`);
    seenModes.add(modeId);
    if (!Array.isArray(mode?.strategies) || mode.strategies.length === 0) {
      errors.push(`${modeId || '<empty>'}: presentation mode requires at least one strategy`);
      continue;
    }
    for (const rawStrategy of mode.strategies) {
      const strategy = text(rawStrategy);
      if (!strategy) {
        errors.push(`${modeId}: presentation mode contains an empty strategy`);
        continue;
      }
      if (strategyToMode.has(strategy)) {
        errors.push(`${strategy}: presentation strategy is mapped by both ${strategyToMode.get(strategy)} and ${modeId}`);
        continue;
      }
      strategyToMode.set(strategy, modeId);
    }
  }

  for (const modeId of VISUAL_PRESENTATION_MODE_IDS) {
    if (!seenModes.has(modeId)) errors.push(`missing visual presentation mode ${modeId}`);
  }

  const expectedStrategies = new Set([...strategyIds].map(text).filter(Boolean));
  for (const strategy of expectedStrategies) {
    if (!strategyToMode.has(strategy)) errors.push(`${strategy}: registry strategy has no visual presentation mode`);
  }
  for (const strategy of strategyToMode.keys()) {
    if (expectedStrategies.size && !expectedStrategies.has(strategy)) {
      errors.push(`${strategy}: visual presentation mode references an unknown registry strategy`);
    }
  }

  if (strategyToMode.get('sense_unresolved') !== 'text') {
    errors.push('sense_unresolved must derive only to text');
  }
  if (strategyToMode.get('textual_only') !== 'text') {
    errors.push('textual_only must derive only to text');
  }
  return errors;
}

export function createPresentationModeIndex(contract, strategyIds = []) {
  const errors = validatePresentationModeContract(contract, strategyIds);
  if (errors.length) throw new Error(`Invalid visual presentation mode contract:\n- ${errors.join('\n- ')}`);
  const result = new Map();
  for (const mode of contract.modes) {
    for (const strategy of mode.strategies) result.set(strategy, mode.id);
  }
  return result;
}

export function derivePresentationMode(strategy, contract) {
  const modeIndex = createPresentationModeIndex(contract);
  const normalizedStrategy = required(strategy, 'strategy');
  const mode = modeIndex.get(normalizedStrategy);
  if (!mode) throw new Error(`${normalizedStrategy}: no visual presentation mode is registered`);
  return mode;
}

function validateRuntimeProjection(item, runtimePlan) {
  if (!runtimePlan) return;
  const senseKey = required(item?.senseKey, 'senseKey');
  if (runtimePlan.senseKey !== senseKey) throw new Error(`${senseKey}: runtime projection senseKey drift`);
  const fields = ['lemma', 'strategy', 'sceneTemplate', 'motionPolicy', 'answerSafety', 'visualRef'];
  for (const field of fields) {
    const sourceValue = item?.[field] ?? null;
    const runtimeValue = runtimePlan?.[field] ?? null;
    if (sourceValue !== runtimeValue) {
      throw new Error(`${senseKey}: runtime projection changed ${field} from ${String(sourceValue)} to ${String(runtimeValue)}`);
    }
  }
  if (canonicalJson(item?.parameters ?? {}) !== canonicalJson(runtimePlan?.parameters ?? {})) {
    throw new Error(`${senseKey}: runtime projection changed semantic parameters`);
  }
  if (!RUNTIME_USAGES.has(runtimePlan.runtimeUsage)) {
    throw new Error(`${senseKey}: unsupported runtime usage ${String(runtimePlan.runtimeUsage)}`);
  }
}

function runtimePresentationSignature(plan) {
  return JSON.stringify({
    senseKey: plan?.senseKey ?? null,
    lemma: plan?.lemma ?? null,
    strategy: plan?.strategy ?? null,
    sceneTemplate: plan?.sceneTemplate ?? null,
    maturity: plan?.maturity ?? null,
    motionPolicy: plan?.motionPolicy ?? null,
    answerSafety: plan?.answerSafety ?? null,
    visualRef: plan?.visualRef ?? null,
    runtimeUsage: plan?.runtimeUsage ?? null,
    parameters: canonicalObject(plan?.parameters ?? {})
  });
}

function preferredEquivalentRuntimePlan(left, right) {
  const leftKey = `${left?.knowledgeRef ?? ''}\u0000${left?.senseKey ?? ''}`;
  const rightKey = `${right?.knowledgeRef ?? ''}\u0000${right?.senseKey ?? ''}`;
  return rightKey.localeCompare(leftKey) < 0 ? right : left;
}

export function compilePresentationRecord(item, {
  contract,
  runtimePlan = null,
  runtimePlanCount = runtimePlan ? 1 : 0,
  modeIndex = null
} = {}) {
  if (!contract) throw new Error('Visual presentation compiler requires a presentation mode contract');
  const senseKey = required(item?.senseKey, 'senseKey');
  const lemma = required(item?.lemma, `${senseKey} lemma`);
  const strategy = required(item?.strategy, `${senseKey} strategy`);
  const sourceMaturity = required(item?.maturity, `${senseKey} maturity`);
  validateRuntimeProjection(item, runtimePlan);

  const modes = modeIndex ?? createPresentationModeIndex(contract);
  const derivedMode = modes.get(strategy);
  if (!derivedMode) throw new Error(`${senseKey}: no visual presentation mode for strategy ${strategy}`);
  const runtimeUsage = runtimePlan?.runtimeUsage ?? 'none';
  const effectiveMaturity = runtimePlan?.maturity ?? sourceMaturity;
  const unresolved = strategy === 'sense_unresolved';
  const textualOnly = strategy === 'textual_only';
  const rendererReady = Boolean(
    runtimePlan &&
    RUNTIME_USAGES.has(runtimeUsage) &&
    RENDERER_PROVEN_MATURITIES.has(effectiveMaturity) &&
    !BLOCKED_STRATEGIES.has(strategy)
  );
  const childFacing = Boolean(
    rendererReady &&
    runtimeUsage === 'knowledge_reinforcement' &&
    CHILD_FACING_MATURITIES.has(effectiveMaturity)
  );

  let status = 'candidate';
  let fallbackReason = null;
  if (unresolved) {
    status = 'blocked';
    fallbackReason = 'sense_unresolved';
  } else if (textualOnly) {
    status = 'text_fallback';
    fallbackReason = 'textual_only';
  } else if (childFacing) {
    status = 'child_facing';
  } else if (rendererReady) {
    status = 'renderer_proven';
    fallbackReason = 'not_child_facing';
  } else {
    fallbackReason = 'runtime_proof_missing';
  }

  return {
    presentationKey: presentationKeyFor(senseKey, contract.compilerVersion),
    compilerVersion: contract.compilerVersion,
    senseKey,
    lemma,
    strategy,
    derivedMode,
    deliveryMode: childFacing ? derivedMode : 'text',
    status,
    fallbackReason,
    sourceMaturity,
    effectiveMaturity,
    runtimeUsage,
    runtimePlanCount,
    rendererReady,
    childFacing,
    sceneTemplate: item?.sceneTemplate ?? null,
    motionPolicy: item?.motionPolicy ?? null,
    answerSafety: item?.answerSafety ?? null,
    visualRef: item?.visualRef ?? null,
    parameters: canonicalObject(item?.parameters ?? {})
  };
}

function missingPresentationRecord(senseKey, contract) {
  return {
    presentationKey: presentationKeyFor(senseKey, contract.compilerVersion),
    compilerVersion: contract.compilerVersion,
    senseKey,
    lemma: null,
    strategy: null,
    derivedMode: 'text',
    deliveryMode: 'text',
    status: 'blocked',
    fallbackReason: 'missing_sense',
    sourceMaturity: null,
    effectiveMaturity: null,
    runtimeUsage: 'none',
    runtimePlanCount: 0,
    rendererReady: false,
    childFacing: false,
    sceneTemplate: null,
    motionPolicy: null,
    answerSafety: null,
    visualRef: null,
    parameters: {}
  };
}

function histogram(values) {
  const result = {};
  for (const value of values) result[value] = (result[value] ?? 0) + 1;
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left.localeCompare(right)));
}

export function compilePresentationSlice({
  items,
  requestedSenseKeys,
  contract,
  runtimePlans = []
}) {
  if (!Array.isArray(items)) throw new Error('Visual presentation slice requires items[]');
  if (!Array.isArray(requestedSenseKeys)) throw new Error('Visual presentation slice requires requestedSenseKeys[]');
  if (!Array.isArray(runtimePlans)) throw new Error('Visual presentation slice requires runtimePlans[]');
  if (!contract) throw new Error('Visual presentation slice requires a presentation mode contract');

  const modeIndex = createPresentationModeIndex(contract);
  const maxRequestedSenses = contract.slicePolicy.maxRequestedSenses;
  const maxPayloadBytes = contract.slicePolicy.maxPayloadBytes;
  if (requestedSenseKeys.length > maxRequestedSenses) {
    throw new Error(
      `Visual presentation slice requested ${requestedSenseKeys.length} sense(s); maximum is ${maxRequestedSenses}`
    );
  }

  const itemBySenseKey = new Map();
  for (const item of items) {
    const senseKey = required(item?.senseKey, 'source item senseKey');
    if (itemBySenseKey.has(senseKey)) throw new Error(`${senseKey}: duplicate source presentation item`);
    itemBySenseKey.set(senseKey, item);
  }

  const runtimeBySenseKey = new Map();
  for (const plan of runtimePlans) {
    const senseKey = required(plan?.senseKey, 'runtime plan senseKey');
    const existing = runtimeBySenseKey.get(senseKey);
    if (!existing) {
      runtimeBySenseKey.set(senseKey, { plan, count: 1 });
      continue;
    }
    if (runtimePresentationSignature(existing.plan) !== runtimePresentationSignature(plan)) {
      throw new Error(`${senseKey}: conflicting runtime presentation plans for one semantic sense`);
    }
    runtimeBySenseKey.set(senseKey, {
      plan: preferredEquivalentRuntimePlan(existing.plan, plan),
      count: existing.count + 1
    });
  }

  const requested = requestedSenseKeys.map((value) => required(value, 'requested senseKey'));
  if (new Set(requested).size !== requested.length) {
    throw new Error('Visual presentation slice cannot contain duplicate requested sense keys');
  }

  const canonicalSenseKeys = [...requested].sort((left, right) => left.localeCompare(right));
  const plans = canonicalSenseKeys.map((senseKey) => {
    const item = itemBySenseKey.get(senseKey);
    if (!item) return missingPresentationRecord(senseKey, contract);
    const runtime = runtimeBySenseKey.get(senseKey);
    return compilePresentationRecord(item, {
      contract,
      runtimePlan: runtime?.plan ?? null,
      runtimePlanCount: runtime?.count ?? 0,
      modeIndex
    });
  });

  const payload = {
    schemaVersion: VISUAL_PRESENTATION_SCHEMA_VERSION,
    compilerVersion: contract.compilerVersion,
    plans
  };
  const payloadBytes = Buffer.byteLength(JSON.stringify(payload), 'utf8');
  if (payloadBytes > maxPayloadBytes) {
    throw new Error(
      `Visual presentation slice payload is ${payloadBytes} byte(s); maximum is ${maxPayloadBytes}`
    );
  }

  const summary = {
    requested: plans.length,
    runtimeMappings: plans.reduce((total, plan) => total + plan.runtimePlanCount, 0),
    childFacing: plans.filter((plan) => plan.childFacing).length,
    rendererReady: plans.filter((plan) => plan.rendererReady).length,
    blocked: plans.filter((plan) => plan.status === 'blocked').length,
    textFallback: plans.filter((plan) => plan.deliveryMode === 'text').length,
    unresolved: plans.filter((plan) => plan.strategy === 'sense_unresolved').length,
    textualOnly: plans.filter((plan) => plan.strategy === 'textual_only').length,
    sourceV1Plus: plans.filter((plan) => maturityRank(plan.sourceMaturity) >= 1).length,
    effectiveV3Plus: plans.filter((plan) => maturityRank(plan.effectiveMaturity) >= 3).length,
    effectiveV5Plus: plans.filter((plan) => maturityRank(plan.effectiveMaturity) >= 5).length,
    sourceMaturities: histogram(plans.map((plan) => plan.sourceMaturity ?? 'missing')),
    effectiveMaturities: histogram(plans.map((plan) => plan.effectiveMaturity ?? 'missing')),
    derivedModes: histogram(plans.map((plan) => plan.derivedMode)),
    deliveryModes: histogram(plans.map((plan) => plan.deliveryMode)),
    statuses: histogram(plans.map((plan) => plan.status)),
    payloadBytes,
    maxRequestedSenses,
    maxPayloadBytes
  };

  return { ...payload, summary };
}
