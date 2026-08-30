import { describe, expect, it } from 'vitest';
import registry from '../content/assets/registry.json';
import { validateAssetRegistry } from '../scripts/validate-assets.mjs';
import {
  getBundledAssetDefinitions,
  resolveAssetRefForVisualRef,
  resolveBundledAsset
} from '../src/presentation/assetRegistry';
import { resolveVisualDefinition } from '../src/presentation/visualRegistry';

describe('OSS semantic asset integration', () => {
  it('validates every bundled asset offline against registered provenance', () => {
    const result = validateAssetRegistry();
    expect(result.errors).toEqual([]);
    expect(result.assetCount).toBe(10);
    expect(result.sourceCount).toBe(1);
  });

  it('fails closed when provenance, source approval, revision pinning, or registration is tampered with', () => {
    const hashTampered = structuredClone(registry);
    hashTampered.assets[0].sourceBlobSha = '0000000000000000000000000000000000000000';
    expect(validateAssetRegistry({ registry: hashTampered }).errors.some((error) => error.includes('provenance hash mismatch'))).toBe(true);

    const sourceTampered = structuredClone(registry);
    const fluentSource = sourceTampered.sources.find((source) => source.id === 'microsoft-fluent-emoji');
    if (!fluentSource) throw new Error('missing Fluent source fixture');
    fluentSource.status = 'candidate';
    expect(validateAssetRegistry({ registry: sourceTampered }).errors.some((error) => error.includes('not approved for bundling'))).toBe(true);

    const revisionTampered = structuredClone(registry);
    const unpinnedSource = revisionTampered.sources.find((source) => source.id === 'microsoft-fluent-emoji');
    if (!unpinnedSource) throw new Error('missing Fluent source fixture');
    unpinnedSource.revision = '';
    expect(validateAssetRegistry({ registry: revisionTampered }).errors.some((error) => error.includes('has no immutable revision'))).toBe(true);

    const registrationTampered = structuredClone(registry);
    registrationTampered.assets = registrationTampered.assets.slice(1);
    expect(validateAssetRegistry({ registry: registrationTampered }).errors.some((error) => error.includes('unregistered file in bundled asset tree'))).toBe(true);
  });

  it('maps the proof set to semantic visual ids without changing renderer fallbacks', () => {
    const definitions = getBundledAssetDefinitions();
    expect(definitions).toHaveLength(10);
    expect(new Set(definitions.flatMap((definition) => definition.visualRefs)).size).toBe(10);

    expect(resolveAssetRefForVisualRef('entity.animal.dog')).toBe('fluent.dog.flat');
    expect(resolveBundledAsset('fluent.dog.flat')?.url).toBe('/assets/open/fluent/dog.svg');

    const dog = resolveVisualDefinition('entity.animal.dog');
    expect(dog?.assetRef).toBe('fluent.dog.flat');
    expect(dog?.renderer).toBe('scene-icon');
    expect(dog?.glyph).toBe('dog-happy');

    const cat = resolveVisualDefinition('entity.animal.cat');
    expect(cat?.assetRef).toBeUndefined();
    expect(cat?.renderer).toBe('entity-icon');
    expect(cat?.glyph).toBe('cat');
  });

  it('keeps proof assets pinned to exact approved source revisions', () => {
    const fluentSource = registry.sources.find((source) => source.id === 'microsoft-fluent-emoji');
    expect(fluentSource?.status).toBe('approved');
    expect(fluentSource?.revision).toBe('1ffb34c752ecf5d402f04cfb4b392c77f57c54bc');
    for (const asset of registry.assets) {
      expect(asset.sourceId).toBe('microsoft-fluent-emoji');
      expect(asset.sourceRevision).toBe(fluentSource?.revision);
      expect(asset.localPath.startsWith('public/assets/open/')).toBe(true);
      expect(asset.modificationStatus).toBe('unmodified');
    }
  });
});
