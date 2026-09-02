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

const promotedMappings = [
  ['kr.vocab.place.village.is-settlement', 'village#settlement'],
  ['kr.vocab.spatial.under.describes-relative-position', 'under#below-reference'],
  ['kr.vocab.comparison.same.matches-target-dimension', 'same#matching-in-target-dimension'],
  ['kr.vocab.process.open.closed-to-open', 'open#change-from-closed']
] as const;

const phaseDBaselineKnowledgeRefs = new Set([
  'kr.vocab.meaning.enormous.very-large',
  'kr.vocab.meaning.fragile.easily-broken',
  'kr.vocab.meaning.rapid.very-fast',
  'kr.vocab.meaning.ancient.very-old',
  'kr.vocab.meaning.cheerful.happy-positive',
  'kr.vocab.meaning.scarce.hard-to-find',
  'kr.vocab.meaning.silent.no-sound',
  'kr.vocab.meaning.observe.watch-carefully',
  'kr.vocab.synonym.happy.glad',
  'kr.vocab.synonym.quick.fast',
  'kr.vocab.synonym.small.tiny',
  'kr.vocab.synonym.large.big',
  'kr.vocab.synonym.quiet.silent',
  'kr.vocab.antonym.hot.cold',
  'kr.vocab.antonym.early.late',
  'kr.vocab.antonym.narrow.wide',
  'kr.vocab.antonym.smooth.rough',
  'kr.vocab.antonym.ancient.modern',
  'kr.vocab.force.pull.can-move-object-toward',
  'kr.vocab.primary.meaning.fast.fast-a-1',
  'kr.vocab.primary.meaning.full.full-a-1',
  'kr.vocab.primary.meaning.library.library-n-3',
  'kr.vocab.place.village.is-settlement',
  'kr.vocab.spatial.under.describes-relative-position',
  'kr.vocab.comparison.same.matches-target-dimension',
  'kr.vocab.process.open.closed-to-open'
]);

const stageAEvidence = {
  headSha: 'a85af7a65787cf60497c0eb696721f428f2d2e9a',
  windowsWorkflowRunId: 33583987996
} as const;

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

  it('keeps the certified #132 baseline V6 even as later Phase D tranches add more mapped senses', () => {
    const runtime = readJson('content/vocabulary-visuals/__generated-runtime-plans.json');
    const knowledgePlans = runtime.plans.filter((plan: { runtimeUsage?: string }) => plan.runtimeUsage === 'knowledge_reinforcement');
    const baselinePlans = knowledgePlans.filter((plan: { knowledgeRef?: string }) => phaseDBaselineKnowledgeRefs.has(plan.knowledgeRef ?? ''));

    expect(runtime.semanticDepthIssueRefs).toEqual(expect.arrayContaining([84, 132]));
    expect(runtime.maturityEvidence).toMatchObject({
      headSha: stageAEvidence.headSha,
      workflowRunId: stageAEvidence.windowsWorkflowRunId
    });
    expect(baselinePlans).toHaveLength(26);
    expect(new Set(baselinePlans.map((plan: { senseKey: string }) => plan.senseKey)).size).toBe(25);
    expect(baselinePlans.every((plan: { maturity?: string }) => plan.maturity === 'V6')).toBe(true);
    expect(baselinePlans.every((plan: { semanticDepthPatternRefs?: string[] }) => (plan.semanticDepthPatternRefs?.length ?? 0) >= 1)).toBe(true);
    expect(baselinePlans.every((plan: { semanticDepthPatternRefs?: string[] }) => Boolean(resolveSemanticDepthMode(plan.semanticDepthPatternRefs ?? [])))).toBe(true);
    expect(baselinePlans.every((plan: any) => isVocabularyVisualPlanChildFacing(plan))).toBe(true);

    for (const [knowledgeRef, senseKey] of promotedMappings) {
      const plan = baselinePlans.find((candidate: { knowledgeRef?: string }) => candidate.knowledgeRef === knowledgeRef);
      expect(plan).toMatchObject({ knowledgeRef, senseKey, maturity: 'V6' });
      expect(resolveVocabularyVisualPlanForKnowledgeRefs([knowledgeRef])).toMatchObject({ knowledgeRef, senseKey, maturity: 'V6' });
    }
  });

  it('generates multiple bounded learner forms from the #132 canonical rows using existing engines', () => {
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

  it('keeps the hard V6 compiler boundary and renders the connected cue for the certified #132 baseline', () => {
    const compiler = readText('scripts/compile-vocabulary-visual-runtime.mjs');
    expect(compiler).toContain("child_facing_semantic_depth_explanation");
    expect(compiler).toContain('V6 semantic-depth proof is missing same-sense depth');
    expect(compiler).toContain('semanticDepthPatternsFor');

    const { container } = render(VocabularySemanticScene, { props: { senseKey: 'enormous#very-large-size' } });
    const root = container.querySelector('[data-vocabulary-sense="enormous#very-large-size"]');
    const cue = container.querySelector('[data-semantic-depth-cue]');
    expect(root?.getAttribute('data-semantic-depth-mode')).toBe('attribute_explanation');
    expect(root?.getAttribute('aria-label')).toContain('Connected explanation: Compare the feature.');
    expect(cue?.textContent).toContain('Compare the feature');
  });
});
