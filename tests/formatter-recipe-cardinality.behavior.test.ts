import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertRecipeUnitMode } from '../scripts/formatters/recipeUnitMode.mjs';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));

describe('formatter recipe cardinality contracts', () => {
  it('keeps the canonical generated animal crossword as a multi-entry set', () => {
    const crosswords = readJson('content/authoring/crosswords/__generated-from-knowledge.json');
    const crossword = crosswords.find((candidate: { id: string }) => candidate.id === 'animals.associations.crossword.generated.001');

    expect(crossword).toBeTruthy();
    expect(crossword.entries).toHaveLength(5);
    expect(crossword.knowledgeRefs).toHaveLength(5);
  });

  it('rejects a set-mode recipe that narrows to one selected unit', () => {
    expect(() => assertRecipeUnitMode({
      sourceRef: 'knowledge.animals.associations.001',
      recipeId: 'test.crossword.one-entry',
      engine: 'crossword@1',
      mode: 'set',
      selectedCount: 1,
      totalCount: 5
    })).toThrow('test.crossword.one-entry: crossword@1 requires at least two selected knowledge units; got 1');
  });

  it('rejects a single-mode recipe that selects more than one unit', () => {
    expect(() => assertRecipeUnitMode({
      sourceRef: 'knowledge.animals.associations.001',
      recipeId: 'test.mcq.too-many',
      engine: 'single_choice@1',
      mode: 'single',
      selectedCount: 5,
      totalCount: 5
    })).toThrow('test.mcq.too-many: single_choice@1 requires exactly one selected knowledge unit; got 5');
  });

  it('rejects all-mode partial selection and accepts valid single/set selections', () => {
    expect(() => assertRecipeUnitMode({
      sourceRef: 'knowledge.choice.proof.001',
      recipeId: 'test.choice.partial',
      engine: 'single_choice@1',
      mode: 'all',
      selectedCount: 1,
      totalCount: 2
    })).toThrow('test.choice.partial: single_choice@1 requires the complete knowledge record; selected 1/2');

    expect(() => assertRecipeUnitMode({
      sourceRef: 'knowledge.animals.associations.001',
      recipeId: 'test.mcq.valid',
      engine: 'single_choice@1',
      mode: 'single',
      selectedCount: 1,
      totalCount: 5
    })).not.toThrow();
    expect(() => assertRecipeUnitMode({
      sourceRef: 'knowledge.animals.associations.001',
      recipeId: 'test.crossword.valid',
      engine: 'crossword@1',
      mode: 'set',
      selectedCount: 2,
      totalCount: 5
    })).not.toThrow();
  });
});
