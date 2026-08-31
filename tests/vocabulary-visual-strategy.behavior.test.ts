import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { planVocabularyScene, validateStrategyItem } from '../scripts/vocabulary-visuals/strategy-contract.mjs';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
const registryJson = readJson('content/vocabulary-visuals/registry.json');
const batch = readJson('content/vocabulary-visuals/batches/priority-batch-001.json');
const registry = {
  strategyIds: new Set((registryJson.strategies ?? []).map((entry: { id: string }) => entry.id)),
  maturityRanks: new Map((registryJson.maturityLevels ?? []).map((entry: { id: string; rank: number }) => [entry.id, entry.rank])),
  templateById: new Map((registryJson.sceneTemplates ?? []).map((entry: { id: string }) => [entry.id, entry])),
  motionPolicies: new Set(registryJson.motionPolicies ?? []),
  answerSafety: new Set(registryJson.answerSafety ?? [])
};
const visualIds = new Set(
  readdirSync(resolve(process.cwd(), 'content/visuals'))
    .filter((name) => name.endsWith('.json'))
    .flatMap((name) => readJson(`content/visuals/${name}`))
    .map((visual: { id: string }) => visual.id)
);

const byLemma = new Map(batch.items.map((item: { lemma: string }) => [item.lemma, item]));

describe('semantic vocabulary visual strategy control plane', () => {
  it('seeds a broad first batch with explicit sense keys and no strategy-contract violations', () => {
    expect(batch.items.length).toBeGreaterThanOrEqual(80);
    expect(new Set(batch.items.map((item: { senseKey: string }) => item.senseKey)).size).toBe(batch.items.length);
    for (const item of batch.items) {
      expect(item.senseKey).toMatch(new RegExp(`^${item.lemma}#`));
      expect(validateStrategyItem(item, registry, visualIds)).toEqual([]);
    }
  });

  it('models village, town and city as one reusable settlement grammar with controlled semantic differences', () => {
    const village = byLemma.get('village') as any;
    const town = byLemma.get('town') as any;
    const city = byLemma.get('city') as any;
    expect([village, town, city].every((item) => item.sceneTemplate === 'settlement')).toBe(true);
    expect(village.parameters.density).toBe('low');
    expect(town.parameters.density).toBe('medium');
    expect(city.parameters.density).toBe('high');
    expect(village.parameters.farmland).toBe('high');
    expect(city.parameters.farmland).toBe('none');
  });

  it('keeps polysemous visual teaching sense-specific rather than mapping the bare lemma', () => {
    const light = byLemma.get('light') as any;
    const old = byLemma.get('old') as any;
    const full = byLemma.get('full') as any;
    expect(light.senseKey).toBe('light#not-heavy');
    expect(light.parameters.dimension).toBe('weight');
    expect(old.senseKey).toBe('old#not-new');
    expect(full.senseKey).toBe('full#container-at-capacity');
  });

  it('suppresses explanatory animation before assessment answers but allows explicitly neutral direct visuals', () => {
    const pull = byLemma.get('pull') as any;
    const school = byLemma.get('school') as any;
    expect(planVocabularyScene(pull, { phase: 'assessment_pre_answer' })).toMatchObject({
      status: 'suppressed',
      reason: 'answer_safety'
    });
    expect(planVocabularyScene(school, { phase: 'assessment_pre_answer' })).toMatchObject({
      status: 'ready',
      type: 'direct_entity',
      visualRef: 'entity.place.school'
    });
  });

  it('gives every plan a reduced-motion/static semantic equivalent and meaningful beats for actions/processes', () => {
    for (const item of batch.items) {
      const plan = planVocabularyScene(item, { phase: 'explanation' }) as any;
      if (['blocked', 'textual_only'].includes(plan.status)) continue;
      expect(plan.status).toBe('ready');
      expect(plan.staticEquivalent).toBeTruthy();
    }
    const pullPlan = planVocabularyScene(byLemma.get('pull'), { phase: 'explanation' }) as any;
    const openPlan = planVocabularyScene(byLemma.get('open'), { phase: 'explanation' }) as any;
    expect(pullPlan.beats).toEqual(['establish', 'act', 'result']);
    expect(pullPlan.staticEquivalent.beats).toEqual(['establish', 'result']);
    expect(openPlan.beats).toEqual(['establish', 'transform', 'result']);
    expect(openPlan.staticEquivalent.beats).toEqual(['establish', 'result']);
  });
});
