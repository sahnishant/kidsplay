import { describe, expect, it } from 'vitest';
import {
  resolveLabelVisualRefs,
  resolveSemanticVisualRefs,
  resolveVisualDefinition
} from '../src/presentation/visualRegistry';

const expected = new Map([
  ['exercise', 'entity.habit.exercise'],
  ['air-pollution', 'entity.air.air-pollution'],
  ['balanced-diet', 'entity.food.balanced-diet'],
  ['bird-beak', 'entity.animal-part.bird-beak'],
  ['bird-feathers', 'entity.animal-part.bird-feathers'],
  ['bird-wings', 'entity.animal-part.bird-wings'],
  ['carbohydrates', 'entity.nutrient.carbohydrates'],
  ['email', 'entity.communication.email'],
  ['evaporation-separation', 'entity.process.evaporation-separation'],
  ['farmer', 'entity.people.farmer'],
  ['fats', 'entity.nutrient.fats'],
  ['filtration', 'entity.process.filtration']
]);

describe('high-value Class 2 concept visuals', () => {
  it('resolves the concrete semantic ids selected by the opportunity audit', () => {
    for (const [semanticRef, visualRef] of expected) {
      expect(resolveSemanticVisualRefs(semanticRef), semanticRef).toEqual([visualRef]);
      expect(resolveVisualDefinition(visualRef), visualRef).toMatchObject({
        renderer: 'class2-concept-icon'
      });
    }
  });

  it('supports exact useful labels without fuzzy sentence matching', () => {
    expect(resolveLabelVisualRefs('Air pollution')).toEqual(['entity.air.air-pollution']);
    expect(resolveLabelVisualRefs('Balanced diet')).toEqual(['entity.food.balanced-diet']);
    expect(resolveLabelVisualRefs('Email')).toEqual(['entity.communication.email']);
    expect(resolveLabelVisualRefs('Evaporation')).toEqual(['entity.process.evaporation-separation']);
    expect(resolveLabelVisualRefs('The farmer sends an email after filtration')).toEqual([]);
  });

  it('does not turn audit-only vocabulary or predicates into automatic visuals', () => {
    expect(resolveSemanticVisualRefs('ancient')).toEqual([]);
    expect(resolveSemanticVisualRefs('natural')).toEqual([]);
    expect(resolveSemanticVisualRefs('control')).toEqual([]);
  });
});
