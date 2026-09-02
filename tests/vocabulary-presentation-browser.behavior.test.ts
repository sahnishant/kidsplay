import { describe, expect, it } from 'vitest';
import presentationModesJson from '../content/vocabulary-visuals/presentation-modes.json';
import {
  resolveVisualMeaningPresentationForKnowledgeRefs,
  resolveVisualMeaningPresentationSlice
} from '../src/presentation/vocabularyPresentation';

const contract = presentationModesJson as {
  slicePolicy: { maxRequestedSenses: number; maxPayloadBytes: number };
};

describe('browser visual meaning slice projection', () => {
  it('projects a canonical bounded multi-sense slice independent of caller order', () => {
    const requested = [
      'pull#move-toward-by-force',
      'village#settlement',
      'enormous#very-large-size',
      'cheerful#happy-positive'
    ];
    const forward = resolveVisualMeaningPresentationSlice(requested);
    const reverse = resolveVisualMeaningPresentationSlice([...requested].reverse());

    expect(forward).toEqual(reverse);
    expect(forward.plans.map((plan) => plan.senseKey)).toEqual([...requested].sort());
    expect(forward.summary.requested).toBe(4);
    expect(forward.summary.visualAllowed).toBe(4);
    expect(forward.summary.textFallback).toBe(0);
    expect(forward.summary.payloadBytes).toBeGreaterThan(0);
    expect(forward.summary.payloadBytes).toBeLessThanOrEqual(contract.slicePolicy.maxPayloadBytes);
    expect(forward.summary.maxRequestedSenses).toBe(contract.slicePolicy.maxRequestedSenses);
    expect(forward.plans.find((plan) => plan.senseKey === 'village#settlement')).toMatchObject({
      deliveryMode: 'compose',
      visualAllowed: true,
      maturity: 'V6'
    });
  });

  it('resolves canonical knowledge refs without a lemma shortcut or input-order visual choice', () => {
    const resolved = resolveVisualMeaningPresentationForKnowledgeRefs([
      'kr.vocab.meaning.enormous.very-large'
    ]);
    expect(resolved).toMatchObject({
      senseKey: 'enormous#very-large-size',
      derivedMode: 'compare',
      deliveryMode: 'compare',
      visualAllowed: true,
      maturity: 'V6'
    });

    const sameSenseRefs = [
      'kr.vocab.meaning.ancient.very-old',
      'kr.vocab.antonym.ancient.modern'
    ];
    const ancientForward = resolveVisualMeaningPresentationForKnowledgeRefs(sameSenseRefs);
    const ancientReverse = resolveVisualMeaningPresentationForKnowledgeRefs([...sameSenseRefs].reverse());
    expect(ancientForward).toEqual(ancientReverse);
    expect(ancientForward).toMatchObject({
      senseKey: 'ancient#very-old-from-long-ago',
      visualAllowed: true,
      maturity: 'V6'
    });

    const conflict = resolveVisualMeaningPresentationForKnowledgeRefs([
      'kr.vocab.meaning.enormous.very-large',
      'kr.vocab.meaning.cheerful.happy-positive'
    ]);
    expect(conflict).toMatchObject({
      senseKey: '',
      deliveryMode: 'text',
      visualAllowed: false,
      fallbackReason: 'knowledge_refs_conflict'
    });

    const missing = resolveVisualMeaningPresentationForKnowledgeRefs(['kr.not-real']);
    expect(missing).toMatchObject({
      senseKey: '',
      deliveryMode: 'text',
      visualAllowed: false,
      fallbackReason: 'runtime_plan_missing'
    });
  });

  it('applies answer-safety consistently to every sense in a pre-answer slice', () => {
    const slice = resolveVisualMeaningPresentationSlice([
      'enormous#very-large-size',
      'pull#move-toward-by-force',
      'cheerful#happy-positive'
    ], { phase: 'assessment_pre_answer' });

    expect(slice.phase).toBe('assessment_pre_answer');
    expect(slice.plans.every((plan) => plan.deliveryMode === 'text')).toBe(true);
    expect(slice.plans.every((plan) => plan.visualAllowed === false)).toBe(true);
    expect(slice.plans.every((plan) => plan.fallbackReason === 'answer_safety')).toBe(true);
    expect(slice.summary.visualAllowed).toBe(0);
    expect(slice.summary.textFallback).toBe(3);
  });

  it('fails closed on duplicate, empty and over-limit slice requests', () => {
    expect(() => resolveVisualMeaningPresentationSlice([
      'enormous#very-large-size',
      'enormous#very-large-size'
    ])).toThrow(/duplicate sense keys/i);

    expect(() => resolveVisualMeaningPresentationSlice([''])).toThrow(/non-empty sense keys/i);

    const tooMany = Array.from(
      { length: contract.slicePolicy.maxRequestedSenses + 1 },
      (_, index) => `missing-${index}#sense`
    );
    expect(() => resolveVisualMeaningPresentationSlice(tooMany)).toThrow(/maximum is/i);
  });
});
