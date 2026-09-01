import presentationModesJson from '../../content/vocabulary-visuals/presentation-modes.json';
import {
  isVocabularyVisualPlanChildFacing,
  resolveVocabularyVisualPlan,
  resolveVocabularyVisualPlanForKnowledgeRefs,
  type VocabularyVisualRuntimePlan
} from './vocabularyVisualRegistry';

export type VisualMeaningPresentationMode =
  | 'asset'
  | 'compose'
  | 'compare'
  | 'transition'
  | 'scene'
  | 'text';

export type VisualMeaningPresentationPhase = 'explanation' | 'assessment_pre_answer';

export type VisualMeaningFallbackReason =
  | 'runtime_plan_missing'
  | 'runtime_not_child_facing'
  | 'answer_safety'
  | null;

export interface VisualMeaningPresentation {
  presentationKey: string;
  compilerVersion: number;
  senseKey: string;
  lemma: string | null;
  phase: VisualMeaningPresentationPhase;
  derivedMode: VisualMeaningPresentationMode;
  deliveryMode: VisualMeaningPresentationMode;
  visualAllowed: boolean;
  fallbackReason: VisualMeaningFallbackReason;
  maturity: string | null;
  runtimeUsage: VocabularyVisualRuntimePlan['runtimeUsage'] | 'none';
  plan: VocabularyVisualRuntimePlan | null;
}

export interface VisualMeaningPresentationSlice {
  schemaVersion: 1;
  compilerVersion: number;
  phase: VisualMeaningPresentationPhase;
  plans: VisualMeaningPresentation[];
  summary: {
    requested: number;
    visualAllowed: number;
    textFallback: number;
    derivedModes: Record<string, number>;
    deliveryModes: Record<string, number>;
    payloadBytes: number;
    maxRequestedSenses: number;
    maxPayloadBytes: number;
  };
}

interface PresentationModeContract {
  schemaVersion: number;
  compilerVersion: number;
  policy: {
    derivedOnly: boolean;
    semanticAuthorityFromPresentationMode: boolean;
    childFacingVisualRequiresRuntimeProof: boolean;
    fullCorpusBrowserImportAllowed: boolean;
    boundedSliceRequired: boolean;
  };
  slicePolicy: {
    maxRequestedSenses: number;
    maxPayloadBytes: number;
  };
  modes: Array<{
    id: VisualMeaningPresentationMode;
    strategies: string[];
  }>;
}

const contract = presentationModesJson as PresentationModeContract;
if (
  contract.schemaVersion !== 1 ||
  !Number.isInteger(contract.compilerVersion) ||
  contract.compilerVersion < 1 ||
  contract.policy?.derivedOnly !== true ||
  contract.policy?.semanticAuthorityFromPresentationMode !== false ||
  contract.policy?.childFacingVisualRequiresRuntimeProof !== true ||
  contract.policy?.fullCorpusBrowserImportAllowed !== false ||
  contract.policy?.boundedSliceRequired !== true ||
  !Number.isInteger(contract.slicePolicy?.maxRequestedSenses) ||
  contract.slicePolicy.maxRequestedSenses < 1 ||
  !Number.isInteger(contract.slicePolicy?.maxPayloadBytes) ||
  contract.slicePolicy.maxPayloadBytes < 1
) {
  throw new Error('Invalid vocabulary visual presentation mode contract');
}

const presentationModeByStrategy = new Map<string, VisualMeaningPresentationMode>();
for (const mode of contract.modes) {
  for (const strategy of mode.strategies) {
    if (presentationModeByStrategy.has(strategy)) {
      throw new Error(`Duplicate vocabulary presentation strategy mapping for ${strategy}`);
    }
    presentationModeByStrategy.set(strategy, mode.id);
  }
}

function presentationKeyFor(senseKey: string): string {
  return `visual-meaning:v${contract.compilerVersion}:${senseKey}`;
}

function modeForPlan(plan: VocabularyVisualRuntimePlan): VisualMeaningPresentationMode {
  const mode = presentationModeByStrategy.get(plan.strategy);
  if (!mode || mode === 'text') {
    throw new Error(`${plan.senseKey}: runtime visual strategy ${plan.strategy} has no visual presentation mode`);
  }
  return mode;
}

function histogram(values: string[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const value of values) result[value] = (result[value] ?? 0) + 1;
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left.localeCompare(right)));
}

function payloadBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

