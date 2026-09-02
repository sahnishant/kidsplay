import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveSemanticDepthMode } from '../src/presentation/semanticDepthRegistry';
import { isVocabularyVisualPlanChildFacing } from '../src/presentation/vocabularyVisualRegistry';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));

const exactSenseKeys = [
  'today#r#2', 'century#n#1', 'month#n#1', 'afternoon#n#1', 'yesterday#r#1', 'second#a#1', 'later#a#1', 'daily#a#1', 'annual#a#2',
  'one#n#1', 'two#n#1', 'three#n#1', 'four#n#1', 'six#n#1', 'seven#n#1', 'ten#n#1', 'million#n#1',
  'island#n#1', 'tree#n#1', 'apple#n#1', 'mountain#n#1', 'forest#n#1', 'ocean#n#1', 'map#n#1', 'temperature#n#1', 'global#a#1', 'list#n#1',
  'team#n#1', 'teacher#n#1', 'student#n#1', 'committee#n#1', 'manager#n#1', 'author#n#1'
] as const;

const matchingQuestionIds = [
  'vocab.reviewed-exact.time-order.match.003',
  'vocab.reviewed-exact.time-cycle.match.003',
  'vocab.reviewed-exact.number-small.match.003',
  'vocab.reviewed-exact.number-extended.match.003',
  'vocab.reviewed-exact.world-place.match.003',
  'vocab.reviewed-exact.objects-diagrams.match.003',
  'vocab.reviewed-exact.people-roles.match.003',
  'vocab.reviewed-exact.groups-creator.match.003'
] as const;

describe('#134 reviewed-exact Phase D expansion Stage A', () => {
  it('uses only already exact-reviewed non-textual strategy rows', () => {
    const first = readJson('content/vocabulary-visuals/review-batches/priority-sense-resolution-001.items.json');
    const second = readJson('content/vocabulary-visuals/review-batches/priority-sense-resolution-002.items.json');
    const rows = [...(first.items ?? []), ...(second.items ?? [])];
    const bySense = new Map(rows.map((item: { senseKey: string }) => [item.senseKey, item]));

    expect(exactSenseKeys).toHaveLength(33);
    for (const senseKey of exactSenseKeys) {
      const item = bySense.get(senseKey) as { strategy?: string; maturity?: string } | undefined;
      expect(item, senseKey).toBeTruthy();
      expect(item?.strategy).not.toBe('textual_only');
      expect(['V1', 'V2']).toContain(item?.maturity);
    }
  });

  it('adds 33 canonical rows and 33 same-sense presentation-independent reasoning patterns', () => {
    const canonical = readJson('content/knowledge/semantic-vocabulary-reviewed-exact-depth-003.json');
    const depth = readJson('content/semantic-knowledge/vocabulary-depth-003.json');

    expect(canonical).toHaveLength(1);
    expect(canonical[0].entries).toHaveLength(33);
    expect(depth.issueRef).toBe(134);
    expect(depth.reasoningPatterns).toHaveLength(33);
    expect(depth.neighbourhoods).toHaveLength(4);
    expect(new Set(depth.reasoningPatterns.map((pattern: { visualSenseKey: string }) => pattern.visualSenseKey))).toEqual(new Set(exactSenseKeys));

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

  it('maps every reviewed exact row into runtime but keeps the new tranche fail-closed before Stage-A proof', () => {
    const runtime = readJson('content/vocabulary-visuals/__generated-runtime-plans.json');
    const newPlans = runtime.plans.filter((plan: { senseKey?: string }) => exactSenseKeys.includes(plan.senseKey as typeof exactSenseKeys[number]));

    expect(runtime.semanticDepthIssueRefs).toEqual(expect.arrayContaining([84, 132, 134]));
    expect(newPlans).toHaveLength(33);
    expect(new Set(newPlans.map((plan: { senseKey: string }) => plan.senseKey)).size).toBe(33);
    expect(newPlans.every((plan: { maturity?: string }) => ['V1', 'V2'].includes(plan.maturity ?? ''))).toBe(true);
    expect(newPlans.every((plan: any) => !isVocabularyVisualPlanChildFacing(plan))).toBe(true);
    expect(newPlans.every((plan: { semanticDepthPatternRefs?: string[] }) => (plan.semanticDepthPatternRefs?.length ?? 0) === 1)).toBe(true);
    expect(newPlans.every((plan: { semanticDepthPatternRefs?: string[] }) => Boolean(resolveSemanticDepthMode(plan.semanticDepthPatternRefs ?? [])))).toBe(true);
  });

  it('generates eight bounded matching activities through the existing drag-to-target engine', () => {
    const questions = readJson('content/questions/__generated-from-knowledge.json');
    const byId = new Map(questions.map((question: { id: string }) => [question.id, question]));

    for (const id of matchingQuestionIds) {
      const question = byId.get(id) as { interaction?: { type?: string; items?: unknown[] }; knowledgeRefs?: string[] };
      expect(question?.interaction?.type).toBe('drag_to_target');
      expect(question?.interaction?.items?.length).toBeGreaterThanOrEqual(3);
      expect(question?.interaction?.items?.length).toBeLessThanOrEqual(5);
      expect(question?.knowledgeRefs?.length).toBe(question?.interaction?.items?.length);
    }
  });
});
