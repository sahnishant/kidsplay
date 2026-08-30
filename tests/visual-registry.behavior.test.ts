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

  it('loads independent utility SVG packs through the same semantic contract', () => {
    expect(resolveVisualDefinition('entity.transport.ambulance')).toMatchObject({
      renderer: 'utility-icon',
      glyph: 'ambulance'
    });
    expect(resolveVisualDefinition('entity.communication.telephone')).toMatchObject({
      renderer: 'utility-icon',
      glyph: 'telephone',
      motion: 'wiggle'
    });
  });

  it('uses exact aliases for legacy option labels instead of fuzzy matching', () => {
    expect(resolveLabelVisualRefs('Dog')).toEqual(['entity.animal.dog']);
    expect(resolveLabelVisualRefs('Moving air')).toEqual(['entity.nature.wind']);
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

  it('keeps the registry unique and large enough to be a reusable first set', () => {
    const refs = getRegisteredVisualRefs();
    expect(new Set(refs).size).toBe(refs.length);
    expect(refs.length).toBeGreaterThanOrEqual(70);
    expect(getVisualDefinitions().every((visual) => visual.aliases.length > 0)).toBe(true);
  });
});
