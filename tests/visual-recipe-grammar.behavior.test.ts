import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateVisualRecipes } from '../scripts/visual-recipe-validation-core.mjs';
import {
  getVisualRecipes,
  resolveVisualRecipeForSemantic
} from '../src/presentation/visualRecipeRegistry';
import {
  getRegisteredVisualRefs,
  resolveItemVisualRefs
} from '../src/presentation/visualRegistry';

describe('semantic visual recipe grammar', () => {
  it('auto-discovers the first recipe pack and resolves identity-only answer surfaces', () => {
    const recipes = getVisualRecipes();
    expect(recipes.map((recipe) => recipe.id)).toContain('recipe.classification.living-things');

    expect(resolveItemVisualRefs({ label: 'Living things', semanticRef: 'living-things' }, true, 'option')).toEqual([
      'entity.animal.dog',
      'entity.plant.generic'
    ]);

    expect(resolveItemVisualRefs({ label: "Earth's revolution", semanticRef: 'earth-revolution' }, true, 'option')).toEqual([
      'entity.universe.earth'
    ]);
  });

  it('reveals context only on explicitly full-relation surfaces', () => {
    const optionRecipe = resolveVisualRecipeForSemantic('earth-revolution', 'option');
    const feedbackRecipe = resolveVisualRecipeForSemantic('earth-revolution', 'feedback');

    expect(optionRecipe?.exposure).toBe('identity_only');
    expect(optionRecipe?.slots.map((slot) => slot.visualRef)).toEqual(['entity.universe.earth']);
    expect(feedbackRecipe?.exposure).toBe('full_relation');
    expect(feedbackRecipe?.slots.map((slot) => slot.visualRef)).toEqual([
      'entity.nature.sun',
      'entity.universe.earth'
    ]);
  });

  it('preserves authored/direct semantic precedence and never adds fuzzy label matching', () => {
    expect(resolveItemVisualRefs({
      label: 'Living things',
      semanticRef: 'living-things',
      visualRefs: ['entity.animal.cat']
    })).toEqual(['entity.animal.cat']);

    expect(resolveItemVisualRefs({ label: 'Dog', semanticRef: 'dog' })).toEqual(['entity.animal.dog']);
    expect(resolveItemVisualRefs({ label: 'A story about living things' })).toEqual([]);
  });

  it('fails duplicate identities, missing primitives and unsafe identity-only recipes closed', () => {
    const knownRefs = new Set(getRegisteredVisualRefs());
    const valid = getVisualRecipes()[0];
    expect(valid).toBeTruthy();

    const duplicate = { ...valid, id: 'recipe.duplicate-id' };
    const missingPrimitive = {
      ...valid,
      id: 'recipe.missing-primitive',
      semanticRef: 'missing-primitive',
      slots: [{ role: 'subject', visualRef: 'entity.missing.visual', exposure: 'identity' }]
    };
    const unsafeIdentity = {
      ...valid,
      id: 'recipe.unsafe-identity',
      semanticRef: 'unsafe-identity',
      slots: [{ role: 'context', visualRef: 'entity.nature.sun', exposure: 'context' }],
      surfaces: { option: 'identity_only' }
    };

    const result = validateVisualRecipes([valid, duplicate, missingPrimitive, unsafeIdentity], knownRefs);
    expect(result.errors.some((error: string) => error.includes('duplicate semanticRef'))).toBe(true);
    expect(result.errors.some((error: string) => error.includes('unknown visualRef entity.missing.visual'))).toBe(true);
    expect(result.errors.some((error: string) => error.includes('identity_only requires at least one identity slot'))).toBe(true);
  });

  it('keeps the generic presenter template-driven rather than concept-branch-driven', () => {
    const source = readFileSync('src/presentation/VisualRecipe.svelte', 'utf8');
    expect(source).toContain('data-recipe-template');
    expect(source).toContain('recipe.slots');
    expect(source).not.toContain("living-things");
    expect(source).not.toContain("earth-revolution");
  });

  it('produces a deterministic high-ROI queue after authored recipes are removed from the gap set', () => {
    const output = execFileSync(process.execPath, ['scripts/report-visual-recipe-roi.mjs', '--json', '--limit=12'], {
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    const report = JSON.parse(output) as {
      recipes: number;
      queue: Array<{ semanticRef: string | null; roiScore: number }>;
    };

    expect(report.recipes).toBeGreaterThanOrEqual(5);
    expect(report.queue.length).toBeGreaterThan(0);
    for (let index = 1; index < report.queue.length; index += 1) {
      expect(report.queue[index - 1].roiScore).toBeGreaterThanOrEqual(report.queue[index].roiScore);
    }
    expect(report.queue.map((entry) => entry.semanticRef)).not.toContain('living-things');
    expect(report.queue.map((entry) => entry.semanticRef)).not.toContain('earth-revolution');
  });
});
