import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = (relativePath: string) => readFileSync(path.join(root, relativePath), 'utf8');

describe('Quiet Creek visual rescue', () => {
  const viewport = source('src/ui/ForestWorldDepthMissionViewport.svelte');
  const scene = source('public/assets/forest/quiet-creek-scene.svg');

  it('uses one illustrated creek world instead of the old status-card presentation', () => {
    expect(viewport).toContain('data-testid="quiet-creek-scene"');
    expect(viewport).toContain('/assets/forest/quiet-creek-scene.svg');
    expect(scene).toMatch(/broken wooden bridge|broken plank bridge/i);
    expect(scene).toContain('id="water"');
    expect(viewport).toContain('StoryCharacter character="scientu"');
    expect(viewport).toContain('StoryCharacter character="dheu"');
  });

  it('keeps assembly authority while making bridge and channel targets spatial', () => {
    expect(viewport).toContain('commitAssemblyPlacement');
    expect(viewport).toContain('data-slot={slot.slotId}');
    expect(viewport).toContain('data-part={part.partId}');
    expect(viewport).toContain('onpointerdown={(event) => beginDrag(event, part.partId)}');
    expect(viewport).toContain('document.elementsFromPoint');
    expect(viewport).toContain('data-first-attempt={assemblyState.firstAttemptCorrect');
  });

  it('renders visible cause/effect state in the scene and removes implementation copy from Level 2 completion', () => {
    for (const state of [
      'bridge-plank-repaired',
      'bridge-rail-repaired',
      'channel-left-connected',
      'channel-right-connected',
      'saplings-watered',
      'creek-flowing'
    ]) expect(viewport).toContain(`data-scene-state="${state}"`);

    expect(viewport).toContain('Creek rescued!');
    expect(viewport).not.toContain('replaying the mission cannot farm another reward');
  });

  it('keeps the scene meaningful with reduced motion', () => {
    expect(viewport).toContain('@media(prefers-reduced-motion:reduce)');
    expect(viewport).toContain('.flow-lines i{opacity:.8}');
  });
});
