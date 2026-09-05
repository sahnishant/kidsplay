import { describe, expect, it } from 'vitest';
import { formatDataForEngine } from '../scripts/formatters/registry.mjs';
import source from '../content/knowledge/studio-lion-growth.json';
import recipes from '../content/recipes/studio-lion-growth.json';
import { evaluate } from '../src/evaluation/evaluate';
import type { SequenceOrderQuestion } from '../src/contracts/question';

describe('Lion growth scope', () => {
  it('derives the one source order and checks all six alternatives without mastery', () => {
    const recipe = recipes[0];
    const question = formatDataForEngine(source, recipe.engine, recipe).questions[0] as SequenceOrderQuestion;
    const [a,b,c] = question.solution.orderedItemIds;
    const orders = [[a,b,c],[a,c,b],[b,a,c],[b,c,a],[c,a,b],[c,b,a]];
    const results = orders.map((orderedItemIds) => evaluate(question,{orderedItemIds}));
    expect(results.filter((result) => result.correct)).toHaveLength(1);
    expect(results.every((result) => !result.masteryEvidence.length && !result.knowledgeEvidence.length)).toBe(true);
    expect(question.knowledgeRefs).toEqual([source.rowId]);
    expect(question.authoring.status).toBe('draft');
    expect(question.interaction.items.map((item) => item.label)).toEqual(source.stages.map((stage) => stage.label));
    expect(source.authoring.provenance[0].url).toBe('https://nationalzoo.si.edu/animals/lion');
  });
  it('does not use a generic adult-male lion picture to certify age discrimination', () => {
    for (const stage of source.stages) expect(stage).not.toHaveProperty('semanticRef');
    expect(source.authoring.scopeNote).toContain('not a guarantee of survival');
    expect(source.authoring.scopeNote).toContain('separate stage-discrimination review');
  });
});
