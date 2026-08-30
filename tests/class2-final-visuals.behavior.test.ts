import { describe, expect, it } from 'vitest';
import { resolveSemanticVisualRefs, resolveVisualDefinition } from '../src/presentation/visualRegistry';

const expected = new Map([
  ['caravan', 'entity.housing.caravan'],
  ['moonlight', 'entity.universe.moonlight'],
  ['neem', 'entity.plant.neem'],
  ['orbit', 'entity.universe.orbit'],
  ['pea', 'entity.plant.pea'],
  ['plateau', 'entity.earth.plateau'],
  ['pumpkin', 'entity.plant.pumpkin'],
  ['saturn', 'entity.universe.saturn'],
  ['school-uniform', 'entity.clothing.school-uniform'],
  ['sharp-tools', 'entity.safety.sharp-tools'],
  ['television', 'entity.communication.television']
]);

describe('final concrete Class 2 visual review', () => {
  it('resolves each remaining unambiguous semantic identity through the final renderer', () => {
    for (const [semanticRef, visualRef] of expected) {
      expect(resolveSemanticVisualRefs(semanticRef), semanticRef).toEqual([visualRef]);
      expect(resolveVisualDefinition(visualRef), visualRef).toMatchObject({ renderer: 'class2-final-icon' });
    }
  });

  it('keeps the diversity concept different-festivals textual instead of collapsing it to one festival image', () => {
    expect(resolveSemanticVisualRefs('different-festivals')).toEqual([]);
  });
});
