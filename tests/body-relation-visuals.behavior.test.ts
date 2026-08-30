import { describe, expect, it } from 'vitest';
import {
  resolveSemanticVisualRefs,
  resolveVisualDefinition
} from '../src/presentation/visualRegistry';

describe('body relationship semantic visuals', () => {
  it('reuses existing lightweight SVG primitives for clear body relationships', () => {
    expect(resolveSemanticVisualRefs('digest-food')).toEqual(['entity.body.digest-food']);
    expect(resolveSemanticVisualRefs('bones')).toEqual(['entity.body.bones']);
    expect(resolveSemanticVisualRefs('walk-run')).toEqual(['entity.body.walk-run']);
    expect(resolveSemanticVisualRefs('turn-head')).toEqual(['entity.body.turn-head']);

    expect(resolveVisualDefinition('entity.body.digest-food')).toMatchObject({
      renderer: 'entity-icon',
      glyph: 'stomach'
    });
    expect(resolveVisualDefinition('entity.body.bones')).toMatchObject({
      renderer: 'scene-icon',
      glyph: 'bone'
    });
    expect(resolveVisualDefinition('entity.body.walk-run')).toMatchObject({
      renderer: 'concept-icon',
      glyph: 'legs'
    });
    expect(resolveVisualDefinition('entity.body.turn-head')).toMatchObject({
      renderer: 'concept-icon',
      glyph: 'neck'
    });
  });

  it('keeps ambiguous global relation words text-only instead of assigning misleading art', () => {
    expect(resolveSemanticVisualRefs('natural')).toEqual([]);
    expect(resolveSemanticVisualRefs('hard')).toEqual([]);
    expect(resolveSemanticVisualRefs('light')).toEqual([]);
    expect(resolveSemanticVisualRefs('control')).toEqual([]);
    expect(resolveSemanticVisualRefs('move')).toEqual([]);
  });
});
