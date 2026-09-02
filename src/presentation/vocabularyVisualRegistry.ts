import runtimePlansJson from '../../content/vocabulary-visuals/__generated-runtime-plans.json';

export type VocabularyVisualStrategy =
  | 'direct_entity'
  | 'place_scene'
  | 'person_role'
  | 'action_scene'
  | 'state_scene'
  | 'expression_scene'
  | 'attribute_contrast'
  | 'spatial_relation'
  | 'quantity_scene'
  | 'sequence_scene'
  | 'process_scene'
  | 'part_whole'
  | 'cause_effect'
  | 'comparison_scene'
  | 'diagrammatic'
  | 'symbolic';

export type VocabularyMotionPolicy = 'none' | 'optional_meaningful' | 'recommended_meaningful';
export type VocabularyAnswerSafety = 'neutral_safe' | 'post_answer_only' | 'explanation_only';
export type VocabularyRuntimeUsage = 'knowledge_reinforcement' | 'template_proof';

export interface VocabularyVisualRuntimePlan {
  knowledgeRef: string | null;
  runtimeUsage: VocabularyRuntimeUsage;
  senseKey: string;
  lemma: string;
  strategy: VocabularyVisualStrategy;
  sceneTemplate: string | null;
  maturity: string;
  motionPolicy: VocabularyMotionPolicy;
  answerSafety: VocabularyAnswerSafety;
  visualRef: string | null;
  parameters: Record<string, string | number | boolean>;
  semanticDepthPatternRefs: string[];
}

interface RuntimePlanFile {
  schemaVersion: number;
  issueRef: number;
  semanticDepthIssueRefs: number[];
  plans: VocabularyVisualRuntimePlan[];
}

interface RawRuntimePlanFile {
  schemaVersion?: unknown;
  issueRef?: unknown;
  semanticDepthIssueRefs?: unknown;
  plans?: unknown;
}

const STRATEGIES = new Set<VocabularyVisualStrategy>([
  'direct_entity', 'place_scene', 'person_role', 'action_scene', 'state_scene', 'expression_scene',
  'attribute_contrast', 'spatial_relation', 'quantity_scene', 'sequence_scene', 'process_scene',
  'part_whole', 'cause_effect', 'comparison_scene', 'diagrammatic', 'symbolic'
]);
const MOTION_POLICIES = new Set<VocabularyMotionPolicy>(['none', 'optional_meaningful', 'recommended_meaningful']);
const ANSWER_SAFETY = new Set<VocabularyAnswerSafety>(['neutral_safe', 'post_answer_only', 'explanation_only']);
const RUNTIME_USAGE = new Set<VocabularyRuntimeUsage>(['knowledge_reinforcement', 'template_proof']);
const CHILD_FACING_MATURITIES = new Set(['V5', 'V6']);

const asObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

