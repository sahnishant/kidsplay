import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  resolveItemVisualRefs,
  resolveLabelVisualRefs,
  resolveSemanticVisualRefs,
  resolveVisualDefinition
} from '../src/presentation/visualRegistry';
import { resolveVisualRecipeForSemantic } from '../src/presentation/visualRecipeRegistry';

const properties = [
  ['transparent', 'entity.material.transparent-sample'],
  ['opaque', 'entity.material.opaque-sample']
] as const;

describe('transparent and opaque material contrast family', () => {
  it('resolves both properties through recipes rather than direct semantic aliases', () => {
    for (const [semanticRef, visualRef] of properties) {
      expect(resolveSemanticVisualRefs(semanticRef)).toEqual([]);
      expect(resolveItemVisualRefs({ label: semanticRef, semanticRef }, true, 'option')).toEqual([visualRef]);
      expect(resolveVisualRecipeForSemantic(semanticRef, 'option')?.template).toBe('contrast.pair');
      expect(resolveVisualDefinition(visualRef)?.renderer).toBe('material-property-icon');
    }
  });

  it('keeps the opposite property hidden until a full-relation teaching surface', () => {
    const transparentOption = resolveVisualRecipeForSemantic('transparent', 'option');
    const transparentFeedback = resolveVisualRecipeForSemantic('transparent', 'feedback');
    const opaqueOption = resolveVisualRecipeForSemantic('opaque', 'option');
    const opaqueFeedback = resolveVisualRecipeForSemantic('opaque', 'feedback');

    expect(transparentOption?.slots.map((slot) => slot.visualRef)).toEqual(['entity.material.transparent-sample']);
    expect(opaqueOption?.slots.map((slot) => slot.visualRef)).toEqual(['entity.material.opaque-sample']);
    expect(transparentFeedback?.slots.map((slot) => slot.visualRef)).toEqual([
      'entity.material.transparent-sample',
      'entity.material.opaque-sample'
    ]);
    expect(opaqueFeedback?.slots.map((slot) => slot.visualRef)).toEqual([
      'entity.material.opaque-sample',
      'entity.material.transparent-sample'
    ]);
  });

  it('does not attach property visuals to longer explanatory sentences by label inference', () => {
    for (const label of [
      'Transparent material lets light pass through',
      'Opaque material blocks light',
      'The glass is transparent',
      'The wall is opaque'
    ]) {
      expect(resolveLabelVisualRefs(label)).toEqual([]);
    }
  });

  it('encodes light passage versus blocking in one generic renderer family', () => {
    const source = readFileSync('src/presentation/MaterialPropertyIcon.svelte', 'utf8');
    expect(source).toContain("icon === 'transparent-sample'");
    expect(source).toContain("icon === 'opaque-sample'");
    expect(source).toContain('M72 38h35');
    expect(source).not.toContain("semanticRef === 'transparent'");
    expect(source).not.toContain("semanticRef === 'opaque'");
  });

  it('keeps transparent and opaque out of the production ROI queue after later families are added', () => {
    const output = execFileSync(process.execPath, ['scripts/report-visual-recipe-roi.mjs', '--json', '--limit=50'], {
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    const report = JSON.parse(output) as {
      queue: Array<{ semanticRef: string | null }>;
    };
    const refs = new Set(report.queue.map((entry) => entry.semanticRef));
    expect(refs.has('transparent')).toBe(false);
    expect(refs.has('opaque')).toBe(false);
  });

  it('preserves at least the certified material-family coverage contribution as the system grows', () => {
    const output = execFileSync(process.execPath, ['scripts/report-visual-coverage.mjs', '--json'], {
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    const report = JSON.parse(output) as {
      library: { entities: number; recipes: number };
      visualFriendly: { visual: number; total: number; percent: number; recipe: number };
    };

    expect(report.library.entities).toBeGreaterThanOrEqual(296);
    expect(report.library.recipes).toBeGreaterThanOrEqual(11);
    expect(report.visualFriendly.total).toBe(1459);
    expect(report.visualFriendly.visual).toBeGreaterThanOrEqual(714);
    expect(report.visualFriendly.percent).toBeGreaterThanOrEqual(48.9);
    expect(report.visualFriendly.recipe).toBeGreaterThanOrEqual(105);
  });
});
