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

const soils = [
  ['sandy-soil', 'entity.soil.sandy-sample', 'sandy-soil-sample'],
  ['clay-soil', 'entity.soil.clay-sample', 'clay-soil-sample'],
  ['loamy-soil', 'entity.soil.loamy-sample', 'loamy-soil-sample'],
  ['humus', 'entity.soil.humus-sample', 'humus-sample']
] as const;

describe('soil visual recipe family', () => {
  it('resolves each soil meaning through recipe policy rather than a direct concept alias', () => {
    for (const [semanticRef, visualRef] of soils) {
      expect(resolveSemanticVisualRefs(semanticRef)).toEqual([]);
      expect(resolveItemVisualRefs({ label: semanticRef, semanticRef }, true, 'option')).toEqual([visualRef]);
      expect(resolveVisualRecipeForSemantic(semanticRef, 'option')).toMatchObject({
        template: 'entity.single',
        exposure: 'identity_only'
      });
      expect(resolveVisualDefinition(visualRef)?.renderer).toBe('soil-type-icon');
    }
  });

  it('keeps longer explanatory soil sentences out of exact-label inference', () => {
    for (const label of [
      'Sandy soil has large particles',
      'Clay soil has fine particles',
      'Loamy soil is good for many plants',
      'Humus is decayed organic matter'
    ]) {
      expect(resolveLabelVisualRefs(label)).toEqual([]);
    }
  });

  it('encodes four visibly distinct static texture states with no component CSS', () => {
    const source = readFileSync('src/presentation/SoilTypeIcon.svelte', 'utf8');
    for (const [, , glyph] of soils) expect(source).toContain(`icon === '${glyph}'`);
    expect(source).toContain('circle cx="25" cy="48"');
    expect(source).toContain('M29 40l8 13');
    expect(source).toContain('M60 42V17');
    expect(source).toContain('leaf rich').toBeFalsy();
    expect(source).not.toContain('<style>');
    expect(source).not.toContain("semanticRef === 'sandy-soil'");
  });

  it('removes the completed soil family from both live production queues', () => {
    const report = JSON.parse(execFileSync(process.execPath, ['scripts/report-visual-recipe-roi.mjs', '--json', '--limit=50'], { encoding: 'utf8' })) as {
      queue: Array<{ semanticRef: string | null }>;
      familyQueue: Array<{ familyKey: string }>;
    };
    const refs = new Set(report.queue.map((entry) => entry.semanticRef));
    for (const [semanticRef] of soils) expect(refs.has(semanticRef)).toBe(false);
    expect(report.familyQueue.some((family) => family.familyKey === 'soil-family')).toBe(false);
  });

  it('adds the full 32-instance soil-family gain without weakening the denominator', () => {
    const report = JSON.parse(execFileSync(process.execPath, ['scripts/report-visual-coverage.mjs', '--json'], { encoding: 'utf8' })) as {
      library: { entities: number; recipes: number };
      visualFriendly: { visual: number; total: number; percent: number; recipe: number };
    };
    expect(report.library.entities).toBeGreaterThanOrEqual(303);
    expect(report.library.recipes).toBeGreaterThanOrEqual(18);
    expect(report.visualFriendly.total).toBe(1459);
    expect(report.visualFriendly.visual).toBeGreaterThanOrEqual(776);
    expect(report.visualFriendly.percent).toBeGreaterThanOrEqual(53.2);
    expect(report.visualFriendly.recipe).toBeGreaterThanOrEqual(167);
  });
});
