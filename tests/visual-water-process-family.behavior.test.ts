import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resolveVisualRecipeForSemantic } from '../src/presentation/visualRecipeRegistry';
import {
  resolveItemVisualRefs,
  resolveLabelVisualRefs,
  resolveSemanticVisualRefs,
  resolveVisualDefinition
} from '../src/presentation/visualRegistry';

const processes = [
  ['condensation', 'entity.process.condensation-sample', 'condensation-sample'],
  ['water-cycle', 'entity.process.water-cycle-sample', 'water-cycle-sample']
] as const;

describe('water process visual family', () => {
  it('resolves both canonical process identities through recipes, not direct aliases', () => {
    for (const [semanticRef, visualRef] of processes) {
      expect(resolveSemanticVisualRefs(semanticRef)).toEqual([]);
      expect(resolveItemVisualRefs({ label: semanticRef, semanticRef }, true, 'option')).toEqual([visualRef]);
      expect(resolveVisualRecipeForSemantic(semanticRef, 'option')).toMatchObject({
        template: 'process.transform',
        exposure: 'identity_only'
      });
      expect(resolveVisualDefinition(visualRef)?.renderer).toBe('process-icon');
    }
  });

  it('encodes the reviewed water meanings without adding renderer CSS', () => {
    const source = readFileSync('src/presentation/ProcessIcon.svelte', 'utf8');
    expect(source).toContain("icon === 'condensation-sample'");
    expect(source).toContain("icon === 'water-cycle-sample'");
    expect(source).toContain('water vapour').toBeFalsy();
    expect(source).toContain('stroke-dasharray="4 4"');
    expect(source).toContain('circle cx="24" cy="23"');
    expect(source.match(/<style>/g)?.length ?? 0).toBe(1);
  });

  it('does not attach process visuals by explanatory-sentence inference', () => {
    for (const label of [
      'Water vapour changes into tiny liquid-water droplets',
      'Water moves between Earth and the atmosphere',
      'The water cycle repeats continuously'
    ]) {
      expect(resolveLabelVisualRefs(label)).toEqual([]);
    }
  });

  it('removes the completed process-change family from the live production queue', () => {
    const report = JSON.parse(execFileSync(process.execPath, ['scripts/report-visual-recipe-roi.mjs', '--json', '--limit=50'], { encoding: 'utf8' })) as {
      queue: Array<{ semanticRef: string | null }>;
      familyQueue: Array<{ familyKey: string }>;
    };
    const refs = new Set(report.queue.map((entry) => entry.semanticRef));
    for (const [semanticRef] of processes) expect(refs.has(semanticRef)).toBe(false);
    expect(report.familyQueue.some((family) => family.familyKey === 'process-change')).toBe(false);
  });

  it('adds the five process instances on top of the soil and shadow gains', () => {
    const report = JSON.parse(execFileSync(process.execPath, ['scripts/report-visual-coverage.mjs', '--json'], { encoding: 'utf8' })) as {
      library: { entities: number; recipes: number };
      visualFriendly: { visual: number; total: number; percent: number; recipe: number };
    };
    expect(report.library.entities).toBeGreaterThanOrEqual(306);
    expect(report.library.recipes).toBeGreaterThanOrEqual(21);
    expect(report.visualFriendly.total).toBe(1459);
    expect(report.visualFriendly.visual).toBeGreaterThanOrEqual(791);
    expect(report.visualFriendly.percent).toBeGreaterThanOrEqual(54.2);
    expect(report.visualFriendly.recipe).toBeGreaterThanOrEqual(182);
  });
});
