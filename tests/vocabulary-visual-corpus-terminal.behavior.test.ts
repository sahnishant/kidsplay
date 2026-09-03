import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
const reviewedUnresolvedLemmas = [
  'public', 'research', 'project', 'times', 'possible', 'probably', 'final', 'self', 'especially', 'increase',
  'recent', 'individual', 'imagine', 'judge', 'plus', 'pro', 'none', 'christmas', 'interview', 'therefore', 'worry', 'status'
];
const reviewedUnresolvedLemmas003 = [
  'prevent', 'improve', 'holiday', 'discuss', 'favourite', 'rice', 'bathroom', 'calm', 'hat', 'witness',
  'parent', 'chemical', 'lane', 'unlike', 'x-ray', 'tradition', 'historic', 'basketball'
];
const reviewedUnresolvedLemmas004 = [
  'baseball', 'ultimate', 'mystery', 'conduct', 'valuable', 'format', 'relative', 'extent', 'impressive', 'membership'
];

const expectedRuntimeProofAccounting = () => {
  const runtime = readJson('content/vocabulary-visuals/__generated-runtime-plans.json');
  const knowledgePlans = (runtime.plans ?? []).filter((plan: any) => plan.runtimeUsage === 'knowledge_reinforcement');
  const childFacingPlans = knowledgePlans.filter((plan: any) => plan.maturity === 'V5' || plan.maturity === 'V6');
  return {
    totalPlans: (runtime.plans ?? []).length,
    childFacingPlans: childFacingPlans.length,
    childFacingSenses: new Set(childFacingPlans.map((plan: any) => plan.senseKey)).size,
    pendingProofPlans: knowledgePlans.length - childFacingPlans.length
  };
};

