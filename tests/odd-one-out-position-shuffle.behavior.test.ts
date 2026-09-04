import { describe, expect, it } from 'vitest';
import { createSeededRandom, shuffled } from '../src/mechanics/random';
import { resolveOddOneOutPlan } from '../src/experience/semanticChoiceSafety';

const resolved = resolveOddOneOutPlan({
  schemaVersion: 1,
  comparisonDimensionRef: 'dimension.test.shared-family',
  candidates: [
    { semanticRef: 'semantic.inlier.a', satisfiesRule: true },
    { semanticRef: 'semantic.inlier.b', satisfiesRule: true },
    { semanticRef: 'semantic.inlier.c', satisfiesRule: true },
    { semanticRef: 'semantic.odd', satisfiesRule: false }
  ]
});

describe('Odd One Out visible position', () => {
  it('moves the unique odd item through all four visible positions across deterministic session seeds', () => {
    const semanticRefs = [...resolved.inlierSemanticRefs, resolved.oddSemanticRef];
    const seenPositions = new Set<number>();
    for (let seed = 1; seed <= 256; seed += 1) {
      seenPositions.add(shuffled(semanticRefs, createSeededRandom(seed)).indexOf(resolved.oddSemanticRef));
    }
    expect([...seenPositions].sort()).toEqual([0, 1, 2, 3]);
  });

  it('does not change which semantic item is odd when presentation order changes', () => {
    for (let seed = 1; seed <= 32; seed += 1) {
      const visible = shuffled([...resolved.inlierSemanticRefs, resolved.oddSemanticRef], createSeededRandom(seed));
      expect(visible).toContain('semantic.odd');
      expect(resolved.oddSemanticRef).toBe('semantic.odd');
    }
  });
});
