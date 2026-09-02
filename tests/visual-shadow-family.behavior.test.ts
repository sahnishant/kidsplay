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

describe('shadow formation visual family', () => {
  it('keeps the shadow identity separate from its causal teaching context', () => {
    expect(resolveSemanticVisualRefs('shadow')).toEqual([]);
    expect(resolveItemVisualRefs({ label: 'A shadow', semanticRef: 'shadow' }, true, 'option')).toEqual([
      'entity.light.cast-shadow-sample'
    ]);

    const option = resolveVisualRecipeForSemantic('shadow', 'option');
    const feedback = resolveVisualRecipeForSemantic('shadow', 'feedback');
    expect(option).toMatchObject({ template: 'relation.source-target', exposure: 'identity_only' });
    expect(option?.slots.map((slot) => slot.visualRef)).toEqual(['entity.light.cast-shadow-sample']);
    expect(feedback?.exposure).toBe('full_relation');
    expect(feedback?.slots.map((slot) => slot.visualRef)).toEqual([
      'entity.light.cast-shadow-sample',
      'entity.material.opaque-sample'
    ]);
  });

  it('reuses the existing material/light renderer and keeps the shadow state static and meaningful', () => {
    expect(resolveVisualDefinition('entity.light.cast-shadow-sample')).toMatchObject({
      renderer: 'material-property-icon',
      glyph: 'shadow-sample',
      motion: 'idle'
    });
    const source = readFileSync('src/presentation/MaterialPropertyIcon.svelte', 'utf8');
    expect(source).toContain("icon === 'shadow-sample'");
    expect(source).toContain('ellipse cx="82" cy="76"');
    expect(source).not.toContain("semanticRef === 'shadow'");
  });

  it('does not infer a shadow visual from explanatory sentences', () => {
    for (const label of [
      'A shadow forms when light is blocked',
      'The opaque object blocks the light',
      'Light is blocked by an opaque object'
    ]) {
      expect(resolveLabelVisualRefs(label)).toEqual([]);
    }
  });

  it('removes shadow from the individual and family ROI queues', () => {
    const report = JSON.parse(execFileSync(process.execPath, ['scripts/report-visual-recipe-roi.mjs', '--json', '--limit=50'], { encoding: 'utf8' })) as {
      queue: Array<{ semanticRef: string | null }>;
      familyQueue: Array<{ familyKey: string }>;
    };
    expect(report.queue.some((entry) => entry.semanticRef === 'shadow')).toBe(false);
    expect(report.familyQueue.some((family) => family.familyKey === 'shadow-formation')).toBe(false);
  });

  it('adds the ten shadow instances on top of the certified soil-family floor', () => {
    const report = JSON.parse(execFileSync(process.execPath, ['scripts/report-visual-coverage.mjs', '--json'], { encoding: 'utf8' })) as {
      library: { entities: number; recipes: number };
      visualFriendly: { visual: number; total: number; percent: number; recipe: number };
    };
    expect(report.library.entities).toBeGreaterThanOrEqual(304);
    expect(report.library.recipes).toBeGreaterThanOrEqual(19);
    expect(report.visualFriendly.total).toBeGreaterThanOrEqual(1459);
    expect(report.visualFriendly.visual).toBeGreaterThanOrEqual(786);
    expect(report.visualFriendly.percent).toBeGreaterThanOrEqual(53.8);
    expect(report.visualFriendly.recipe).toBeGreaterThanOrEqual(177);
  });
});