describe('#76 Phase C full-corpus terminal visual accounting', () => {
  it('gives every 10k corpus lemma a terminal disposition without claiming visual resolution', () => {
    const corpus = readJson('content/lexicon/open/primary-grade-corpus.json');
    const batch = readJson('content/vocabulary-visuals/batches/__generated-corpus-terminal-dispositions.json');

    expect(batch).toMatchObject({
      schemaVersion: 1,
      issueRef: 76,
      status: 'sense_resolution_required',
      policy: {
        bareLemmaMappingAllowed: false,
        definitionsIncluded: false,
        sourceGlossesIncluded: false,
        profilePlacementInferred: false,
        runtimeMappingCreated: false,
        childDefinitionApprovalInferred: false
      },
      summary: {
        corpusLemmas: 10000,
        previouslyDispositionedLemmas: 2435,
        exactReviewedSupersedingLemmas: 100,
        senseUnresolvedItems: 7565,
        finalTerminalDispositionLemmas: 10000
      }
    });
    expect(corpus.entries).toHaveLength(10000);
    expect(batch.items).toHaveLength(7565);
    expect(batch.items.every((item: { strategy: string; maturity: string; reviewDisposition: string }) =>
      item.strategy === 'sense_unresolved' && item.maturity === 'V1' &&
      item.reviewDisposition === 'sense_candidate_or_human_selection_required'
    )).toBe(true);
  });

  it('keeps every remaining priority blocker visible while separating independently reviewed unresolved rows from first-pass work', () => {
    const queue = readJson('content/vocabulary-visuals/__generated-priority-sense-resolution-queue.json');
    const relevance = queue.items.filter((item: { status: string }) => item.status === 'candidate_relevance_review_required');
    const revisitOnly = queue.items.filter((item: { status: string }) => item.status === 'reviewed_unresolved_revisit_only');
    const unresolved = queue.items.filter((item: { status: string }) => item.status === 'human_sense_selection_required');

    expect(queue).toMatchObject({
      schemaVersion: 1,
      issueRef: 76,
      status: 'human_sense_selection_queue',
      policy: { reviewedUnresolvedRequiresNewContextOrEvidence: true },
      summary: {
        items: 1746,
        exactReviewedSupersededBlockers: 100,
        reviewedUnresolvedRevisitOnly: 50,
        firstPassHumanSenseSelection: 1684,
        byRisk: { candidate_relevance: 13, medium: 429, high: 1304 },
        byStatus: {
          candidate_relevance_review_required: 12,
          reviewed_unresolved_revisit_only: 50,
          human_sense_selection_required: 1684
        }
      }
    });
    expect(relevance.map((item: { lemma: string }) => item.lemma).sort()).toEqual(
      ['add', 'converse', 'customs', 'gay', 'guts', 'least', 'ness', 'pants', 'principal', 'rolling', 'slight', 'so'].sort()
    );
    expect(relevance.every((item: { candidateSenseCount: number; terminalStrategy: string }) =>
      item.candidateSenseCount === 1 && item.terminalStrategy === 'textual_only'
    )).toBe(true);
    expect(revisitOnly.map((item: { lemma: string }) => item.lemma).sort()).toEqual(
      [...reviewedUnresolvedLemmas, ...reviewedUnresolvedLemmas003, ...reviewedUnresolvedLemmas004].sort()
    );
    const revisitByLemma = new Map(revisitOnly.map((item: any) => [item.lemma, item]));
    for (const lemma of reviewedUnresolvedLemmas) {
      expect(revisitByLemma.get(lemma)).toMatchObject({
        candidateSenseCount: 2,
        terminalStrategy: 'sense_unresolved',
        reviewedUnresolvedReviewNodeId: 'PRR_kwDOUHzR8c8AAAABLo97tQ',
        reviewedUnresolvedReviewSource: 'content/vocabulary-visuals/review-batches/priority-sense-resolution-002.unresolved.json'
      });
    }
    for (const lemma of reviewedUnresolvedLemmas003) {
      expect(revisitByLemma.get(lemma)).toMatchObject({
        candidateSenseCount: 2,
        terminalStrategy: 'sense_unresolved',
        reviewedUnresolvedReviewNodeId: 'PRR_kwDOUHzR8c8AAAABL6e00g',
        reviewedUnresolvedReviewSource: 'content/vocabulary-visuals/review-batches/priority-sense-resolution-003.unresolved.json'
      });
    }
    for (const lemma of reviewedUnresolvedLemmas004) {
      expect(revisitByLemma.get(lemma)).toMatchObject({
        candidateSenseCount: 2,
        terminalStrategy: 'sense_unresolved',
        reviewedUnresolvedReviewNodeId: 'PRR_kwDOUHzR8c8AAAABMEduSQ',
        reviewedUnresolvedReviewSource: 'content/vocabulary-visuals/review-batches/priority-sense-resolution-004.unresolved.json',
        reviewedUnresolvedReviewAuthorityKind: 'human_reviewed_unresolved_reference'
      });
    }
    expect(unresolved).toHaveLength(1684);
    expect(unresolved.every((item: { terminalStrategy: string; candidateIds: string[] }) =>
      item.terminalStrategy === 'sense_unresolved' && item.candidateIds.length >= 1
    )).toBe(true);
  });

  it('keeps every residual blocker in a separate deterministic queue', () => {
    const queue = readJson('content/vocabulary-visuals/__generated-corpus-sense-resolution-queue.json');
    const batch = readJson('content/vocabulary-visuals/batches/__generated-corpus-terminal-dispositions.json');
    const batchByLemma = new Map(batch.items.map((item: { lemma: string }) => [item.lemma, item]));

    expect(queue).toMatchObject({
      schemaVersion: 1,
      issueRef: 76,
      status: 'corpus_sense_resolution_queue',
      summary: { items: 7565, byReviewStatus: { spelling_only: 137, needs_sense_review: 7428 } }
    });
    expect(queue.items).toHaveLength(batch.items.length);
    for (const row of queue.items) {
      expect(batchByLemma.get(row.lemma)).toMatchObject({
        senseKey: row.terminalDispositionSenseKey,
        strategy: 'sense_unresolved'
      });
    }
  });

  it('reports exact terminal accounting separately from resolved and proof-derived child-facing maturity', () => {
    const output = execFileSync(
      process.execPath,
      ['scripts/report-vocabulary-visual-coverage.mjs', '--json', '--limit=5'],
      { cwd: process.cwd(), encoding: 'utf8' }
    );
    const report = JSON.parse(output);
    expect(report.corpus).toMatchObject({
      totalLemmas: 10000,
      terminalDispositionLemmas: 10000,
      resolvedStrategyLemmas: 687,
      blockedSenseResolutionLemmas: 9313,
      exactReviewedSupersedingLemmas: 100,
      unauditedLemmas: 0
    });
    expect(report.meaningQueue).toMatchObject({
      totalPriorityLemmas: 2400,
      terminalDispositionLemmas: 2400,
      resolvedStrategyLemmas: 654,
      blockedSenseResolutionLemmas: 1746
    });
    expect(report.senseResolutionQueue.items).toBe(1746);
    expect(report.corpusSenseResolutionQueue.items).toBe(7565);
    expect(report.runtime).toMatchObject(expectedRuntimeProofAccounting());
    expect(report.summary.errors).toBe(0);
  });

  it('copies no editorial prose or curriculum placement into generated terminal data', () => {
    const values = [
      readJson('content/vocabulary-visuals/batches/__generated-corpus-terminal-dispositions.json'),
      readJson('content/vocabulary-visuals/__generated-priority-sense-resolution-queue.json'),
      readJson('content/vocabulary-visuals/__generated-corpus-sense-resolution-queue.json')
    ];
    const keys = new Set<string>();
    const visit = (value: unknown) => {
      if (Array.isArray(value)) return value.forEach(visit);
      if (!value || typeof value !== 'object') return;
      for (const [key, nested] of Object.entries(value)) {
        keys.add(key);
        visit(nested);
      }
    };
    visit(values);
    for (const forbidden of ['definition', 'gloss', 'sourceGloss', 'example', 'childDefinition', 'profileRef']) {
      expect(keys.has(forbidden)).toBe(false);
    }
  });
});
