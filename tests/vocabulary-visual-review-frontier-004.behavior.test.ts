import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));

const selectionPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-004.selection.json';
const reviewDraftPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-004.review-draft.json';
const exactPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-004.items.json';
const unresolvedPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-004.unresolved.json';
const manifestPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-004.json';
const queuePath = 'content/vocabulary-visuals/__generated-priority-sense-resolution-queue.json';
const ledgerPath = 'content/vocabulary-visuals/review-batches/ledger.json';
const runtimePath = 'content/vocabulary-visuals/__generated-runtime-plans.json';
const reviewNodeId = 'PRR_kwDOUHzR8c8AAAABMEduSQ';

const exactExpected = new Map([
  ['electronic', 'electronic#a#1'], ['joy', 'joy#n#1'], ['incident', 'incident#n#1'],
  ['weapon', 'weapon#n#1'], ['contest', 'contest#n#1'], ['motor', 'motor#n#1'],
  ['quote', 'quote#n#2'], ['hungry', 'hungry#a#1'], ['uncle', 'uncle#n#1'],
  ['smoking', 'smoking#n#2'], ['decade', 'decade#n#1'], ['pleased', 'pleased#a#1'],
  ['childhood', 'childhood#n#1'], ['comedy', 'comedy#n#1'], ['suspect', 'suspect#n#1'],
  ['soldier', 'soldier#n#1'], ['engineer', 'engineer#n#1'], ['graduate', 'graduate#n#1'],
  ['visual', 'visual#a#1'], ['arrive', 'arrive#v#1'], ['coal', 'coal#n#1'],
  ['inch', 'inch#n#1'], ['jury', 'jury#n#1'], ['olympic', 'olympic#a#1'],
  ['comic', 'comic#a#1'], ['percentage', 'percentage#n#1'], ['temporary', 'temporary#a#1'],
  ['telephone', 'telephone#n#1'], ['butter', 'butter#n#1'], ['nurse', 'nurse#n#1']
]);
const unresolvedExpected = new Set([
  'baseball', 'ultimate', 'mystery', 'conduct', 'valuable',
  'format', 'relative', 'extent', 'impressive', 'membership'
]);

const forbiddenDownstreamKeys = new Set([
  'knowledgeRef', 'runtimeUsage', 'profileRef', 'profileId', 'curriculumRef', 'curriculumId',
  'membershipRef', 'childDefinition', 'answer', 'correctAnswer', 'assessmentAnswer', 'questionId', 'learnableRef'
]);
const findForbidden = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.flatMap(findForbidden);
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => [
    ...(forbiddenDownstreamKeys.has(key) ? [key] : []),
    ...findForbidden(nested)
  ]);
};