export function resolveVisualMeaningPresentation(
  senseKey: string,
  { phase = 'explanation' }: { phase?: VisualMeaningPresentationPhase } = {}
): VisualMeaningPresentation {
  const normalizedSenseKey = String(senseKey ?? '').trim();
  const plan = normalizedSenseKey ? resolveVocabularyVisualPlan(normalizedSenseKey) : null;
  if (!plan) {
    return {
      presentationKey: presentationKeyFor(normalizedSenseKey || '<missing>'),
      compilerVersion: contract.compilerVersion,
      senseKey: normalizedSenseKey,
      lemma: null,
      phase,
      derivedMode: 'text',
      deliveryMode: 'text',
      visualAllowed: false,
      fallbackReason: 'runtime_plan_missing',
      maturity: null,
      runtimeUsage: 'none',
      plan: null
    };
  }

  const derivedMode = modeForPlan(plan);
  const proofAllowsVisual = isVocabularyVisualPlanChildFacing(plan);
  const answerSafe = phase !== 'assessment_pre_answer' || plan.answerSafety === 'neutral_safe';
  const visualAllowed = proofAllowsVisual && answerSafe;
  const fallbackReason: VisualMeaningFallbackReason = !proofAllowsVisual
    ? 'runtime_not_child_facing'
    : !answerSafe
      ? 'answer_safety'
      : null;
  return {
    presentationKey: presentationKeyFor(plan.senseKey),
    compilerVersion: contract.compilerVersion,
    senseKey: plan.senseKey,
    lemma: plan.lemma,
    phase,
    derivedMode,
    deliveryMode: visualAllowed ? derivedMode : 'text',
    visualAllowed,
    fallbackReason,
    maturity: plan.maturity,
    runtimeUsage: plan.runtimeUsage,
    plan
  };
}

export function resolveVisualMeaningPresentationForKnowledgeRefs(
  knowledgeRefs: string[] = [],
  { phase = 'explanation' }: { phase?: VisualMeaningPresentationPhase } = {}
): VisualMeaningPresentation {
  const plan = resolveVocabularyVisualPlanForKnowledgeRefs(knowledgeRefs);
  return resolveVisualMeaningPresentation(plan?.senseKey ?? '', { phase });
}

export function resolveVisualMeaningPresentationSlice(
  senseKeys: string[],
  { phase = 'explanation' }: { phase?: VisualMeaningPresentationPhase } = {}
): VisualMeaningPresentationSlice {
  if (!Array.isArray(senseKeys)) throw new Error('Visual meaning presentation slice requires senseKeys[]');
  if (senseKeys.length > contract.slicePolicy.maxRequestedSenses) {
    throw new Error(
      `Visual meaning presentation slice requested ${senseKeys.length} sense(s); maximum is ${contract.slicePolicy.maxRequestedSenses}`
    );
  }

  const normalized = senseKeys.map((value) => String(value ?? '').trim());
  if (normalized.some((senseKey) => !senseKey)) {
    throw new Error('Visual meaning presentation slice requires non-empty sense keys');
  }
  if (new Set(normalized).size !== normalized.length) {
    throw new Error('Visual meaning presentation slice cannot contain duplicate sense keys');
  }

  const canonicalSenseKeys = [...normalized].sort((left, right) => left.localeCompare(right));
  const plans = canonicalSenseKeys.map((senseKey) => resolveVisualMeaningPresentation(senseKey, { phase }));
  const payload = {
    schemaVersion: 1 as const,
    compilerVersion: contract.compilerVersion,
    phase,
    plans
  };
  const bytes = payloadBytes(payload);
  if (bytes > contract.slicePolicy.maxPayloadBytes) {
    throw new Error(
      `Visual meaning presentation slice payload is ${bytes} byte(s); maximum is ${contract.slicePolicy.maxPayloadBytes}`
    );
  }

  return {
    ...payload,
    summary: {
      requested: plans.length,
      visualAllowed: plans.filter((plan) => plan.visualAllowed).length,
      textFallback: plans.filter((plan) => plan.deliveryMode === 'text').length,
      derivedModes: histogram(plans.map((plan) => plan.derivedMode)),
      deliveryModes: histogram(plans.map((plan) => plan.deliveryMode)),
      payloadBytes: bytes,
      maxRequestedSenses: contract.slicePolicy.maxRequestedSenses,
      maxPayloadBytes: contract.slicePolicy.maxPayloadBytes
    }
  };
}
