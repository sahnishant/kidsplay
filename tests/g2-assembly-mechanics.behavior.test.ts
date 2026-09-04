import { describe, expect, it } from 'vitest';
import {
  evaluateAssemblyResponse,
  validateAssemblyDefinition,
  type AssemblyDefinition
} from '../src/mechanics/assembly';

const unordered: AssemblyDefinition = {
  schemaVersion: 1,
  assemblyId: 'assembly.birdhouse.repair',
  operation: 'repair_restore',
  orderMode: 'unordered',
  parts: [
    { partId: 'part.roof', semanticRef: 'semantic.birdhouse.roof' },
    { partId: 'part.perch', semanticRef: 'semantic.birdhouse.perch' }
  ],
  slots: [
    { slotId: 'slot.roof', semanticRef: 'semantic.birdhouse.roof-slot' },
    { slotId: 'slot.perch', semanticRef: 'semantic.birdhouse.perch-slot' }
  ],
  requiredAssignments: [
    { partId: 'part.roof', slotId: 'slot.roof' },
    { partId: 'part.perch', slotId: 'slot.perch' }
  ],
  retryPolicy: 'reset_for_retry_preserve_first_attempt'
};

const ordered: AssemblyDefinition = {
  schemaVersion: 1,
  assemblyId: 'assembly.plant.steps',
  operation: 'place_part_in_slot',
  orderMode: 'ordered',
  parts: [
    { partId: 'part.seed', semanticRef: 'semantic.seed' },
    { partId: 'part.water', semanticRef: 'semantic.water' }
  ],
  slots: [
    { slotId: 'slot.soil', semanticRef: 'semantic.soil' },
    { slotId: 'slot.water', semanticRef: 'semantic.water-target' }
  ],
  requiredAssignments: [
    { partId: 'part.seed', slotId: 'slot.soil' },
    { partId: 'part.water', slotId: 'slot.water' }
  ],
  requiredPlacementOrder: ['part.seed', 'part.water'],
  retryPolicy: 'reset_for_retry_preserve_first_attempt'
};

describe('G2 reusable assembly mechanics', () => {
  it('supports unordered repair/restore without making interaction order meaningful', () => {
    const definition = validateAssemblyDefinition(unordered);
    expect(definition.requiredPlacementOrder).toBeUndefined();
    expect(evaluateAssemblyResponse(definition, {
      assignments: [
        { partId: 'part.perch', slotId: 'slot.perch' },
        { partId: 'part.roof', slotId: 'slot.roof' }
      ]
    })).toEqual({ correct: true, assignmentCorrect: true, orderCorrect: true });
  });

  it('supports ordered assembly only when semantic/process order is explicitly declared', () => {
    const definition = validateAssemblyDefinition(ordered);
    expect(evaluateAssemblyResponse(definition, {
      assignments: definition.requiredAssignments,
      placementOrder: ['part.seed', 'part.water']
    }).correct).toBe(true);

    expect(evaluateAssemblyResponse(definition, {
      assignments: definition.requiredAssignments,
      placementOrder: ['part.water', 'part.seed']
    })).toEqual({ correct: false, assignmentCorrect: true, orderCorrect: false });
  });

  it('fails closed when unordered content tries to smuggle in an order constraint', () => {
    expect(() => validateAssemblyDefinition({
      ...unordered,
      requiredPlacementOrder: ['part.roof', 'part.perch']
    })).toThrow(/unordered assembly may not carry requiredPlacementOrder/);
  });

  it('requires every part and slot to be used exactly once by the interaction truth', () => {
    expect(() => validateAssemblyDefinition({
      ...unordered,
      requiredAssignments: [
        { partId: 'part.roof', slotId: 'slot.roof' },
        { partId: 'part.roof', slotId: 'slot.perch' }
      ]
    })).toThrow(/requiredAssignments.partId contains duplicates/);
  });

  it('keeps retry policy explicitly bound to first-attempt preservation', () => {
    expect(() => validateAssemblyDefinition({
      ...unordered,
      retryPolicy: 'reset_for_retry' as never
    })).toThrow(/must preserve first-attempt evidence/);
  });

  it('distinguishes assignment correctness from order correctness for honest feedback/scaffolding', () => {
    const result = evaluateAssemblyResponse(ordered, {
      assignments: [
        { partId: 'part.seed', slotId: 'slot.water' },
        { partId: 'part.water', slotId: 'slot.soil' }
      ],
      placementOrder: ['part.seed', 'part.water']
    });
    expect(result).toEqual({ correct: false, assignmentCorrect: false, orderCorrect: true });
  });
});
