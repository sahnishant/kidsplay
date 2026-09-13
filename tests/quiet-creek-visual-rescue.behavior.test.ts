import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = (relativePath: string) => readFileSync(path.join(root, relativePath), 'utf8');

describe('Quiet Creek visual rescue', () => {
  const viewport = source('src/ui/ForestWorldDepthMissionViewport-Practical.svelte');
  const dispatcher = source('src/ui/ForestWorldDepthViewport.svelte');
  const scene = source('public/assets/forest/quiet-creek-scene.svg');

  it('routes the active Forest mission through the practical viewport and keeps one illustrated creek world', () => {
    expect(dispatcher).toContain("import('./ForestWorldDepthMissionViewport-Practical.svelte')");
    expect(viewport).toContain('data-testid="quiet-creek-scene"');
    expect(viewport).toContain('/assets/forest/quiet-creek-scene.svg');
    expect(scene).toMatch(/broken wooden bridge|broken plank bridge/i);
    expect(scene).toContain('id="water"');
    expect(viewport).toContain('StoryCharacter character="scientu"');
    expect(viewport).toContain('StoryCharacter character="dheu"');
  });

  it('keeps assembly authority while making bridge and channel repair spatial and draggable', () => {
    expect(viewport).toContain('commitAssemblyPlacement');
    expect(viewport).toContain('data-slot={slot.slotId}');
    expect(viewport).toContain('data-part={part.partId}');
    expect(viewport).toContain('onpointerdown={(event) => beginAssemblyDrag(event, part.partId)}');
    expect(viewport).toContain('document.elementsFromPoint');
    expect(viewport).toContain('data-first-attempt={assemblyState.firstAttemptCorrect');
  });

  it('makes creek clearance a physical branch move rather than a bottom action button', () => {
    expect(viewport).toContain('class="fallen-branch branch-action"');
    expect(viewport).toContain('data-branch-bank="clear"');
    expect(viewport).toContain('endBranchDrag');
    expect(viewport).toContain('placeBranchOnBank');
    expect(viewport).toContain('class="fallen-branch cleared-branch"');
    expect(viewport).toContain('@keyframes branch-to-bank');
    expect(viewport).not.toContain('<button type="button" class="world-action creek-action" onclick={performWorldAction}>{currentStep.actionLabel}</button>\n            {#if feedback}');
  });

  it('requires three visible saplings to be watered instead of one generic water button', () => {
    expect(viewport).toContain('class="watering-can"');
    expect(viewport).toContain('data-sapling-target={sapling}');
    expect(viewport).toContain('{#each [0, 1, 2] as sapling}');
    expect(viewport).toContain('wateredSaplings.includes(sapling)');
    expect(viewport).toContain('next.length === 3');
    expect(viewport).toContain('@keyframes drops');
    expect(viewport).not.toContain('class="plant-action"');
  });

  it('renders strong visible cause/effect state in the scene', () => {
    for (const state of [
      'bridge-plank-repaired',
      'bridge-rail-repaired',
      'channel-left-connected',
      'channel-right-connected',
      'saplings-watered',
      'creek-flowing'
    ]) expect(viewport).toContain(`data-scene-state="${state}"`);

    expect(viewport).toContain('Creek rescued!');
    expect(viewport).toContain('@keyframes water-run');
    expect(viewport).toContain('@keyframes stream-arrow');
  });

  it('keeps the scene meaningful with reduced motion', () => {
    expect(viewport).toContain('@media(prefers-reduced-motion:reduce)');
    expect(viewport).toContain('.flow-lines i{opacity:.9}');
  });
});
