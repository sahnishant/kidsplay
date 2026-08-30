import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';
import registry from '../content/assets/registry.json';
import VisualEntity from '../src/presentation/VisualEntity.svelte';
import {
  getBundledAssetDefinitions,
  resolveAssetRefForVisualRef,
  resolveBundledAsset
} from '../src/presentation/assetRegistry';
import { resolveVisualDefinition } from '../src/presentation/visualRegistry';

const validatorPath = join(process.cwd(), 'scripts', 'validate-assets.mjs');

function runAssetValidator(rootDir?: string): string {
  const args = rootDir ? [validatorPath, '--root', rootDir] : [validatorPath];
  return execFileSync(process.execPath, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

describe('OSS semantic asset integration', () => {
  it('validates every bundled asset offline through the standalone Node authoring command', () => {
    expect(runAssetValidator()).toContain('Validated 10 bundled open asset(s) from 1 source(s).');
  });

  it('accepts Windows CRLF SVG materialization but still fails closed on real content drift', () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'kidsplay-assets-'));
    try {
      cpSync(join(process.cwd(), 'content', 'assets'), join(fixtureRoot, 'content', 'assets'), {
        recursive: true
      });
      cpSync(join(process.cwd(), 'public', 'assets', 'open'), join(fixtureRoot, 'public', 'assets', 'open'), {
        recursive: true
      });

      const dogPath = join(fixtureRoot, 'public', 'assets', 'open', 'fluent', 'dog.svg');
      const canonicalDog = readFileSync(dogPath, 'utf8').replace(/\r\n/g, '\n');
      writeFileSync(dogPath, canonicalDog.replace(/\n/g, '\r\n'), 'utf8');

      expect(runAssetValidator(fixtureRoot)).toContain('Validated 10 bundled open asset(s) from 1 source(s).');

      writeFileSync(dogPath, canonicalDog.replace('</svg>', '<!-- tampered -->\n</svg>'), 'utf8');
      expect(() => runAssetValidator(fixtureRoot)).toThrow();
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
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

  it('renders bundled artwork first and falls back to the existing SVG renderer after an image failure', async () => {
    const { container } = render(VisualEntity, { visualRef: 'entity.animal.dog' });
    const image = container.querySelector<HTMLImageElement>('img.visual-entity__asset');

    expect(image?.getAttribute('src')).toBe('/assets/open/fluent/dog.svg');
    expect(container.querySelector('[data-asset-ref="fluent.dog.flat"]')).not.toBeNull();

    if (!image) throw new Error('expected bundled dog image');
    await fireEvent.error(image);
    await tick();

    expect(container.querySelector('img.visual-entity__asset')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders the existing SVG path directly when no assetRef exists', () => {
    const { container } = render(VisualEntity, { visualRef: 'entity.animal.cat' });

    expect(container.querySelector('img.visual-entity__asset')).toBeNull();
    expect(container.querySelector('[data-visual-ref="entity.animal.cat"]')).not.toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
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
