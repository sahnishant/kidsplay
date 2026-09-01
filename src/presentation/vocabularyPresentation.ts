import presentationModesJson from '../../content/vocabulary-visuals/presentation-modes.json';
import {
  isVocabularyVisualPlanChildFacing,
  resolveVocabularyVisualPlan,
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

interface PresentationModeContract {
  schemaVersion: number;
  compilerVersion: number;
  policy: {
    derivedOnly: boolean;
    semanticAuthorityFromPresentationMode: boolean;
    childFacingVisualRequiresRuntimeProof: boolean;
    fullCorpusBrowserImportAllowed: boolean;
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
  contract.policy?.fullCorpusBrowserImportAllowed !== false
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
