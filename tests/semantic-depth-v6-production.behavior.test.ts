import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import VocabularySemanticScene from '../src/presentation/VocabularySemanticScene.svelte';
import { resolveSemanticDepthMode } from '../src/presentation/semanticDepthRegistry';
import {
  isVocabularyVisualPlanChildFacing,
  resolveVocabularyVisualPlanForKnowledgeRefs
} from '../src/presentation/vocabularyVisualRegistry';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
const readText = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const rendererPromotions = [
  ['kr.vocab.place.village.is-settlement', 'village#settlement', 'V3'],
  ['kr.vocab.spatial.under.describes-relative-position', 'under#below-reference', 'V3'],
  ['kr.vocab.comparison.same.matches-target-dimension', 'same#matching-in-target-dimension', 'V3'],
  ['kr.vocab.process.open.closed-to-open', 'open#change-from-closed', 'V4']
] as const;

afterEach(() => cleanup());

describe('#132 Phase D V6 semantic-depth production', () => {
  it('adds a bounded presentation-independent canonical relationship tranche', () => {
    const canonical = readJson('content/knowledge/semantic-vocabulary-depth-002.json');
    const depth = readJson('content/semantic-knowledge/vocabulary-depth-002.json');

    expect(canonical).toHaveLength(1);
    expect(canonical[0].entries).toHaveLength(18);
    expect(depth.issueRef).toBe(132);
    expect(depth.reasoningPatterns).toHaveLength(24);
    expect(depth.neighbourhoods.length).toBeGreaterThanOrEqual(6);

    const forbidden = new Set(['visualRef', 'assetRef', 'assetUrl', 'url', 'file', 'filename', 'x', 'y', 'motion', 'css']);
    const scan = (value: unknown): string[] => {
      if (Array.isArray(value)) return value.flatMap(scan);
      if (!value || typeof value !== 'object') return [];
      return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => [
        ...(forbidden.has(key) ? [key] : []),
        ...scan(nested)
      ]);
    };
    expect(scan(depth)).toEqual([]);
  });

  it('projects semantic depth onto every admitted knowledge mapping while renderer-only candidates remain fail-closed before promotion', () => {
    const runtime = readJson('content/vocabulary-visuals/__generated-runtime-plans.json');
    const knowledgePlans = runtime.plans.filter((plan: { runtimeUsage?: string }) => plan.runtimeUsage === 'knowledge_reinforcement');

    expect(runtime.semanticDepthIssueRefs).toEqual(expect.arrayContaining([84, 132]));
    expect(knowledgePlans).toHaveLength(26);
    expect(knowledgePlans.every((plan: { semanticDepthPatternRefs?: string[] }) => (plan.semanticDepthPatternRefs?.length ?? 0) >= 1)).toBe(true);
    expect(knowledgePlans.every((plan: { semanticDepthPatternRefs?: string[] }) => Boolean(resolveSemanticDepthMode(plan.semanticDepthPatternRefs ?? [])))).toBe(true);

    for (const [knowledgeRef, senseKey, maturity] of rendererPromotions) {
      const plan = knowledgePlans.find((candidate: { knowledgeRef?: string }) => candidate.knowledgeRef === knowledgeRef);
      expect(plan).toMatchObject({ knowledgeRef, senseKey, maturity });
      expect(isVocabularyVisualPlanChildFacing(plan)).toBe(false);
      expect(resolveVocabularyVisualPlanForKnowledgeRefs([knowledgeRef])).toBeNull();
    }
  });

  it('generates multiple bounded learner forms from the new canonical rows using existing engines', () => {
    const questions = readJson('content/questions/__generated-from-knowledge.json');
    const byId = new Map(questions.map((question: { id: string }) => [question.id, question]));

    for (const id of [
      'vocab.depth.size-speed.match.002',
      'vocab.depth.properties.match.002',
      'vocab.depth.states-actions.match.002',
      'vocab.depth.time-place-emotion.match.002'
    ]) {
      const question = byId.get(id) as { interaction?: { type?: string; items?: unknown[] } };
      expect(question?.interaction?.type).toBe('drag_to_target');
      expect(question?.interaction?.items?.length).toBeGreaterThanOrEqual(3);
      expect(question?.interaction?.items?.length).toBeLessThanOrEqual(5);
    }

    expect((byId.get('vocab.depth.happy.recognition.002') as { interaction?: { type?: string } })?.interaction?.type).toBe('single_choice');
  });

  it('contains a hard V6 compiler boundary but does not render a V6 cue before proof promotion', () => {
    const compiler = readText('scripts/compile-vocabulary-visual-runtime.mjs');
    expect(compiler).toContain("child_facing_semantic_depth_explanation");
    expect(compiler).toContain('V6 semantic-depth proof is missing same-sense depth');
    expect(compiler).toContain('semanticDepthPatternsFor');

    const { container } = render(VocabularySemanticScene, { props: { senseKey: 'enormous#very-large-size' } });
    const root = container.querySelector('[data-vocabulary-sense="enormous#very-large-size"]');
    expect(root?.getAttribute('data-semantic-depth-mode')).toBe('attribute_explanation');
    expect(container.querySelector('[data-semantic-depth-cue]')).toBeNull();
  });
});
