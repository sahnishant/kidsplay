import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = (relativePath: string) => readFileSync(path.join(root, relativePath), 'utf8');

describe('world mission practical motion', () => {
  const dispatcher = source('src/ui/ForestWorldDepthViewport.svelte');
  const town = source('src/ui/TownWorldDepthViewport-Practical.svelte');
  const grove = source('src/ui/ForestGroveMissionViewport.svelte');
  const forestDepth = source('content/forest/world-depth.json');

  it('routes Town, Quiet Creek and Busy Grove through practical world viewports', () => {
    expect(dispatcher).toContain("import('./TownWorldDepthViewport-Practical.svelte')");
    expect(dispatcher).toContain("import('./ForestWorldDepthMissionViewport-Practical.svelte')");
    expect(dispatcher).toContain("import('./ForestGroveMissionViewport.svelte')");
    expect(dispatcher).toContain("mission.worldActionRef === 'forest.world-depth.l3.grove-return'");
    expect(town).toContain('data-world-depth-location="town-square"');
    expect(town).toContain('commitAssemblyPlacement');
    expect(grove).toContain('data-testid="busy-grove-practical"');
  });

  it('turns the safe crossing into an in-world three-stage character action with substantial travel', () => {
    expect(town).toContain('data-crossing-phase={crossingStage}');
    expect(town).toContain('onclick={advanceCrossing}');
    expect(town).toContain("crossingStage = 1");
    expect(town).toContain("crossingStage = 2");
    expect(town).toContain("crossingStage = 3");
    expect(town).toContain('@keyframes head-check');
    expect(town).toContain('@keyframes cross-road');
    expect(town).toMatch(/translate\(145px,23px\)/);
    expect(town).toContain('Tap the people in the town picture.');
    expect(town).not.toContain('class="sequence-card"');
  });

  it('puts the completed parcel on top of the help table instead of below it', () => {
    expect(town).toContain('data-parcel-target="help-table"');
    expect(town).toContain('onpointerup={endParcelDrag}');
    expect(town).toContain('.parcel-node.resolved .parcel{left:19px;bottom:43px');
    expect(town).toContain('@keyframes parcel-land');
    expect(town).toContain('PARCEL ON TABLE');
  });

  it('makes Town assembly and rain work happen on spatial scene targets', () => {
    expect(town).toContain('data-town-slot={slot.slotId}');
    expect(town).toContain('onpointerdown={(event) => beginAssemblyDrag(event, part.partId)}');
    expect(town).toContain('data-rain-target="clear-bank"');
    expect(town).toContain('onpointerup={endRainDrag}');
    expect(town).toContain('@keyframes water-rush');
  });

  it('makes every Busy Grove job manipulate an object in the scene rather than pressing an action button', () => {
    expect(grove).toContain('data-grove-slot="slot.shelter-top"');
    expect(grove).toContain('data-grove-slot="slot.shelter-front"');
    expect(grove).toContain('onpointerdown={(event) => beginAssemblyDrag(event, \'part.shelter-roof\')}');
    expect(grove).toContain('onpointerdown={(event) => beginAssemblyDrag(event, \'part.shelter-perch\')}');

    expect(grove).toContain('data-grove-slot="slot.grove.feeder"');
    expect(grove).toContain('data-grove-slot="slot.grove.compost"');
    expect(grove).toContain('data-grove-slot="slot.grove.litter-bag"');
    expect(forestDepth).toContain('"assemblyId": "assembly.forest.l3.feeding-sort"');
    expect(forestDepth).toContain('"operation": "place_part_in_slot"');

    expect(grove).toContain('data-feed-target="feeder"');
    expect(grove).toContain('onpointerup={endSeedDrag}');
    expect(grove).toContain('data-meadow-patch={patch}');
    expect(grove).toContain('onpointerup={endWaterDrag}');
    expect(grove).toContain('wateredPatches.length');
    expect(grove).toContain('No “do it for me” action button. Move the actual object in the grove.');
    expect(grove).not.toContain('onclick={performWorldAction}');
  });

  it('makes grove consequences visibly happen in the same scene', () => {
    expect(grove).toContain('data-grove-state="roof-installed"');
    expect(grove).toContain('data-grove-state="perch-installed"');
    expect(grove).toContain('data-grove-state="bird-returned"');
    expect(grove).toContain('data-grove-state="butterflies-returned"');
    expect(grove).toContain('@keyframes roof-set');
    expect(grove).toContain('@keyframes seed-pour');
    expect(grove).toContain('@keyframes bird-arrive');
    expect(grove).toContain('@keyframes flowers-rise');
    expect(grove).toContain('@keyframes butterfly-return');
  });

  it('has explicit reduced-motion end states rather than removing meaning', () => {
    expect(town).toContain('@media(prefers-reduced-motion:reduce)');
    expect(town).toContain('transform:translate(145px,23px)');
    expect(town).toContain('bottom:43px');
    expect(grove).toContain('@media(prefers-reduced-motion:reduce)');
    expect(grove).toContain('.returning-bird,.butterflies,.shelter-roof,.shelter-perch,.meadow-patch.watered span{transform:none!important;opacity:1!important}');
  });
});
