import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  compilePresentationRecord,
  compilePresentationSlice,
  validatePresentationModeContract
} from '../scripts/vocabulary-visuals/presentation-compiler.mjs';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
const registry = readJson('content/vocabulary-visuals/registry.json');
const contract = readJson('content/vocabulary-visuals/presentation-modes.json');
const runtime = readJson('content/vocabulary-visuals/__generated-runtime-plans.json');
const sourceItems = readdirSync(resolve(process.cwd(), 'content/vocabulary-visuals/batches'))
  .filter((name) => name.endsWith('.json'))
  .sort()
  .flatMap((name) => readJson(`content/vocabulary-visuals/batches/${name}`).items ?? []);
const sourceBySenseKey = new Map(sourceItems.map((item: any) => [item.senseKey, item]));
const runtimeBySenseKey = new Map(runtime.plans.map((plan: any) => [plan.senseKey, plan]));

function source(senseKey: string): any {
  const item = sourceBySenseKey.get(senseKey);
  if (!item) throw new Error(`Missing test source ${senseKey}`);
  return item;
}

function runtimePlan(senseKey: string): any {
  return runtimeBySenseKey.get(senseKey) ?? null;
}

describe('scalable visual dictionary presentation compiler', () => {
  it('covers every existing #76 strategy exactly once with six derived presentation modes', () => {
    const errors = validatePresentationModeContract(
      contract,
      registry.strategies.map((entry: { id: string }) => entry.id)
    );
    expect(errors).toEqual([]);
    expect(contract.modes.map((mode: { id: string }) => mode.id).sort()).toEqual([
      'asset', 'compare', 'compose', 'scene', 'text', 'transition'
    ]);

    const strategyMappings = contract.modes.flatMap((mode: { id: string; strategies: string[] }) =>
      mode.strategies.map((strategy) => [strategy, mode.id])
    );
    expect(strategyMappings.length).toBe(registry.strategies.length);
    expect(new Set(strategyMappings.map(([strategy]: string[]) => strategy)).size).toBe(strategyMappings.length);
  });

  it('derives bounded renderer modes from real strategies without changing semantic authority', () => {
    const cases = [
      ['village#settlement', 'compose'],
      ['enormous#very-large-size', 'compare'],
      ['pull#move-toward-by-force', 'transition'],
      ['cheerful#happy-positive', 'scene']
    ] as const;

    for (const [senseKey, derivedMode] of cases) {
      const item = source(senseKey);
      const plan = compilePresentationRecord(item, {
        contract,
        runtimePlan: runtimePlan(senseKey)
      });
      expect(plan).toMatchObject({
        senseKey,
        strategy: item.strategy,
        sourceMaturity: item.maturity,
        derivedMode
      });
      expect(plan.presentationKey).toBe(`visual-meaning:v1:${senseKey}`);
    }

    const directItem = sourceItems.find((item: any) => item.lemma === 'school' && item.strategy === 'direct_entity');
    expect(directItem).toBeTruthy();
    expect(compilePresentationRecord(directItem, { contract }).derivedMode).toBe('asset');
  });

  it('keeps renderer proof separate from child-facing dictionary authority', () => {
    const village = compilePresentationRecord(source('village#settlement'), {
      contract,
      runtimePlan: runtimePlan('village#settlement')
    });
    expect(village).toMatchObject({
      status: 'renderer_proven',
      derivedMode: 'compose',
      deliveryMode: 'text',
      rendererReady: true,
      childFacing: false,
      effectiveMaturity: 'V3',
      fallbackReason: 'not_child_facing'
    });

    const enormous = compilePresentationRecord(source('enormous#very-large-size'), {
      contract,
      runtimePlan: runtimePlan('enormous#very-large-size')
    });
    expect(enormous).toMatchObject({
      status: 'child_facing',
      derivedMode: 'compare',
      deliveryMode: 'compare',
      rendererReady: true,
      childFacing: true,
      effectiveMaturity: 'V5',
      runtimeUsage: 'knowledge_reinforcement'
    });
  });

  it('fails closed for unresolved/text-only/missing senses instead of inheriting an approximate visual', () => {
    const unresolved = compilePresentationRecord({
      lemma: 'bank',
      senseKey: 'bank#unresolved',
      strategy: 'sense_unresolved',
      maturity: 'V1',
      motionPolicy: 'none',
      answerSafety: 'explanation_only'
    }, { contract });
    expect(unresolved).toMatchObject({
      derivedMode: 'text',
      deliveryMode: 'text',
      status: 'blocked',
      fallbackReason: 'sense_unresolved',
      childFacing: false
    });

    const textual = compilePresentationRecord({
      lemma: 'justice',
      senseKey: 'justice#reviewed-text-only',
      strategy: 'textual_only',
      maturity: 'V1',
      motionPolicy: 'none',
      answerSafety: 'explanation_only'
    }, { contract });
    expect(textual).toMatchObject({
      derivedMode: 'text',
      deliveryMode: 'text',
      status: 'text_fallback',
      fallbackReason: 'textual_only'
    });

    const slice = compilePresentationSlice({
      items: sourceItems,
      requestedSenseKeys: ['not-a-real-sense#missing'],
      contract,
      runtimePlans: runtime.plans
    });
    expect(slice.plans[0]).toMatchObject({
      senseKey: 'not-a-real-sense#missing',
      status: 'blocked',
      deliveryMode: 'text',
      fallbackReason: 'missing_sense'
    });
  });

  it('builds deterministic bounded slices independent of request ordering and rejects duplicate requests', () => {
    const requested = [
      'enormous#very-large-size',
      'village#settlement',
      'pull#move-toward-by-force',
      'cheerful#happy-positive'
    ];
    const first = compilePresentationSlice({
      items: sourceItems,
      requestedSenseKeys: requested,
      contract,
      runtimePlans: runtime.plans
    });
    const second = compilePresentationSlice({
      items: sourceItems,
      requestedSenseKeys: [...requested].reverse(),
      contract,
      runtimePlans: runtime.plans
    });

    expect(first).toEqual(second);
    expect(first.plans.map((plan: any) => plan.senseKey)).toEqual([...requested].sort());
    expect(first.summary.requested).toBe(4);
    expect(first.summary.payloadBytes).toBeGreaterThan(0);
    expect(first.summary.payloadBytes).toBeLessThan(10_000);
    expect(() => compilePresentationSlice({
      items: sourceItems,
      requestedSenseKeys: ['village#settlement', 'village#settlement'],
      contract,
      runtimePlans: runtime.plans
    })).toThrow(/duplicate requested sense keys/i);
  });

  it('collapses equivalent many-to-one knowledge mappings to one semantic presentation and rejects conflicts', () => {
    const runtimeGroups = new Map<string, any[]>();
    for (const plan of runtime.plans) {
      const values = runtimeGroups.get(plan.senseKey) ?? [];
      values.push(plan);
      runtimeGroups.set(plan.senseKey, values);
    }
    const duplicate = [...runtimeGroups.entries()].find(([, plans]) => plans.length > 1);
    expect(duplicate).toBeTruthy();
    const [senseKey, equivalentPlans] = duplicate!;

    const slice = compilePresentationSlice({
      items: sourceItems,
      requestedSenseKeys: [senseKey],
      contract,
      runtimePlans: equivalentPlans
    });
    expect(slice.plans).toHaveLength(1);
    expect(slice.plans[0]).toMatchObject({
      senseKey,
      runtimePlanCount: equivalentPlans.length
    });
    expect(slice.summary).toMatchObject({
      requested: 1,
      runtimeMappings: equivalentPlans.length
    });

    const conflict = {
      ...equivalentPlans[1],
      parameters: { ...equivalentPlans[1].parameters, __conflictProbe: true }
    };
    expect(() => compilePresentationSlice({
      items: sourceItems,
      requestedSenseKeys: [senseKey],
      contract,
      runtimePlans: [equivalentPlans[0], conflict]
    })).toThrow(/conflicting runtime presentation plans/i);
  });

  it('detects runtime projection drift instead of letting presentation data mutate meaning', () => {
    const item = source('enormous#very-large-size');
    const plan = runtimePlan('enormous#very-large-size');
    expect(() => compilePresentationRecord(item, {
      contract,
      runtimePlan: { ...plan, parameters: { ...plan.parameters, dimension: 'weight' } }
    })).toThrow(/changed semantic parameters/i);
  });
});
