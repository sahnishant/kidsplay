import { describe, expect, it } from 'vitest';
import {
  getRegisteredVisualRefs,
  getVisualDefinitions,
  resolveItemVisualRefs,
  resolveLabelVisualRefs,
  resolveSemanticVisualRefs,
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
    expect(resolveVisualDefinition('entity.animal.rhinoceros')).toMatchObject({
      renderer: 'animal-expansion-icon',
      glyph: 'rhinoceros'
    });
    expect(resolveVisualDefinition('entity.concept.domestic-animal')).toMatchObject({
      renderer: 'concept-icon',
      glyph: 'domestic-animal'
    });
    expect(resolveVisualDefinition('entity.universe.jupiter')).toMatchObject({
      renderer: 'curriculum-icon',
      glyph: 'jupiter'
    });
  });

  it('resolves canonical semantic ids independently of display wording', () => {
    expect(resolveSemanticVisualRefs('seahorse')).toEqual(['entity.animal.seahorse']);
    expect(resolveSemanticVisualRefs('kennel')).toEqual(['entity.animal-home.kennel']);
    expect(resolveSemanticVisualRefs('domestic-animal')).toEqual(['entity.concept.domestic-animal']);
    expect(resolveSemanticVisualRefs('air-space')).toEqual(['entity.concept.air-space']);
    expect(resolveSemanticVisualRefs('wash-produce')).toEqual(['entity.hygiene.wash-produce']);
    expect(resolveSemanticVisualRefs('earth-rotation')).toEqual(['entity.universe.earth-rotation']);
    expect(resolveSemanticVisualRefs('family-tree')).toEqual(['entity.family.family-tree']);
    expect(resolveSemanticVisualRefs('steep-descent-sign')).toEqual(['entity.safety.steep-descent-sign']);
    expect(resolveSemanticVisualRefs('sight')).toEqual(['entity.body.eyes']);
    expect(resolveSemanticVisualRefs('hearing')).toEqual(['entity.body.ears']);
    expect(resolveSemanticVisualRefs('smell')).toEqual(['entity.body.nose']);
    expect(resolveItemVisualRefs({ label: 'Caballito', semanticRef: 'seahorse' })).toEqual([
      'entity.animal.seahorse'
    ]);
    expect(resolveItemVisualRefs({ label: 'Not a dog', semanticRef: 'dog' })).toEqual([
      'entity.animal.dog'
    ]);
  });

  it('uses exact aliases for legacy option labels instead of fuzzy matching', () => {
    expect(resolveLabelVisualRefs('Dog')).toEqual(['entity.animal.dog']);
    expect(resolveLabelVisualRefs('Moving air')).toEqual(['entity.nature.wind']);
    expect(resolveLabelVisualRefs('Moon')).toEqual(['entity.universe.moon']);
    expect(resolveLabelVisualRefs('Covered food')).toEqual(['entity.food.covered']);
    expect(resolveLabelVisualRefs('Seahorse')).toEqual(['entity.animal.seahorse']);
    expect(resolveLabelVisualRefs('Kennel')).toEqual(['entity.animal-home.kennel']);
    expect(resolveLabelVisualRefs('Avoid spoiled food')).toEqual(['entity.hygiene.avoid-spoiled']);
    expect(resolveLabelVisualRefs('Reach a marked zebra crossing')).toEqual(['entity.safety.zebra-reach']);
    expect(resolveLabelVisualRefs('Check that traffic has stopped and it is safe')).toEqual(['entity.safety.traffic-check']);
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
      semanticRef: 'dog',
      visualRefs: ['entity.animal.whale']
    })).toEqual(['entity.animal.whale']);
    expect(resolveItemVisualRefs({ label: 'Dog' }, false)).toEqual([]);
  });

  it('keeps the registry unique and broad enough for reusable Class 2 EVS coverage', () => {
    const refs = getRegisteredVisualRefs();
    expect(new Set(refs).size).toBe(refs.length);
    expect(refs.length).toBeGreaterThanOrEqual(190);
    expect(getVisualDefinitions().every((visual) => visual.aliases.length > 0)).toBe(true);
  });
});
