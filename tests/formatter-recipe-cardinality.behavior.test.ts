import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatDataForEngine } from '../scripts/formatters/registry.mjs';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));

describe('formatter recipe cardinality contracts', () => {
  it('keeps the canonical animal crossword as a multi-entry set', () => {
    const source = readJson('content/knowledge/animal-associations.json');
    const recipes = readJson('content/recipes/animal-association-activities.json');
    const recipe = recipes.find((candidate: { id: string }) => candidate.id === 'animals.associations.crossword.generated.001');

    const result = formatDataForEngine(source, recipe.engine, recipe);
    expect(result.crosswordAuthoring).toHaveLength(1);
    expect(result.crosswordAuthoring[0].entries).toHaveLength(5);
    expect(result.crosswordAuthoring[0].knowledgeRefs).toHaveLength(5);
  });

  it('rejects a set-mode crossword recipe that narrows to one entry', () => {
    const source = readJson('content/knowledge/animal-associations.json');

    expect(() => formatDataForEngine(source, 'crossword@1', {
      id: 'test.crossword.one-entry',
      entryIds: ['dog-domestic']
    })).toThrow('test.crossword.one-entry: crossword@1 requires at least two selected knowledge units; got 1');
  });

  it('rejects set-mode entry limits that collapse a reusable activity to one unit', () => {
    const source = readJson('content/knowledge/animal-associations.json');

    expect(() => formatDataForEngine(source, 'memory_pairs@1', {
      id: 'test.memory.one-entry',
      entryOffset: 0,
      entryLimit: 1
    })).toThrow('test.memory.one-entry: memory_pairs@1 requires at least two selected knowledge units; got 1');
  });

  it('enforces single-mode recipes centrally while allowing an explicit one-row selection', () => {
    const source = readJson('content/knowledge/animal-associations.json');

    expect(() => formatDataForEngine(source, 'single_choice@1', {
      id: 'test.mcq.too-many',
      distractorCount: 2
    })).toThrow('test.mcq.too-many: single_choice@1 requires exactly one selected knowledge unit; got 5');

    const result = formatDataForEngine(source, 'single_choice@1', {
      id: 'test.mcq.one-entry',
      entryIds: ['dog-domestic'],
      distractorCount: 2
    });
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].knowledgeRefs).toEqual(['kr.animals.dog.domestic']);
  });
});
