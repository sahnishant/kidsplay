import { describe, expect, it } from 'vitest';
import {
  resolveSemanticVisualRefs,
  resolveVisualDefinition
} from '../src/presentation/visualRegistry';

describe('food source semantic visuals', () => {
  it('resolves concrete food/source relationships to reusable property SVGs', () => {
    const refs = {
      eggs: 'entity.property.eggs',
      flour: 'entity.property.flour',
      'rice-plant': 'entity.property.rice-plant',
      mustard: 'entity.property.mustard',
      oil: 'entity.property.oil',
      'energy-cereal': 'entity.property.energy-cereal',
      'body-building-pulse': 'entity.property.body-building-pulse',
      'body-building-dairy': 'entity.property.body-building-dairy'
    } as const;

    for (const [semanticRef, visualRef] of Object.entries(refs)) {
      expect(resolveSemanticVisualRefs(semanticRef)).toEqual([visualRef]);
      expect(resolveVisualDefinition(visualRef)).toMatchObject({ renderer: 'property-icon' });
    }
  });

  it('keeps the visuals tied to the intended concrete glyphs', () => {
    expect(resolveVisualDefinition('entity.property.eggs')?.glyph).toBe('eggs');
    expect(resolveVisualDefinition('entity.property.flour')?.glyph).toBe('flour');
    expect(resolveVisualDefinition('entity.property.rice-plant')?.glyph).toBe('rice-plant');
    expect(resolveVisualDefinition('entity.property.mustard')?.glyph).toBe('mustard');
    expect(resolveVisualDefinition('entity.property.oil')?.glyph).toBe('oil');
  });
});
