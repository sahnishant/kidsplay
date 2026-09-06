import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import day from '../content/knowledge/studio-earth-day.json';
import processes from '../content/knowledge/vocabulary-processes.json';
import recipes from '../content/recipes/studio-earth-processes.json';
import { evaluate } from '../src/evaluation/evaluate';
import type { SequenceOrderQuestion } from '../src/contracts/question';

// Check the actual compiler output. Do not import the Node filesystem-backed
// formatter registry through the browser-like Vitest module transform.
const compiled = JSON.parse(readFileSync(resolve(process.cwd(), 'content/questions/__generated-from-knowledge.json'), 'utf8')) as SequenceOrderQuestion[];
function permutations<T>(items: T[]): T[][] {
  return items.length ? items.flatMap((item, index) => permutations(items.filter((_, i) => i !== index)).map((rest) => [item, ...rest])) : [[]];
}

describe('Earth source-driven sequence pilots', () => {
  for (const recipe of recipes) it(`compiles ${recipe.id} without a second order or mastery writes`, () => {
    const source = [day, ...processes].find((item) => item.id === recipe.sourceRef)!;
    const question = compiled.find((item) => item.id === recipe.id)!;
    expect(question).toBeDefined();
    expect(question.interaction.items.map((item) => item.label)).toEqual(source.stages.map((stage) => stage.label));
    expect(question.knowledgeRefs).toEqual([source.rowId]);
    expect(question.evidencePolicy).toBe('practice_only');
    let accepted = 0;
    for (const orderedItemIds of permutations(question.solution.orderedItemIds)) {
      const result = evaluate(question, { orderedItemIds });
      accepted += Number(result.correct);
      expect(result.masteryEvidence).toEqual([]);
      expect(result.knowledgeEvidence).toEqual([]);
    }
    expect(accepted).toBe(1);
  });
  it('keeps new science draft and explicitly anchors the day rather than granting rotation mastery', () => {
    expect(day.authoring.status).toBe('draft');
    expect(day.conceptIds).not.toContain('universe.earth.rotation');
    expect(recipes[0].prompt).toContain('Start at sunrise');
    expect(day.authoring.provenance[0].url).toContain('lpi.usra.edu');
  });
});
