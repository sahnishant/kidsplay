export type WorldActionFamily = 'practical_life' | 'cause_effect';

export type PracticalLifeAction =
  | 'pack'
  | 'place'
  | 'sort'
  | 'help'
  | 'clean'
  | 'feed'
  | 'water'
  | 'safety_choice';

export type CauseEffectAction =
  | 'push'
  | 'pull'
  | 'fill'
  | 'empty'
  | 'grow'
  | 'float_sink'
  | 'observe_change';

export type WorldActionKind = PracticalLifeAction | CauseEffectAction;
export type WorldActionEvidenceClass = 'exploration' | 'guided_practice' | 'evaluative';

export interface WorldStateTransitionRef {
  beforeStateRef: string;
  afterStateRef: string;
  causalKnowledgeRef: string;
}

export interface WorldActionDefinition {
  schemaVersion: 1;
  actionId: string;
  family: WorldActionFamily;
  action: WorldActionKind;
  canonicalGoalRefs: readonly string[];
  subjectSemanticRefs: readonly string[];
  targetSemanticRefs?: readonly string[];
  stateTransition?: WorldStateTransitionRef;
  evidenceClass: WorldActionEvidenceClass;
  retryPolicy: 'not_applicable' | 'reset_for_retry_preserve_first_attempt';
}

const PRACTICAL_ACTIONS = new Set<PracticalLifeAction>([
  'pack',
  'place',
  'sort',
  'help',
  'clean',
  'feed',
  'water',
  'safety_choice'
]);
const CAUSE_EFFECT_ACTIONS = new Set<CauseEffectAction>([
  'push',
  'pull',
  'fill',
  'empty',
  'grow',
  'float_sink',
  'observe_change'
]);
const STABLE_REF = /^[a-z0-9]+(?:[._:#-][a-z0-9]+)*$/i;

function assertStableRef(value: unknown, context: string): string {
  if (typeof value !== 'string' || !value.trim() || !STABLE_REF.test(value)) {
    throw new Error(`${context} must be a stable ref`);
  }
  return value;
}

function uniqueRefs(value: unknown, context: string, allowEmpty = false): string[] {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    throw new Error(`${context} must be ${allowEmpty ? 'an' : 'a non-empty'} array`);
  }
  const refs = value.map((item, index) => assertStableRef(item, `${context}[${index}]`));
  if (new Set(refs).size !== refs.length) throw new Error(`${context} contains duplicates`);
  return refs;
}

export function validateWorldActionDefinition(value: WorldActionDefinition): WorldActionDefinition {
  if (value.schemaVersion !== 1) throw new Error('World action definition must use schemaVersion 1');
  const actionId = assertStableRef(value.actionId, 'actionId');
  if (value.family !== 'practical_life' && value.family !== 'cause_effect') {
    throw new Error(`${actionId}: invalid action family`);
  }

  if (value.family === 'practical_life' && !PRACTICAL_ACTIONS.has(value.action as PracticalLifeAction)) {
    throw new Error(`${actionId}: action ${value.action} is not a practical-life action`);
  }
  if (value.family === 'cause_effect' && !CAUSE_EFFECT_ACTIONS.has(value.action as CauseEffectAction)) {
    throw new Error(`${actionId}: action ${value.action} is not a cause/effect action`);
  }

  const canonicalGoalRefs = uniqueRefs(value.canonicalGoalRefs, `${actionId}.canonicalGoalRefs`);
  const subjectSemanticRefs = uniqueRefs(value.subjectSemanticRefs, `${actionId}.subjectSemanticRefs`);
  const targetSemanticRefs = value.targetSemanticRefs === undefined
    ? undefined
    : uniqueRefs(value.targetSemanticRefs, `${actionId}.targetSemanticRefs`);

  let stateTransition: WorldStateTransitionRef | undefined;
  if (value.stateTransition !== undefined) {
    stateTransition = {
      beforeStateRef: assertStableRef(value.stateTransition.beforeStateRef, `${actionId}.stateTransition.beforeStateRef`),
      afterStateRef: assertStableRef(value.stateTransition.afterStateRef, `${actionId}.stateTransition.afterStateRef`),
      causalKnowledgeRef: assertStableRef(value.stateTransition.causalKnowledgeRef, `${actionId}.stateTransition.causalKnowledgeRef`)
    };
    if (stateTransition.beforeStateRef === stateTransition.afterStateRef) {
      throw new Error(`${actionId}: state transition must visibly change state`);
    }
  }

  if (value.family === 'cause_effect' && !stateTransition) {
    throw new Error(`${actionId}: cause/effect action requires an explicit canonical state transition`);
  }
  if (value.family === 'practical_life' && value.action === 'sort' && !targetSemanticRefs?.length) {
    throw new Error(`${actionId}: sort requires explicit semantic targets`);
  }
  if ((value.action === 'feed' || value.action === 'water' || value.action === 'place' || value.action === 'pack') && !targetSemanticRefs?.length) {
    throw new Error(`${actionId}: ${value.action} requires an explicit target`);
  }

  if (!['exploration', 'guided_practice', 'evaluative'].includes(value.evidenceClass)) {
    throw new Error(`${actionId}: invalid evidence class`);
  }
  if (value.evidenceClass === 'evaluative' && value.retryPolicy !== 'reset_for_retry_preserve_first_attempt') {
    throw new Error(`${actionId}: evaluative action must preserve first-attempt evidence on retry`);
  }
  if (value.evidenceClass !== 'evaluative' && value.retryPolicy !== 'not_applicable') {
    throw new Error(`${actionId}: non-evaluative action may not manufacture retry/mastery semantics`);
  }

  return {
    schemaVersion: 1,
    actionId,
    family: value.family,
    action: value.action,
    canonicalGoalRefs,
    subjectSemanticRefs,
    ...(targetSemanticRefs ? { targetSemanticRefs } : {}),
    ...(stateTransition ? { stateTransition } : {}),
    evidenceClass: value.evidenceClass,
    retryPolicy: value.retryPolicy
  };
}
