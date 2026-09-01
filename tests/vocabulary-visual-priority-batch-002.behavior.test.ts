import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));

describe('#88 reviewed priority visual strategy batch 002', () => {
  it('adds at least 100 exact sense strategies with majority reuse of existing scene grammar', () => {
    const batch = readJson('content/vocabulary-visuals/batches/__generated-priority-batch-002.json');
    const senseKeys = batch.items.map((item: { senseKey: string }) => item.senseKey);
    const sceneItems = batch.items.filter((item: { sceneTemplate?: string }) => Boolean(item.sceneTemplate));

    expect(batch).toMatchObject({
      schemaVersion: 1,
      issueRef: 88,
      parentIssueRef: 76,
      status: 'reviewed_visual_strategy',
      policy: {
        bareLemmaMappingAllowed: false,
        definitionsIncluded: false,
        sourceGlossesIncluded: false,
        profilePlacementInferred: false,
        assessmentAnswerRevealAllowed: false,
        humanEditorialDefinitionApprovalInferredFromVisualReview: false
      }
    });
    expect(batch.items.length).toBeGreaterThanOrEqual(100);
    expect(new Set(senseKeys).size).toBe(senseKeys.length);
    expect(batch.items.every((item: { lemma: string; senseKey: string; maturity: string }) =>
      item.senseKey.startsWith(`${item.lemma}#`) && item.maturity === 'V1'
    )).toBe(true);
    expect(sceneItems.length / batch.items.length).toBeGreaterThanOrEqual(0.75);
    expect(batch.summary.sceneGrammarItems).toBe(sceneItems.length);
    expect(batch.summary.newAssetBlockers).toBe(0);
  });

  it('admits generated queue rows only when the pinned OEWN candidate is unique and exact', () => {
    const queue = readJson('content/vocabulary-visuals/__generated-priority-gap.json');
    const batch = readJson('content/vocabulary-visuals/batches/__generated-priority-batch-002.json');
    const queueByLemma = new Map(queue.items.map((item: { lemma: string }) => [item.lemma, item]));

    const queueReviewed = batch.items.filter((item: { reviewSource: string }) => item.reviewSource === 'single_candidate_priority_gap');
    expect(queueReviewed.length).toBeGreaterThanOrEqual(100);
    for (const item of queueReviewed) {
      const source = queueByLemma.get(item.lemma) as {
        candidateSenseCount: number; candidateIds: string[]; polysemyRisk: string;
      };
      expect(source).toBeTruthy();
      expect(source.polysemyRisk).toBe('low');
      expect(source.candidateSenseCount).toBe(1);
      expect(source.candidateIds).toEqual([item.senseKey]);
    }
  });

  it('uses exact #51 human-reviewed senses for the bounded polysemy exceptions', () => {
    const batch = readJson('content/vocabulary-visuals/batches/__generated-priority-batch-002.json');
    const reviewedKnowledge = readJson('content/knowledge/english-vocabulary-primary-reviewed.json');
    const knowledgeEntries = reviewedKnowledge.flatMap((source: { entries?: unknown[] }) => source.entries ?? []) as Array<{
      id: string; meta?: { curation?: { status?: string; candidateId?: string; sourceGlossCopied?: boolean } };
    }>;
    const knowledgeByLemma = new Map(knowledgeEntries.map((entry) => [entry.id, entry]));
    const humanItems = batch.items.filter((item: { reviewSource: string }) => item.reviewSource === 'human_reviewed_primary_meaning');

    expect(humanItems.map((item: { lemma: string }) => item.lemma).sort()).toEqual(
      ['ask', 'environment', 'find', 'floor', 'guide', 'minute', 'notice'].sort()
    );
    for (const item of humanItems) {
      const curation = knowledgeByLemma.get(item.lemma)?.meta?.curation;
      expect(curation).toMatchObject({ status: 'reviewed', candidateId: item.senseKey, sourceGlossCopied: false });
    }
  });

  it('contains no editorial prose or curriculum/profile placement payloads', () => {
    const batch = readJson('content/vocabulary-visuals/batches/__generated-priority-batch-002.json');
    const serialized = JSON.stringify(batch);
    for (const forbidden of ['"definition"', '"gloss"', '"sourceGloss"', '"example"', '"childDefinition"', '"profileRef"']) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
