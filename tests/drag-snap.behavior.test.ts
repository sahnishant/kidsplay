import { describe, expect, it } from 'vitest';
import { resolveForgivingDropTarget } from '../src/mechanics/dragSnap';

const targets = [
  { targetId: 'slot.left', left: 0, top: 0, right: 100, bottom: 100 },
  { targetId: 'slot.right', left: 150, top: 0, right: 250, bottom: 100 }
];

describe('forgiving drag/snap motor tolerance', () => {
  it('keeps direct DOM hit authority when a target was actually hit', () => {
    expect(resolveForgivingDropTarget({ x: 140, y: 50 }, 'slot.right', targets)).toBe('slot.right');
  });

  it('snaps a small near miss to the nearest target', () => {
    expect(resolveForgivingDropTarget({ x: 112, y: 50 }, undefined, targets, 24)).toBe('slot.left');
    expect(resolveForgivingDropTarget({ x: 138, y: 50 }, undefined, targets, 24)).toBe('slot.right');
  });

  it('does not convert a distant miss into an accidental answer', () => {
    expect(resolveForgivingDropTarget({ x: 125, y: 160 }, undefined, targets, 24)).toBeUndefined();
  });

  it('uses deterministic target ids only as a tie-break after geometric distance', () => {
    const tied = [
      { targetId: 'slot.b', left: 0, top: 0, right: 100, bottom: 100 },
      { targetId: 'slot.a', left: 0, top: 0, right: 100, bottom: 100 }
    ];
    expect(resolveForgivingDropTarget({ x: 110, y: 50 }, undefined, tied, 24)).toBe('slot.a');
  });

  it('rejects invalid tolerance instead of silently widening motor acceptance', () => {
    expect(() => resolveForgivingDropTarget({ x: 0, y: 0 }, undefined, targets, -1)).toThrow(/non-negative/);
  });
});
