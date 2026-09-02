import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
const selectionPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-003.selection.json';
const queuePath = 'content/vocabulary-visuals/__generated-priority-sense-resolution-queue.json';

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

  it('is explicitly non-authoritative until row review and independent PR acceptance exist', () => {
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
    expect(report.runtime).toMatchObject({ totalPlans: 26, childFacingPlans: 22, childFacingSenses: 21, pendingProofPlans: 0 });
    expect(report.summary.errors).toBe(0);
  });
});
