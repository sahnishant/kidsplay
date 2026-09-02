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

describe('gas spreading visual family', () => {
  it('resolves the canonical gas-spreads meaning through recipe policy', () => {
    expect(resolveSemanticVisualRefs('gas-spreads')).toEqual([]);
    expect(resolveItemVisualRefs({ label: 'A gas', semanticRef: 'gas-spreads' }, true, 'option')).toEqual([
      'entity.process.gas-spread-sample'
    ]);
    expect(resolveVisualRecipeForSemantic('gas-spreads', 'option')).toMatchObject({
      template: 'process.sequence',
      exposure: 'identity_only'
    });
    expect(resolveVisualDefinition('entity.process.gas-spread-sample')?.renderer).toBe('process-icon');
  });

  it('shows particles spreading into available container space without extra CSS', () => {
    const source = readFileSync('src/presentation/ProcessIcon.svelte', 'utf8');
    expect(source).toContain("icon === 'gas-spread-sample'");
    expect(source).toContain('rect x="9" y="24"');
    expect(source).toContain('rect x="72" y="15"');
    expect(source).toContain('M50 51h17');
    expect(source.match(/<style>/g)?.length ?? 0).toBe(1);
  });

  it('does not infer the visual from explanatory gas sentences', () => {
    for (const label of [
      'A gas spreads through available space',
      'Gas particles spread through a container',
      'A gas has no fixed shape'
    ]) {
      expect(resolveLabelVisualRefs(label)).toEqual([]);
    }
  });

  it('removes gas-process from both live production queues', () => {
    const report = JSON.parse(execFileSync(process.execPath, ['scripts/report-visual-recipe-roi.mjs', '--json', '--limit=50'], { encoding: 'utf8' })) as {
      queue: Array<{ semanticRef: string | null }>;
      familyQueue: Array<{ familyKey: string }>;
    };
    expect(report.queue.some((entry) => entry.semanticRef === 'gas-spreads')).toBe(false);
    expect(report.familyQueue.some((family) => family.familyKey === 'gas-process')).toBe(false);
  });

  it('adds all five gas-spread instances on top of the water-process floor', () => {
    const report = JSON.parse(execFileSync(process.execPath, ['scripts/report-visual-coverage.mjs', '--json'], { encoding: 'utf8' })) as {
      library: { entities: number; recipes: number };
      visualFriendly: { visual: number; total: number; percent: number; recipe: number };
    };
    expect(report.library.entities).toBeGreaterThanOrEqual(307);
    expect(report.library.recipes).toBeGreaterThanOrEqual(22);
    expect(report.visualFriendly.total).toBeGreaterThanOrEqual(1459);
    expect(report.visualFriendly.visual).toBeGreaterThanOrEqual(796);
    expect(report.visualFriendly.percent).toBeGreaterThanOrEqual(40);
    expect(report.visualFriendly.recipe).toBeGreaterThanOrEqual(187);
  });
});
