import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = (relativePath: string) => readFileSync(path.join(root, relativePath), 'utf8');

describe('world mission practical motion', () => {
  const dispatcher = source('src/ui/ForestWorldDepthViewport.svelte');
  const town = source('src/ui/TownWorldDepthViewport-Practical.svelte');

  it('routes Town through the practical world viewport', () => {
    expect(dispatcher).toContain("import('./TownWorldDepthViewport-Practical.svelte')");
    expect(town).toContain('data-world-depth-location="town-square"');
    expect(town).toContain('commitAssemblyPlacement');
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

  it('makes assembly and rain work happen on spatial scene targets', () => {
    expect(town).toContain('data-town-slot={slot.slotId}');
    expect(town).toContain('onpointerdown={(event) => beginAssemblyDrag(event, part.partId)}');
    expect(town).toContain('data-rain-target="clear-bank"');
    expect(town).toContain('onpointerup={endRainDrag}');
    expect(town).toContain('@keyframes water-rush');
  });

  it('has explicit reduced-motion end states rather than removing meaning', () => {
    expect(town).toContain('@media(prefers-reduced-motion:reduce)');
    expect(town).toContain('transform:translate(145px,23px)');
    expect(town).toContain('bottom:43px');
  });
});
