import { describe, expect, it } from 'vitest';
import {
  getRegisteredVisualRefs,
  getVisualDefinitions,
  resolveItemVisualRefs,
  resolveLabelVisualRefs,
  resolveVisualDefinition
} from '../src/presentation/visualRegistry';

describe('semantic visual registry', () => {
  it('resolves core animal visuals to reusable artwork and motion', () => {
    expect(resolveVisualDefinition('entity.animal.dog')).toMatchObject({
      renderer: 'scene-icon',
      glyph: 'dog-happy',
      motion: 'wag'
    });
    expect(resolveVisualDefinition('entity.animal.whale')).toMatchObject({
      glyph: 'whale',
      motion: 'swim'
    });
  });

  it('loads independent renderer packs through the same semantic contract', () => {
    expect(resolveVisualDefinition('entity.transport.ambulance')).toMatchObject({
      renderer: 'utility-icon',
      glyph: 'ambulance'
    });
    expect(resolveVisualDefinition('entity.universe.moon')).toMatchObject({
      renderer: 'nature-space-icon',
      glyph: 'moon'
    });
    expect(resolveVisualDefinition('entity.hygiene.soap')).toMatchObject({
      renderer: 'everyday-icon',
      glyph: 'soap'
    });
    expect(resolveVisualDefinition('entity.lifecycle.caterpillar')).toMatchObject({
      renderer: 'process-icon',
      glyph: 'caterpillar',
      motion: 'wiggle'
    });
  });

  it('uses exact aliases for legacy option labels instead of fuzzy matching', () => {
    expect(resolveLabelVisualRefs('Dog')).toEqual(['entity.animal.dog']);
    expect(resolveLabelVisualRefs('Moving air')).toEqual(['entity.nature.wind']);
    expect(resolveLabelVisualRefs('Moon')).toEqual(['entity.universe.moon']);
    expect(resolveLabelVisualRefs('Covered food')).toEqual(['entity.food.covered']);
    expect(resolveLabelVisualRefs('A dog runs beside a school bus')).toEqual([]);
  });

  it('can compose two or three exact semantic entities for compact option labels', () => {
    expect(resolveLabelVisualRefs('Ears and eyes')).toEqual([
      'entity.body.ears',
      'entity.body.eyes'
    ]);
    expect(resolveLabelVisualRefs('Rice + dal + spinach')).toEqual([
      'entity.food.rice',
      'entity.food.pulses',
      'entity.food.spinach'
    ]);
    expect(resolveLabelVisualRefs('Telephone and ambulance')).toEqual([
      'entity.communication.telephone',
      'entity.transport.ambulance'
    ]);
  });

  it('keeps authored refs authoritative and can disable label inference', () => {
    expect(resolveItemVisualRefs({
      label: 'Dog',
      visualRefs: ['entity.animal.whale']
    })).toEqual(['entity.animal.whale']);
    expect(resolveItemVisualRefs({ label: 'Dog' }, false)).toEqual([]);
  });

  it('keeps the registry unique and broad enough for reusable Class 2 EVS coverage', () => {
    const refs = getRegisteredVisualRefs();
    expect(new Set(refs).size).toBe(refs.length);
    expect(refs.length).toBeGreaterThanOrEqual(110);
    expect(getVisualDefinitions().every((visual) => visual.aliases.length > 0)).toBe(true);
  });
});
