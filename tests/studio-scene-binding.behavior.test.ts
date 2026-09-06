import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import bindings from '../content/experience/studio-scene-bindings.json';
import visuals from '../content/visuals/studio-scenes.json';
import { bindStudioScene, validateStudioSceneBindings } from '../scripts/visuals/studio-scene-bindings-core.mjs';
import { resolveLabelVisualRefs, resolveSemanticVisualRefs } from '../src/presentation/visualRegistry';

const read = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
const questions = [...read('content/questions/__generated-from-knowledge.json'), ...read('content/questions/__generated-story-studios.json')];
const byId = new Map(questions.map((question) => [question.id, question]));
function undecorated(question: any) {
  const copy = structuredClone(question);
  copy.interaction.items.forEach((item: any) => { delete item.visualRefs; });
  return copy;
}

describe('explicit source-bound studio illustration projection', () => {
  it('registers sixteen reachable draft illustrations for six existing activities', () => {
    expect(validateStudioSceneBindings(bindings, visuals)).toBe(bindings);
    expect(bindings).toHaveLength(6);
    expect(visuals).toHaveLength(16);
    expect(new Set(bindings.flatMap((binding) => Object.values(binding.items).map((item) => item!.visualRef)))).toEqual(new Set(visuals.map((visual) => visual.id)));
  });
  it.each(bindings)('decorates $questionId without modifying any semantic/evidence authority', (binding) => {
    const compiled = byId.get(binding.questionId);
    expect(compiled).toBeTruthy();
    const source = undecorated(compiled);
    const original = structuredClone(source);
    const result = bindStudioScene(source, binding);
    expect(result).toEqual(compiled);
    expect(undecorated(result)).toEqual(source);
    expect(source).toEqual(original);
    expect(bindStudioScene(result, binding)).toEqual(result);
    const reversed = { ...binding, items: Object.fromEntries(Object.entries(binding.items).reverse()) };
    expect(bindStudioScene(source, reversed)).toEqual(result);
  });
  it.each(visuals)('does not infer $id from labels or semantic lookup', (visual) => {
    expect(resolveLabelVisualRefs(visual.aliases[0])).toEqual([]);
    expect(resolveSemanticVisualRefs(visual.id.split('.').at(-1))).toEqual([]);
    expect(visual.editorialStatus).toBe('draft');
    expect(visual.motion).toBe('none');
  });
  it.each(['solution', 'order', 'correct', 'knowledgeRefs', 'conceptIds'])('rejects %s authority in a presentation binding', (field) => {
    expect(() => validateStudioSceneBindings([{ ...bindings[0], [field]: [] }], visuals)).toThrow();
    const altered = structuredClone(bindings[0]);
    Object.assign(Object.values(altered.items)[0]!, { [field]: [] });
    expect(() => validateStudioSceneBindings([altered], visuals)).toThrow();
  });
  it('rejects duplicate, sparse, missing and unknown illustration bindings', () => {
    expect(() => validateStudioSceneBindings([bindings[0], bindings[0]], visuals)).toThrow();
    const sparse = [bindings[0]]; delete sparse[0];
    expect(() => validateStudioSceneBindings(sparse, visuals)).toThrow();
    expect(() => validateStudioSceneBindings(bindings, [])).toThrow();
    expect(() => validateStudioSceneBindings([{ ...bindings[0], items: {} }], visuals)).toThrow();
  });
  it.each(['wording', 'source', 'evidence', 'review', 'missing', 'sparse', 'duplicate', 'existing-art'])('fails closed when %s changes', (kind) => {
    const binding = bindings[0];
    const question = undecorated(byId.get(binding.questionId));
    if (kind === 'wording') question.interaction.items[0].label += ' changed';
    if (kind === 'source') question.authoring.source = 'another source';
    if (kind === 'evidence') question.evidencePolicy = 'eligible';
    if (kind === 'review') question.authoring.status = 'reviewed';
    if (kind === 'missing') question.interaction.items.pop();
    if (kind === 'sparse') delete question.interaction.items[0];
    if (kind === 'duplicate') question.interaction.items[0] = question.interaction.items[1];
    if (kind === 'existing-art') question.interaction.items[0].visualRefs = ['another-authored-visual'];
    expect(() => bindStudioScene(question, binding)).toThrow();
  });
  it('uses the same water pictures in opposite source orders, without mixing saved identity', () => {
    const melt = byId.get('earth.studio.ice-melting.001');
    const freeze = byId.get('earth.studio.water-freezing.001');
    expect(melt.interaction.items.map((item: any) => item.visualRefs[0])).toEqual(freeze.interaction.items.map((item: any) => item.visualRefs[0]).reverse());
    expect(melt.id).not.toBe(freeze.id);
    expect(melt.solution.orderedItemIds).not.toEqual(freeze.solution.orderedItemIds);
    expect(byId.get('fire-station.studio.visit-story.001').knowledgeRefs).toEqual([]);
  });
});
