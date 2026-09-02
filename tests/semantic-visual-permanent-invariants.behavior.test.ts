import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getAnimationCompositions, resolveAnimationForState } from '../src/presentation/animationRegistry';
import { getSceneDefinitions } from '../src/presentation/sceneRegistry';
import { resolveVisualDefinition } from '../src/presentation/visualRegistry';
import {
  getVocabularyVisualRuntimePlans,
  resolveVocabularyVisualPlan,
  type VocabularyVisualRuntimePlan
} from '../src/presentation/vocabularyVisualRegistry';

function vocabularyPresentationSignature(plan: VocabularyVisualRuntimePlan): string {
  return JSON.stringify({
    lemma: plan.lemma,
    strategy: plan.strategy,
    sceneTemplate: plan.sceneTemplate,
    motionPolicy: plan.motionPolicy,
    answerSafety: plan.answerSafety,
    visualRef: plan.visualRef,
    parameters: plan.parameters,
    semanticDepthPatternRefs: plan.semanticDepthPatternRefs
  });
}

describe('permanent semantic visual invariants', () => {
  it('keeps semantic state fallback deterministic across repeated resolution', () => {
    const queries = [
      { semanticRef: 'dog' as const, expression: 'worried' as const },
      { semanticRef: 'dog' as const, expression: 'neutral' as const, pose: 'play' as const },
      { semanticRef: 'wind' as const },
      { semanticRef: 'germination' as const }
    ];

    for (const query of queries) {
      const first = resolveAnimationForState(query)?.id ?? null;
      const repeated = Array.from({ length: 25 }, () => resolveAnimationForState(query)?.id ?? null);
      expect(new Set(repeated)).toEqual(new Set([first]));
    }
  });

  it('makes cross-file registry precedence explicit instead of inheriting glob enumeration', () => {
    for (const path of [
      'src/presentation/animationRegistry.ts',
      'src/presentation/sceneRegistry.ts',
      'src/presentation/visualRegistry.ts',
      'src/presentation/visualRecipeRegistry.ts'
    ]) {
      const source = readFileSync(path, 'utf8');
      expect(source, `${path} should enumerate modules explicitly`).toContain('Object.entries(');
      expect(source, `${path} should sort module paths`).toContain('localeCompare(');
    }

    const visualRegistry = readFileSync('src/presentation/visualRegistry.ts', 'utf8');
    expect(visualRegistry).toContain('if (!visualRefByAlias.has(normalizedAlias))');
  });

  it('keeps every authored composition accessible and meaningful without motion', () => {
    const renderer = readFileSync('src/presentation/SemanticAnimation.svelte', 'utf8');
    expect(renderer).toContain('@media (prefers-reduced-motion: reduce)');
    expect(renderer).toContain('animation: none !important');

    for (const composition of getAnimationCompositions()) {
      expect(composition.ariaLabel.trim().length, `${composition.id} ariaLabel`).toBeGreaterThan(0);
      expect(composition.subject.variantRef.trim().length, `${composition.id} subject`).toBeGreaterThan(0);
      expect(resolveVisualDefinition(composition.subject.variantRef)?.animationIdentityRef).toBe(composition.semanticRef);
      for (const part of composition.parts) {
        expect(Boolean(part.visualRef) !== Boolean(part.text?.trim()), `${composition.id}/${part.id} static cue`).toBe(true);
      }
    }
  });

  it('keeps every authored composition reachable from at least one child-facing scene', () => {
    const used = new Set(getSceneDefinitions().map((scene) => scene.animationRef));
    const orphaned = getAnimationCompositions().map((composition) => composition.id).filter((id) => !used.has(id));
    expect(orphaned).toEqual([]);

    const reporter = readFileSync('scripts/report-semantic-animation-coverage.mjs', 'utf8');
    expect(reporter).toContain('authored semantic composition has no child-facing scene owner');
  });

  it('keeps vocabulary knowledge ownership unique while allowing deterministic same-sense reuse', () => {
    const plans = getVocabularyVisualRuntimePlans();
    const knowledgeRefs = plans.flatMap((plan) => plan.knowledgeRef ? [plan.knowledgeRef] : []);
    expect(new Set(knowledgeRefs).size).toBe(knowledgeRefs.length);

    const plansBySense = new Map<string, VocabularyVisualRuntimePlan[]>();
    for (const plan of plans) {
      const group = plansBySense.get(plan.senseKey) ?? [];
      group.push(plan);
      plansBySense.set(plan.senseKey, group);
    }

    for (const [senseKey, group] of plansBySense) {
      expect(new Set(group.map(vocabularyPresentationSignature)).size, `${senseKey} presentation semantics`).toBe(1);
      const first = resolveVocabularyVisualPlan(senseKey);
      expect(first, `${senseKey} should resolve`).toBeTruthy();
      const repeated = Array.from({ length: 25 }, () => resolveVocabularyVisualPlan(senseKey));
      expect(new Set(repeated.map((plan) => plan?.knowledgeRef ?? null))).toEqual(new Set([first?.knowledgeRef ?? null]));
    }

    const registry = readFileSync('src/presentation/vocabularyVisualRegistry.ts', 'utf8');
    expect(registry).toContain('Conflicting vocabulary visual runtime presentation for senseKey');
    expect(registry).toContain('Duplicate vocabulary visual runtime knowledgeRef');
  });

  it('keeps semantic visual selection free of runtime randomness', () => {
    for (const path of [
      'src/presentation/animationRegistry.ts',
      'src/presentation/semanticVisualPresentation.ts',
      'src/presentation/visualRegistry.ts',
      'src/presentation/visualRecipeRegistry.ts',
      'src/presentation/vocabularyVisualRegistry.ts'
    ]) {
      const source = readFileSync(path, 'utf8');
      expect(source, `${path} must not select visuals randomly`).not.toContain('Math.random');
      expect(source, `${path} must not select visuals randomly`).not.toContain('crypto.getRandomValues');
    }
  });
});
