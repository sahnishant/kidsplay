import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
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

describe('visual presentation hard slice bounds', () => {
  it('requires explicit positive count and payload limits in the generic contract', () => {
    expect(validatePresentationModeContract(
      contract,
      registry.strategies.map((entry: { id: string }) => entry.id)
    )).toEqual([]);
    expect(contract.policy.boundedSliceRequired).toBe(true);
    expect(contract.slicePolicy.maxRequestedSenses).toBeGreaterThanOrEqual(400);
    expect(contract.slicePolicy.maxRequestedSenses).toBeLessThan(10_000);
    expect(contract.slicePolicy.maxPayloadBytes).toBeGreaterThan(0);
  });

  it('rejects an accidental full-corpus-style request before attempting projection', () => {
    const tooMany = Array.from(
      { length: contract.slicePolicy.maxRequestedSenses + 1 },
      (_, index) => `missing-${index}#sense`
    );
    expect(() => compilePresentationSlice({
      items: sourceItems,
      requestedSenseKeys: tooMany,
      contract,
      runtimePlans: runtime.plans
    })).toThrow(/maximum is/i);
  });

  it('enforces the serialized payload cap independently of the item-count cap', () => {
    const tinyPayloadContract = {
      ...contract,
      slicePolicy: { ...contract.slicePolicy, maxPayloadBytes: 1 }
    };
    expect(() => compilePresentationSlice({
      items: sourceItems,
      requestedSenseKeys: ['enormous#very-large-size'],
      contract: tinyPayloadContract,
      runtimePlans: runtime.plans
    })).toThrow(/payload is .* maximum is 1/i);
  });

  it('reports V1 source resolution separately from V3+ renderability and V5+/V6 child proof', () => {
    const unresolvedSource = sourceItems.find((item: any) => item.strategy === 'sense_unresolved');
    expect(unresolvedSource).toBeTruthy();
    expect(unresolvedSource.maturity).toBe('V1');

    const slice = compilePresentationSlice({
      items: sourceItems,
      requestedSenseKeys: [
        'village#settlement',
        'enormous#very-large-size',
        unresolvedSource.senseKey
      ],
      contract,
      runtimePlans: runtime.plans
    });

    expect(slice.summary.sourceV1Plus).toBe(3);
    expect(slice.summary.effectiveV3Plus).toBe(2);
    expect(slice.summary.effectiveV5Plus).toBe(2);
    expect(slice.summary.childFacing).toBe(2);
    expect(slice.summary.unresolved).toBe(1);
    expect(slice.summary.textFallback).toBe(1);
  });
});
