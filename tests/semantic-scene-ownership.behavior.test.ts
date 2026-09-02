import { readFileSync, readdirSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import Scene from '../src/presentation/Scene.svelte';
import { getReferencedPresentationSceneIds } from '../src/presentation/questionScene';
import { getSceneDefinitions, resolveSceneDefinition } from '../src/presentation/sceneRegistry';

afterEach(() => cleanup());

function authoredSceneRows(): unknown[] {
  return readdirSync('content/scenes')
    .filter((name) => name.endsWith('.json'))
    .sort()
    .flatMap((name) => {
      const value = JSON.parse(readFileSync(`content/scenes/${name}`, 'utf8')) as unknown;
      return Array.isArray(value) ? value : [];
    });
}

describe('canonical semantic scene ownership', () => {
  it('gives every authored scene exactly one semantic animation owner and no legacy entity field', () => {
    const rows = authoredSceneRows() as Array<Record<string, unknown>>;
    expect(rows.length).toBeGreaterThan(0);

    for (const scene of rows) {
      expect(typeof scene.id).toBe('string');
      expect(typeof scene.animationRef).toBe('string');
      expect((scene.animationRef as string).trim().length).toBeGreaterThan(0);
      expect(Object.prototype.hasOwnProperty.call(scene, 'entities')).toBe(false);
    }

    const registered = getSceneDefinitions();
    expect(registered).toHaveLength(rows.length);
    expect(new Set(registered.map((scene) => scene.id)).size).toBe(registered.length);
  });

  it('keeps every static presentation mapping reachable through the canonical scene registry', () => {
    for (const sceneId of getReferencedPresentationSceneIds()) {
      expect(resolveSceneDefinition(sceneId), `${sceneId} should resolve`).toBeTruthy();
    }
  });

  it('routes every registered scene through the shared semantic presenter', () => {
    for (const scene of getSceneDefinitions()) {
      const { container, unmount } = render(Scene, { props: { sceneId: scene.id } });
      const surface = container.querySelector(`[data-animation-ref="${scene.animationRef}"]`);
      expect(surface, `${scene.id} should expose its canonical animationRef`).toBeTruthy();
      expect(surface?.getAttribute('aria-label')).toBe(scene.ariaLabel);
      expect(container.querySelector('.scene__entity')).toBeNull();
      unmount();
    }
  });

  it('keeps legacy ownership rejection in the permanent content gate', () => {
    const validator = readFileSync('scripts/validate-scenes.mjs', 'utf8');
    expect(validator).toContain("hasOwnProperty.call(scene ?? {}, 'entities')");
    expect(validator).toContain('legacy entities ownership is not allowed');
    expect(validator).toContain('animationRef is required');
  });
});