describe('#76 semantic priority sense tranche 004 human-reviewed registration', () => {
  it('preserves the original deterministic 40-row proposal frontier and all-candidate inspection', () => {
    const selection = readJson(selectionPath);
    const reviewDraft = readJson(reviewDraftPath);

    expect(selection).toMatchObject({
      schemaVersion: 1,
      id: 'vocabulary.semantic-priority-medium-risk-tranche-004.selection',
      issueRef: 76,
      status: 'candidate_review_pending',
      authorityKind: 'candidate_reference',
      dependsOnRegisteredBatchId: 'priority-sense-resolution-003',
      sourceQueue: {
        snapshot: { items: 1776, exactReviewedSupersededBlockers: 70, reviewedUnresolvedRevisitOnly: 40 },
        selectionFilter: { polysemyRisk: 'medium', status: 'human_sense_selection_required' },
        selectionWindow: { startFreshMediumIndex: 1, endFreshMediumIndex: 40 },
        nextFreshMediumBoundaryLemma: 'mirror'
      }
    });
    expect(selection.items).toHaveLength(40);
    expect(selection.items[0].lemma).toBe('electronic');
    expect(selection.items.at(-1).lemma).toBe('membership');
    expect(new Set(selection.items.map((row: any) => `${row.lemma}|${row.partOfSpeech}`)).size).toBe(40);

    expect(reviewDraft).toMatchObject({
      schemaVersion: 1,
      status: 'sol_max_first_pass_proposal',
      authorityKind: 'candidate_reference',
      registrationDisposition: 'HOLD_independent_human_semantic_review_required',
      summary: { selectedRows: 40, exactCandidateProposals: 30, senseUnresolvedProposals: 10 }
    });
    expect(reviewDraft.entries).toHaveLength(40);
    expect(reviewDraft.entries.find((row: any) => row[1] === 'quote')?.[4]).toBe('quote#n#2');
    expect(reviewDraft.entries.find((row: any) => row[1] === 'smoking')?.[4]).toBe('smoking#n#2');
    for (const row of reviewDraft.entries) {
      const selected = selection.items[row[0] - 1];
      expect(selected.lemma).toBe(row[1]);
      expect(row[2].map((candidate: any) => candidate[0])).toEqual(selected.candidateIds);
    }
  });

  it('binds exactly 30 accepted senses to the durable human review and keeps 10 rows unresolved', () => {
    const exact = readJson(exactPath);
    const unresolved = readJson(unresolvedPath);
    const manifest = readJson(manifestPath);
    const ledger = readJson(ledgerPath);

    expect(exact).toMatchObject({
      schemaVersion: 1,
      status: 'human_reviewed_exact_sense',
      policy: { claimsHumanEditorialReview: false, claimsHumanSemanticReview: true, runtimeMappingCreated: false },
      reviewBasis: { reviewNodeId, reviewer: 'sahnishant' }
    });
    expect(exact.items).toHaveLength(30);
    expect(new Map(exact.items.map((item: any) => [item.lemma, item.senseKey]))).toEqual(exactExpected);
    expect(exact.items.every((item: any) =>
      item.strategy === 'textual_only' && item.maturity === 'V1' && item.reviewSource === 'human_semantic_review' &&
      item.senseKey === item.sourceTrace.selectedCandidateId && item.sourceTrace.candidateIds.includes(item.senseKey)
    )).toBe(true);

    expect(unresolved).toMatchObject({
      authorityKind: 'human_reviewed_unresolved_reference',
      status: 'human_reviewed_unresolved_reference',
      reviewEvidence: {
        kind: 'human_row_level_unresolved_acceptance', reviewNodeId, reviewer: 'sahnishant', reviewedRows: 10,
        claimsHumanEditorialReview: false, claimsHumanSemanticReview: true
      },
      policy: { countsAsResolved: false, removesBlocker: false, revisitRequiresNewContextOrEvidence: true }
    });
    expect(unresolved.entries).toHaveLength(10);
    expect(new Set(unresolved.entries.map((entry: any) => entry.lemma))).toEqual(unresolvedExpected);
    expect(unresolved.entries.every((entry: any) => entry.reviewDisposition === 'unresolved_confirmed')).toBe(true);

    expect(manifest).toMatchObject({
      sequence: 7,
      status: 'human_reviewed_exact_sense',
      authority: {
        defaultKind: 'human_reviewed_exact_sense', referenceState: 'human_reviewed_exact_reference',
        resolutionState: 'human_resolved', dispositionState: 'reviewed_strategy', runtimeAuthority: 'none'
      },
      source: { kind: 'reviewed_items_file', expectedItemCount: 30 },
      reviewEvidence: { kind: 'human_row_level_semantic_acceptance', reviewNodeId, reviewer: 'sahnishant', acceptedRows: 30 }
    });
    expect(ledger.batches.at(-1)).toEqual({
      id: 'priority-sense-resolution-004', sequence: 7, issueRef: 76, manifest: manifestPath
    });
  });

  it('updates blocker accounting without creating any new V6 runtime authority', () => {
    const report = JSON.parse(execFileSync(
      process.execPath,
      ['scripts/report-vocabulary-visual-coverage.mjs', '--json', '--limit=5'],
      { cwd: process.cwd(), encoding: 'utf8' }
    ));
    const queue = readJson(queuePath);
    const runtime = readJson(runtimePath);
    const v6KnowledgePlans = (runtime.plans ?? []).filter(
      (plan: any) => plan.runtimeUsage === 'knowledge_reinforcement' && plan.maturity === 'V6'
    );

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
    expect(queue.summary).toMatchObject({
      items: 1746,
      exactReviewedSupersededBlockers: 100,
      reviewedUnresolvedRevisitOnly: 50
    });
    for (const lemma of unresolvedExpected) {
      expect(queue.items.find((item: any) => item.lemma === lemma)?.status).toBe('reviewed_unresolved_revisit_only');
    }
    for (const lemma of exactExpected.keys()) {
      expect(queue.items.some((item: any) => item.lemma === lemma)).toBe(false);
    }
    expect(v6KnowledgePlans).toHaveLength(59);
    expect(new Set(v6KnowledgePlans.map((plan: any) => plan.senseKey)).size).toBe(58);
    expect(report.summary.errors).toBe(0);
  });

  it('keeps exact semantic review and unresolved HOLDs outside runtime, profile, curriculum and child-definition authority', () => {
    const exact = readJson(exactPath);
    const unresolved = readJson(unresolvedPath);
    expect(findForbidden(exact.items)).toEqual([]);
    expect(findForbidden(unresolved.entries)).toEqual([]);
    expect(exact.policy).toMatchObject({
      profilePlacementInferred: false,
      assessmentAnswerRevealAllowed: false,
      runtimeMappingCreated: false,
      childDefinitionApprovalInferred: false
    });
    expect(unresolved.policy).toMatchObject({
      createsRuntimeAuthority: false,
      createsProfilePlacement: false,
      createsChildDefinitionApproval: false,
      copiesSourceGlossOrExample: false
    });
  });
});
