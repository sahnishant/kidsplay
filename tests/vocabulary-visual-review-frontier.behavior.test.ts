import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
const selectionPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-003.selection.json';
const reviewDraftPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-003.review-draft.json';
const queuePath = 'content/vocabulary-visuals/__generated-priority-sense-resolution-queue.json';
const ledgerPath = 'content/vocabulary-visuals/review-batches/ledger.json';
const manifestPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-003.json';
const itemsPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-003.items.json';
const unresolvedPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-003.unresolved.json';

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
  it('preserves the immutable 40-row source selection after independent registration', () => {
    const selection = readJson(selectionPath);
    const reviewDraft = readJson(reviewDraftPath);
    const queue = readJson(queuePath);
    const queueByLemma = new Map(queue.items.map((row: any) => [row.lemma, row]));

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
        freshMediumRiskBlockers: 459,
        selectionWindow: { start: 1, end: 40 }
      }
    });
    expect(selection.items).toHaveLength(40);
    expect(new Set(selection.items.map((row: any) => row.lemma)).size).toBe(40);
    expect(selection.items[0].lemma).toBe('prevent');
    expect(selection.items.at(-1).lemma).toBe('arrest');
    expect(selection.items.every((row: any) => row.candidateSenseCount === 2 && row.candidateIds.length === 2)).toBe(true);

    for (const row of reviewDraft.entries) {
      if (row.proposalDisposition === 'exact_candidate_proposed') {
        expect(queueByLemma.has(row.lemma)).toBe(false);
      } else {
        expect((queueByLemma.get(row.lemma) as any)?.status).toBe('reviewed_unresolved_revisit_only');
      }
    }
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

    expect(JSON.stringify(ledger)).toContain('priority-sense-resolution-003');
    expect(JSON.stringify(ledger)).not.toContain(reviewDraftPath);
  });

  it('registers only the independently approved exact candidates and preserves every non-selected row as a blocker', () => {
    const manifest = readJson(manifestPath);
    const items = readJson(itemsPath);
    const unresolved = readJson(unresolvedPath);
    const ledger = readJson(ledgerPath);

    expect(manifest).toMatchObject({
      id: 'priority-sense-resolution-003',
      sequence: 6,
      status: 'sol_max_reviewed_exact_sense',
      source: { kind: 'reviewed_items_file', expectedItemCount: 22 },
      reviewEvidence: {
        kind: 'sol_max_row_level_acceptance',
        pullRequest: 152,
        reviewNodeId: 'PRR_kwDOUHzR8c8AAAABL6e00g',
        reviewedSemanticHeadSha: '21035772539059a62391741a4694bdb113891957',
        acceptedRows: 22,
        claimsHumanEditorialReview: false
      }
    });
    expect(items.items).toHaveLength(22);
    expect(items.items.every((row: any) => row.senseKey === row.sourceTrace.selectedCandidateId && row.strategy === 'textual_only' && row.maturity === 'V1')).toBe(true);
    expect(unresolved).toMatchObject({
      issueRef: 151,
      authorityKind: 'sol_max_reviewed_unresolved_reference',
      reviewEvidence: { reviewNodeId: 'PRR_kwDOUHzR8c8AAAABL6e00g', reviewedRows: 18, claimsHumanEditorialReview: false }
    });
    expect(unresolved.entries).toHaveLength(18);
    expect(unresolved.entries.find((row: any) => row.lemma === 'hat')).toMatchObject({ reasonCode: 'pos_intent_mismatch', reviewDisposition: 'unresolved_confirmed' });
    expect(unresolved.entries.every((row: any) => !('senseKey' in row) && !('strategy' in row) && !('maturity' in row))).toBe(true);
    expect(ledger.batches).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'priority-sense-resolution-003', sequence: 6, manifest: manifestPath })]));
  });

  it('preserves tranche-003 decisions while later tranche registrations advance canonical accounting', () => {
    const report = JSON.parse(execFileSync(
      process.execPath,
      ['scripts/report-vocabulary-visual-coverage.mjs', '--json', '--limit=5'],
      { cwd: process.cwd(), encoding: 'utf8' }
    ));
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
    expect(report.runtime).toMatchObject(expectedRuntimeProofAccounting());
    expect(report.summary.errors).toBe(0);
  });
});
