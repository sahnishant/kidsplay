import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));

describe('#88 priority vocabulary visual gap queue', () => {
  it('contains only unaudited priority-corpus candidates and never creates approved senses', () => {
    const queue = readJson('content/vocabulary-visuals/__generated-priority-gap.json');
    const corpus = readJson('content/lexicon/open/primary-grade-corpus.json');
    const corpusLemmas = new Set(corpus.entries.map((entry: { lemma: string }) => entry.lemma));

    const audited = new Set<string>();
    for (const name of readdirSync(resolve(process.cwd(), 'content/vocabulary-visuals/batches'))
      .filter((name) => name.endsWith('.json') && !name.startsWith('__generated-'))) {
      const batch = readJson(`content/vocabulary-visuals/batches/${name}`);
      for (const item of batch.items ?? []) audited.add(String(item.lemma));
    }

    expect(queue).toMatchObject({
      schemaVersion: 1,
      issueRef: 88,
      parentIssueRef: 76,
      status: 'generated_review_queue_only',
      policy: {
        bareLemmaSenseApprovalAllowed: false,
        candidateQueueCreatesV1: false,
        candidateQueueCreatesRuntimeMapping: false,
        candidateQueueInfersProfilePlacement: false,
        importedGlossOrExampleAllowed: false
      }
    });
    expect(queue.items.length).toBeGreaterThan(1500);
    expect(new Set(queue.items.map((item: { lemma: string }) => item.lemma)).size).toBe(queue.items.length);
    expect(queue.items.every((item: { lemma: string }) => corpusLemmas.has(item.lemma))).toBe(true);
    expect(queue.items.every((item: { lemma: string }) => !audited.has(item.lemma))).toBe(true);
    expect(queue.items.every((item: { status: string }) => item.status === 'candidate_only_not_v1')).toBe(true);
    expect(queue.items.every((item: { policy: Record<string, boolean> }) =>
      item.policy.senseApproved === false && item.policy.visualStrategyApproved === false &&
      item.policy.profilePlacementInferred === false && item.policy.childDefinitionImported === false
    )).toBe(true);
  });

  it('preserves review traceability, ambiguity and reusable-template hints without source prose', () => {
    const queue = readJson('content/vocabulary-visuals/__generated-priority-gap.json');
    const allowedRisks = new Set(['low', 'medium', 'high', 'unresolved']);
    const allowedMotion = new Set(['low', 'medium', 'high']);

    expect(queue.items.every((item: {
      sourceCorpusId?: string; grade?: number; partOfSpeech?: string;
      corpusProvenance?: { sourceId?: string; sourceRevision?: string; license?: string };
      candidateSenseCount?: number; candidateIds?: string[]; polysemyRisk?: string;
      existingStrategyCandidates?: string[]; motionPotential?: string; visualReviewScore?: number;
    }) => Boolean(item.sourceCorpusId) && Number.isInteger(item.grade) && Boolean(item.partOfSpeech) &&
      Boolean(item.corpusProvenance?.sourceId) && Boolean(item.corpusProvenance?.sourceRevision) &&
      Boolean(item.corpusProvenance?.license) && Number.isInteger(item.candidateSenseCount) &&
      Array.isArray(item.candidateIds) && item.candidateIds.length === item.candidateSenseCount &&
      allowedRisks.has(String(item.polysemyRisk)) && Array.isArray(item.existingStrategyCandidates) &&
      item.existingStrategyCandidates.length > 0 && allowedMotion.has(String(item.motionPotential)) &&
      Number.isFinite(item.visualReviewScore))).toBe(true);

    expect(JSON.stringify(queue)).not.toContain('definition');
    expect(JSON.stringify(queue)).not.toContain('examples');
    expect(JSON.stringify(queue)).not.toContain('profileRef');
  });

  it('is sorted deterministically by review score, grade and lemma', () => {
    const queue = readJson('content/vocabulary-visuals/__generated-priority-gap.json');
    const keys = queue.items.map((item: { visualReviewScore: number; grade: number; lemma: string }) => ({
      score: item.visualReviewScore, grade: item.grade, lemma: item.lemma
    }));
    const sorted = [...keys].sort((left, right) => right.score - left.score || left.grade - right.grade || left.lemma.localeCompare(right.lemma));
    expect(keys).toEqual(sorted);
  });
});
