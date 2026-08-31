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

export interface VocabularyVisualRuntimePlan {
  knowledgeRef: string;
  senseKey: string;
  lemma: string;
  strategy: VocabularyVisualStrategy;
  sceneTemplate: string | null;
  maturity: string;
  motionPolicy: VocabularyMotionPolicy;
  answerSafety: VocabularyAnswerSafety;
  visualRef: string | null;
  parameters: Record<string, string | number | boolean>;
}

interface RuntimePlanFile {
  schemaVersion: number;
  issueRef: number;
  plans: VocabularyVisualRuntimePlan[];
}

const runtimePlans = runtimePlansJson as RuntimePlanFile;
const bySenseKey = new Map(runtimePlans.plans.map((plan) => [plan.senseKey, plan]));
const byKnowledgeRef = new Map(runtimePlans.plans.map((plan) => [plan.knowledgeRef, plan]));

export function resolveVocabularyVisualPlan(senseKey: string): VocabularyVisualRuntimePlan | null {
  return bySenseKey.get(senseKey) ?? null;
}

export function resolveVocabularyVisualPlanForKnowledgeRefs(knowledgeRefs: string[] = []): VocabularyVisualRuntimePlan | null {
  for (const knowledgeRef of knowledgeRefs) {
    const plan = byKnowledgeRef.get(knowledgeRef);
    if (plan) return plan;
  }
  return null;
}

export function getVocabularyVisualRuntimePlans(): VocabularyVisualRuntimePlan[] {
  return runtimePlans.plans.map((plan) => ({ ...plan, parameters: { ...plan.parameters } }));
}
