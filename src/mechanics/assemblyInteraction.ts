import {
  evaluateAssemblyResponse,
  validateAssemblyDefinition,
  type AssemblyAssignment,
  type AssemblyDefinition,
  type AssemblyEvaluation
} from './assembly';

export interface AssemblyInteractionState {
  assignments: readonly AssemblyAssignment[];
  placementOrder: readonly string[];
  committedActionCount: number;
  /** Null until the first semantically committed placement occurs. */
  firstAttemptCorrect: boolean | null;
  completed: boolean;
  evaluation?: AssemblyEvaluation;
}

export interface AssemblyPlacementResult {
  state: AssemblyInteractionState;
  feedback: 'placed' | 'retry_in_place' | 'complete' | 'already_complete';
  autoSubmitted: boolean;
}

export function createAssemblyInteractionState(): AssemblyInteractionState {
  return {
    assignments: [],
    placementOrder: [],
    committedActionCount: 0,
    firstAttemptCorrect: null,
    completed: false
  };
}

/**
 * A drop is the commit action. Correct final placement evaluates immediately;
 * there is deliberately no second "Check Answer" transition in this state machine.
 */
export function commitAssemblyPlacement(
  definition: AssemblyDefinition,
  previous: AssemblyInteractionState,
  assignment: AssemblyAssignment
): AssemblyPlacementResult {
  const validated = validateAssemblyDefinition(definition);
  if (previous.completed) return { state: previous, feedback: 'already_complete', autoSubmitted: false };

  const expected = validated.requiredAssignments.find((candidate) => candidate.partId === assignment.partId);
  const slotExists = validated.slots.some((slot) => slot.slotId === assignment.slotId);
  if (!expected || !slotExists) throw new Error(`${validated.assemblyId}: placement references unknown part or slot`);

  const actionCorrect = expected.slotId === assignment.slotId;
  const firstAttemptCorrect = previous.firstAttemptCorrect === null ? actionCorrect : previous.firstAttemptCorrect;
  const committedActionCount = previous.committedActionCount + 1;

  if (!actionCorrect) {
    return {
      state: {
        ...previous,
        committedActionCount,
        firstAttemptCorrect
      },
      feedback: 'retry_in_place',
      autoSubmitted: false
    };
  }

  const withoutPart = previous.assignments.filter((item) => item.partId !== assignment.partId);
  const withoutSlot = withoutPart.filter((item) => item.slotId !== assignment.slotId);
  const assignments = [...withoutSlot, assignment];
  const placementOrder = previous.assignments.some((item) => item.partId === assignment.partId)
    ? [...previous.placementOrder]
    : [...previous.placementOrder, assignment.partId];
  const interactionComplete = assignments.length === validated.requiredAssignments.length;

  if (!interactionComplete) {
    return {
      state: {
        assignments,
        placementOrder,
        committedActionCount,
        firstAttemptCorrect,
        completed: false
      },
      feedback: 'placed',
      autoSubmitted: false
    };
  }

  const evaluation = evaluateAssemblyResponse(validated, {
    assignments,
    ...(validated.orderMode === 'ordered' ? { placementOrder } : {})
  });

  if (!evaluation.correct) {
    return {
      state: {
        assignments: [],
        placementOrder: [],
        committedActionCount,
        firstAttemptCorrect: false,
        completed: false,
        evaluation
      },
      feedback: 'retry_in_place',
      autoSubmitted: true
    };
  }

  return {
    state: {
      assignments,
      placementOrder,
      committedActionCount,
      firstAttemptCorrect,
      completed: true,
      evaluation
    },
    feedback: 'complete',
    autoSubmitted: true
  };
}
