import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));

describe('semantic vocabulary knowledge depth', () => {
  it('keeps the first depth checkpoint canonical, connected and presentation-independent', () => {
    const vocabularyDepth = readJson('content/semantic-knowledge/vocabulary-depth-001.json');
    const processDepth = readJson('content/semantic-knowledge/process-depth-001.json');
    const files = [vocabularyDepth, processDepth];

    const neighbourhoods = files.flatMap((file) => file.neighbourhoods ?? []);
    const ids = neighbourhoods.map((entry: { id: string }) => entry.id);
    expect(ids).toEqual(expect.arrayContaining([
      'settlements',
      'push-pull-force',
      'container-state',
      'spatial-position',
      'order-sequence',
      'quantity-comparison',
      'state-transitions'
    ]));
    expect(neighbourhoods.every((entry: { rowRefs?: string[] }) => (entry.rowRefs?.length ?? 0) >= 2)).toBe(true);

    const forbiddenKeys = new Set(['visualRef', 'assetRef', 'assetUrl', 'url', 'file', 'filename', 'x', 'y', 'motion', 'css']);
    const scan = (value: unknown): string[] => {
      if (Array.isArray(value)) return value.flatMap(scan);
      if (!value || typeof value !== 'object') return [];
      return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => [
        ...(forbiddenKeys.has(key) ? [key] : []),
        ...scan(nested)
      ]);
    };
    expect(files.flatMap(scan)).toEqual([]);
  });

  it('generates reusable matching and process questions from the deeper canonical rows', () => {
    const questions = readJson('content/questions/__generated-from-knowledge.json');
    const byId = new Map(questions.map((question: { id: string }) => [question.id, question]));

    const force = byId.get('vocab.depth.force.direction.match.001') as { knowledgeRefs?: string[]; interaction?: { type?: string } };
    expect(force?.interaction?.type).toBe('drag_to_target');
    expect(force?.knowledgeRefs).toEqual(expect.arrayContaining([
      'kr.vocab.force.push.can-move-object-away',
      'kr.vocab.force.pull.can-move-object-toward'
    ]));

    for (const [questionId, rowId] of [
      ['vocab.process.open.sequence.001', 'kr.vocab.process.open.closed-to-open'],
      ['vocab.process.fill.sequence.001', 'kr.vocab.process.fill.empty-to-full'],
      ['science.process.melt.sequence.001', 'kr.science.process.melt.ice-to-liquid-water'],
      ['science.process.freeze.sequence.001', 'kr.science.process.freeze.water-to-ice'],
      ['science.process.germination.sequence.001', 'kr.science.process.germination.seed-to-young-plant']
    ]) {
      const question = byId.get(questionId) as { knowledgeRefs?: string[]; interaction?: { type?: string; items?: unknown[] } };
      expect(question?.interaction?.type).toBe('sequence_order');
      expect(question?.interaction?.items?.length).toBeGreaterThanOrEqual(2);
      expect(question?.knowledgeRefs).toEqual([rowId]);
    }
  });

  it('uses the same pull relationship for generated learning and post-answer semantic explanation', () => {
    const questions = readJson('content/questions/__generated-from-knowledge.json');
    const runtime = readJson('content/vocabulary-visuals/__generated-runtime-plans.json');
    const pullRow = 'kr.vocab.force.pull.can-move-object-toward';

    const question = questions.find((candidate: { knowledgeRefs?: string[] }) => candidate.knowledgeRefs?.includes(pullRow));
    const plan = runtime.plans.find((candidate: { knowledgeRef?: string }) => candidate.knowledgeRef === pullRow);

    expect(question).toBeTruthy();
    expect(plan).toMatchObject({
      runtimeUsage: 'knowledge_reinforcement',
      senseKey: 'pull#move-toward-by-force',
      maturity: 'V4'
    });
    expect(plan.semanticDepthPatternRefs).toContain('pull-direction-explanation');
  });
});
