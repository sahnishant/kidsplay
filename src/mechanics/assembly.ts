export type AssemblyOperation = 'place_part_in_slot' | 'repair_restore' | 'connect_parts';
export type AssemblyOrderMode = 'unordered' | 'ordered';

export interface AssemblyPart {
  partId: string;
  semanticRef: string;
}

export interface AssemblySlot {
  slotId: string;
  semanticRef: string;
}

export interface AssemblyAssignment {
  partId: string;
  slotId: string;
}

export interface AssemblyDefinition {
  schemaVersion: 1;
  assemblyId: string;
  operation: AssemblyOperation;
  orderMode: AssemblyOrderMode;
  parts: readonly AssemblyPart[];
  slots: readonly AssemblySlot[];
  /** Formatter/evaluator truth for this interaction instance; not canonical knowledge. */
  requiredAssignments: readonly AssemblyAssignment[];
  /** Required only when semantic/process meaning makes placement order relevant. */
  requiredPlacementOrder?: readonly string[];
  retryPolicy: 'reset_for_retry_preserve_first_attempt';
}

export interface AssemblyResponse {
  assignments: readonly AssemblyAssignment[];
  placementOrder?: readonly string[];
}

export interface AssemblyEvaluation {
  correct: boolean;
  assignmentCorrect: boolean;
  orderCorrect: boolean;
}

const STABLE_ID = /^[a-z0-9]+(?:[._:#-][a-z0-9]+)*$/i;
const VALID_OPERATIONS = new Set<AssemblyOperation>(['place_part_in_slot', 'repair_restore', 'connect_parts']);

function assertStable(value: unknown, context: string): string {
  if (typeof value !== 'string' || !value.trim() || !STABLE_ID.test(value)) throw new Error(`${context} must be a stable id/ref`);
  return value;
}

function assertUnique(values: readonly string[], context: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${context} contains duplicates`);
}

export function validateAssemblyDefinition(value: AssemblyDefinition): AssemblyDefinition {
  if (value.schemaVersion !== 1) throw new Error('Assembly definition must use schemaVersion 1');
  const assemblyId = assertStable(value.assemblyId, 'assemblyId');
  if (!VALID_OPERATIONS.has(value.operation)) throw new Error(`${assemblyId}: invalid assembly operation`);
  if (value.orderMode !== 'unordered' && value.orderMode !== 'ordered') throw new Error(`${assemblyId}: invalid order mode`);
  if (!Array.isArray(value.parts) || value.parts.length < 2) throw new Error(`${assemblyId}: at least two parts are required`);
  if (!Array.isArray(value.slots) || value.slots.length < 2) throw new Error(`${assemblyId}: at least two slots are required`);

  const parts = value.parts.map((part, index) => ({
    partId: assertStable(part.partId, `${assemblyId}.parts[${index}].partId`),
    semanticRef: assertStable(part.semanticRef, `${assemblyId}.parts[${index}].semanticRef`)
  }));
  const slots = value.slots.map((slot, index) => ({
    slotId: assertStable(slot.slotId, `${assemblyId}.slots[${index}].slotId`),
    semanticRef: assertStable(slot.semanticRef, `${assemblyId}.slots[${index}].semanticRef`)
  }));
  assertUnique(parts.map((part) => part.partId), `${assemblyId}.parts`);
  assertUnique(slots.map((slot) => slot.slotId), `${assemblyId}.slots`);

  if (!Array.isArray(value.requiredAssignments) || value.requiredAssignments.length !== parts.length) {
    throw new Error(`${assemblyId}: requiredAssignments must place every part exactly once`);
  }
  const partIds = new Set(parts.map((part) => part.partId));
  const slotIds = new Set(slots.map((slot) => slot.slotId));
  const requiredAssignments = value.requiredAssignments.map((assignment, index) => {
    const partId = assertStable(assignment.partId, `${assemblyId}.requiredAssignments[${index}].partId`);
    const slotId = assertStable(assignment.slotId, `${assemblyId}.requiredAssignments[${index}].slotId`);
    if (!partIds.has(partId)) throw new Error(`${assemblyId}: unknown assigned part ${partId}`);
    if (!slotIds.has(slotId)) throw new Error(`${assemblyId}: unknown assigned slot ${slotId}`);
    return { partId, slotId };
  });
  assertUnique(requiredAssignments.map((assignment) => assignment.partId), `${assemblyId}.requiredAssignments.partId`);
  assertUnique(requiredAssignments.map((assignment) => assignment.slotId), `${assemblyId}.requiredAssignments.slotId`);

  let requiredPlacementOrder: string[] | undefined;
  if (value.orderMode === 'ordered') {
    if (!Array.isArray(value.requiredPlacementOrder) || value.requiredPlacementOrder.length !== parts.length) {
      throw new Error(`${assemblyId}: ordered assembly requires one placement-order entry per part`);
    }
    requiredPlacementOrder = value.requiredPlacementOrder.map((partId, index) => {
      const stable = assertStable(partId, `${assemblyId}.requiredPlacementOrder[${index}]`);
      if (!partIds.has(stable)) throw new Error(`${assemblyId}: placement order contains unknown part ${stable}`);
      return stable;
    });
    assertUnique(requiredPlacementOrder, `${assemblyId}.requiredPlacementOrder`);
  } else if (value.requiredPlacementOrder !== undefined) {
    throw new Error(`${assemblyId}: unordered assembly may not carry requiredPlacementOrder`);
  }

  if (value.retryPolicy !== 'reset_for_retry_preserve_first_attempt') {
    throw new Error(`${assemblyId}: retry policy must preserve first-attempt evidence`);
  }

  return {
    schemaVersion: 1,
    assemblyId,
    operation: value.operation,
    orderMode: value.orderMode,
    parts,
    slots,
    requiredAssignments,
    ...(requiredPlacementOrder ? { requiredPlacementOrder } : {}),
    retryPolicy: 'reset_for_retry_preserve_first_attempt'
  };
}

function assignmentKey(assignment: AssemblyAssignment): string {
  return `${assignment.partId}->${assignment.slotId}`;
}

export function evaluateAssemblyResponse(
  definition: AssemblyDefinition,
  response: AssemblyResponse
): AssemblyEvaluation {
  const validated = validateAssemblyDefinition(definition);
  const expected = new Set(validated.requiredAssignments.map(assignmentKey));
  const receivedAssignments = response.assignments.map((assignment) => ({
    partId: assertStable(assignment.partId, `${validated.assemblyId}.response.partId`),
    slotId: assertStable(assignment.slotId, `${validated.assemblyId}.response.slotId`)
  }));
  const received = new Set(receivedAssignments.map(assignmentKey));
  const assignmentCorrect =
    receivedAssignments.length === validated.requiredAssignments.length &&
    received.size === expected.size &&
    [...received].every((key) => expected.has(key));

  let orderCorrect = true;
  if (validated.orderMode === 'ordered') {
    const placementOrder = response.placementOrder ?? [];
    orderCorrect =
      placementOrder.length === validated.requiredPlacementOrder!.length &&
      placementOrder.every((partId, index) => partId === validated.requiredPlacementOrder![index]);
  }

  return {
    correct: assignmentCorrect && orderCorrect,
    assignmentCorrect,
    orderCorrect
  };
}