const requiredString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Vocabulary visual runtime plan requires ${field}`);
  return value;
};

const optionalString = (value: unknown, field: string): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') throw new Error(`Vocabulary visual runtime plan ${field} must be a string or null`);
  return value;
};

const enumValue = <T extends string>(value: unknown, allowed: Set<T>, field: string): T => {
  if (typeof value !== 'string' || !allowed.has(value as T)) {
    throw new Error(`Vocabulary visual runtime plan has invalid ${field} ${String(value)}`);
  }
  return value as T;
};

const normalizeParameters = (value: unknown): Record<string, string | number | boolean> => {
  const result: Record<string, string | number | boolean> = {};
  for (const [key, raw] of Object.entries(asObject(value))) {
    if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') result[key] = raw;
    else if (raw !== undefined && raw !== null) throw new Error(`Vocabulary visual runtime parameter ${key} must be scalar`);
  }
  return result;
};

const normalizeStringArray = (value: unknown, field: string): string[] => {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(`Vocabulary visual runtime plan ${field} must be an array`);
  const result = value.map((item) => requiredString(item, `${field} item`));
  if (new Set(result).size !== result.length) throw new Error(`Vocabulary visual runtime plan ${field} must not contain duplicates`);
  return result;
};

const normalizePositiveIntegerArray = (value: unknown, field: string): number[] => {
  if (!Array.isArray(value)) throw new Error(`Vocabulary visual runtime ${field} must be an array`);
  const result = value.map((item) => {
    if (!Number.isInteger(item) || Number(item) < 1) throw new Error(`Vocabulary visual runtime ${field} must contain positive integers`);
    return Number(item);
  });
  if (new Set(result).size !== result.length) throw new Error(`Vocabulary visual runtime ${field} must not contain duplicates`);
  return result;
};

const normalizePlan = (value: unknown): VocabularyVisualRuntimePlan => {
  const raw = asObject(value);
  return {
    knowledgeRef: optionalString(raw.knowledgeRef, 'knowledgeRef'),
    runtimeUsage: enumValue(raw.runtimeUsage, RUNTIME_USAGE, 'runtimeUsage'),
    senseKey: requiredString(raw.senseKey, 'senseKey'),
    lemma: requiredString(raw.lemma, 'lemma'),
    strategy: enumValue(raw.strategy, STRATEGIES, 'strategy'),
    sceneTemplate: optionalString(raw.sceneTemplate, 'sceneTemplate'),
    maturity: requiredString(raw.maturity, 'maturity'),
    motionPolicy: enumValue(raw.motionPolicy, MOTION_POLICIES, 'motionPolicy'),
    answerSafety: enumValue(raw.answerSafety, ANSWER_SAFETY, 'answerSafety'),
    visualRef: optionalString(raw.visualRef, 'visualRef'),
    parameters: normalizeParameters(raw.parameters),
    semanticDepthPatternRefs: normalizeStringArray(raw.semanticDepthPatternRefs, 'semanticDepthPatternRefs')
  };
};

const rawRuntimePlans = runtimePlansJson as unknown as RawRuntimePlanFile;
if (rawRuntimePlans.schemaVersion !== 1 || rawRuntimePlans.issueRef !== 80 || !Array.isArray(rawRuntimePlans.plans)) {
  throw new Error('Invalid generated vocabulary visual runtime plan file');
}

const runtimePlans: RuntimePlanFile = {
  schemaVersion: 1,
  issueRef: 80,
  semanticDepthIssueRefs: normalizePositiveIntegerArray(rawRuntimePlans.semanticDepthIssueRefs, 'semanticDepthIssueRefs'),
  plans: rawRuntimePlans.plans.map(normalizePlan)
};

const bySenseKey = new Map<string, VocabularyVisualRuntimePlan>();
const byKnowledgeRef = new Map<string, VocabularyVisualRuntimePlan>();
for (const plan of runtimePlans.plans) {
  if (bySenseKey.has(plan.senseKey)) throw new Error(`Duplicate vocabulary visual runtime senseKey ${plan.senseKey}`);
  bySenseKey.set(plan.senseKey, plan);

  if (plan.knowledgeRef) {
    if (byKnowledgeRef.has(plan.knowledgeRef)) {
      throw new Error(`Duplicate vocabulary visual runtime knowledgeRef ${plan.knowledgeRef}`);
    }
    byKnowledgeRef.set(plan.knowledgeRef, plan);
  }
}

export function isVocabularyVisualPlanChildFacing(plan: VocabularyVisualRuntimePlan | null | undefined): boolean {
  return Boolean(plan && plan.runtimeUsage === 'knowledge_reinforcement' && CHILD_FACING_MATURITIES.has(plan.maturity));
}

export function resolveVocabularyVisualPlan(senseKey: string): VocabularyVisualRuntimePlan | null {
  return bySenseKey.get(senseKey) ?? null;
}

export function resolveVocabularyVisualPlanForKnowledgeRefs(knowledgeRefs: string[] = []): VocabularyVisualRuntimePlan | null {
  for (const knowledgeRef of knowledgeRefs) {
    const plan = byKnowledgeRef.get(knowledgeRef);
    if (isVocabularyVisualPlanChildFacing(plan)) return plan ?? null;
  }
  return null;
}

export function getVocabularyVisualRuntimePlans(): VocabularyVisualRuntimePlan[] {
  return runtimePlans.plans.map((plan) => ({
    ...plan,
    parameters: { ...plan.parameters },
    semanticDepthPatternRefs: [...plan.semanticDepthPatternRefs]
  }));
}
