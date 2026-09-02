import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
const selectionPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-003.selection.json';
const reviewDraftPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-003.review-draft.json';
const queuePath = 'content/vocabulary-visuals/__generated-priority-sense-resolution-queue.json';
const ledgerPath = 'content/vocabulary-visuals/review-batches/ledger.json';

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

const queueRow = (row: any) => ({
  lemma: row.lemma,
  partOfSpeech: row.partOfSpeech,
  grade: row.grade,
  sourceCorpusId: row.sourceCorpusId,
  candidateSenseCount: row.candidateSenseCount,
  candidateIds: row.candidateIds,
  polysemyRisk: row.polysemyRisk
});

const selectionRow = (row: any) => ({
  lemma: row.lemma,
  partOfSpeech: row.partOfSpeech,
  grade: row.grade,
  sourceCorpusId: row.sourceCorpusId,
  candidateSenseCount: row.candidateSenseCount,
  candidateIds: row.candidateIds,
  polysemyRisk: row.polysemyRisk
});

describe('#151 deterministic semantic review frontier', () => {
  it('pins exactly the first 40 fresh medium-risk blockers after #149 review deferrals', () => {
    const selection = readJson(selectionPath);
    const queue = readJson(queuePath);
    const freshMedium = queue.items.filter((row: any) =>
      row.polysemyRisk === 'medium' && row.status === 'human_sense_selection_required'
    );

    expect(selection).toMatchObject({
      schemaVersion: 1,
      issueRef: 151,
      parentIssueRef: 76,
      dependsOnIssueRef: 149,
      status: 'candidate_review_pending',
      authorityKind: 'candidate_reference',
      sourceQueue: {
        prerequisiteHeadSha: '90f4f7ceb147d990ccdfbe04fa7e3c11001932c4',
        workflowRunId: 33627076615,
        artifactName: 'priority-vocabulary-sense-resolution-queue',
        artifactSha256: '84373bd320485a56aee54c5d3b6d7230b48204e04a24fe98fa7aff572239959b',
        queueStatus: 'human_sense_selection_queue',
        freshMediumRiskBlockers: 459,
        selectionFilter: { polysemyRisk: 'medium', status: 'human_sense_selection_required' },
        selectionWindow: { start: 1, end: 40 }
      }
    });
    expect(freshMedium).toHaveLength(459);
    expect(selection.items).toHaveLength(40);
    expect(new Set(selection.items.map((row: any) => row.lemma)).size).toBe(40);
    expect(selection.items[0].lemma).toBe('prevent');
    expect(selection.items.at(-1).lemma).toBe('arrest');
    expect(selection.items.map((row: any) => row.freshMediumQueueIndex)).toEqual(
      Array.from({ length: 40 }, (_, index) => index + 1)
    );
    expect(selection.items.map(selectionRow)).toEqual(freshMedium.slice(0, 40).map(queueRow));
    expect(selection.items.every((row: any, index: number) =>
      row.globalQueueIndex === queue.items.indexOf(freshMedium[index]) + 1 &&
      row.candidateSenseCount === 2 &&
      row.candidateIds.length === 2 &&
      row.reviewStatus === 'candidate_review_pending'
    )).toBe(true);
  });

  it('keeps tranche selection explicitly non-authoritative until row review and independent PR acceptance exist', () => {
    const selection = readJson(selectionPath);
    expect(selection.reviewPolicy).toEqual({
      candidateSource: 'Open English WordNet 2025 (CC BY 4.0)',
      inspectAllPinnedCandidates: true,
      defaultIfAmbiguous: 'sense_unresolved',
      candidateOneIsNotDefault: true,
      candidatePosRelevanceDefectMayBlockSelection: true,
      requiresIndependentExternalReviewBeforeResolution: true
    });
    expect(selection.authorityBoundary).toEqual({
      createsSenseSelection: false,
      createsSemanticDisposition: false,
      countsAsResolved: false,
      removesBlocker: false,
      createsVisualStrategy: false,
      createsRuntimeAuthority: false,
      createsProfilePlacement: false,
      createsChildDefinitionApproval: false,
      createsAssessmentAnswerAuthority: false,
      claimsHumanEditorialReview: false
    });
    for (const row of selection.items) {
      for (const forbidden of ['senseKey', 'selectedCandidateId', 'strategy', 'maturity', 'sceneTemplate', 'parameters']) {
        expect(row).not.toHaveProperty(forbidden);
      }
    }
  });

  it('keeps all 40 semantic decisions as review proposals rather than reviewed exact-sense authority', () => {
    const selection = readJson(selectionPath);
    const reviewDraft = readJson(reviewDraftPath);
    const selectionByLemma = new Map(selection.items.map((row: any) => [row.lemma, row]));
    const ledger = readJson(ledgerPath);

    expect(reviewDraft).toMatchObject({
      schemaVersion: 1,
      issueRef: 151,
      parentIssueRef: 76,
      selectionPath,
      status: 'sol_max_first_pass_proposal',
      authorityKind: 'candidate_reference',
      reviewBasis: {
        candidateSource: 'Open English WordNet 2025',
        license: 'CC BY 4.0',
        sourceRepository: 'globalwordnet/english-wordnet',
        sourceRepositoryHeadObserved: 'bff3181fe5c810dcd157cba0eed60322a6e0aaed',
        candidateIdsRemainPinnedToKidsplayImport: true,
        sourceGlossesOrExamplesCopied: false
      },
      authorityBoundary: {
        independentExternalReviewEvidencePresent: false,
        createsReviewedExactSense: false,
        countsAsResolved: false,
        removesBlocker: false,
        registersWithReviewedBatchLedger: false,
        createsVisualStrategy: false,
        createsRuntimeAuthority: false,
        claimsHumanEditorialReview: false
      },
      summary: {
        selectedRows: 40,
        exactCandidateProposals: 22,
        senseUnresolvedProposals: 17,
        candidateRelevanceReviewRequired: 1
      }
    });
    expect(reviewDraft.entries).toHaveLength(40);
    expect(new Set(reviewDraft.entries.map((row: any) => row.lemma)).size).toBe(40);
    expect(reviewDraft.entries.map((row: any) => row.lemma)).toEqual(selection.items.map((row: any) => row.lemma));

    const byDisposition = reviewDraft.entries.reduce((counts: Record<string, number>, row: any) => {
      counts[row.proposalDisposition] = (counts[row.proposalDisposition] ?? 0) + 1;
      return counts;
    }, {});
    expect(byDisposition).toEqual({
      exact_candidate_proposed: 22,
      sense_unresolved: 17,
      candidate_relevance_review_required: 1
    });

    for (const row of reviewDraft.entries) {
      const selected: any = selectionByLemma.get(row.lemma);
      expect(selected).toBeTruthy();
      expect(row).toMatchObject({
        lemma: selected.lemma,
        partOfSpeech: selected.partOfSpeech,
        grade: selected.grade,
        sourceCorpusId: selected.sourceCorpusId,
        candidateIds: selected.candidateIds
      });
      expect(row.reasonCode).toEqual(expect.any(String));
      expect(row.reason).toEqual(expect.any(String));
      expect(row.reasonCode.length).toBeGreaterThan(0);
      expect(row.reason.length).toBeGreaterThan(0);

      if (row.proposalDisposition === 'exact_candidate_proposed') {
        expect(selected.candidateIds).toContain(row.proposedCandidateId);
      } else {
        expect(row).not.toHaveProperty('proposedCandidateId');
      }

      for (const forbidden of ['senseKey', 'strategy', 'maturity', 'sceneTemplate', 'parameters', 'runtimeUsage', 'profileRef', 'childDefinition']) {
        expect(row).not.toHaveProperty(forbidden);
      }
    }

    const relevanceRows = reviewDraft.entries.filter((row: any) => row.proposalDisposition === 'candidate_relevance_review_required');
    expect(relevanceRows).toEqual([
      expect.objectContaining({
        lemma: 'hat',
        partOfSpeech: 'verb',
        candidateIds: ['hat#v#1', 'hat#v#2'],
        reasonCode: 'pos_intent_mismatch'
      })
    ]);

    expect(JSON.stringify(ledger)).not.toContain('priority-sense-resolution-003');
    expect(JSON.stringify(ledger)).not.toContain(reviewDraftPath);
  });

  it('does not change terminal, resolved, blocker or runtime accounting', () => {
    const report = JSON.parse(execFileSync(
      process.execPath,
      ['scripts/report-vocabulary-visual-coverage.mjs', '--json', '--limit=5'],
      { cwd: process.cwd(), encoding: 'utf8' }
    ));
    expect(report.corpus).toMatchObject({
      totalLemmas: 10000,
      terminalDispositionLemmas: 10000,
      resolvedStrategyLemmas: 635,
      blockedSenseResolutionLemmas: 9365,
      exactReviewedSupersedingLemmas: 48,
      unauditedLemmas: 0
    });
    expect(report.meaningQueue).toMatchObject({
      totalPriorityLemmas: 2400,
      terminalDispositionLemmas: 2400,
      resolvedStrategyLemmas: 602,
      blockedSenseResolutionLemmas: 1798
    });
    expect(report.senseResolutionQueue.items).toBe(1798);
    expect(report.runtime).toMatchObject(expectedRuntimeProofAccounting());
    expect(report.summary.errors).toBe(0);
  });
});
