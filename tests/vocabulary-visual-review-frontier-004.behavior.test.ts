import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readText = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const readJson = (path: string) => JSON.parse(readText(path));
const sha256 = (path: string) => createHash('sha256').update(readText(path)).digest('hex');

const selectionPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-004.selection.json';
const reviewDraftPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-004.review-draft.json';
const queuePath = 'content/vocabulary-visuals/__generated-priority-sense-resolution-queue.json';
const ledgerPath = 'content/vocabulary-visuals/review-batches/ledger.json';
const runtimePath = 'content/vocabulary-visuals/__generated-runtime-plans.json';

const queueProjection = (row: any) => ({
  lemma: row.lemma,
  partOfSpeech: row.partOfSpeech,
  grade: row.grade,
  sourceCorpusId: row.sourceCorpusId,
  candidateSenseCount: row.candidateSenseCount,
  candidateIds: row.candidateIds,
  polysemyRisk: row.polysemyRisk,
  sourceQueueStatus: row.status
});

const selectionProjection = (row: any) => ({
  lemma: row.lemma,
  partOfSpeech: row.partOfSpeech,
  grade: row.grade,
  sourceCorpusId: row.sourceCorpusId,
  candidateSenseCount: row.candidateSenseCount,
  candidateIds: row.candidateIds,
  polysemyRisk: row.polysemyRisk,
  sourceQueueStatus: row.sourceQueueStatus
});

const forbiddenAuthorityKeys = new Set([
  'senseKey',
  'selectedCandidateId',
  'strategy',
  'maturity',
  'visualMaturity',
  'sceneTemplate',
  'parameters',
  'renderer',
  'runtimeUsage',
  'knowledgeRef',
  'profileRef',
  'profileId',
  'curriculumRef',
  'curriculumId',
  'membershipRef',
  'childDefinition',
  'answer',
  'correctAnswer',
  'assessmentAnswer',
  'questionId',
  'learnableRef'
]);

const findForbiddenAuthorityKeys = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.flatMap(findForbiddenAuthorityKeys);
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => [
    ...(forbiddenAuthorityKeys.has(key) ? [key] : []),
    ...findForbiddenAuthorityKeys(nested)
  ]);
};

describe('#76 semantic priority sense tranche 004 proposal frontier', () => {
  it('pins exactly the next live 40-row fresh medium-risk deterministic tranche', () => {
    const selection = readJson(selectionPath);
    const queue = readJson(queuePath);
    const freshMedium = queue.items.filter(
      (row: any) => row.polysemyRisk === 'medium' && row.status === 'human_sense_selection_required'
    );

    expect(selection).toMatchObject({
      schemaVersion: 1,
      id: 'vocabulary.semantic-priority-medium-risk-tranche-004.selection',
      issueRef: 76,
      status: 'candidate_review_pending',
      authorityKind: 'candidate_reference',
      currentMainHeadShaAtSelection: '79839ad1869291147b2ba005e7a9bb6d9df963ca',
      dependsOnRegisteredBatchId: 'priority-sense-resolution-003',
      sourceQueue: {
        evidenceHeadSha: 'c2f3c97b746d3157282faaac69dcb60b0b7358be',
        workflowRunId: 33678871612,
        artifactName: 'priority-vocabulary-sense-resolution-queue',
        artifactZipSha256: 'f1d6f90d30cf7a173dda3e32eeb26a257c63082eea3d776a67730ca719465195',
        snapshotJsonSha256: '5a3da8de58a3d12501e5eb774c71ad7800b9dd59f80a380b459abc0ed4eaae3d',
        snapshot: {
          items: 1776,
          exactReviewedSupersededBlockers: 70,
          reviewedUnresolvedRevisitOnly: 40,
          firstPassHumanSenseSelection: 1724,
          mediumRiskAllStatuses: 459,
          freshMediumRiskFirstPass: 419
        },
        selectionFilter: {
          polysemyRisk: 'medium',
          status: 'human_sense_selection_required'
        },
        selectionWindow: {
          startFreshMediumIndex: 1,
          endFreshMediumIndex: 40
        },
        nextFreshMediumBoundaryLemma: 'mirror'
      }
    });
    expect(sha256(queuePath)).toBe(selection.sourceQueue.snapshotJsonSha256);
    expect(freshMedium).toHaveLength(419);
    expect(selection.items).toHaveLength(40);
    expect(new Set(selection.items.map((row: any) => `${row.lemma}|${row.partOfSpeech}`)).size).toBe(40);
    expect(selection.items[0].lemma).toBe('electronic');
    expect(selection.items.at(-1).lemma).toBe('membership');
    expect(freshMedium[40].lemma).toBe('mirror');
    expect(selection.items.map(selectionProjection)).toEqual(freshMedium.slice(0, 40).map(queueProjection));
    expect(selection.items.map((row: any) => row.freshMediumQueueIndex)).toEqual(
      Array.from({ length: 40 }, (_, index) => index + 1)
    );
  });

  it('does not recycle reviewed-unresolved revisit-only rows as fresh work', () => {
    const selection = readJson(selectionPath);
    const queue = readJson(queuePath);
    const revisitOnly = queue.items.filter((row: any) => row.status === 'reviewed_unresolved_revisit_only');
    const revisitKeys = new Set(revisitOnly.map((row: any) => `${row.lemma}|${row.partOfSpeech}`));

    expect(revisitOnly).toHaveLength(40);
    expect(selection.reviewPolicy.reviewedUnresolvedRowsRequireExplicitRevisitDueState).toBe(true);
    expect(selection.items.every((row: any) => row.sourceQueueStatus === 'human_sense_selection_required')).toBe(true);
    expect(selection.items.filter((row: any) => revisitKeys.has(`${row.lemma}|${row.partOfSpeech}`))).toEqual([]);
  });

  it('records all candidate evidence as proposals, including candidate-two selections, without authority', () => {
    const selection = readJson(selectionPath);
    const reviewDraft = readJson(reviewDraftPath);
    const selectionByLemma = new Map(selection.items.map((row: any) => [row.lemma, row]));
    const allowedDispositions = new Set([
      'exact_candidate_proposed',
      'sense_unresolved',
      'candidate_relevance_review_required'
    ]);

    expect(reviewDraft).toMatchObject({
      schemaVersion: 1,
      id: 'vocabulary.semantic-priority-medium-risk-tranche-004.review-draft',
      issueRef: 76,
      selectionPath,
      status: 'sol_max_first_pass_proposal',
      authorityKind: 'candidate_reference',
      registrationDisposition: 'HOLD_independent_human_semantic_review_required',
      independentExternalReviewEvidencePresent: false,
      reviewBasis: {
        candidateSource: 'Open English WordNet 2025',
        license: 'CC BY 4.0',
        sourceRepository: 'globalwordnet/english-wordnet',
        sourceRepositoryHeadObserved: 'bff3181fe5c810dcd157cba0eed60322a6e0aaed',
        candidateIdsRemainPinnedToKidsplayImport: true,
        allPinnedCandidatesInspected: true,
        posAndCandidateRelevanceInspected: true,
        primarySchoolMeaningComparedAgainstCandidateDefinitions: true,
        candidateOneIsNotDefault: true,
        sourceGlossesOrExamplesCopied: false
      },
      summary: {
        selectedRows: 40,
        exactCandidateProposals: 30,
        senseUnresolvedProposals: 10,
        candidateRelevanceReviewRequired: 0
      }
    });
    expect(reviewDraft.entries).toHaveLength(40);
    expect(reviewDraft.entries.map((row: any) => row[1])).toEqual(selection.items.map((row: any) => row.lemma));

    const byDisposition = reviewDraft.entries.reduce((counts: Record<string, number>, row: any) => {
      const disposition = row[3];
      counts[disposition] = (counts[disposition] ?? 0) + 1;
      return counts;
    }, {});
    expect(byDisposition).toEqual({ exact_candidate_proposed: 30, sense_unresolved: 10 });

    expect(reviewDraft.entrySchema).toEqual([
      'selectionItemIndex',
      'lemma',
      'candidateAssessments',
      'proposalDisposition',
      'proposedCandidateIdOrNull',
      'reasonCode',
      'escalationOrNull'
    ]);
    expect(reviewDraft.candidateAssessmentSchema).toEqual(['candidateId', 'meaningSummary', 'relevance']);

    for (const row of reviewDraft.entries) {
      const [selectionItemIndex, lemma, candidateAssessments, proposalDisposition, proposedCandidateId] = row;
      const selected: any = selectionByLemma.get(lemma);
      expect(selected).toBeTruthy();
      expect(selectionItemIndex).toBe(selection.items.findIndex((item: any) => item.lemma === lemma) + 1);
      expect(allowedDispositions.has(proposalDisposition)).toBe(true);
      expect(candidateAssessments).toHaveLength(selected.candidateSenseCount);
      expect(candidateAssessments.map((candidate: any) => candidate[0])).toEqual(selected.candidateIds);
      expect(candidateAssessments.every((candidate: any) =>
        typeof candidate[1] === 'string' &&
        candidate[1].length > 0 &&
        typeof candidate[2] === 'string' &&
        candidate[2].length > 0
      )).toBe(true);

      if (proposalDisposition === 'exact_candidate_proposed') {
        expect(selected.candidateIds).toContain(proposedCandidateId);
      } else {
        expect(proposedCandidateId).toBeNull();
      }
    }

    const quote = reviewDraft.entries.find((row: any) => row[1] === 'quote');
    expect(quote[3]).toBe('exact_candidate_proposed');
    expect(quote[4]).toBe('quote#n#2');
    const smoking = reviewDraft.entries.find((row: any) => row[1] === 'smoking');
    expect(smoking[3]).toBe('exact_candidate_proposed');
    expect(smoking[4]).toBe('smoking#n#2');
  });

  it('leaves resolved/blocker accounting and V6 runtime authority unchanged', () => {
    const report = JSON.parse(execFileSync(
      process.execPath,
      ['scripts/report-vocabulary-visual-coverage.mjs', '--json', '--limit=5'],
      { cwd: process.cwd(), encoding: 'utf8' }
    ));
    const runtime = readJson(runtimePath);
    const v6KnowledgePlans = (runtime.plans ?? []).filter(
      (plan: any) => plan.runtimeUsage === 'knowledge_reinforcement' && plan.maturity === 'V6'
    );

    expect(report.corpus).toMatchObject({
      totalLemmas: 10000,
      terminalDispositionLemmas: 10000,
      resolvedStrategyLemmas: 657,
      blockedSenseResolutionLemmas: 9343,
      exactReviewedSupersedingLemmas: 70,
      unauditedLemmas: 0
    });
    expect(report.meaningQueue).toMatchObject({
      totalPriorityLemmas: 2400,
      terminalDispositionLemmas: 2400,
      resolvedStrategyLemmas: 624,
      blockedSenseResolutionLemmas: 1776
    });
    expect(report.senseResolutionQueue.items).toBe(1776);
    expect(v6KnowledgePlans).toHaveLength(59);
    expect(new Set(v6KnowledgePlans.map((plan: any) => plan.senseKey)).size).toBe(58);
    expect(report.summary.errors).toBe(0);
  });

  it('grants no ledger, visual V-level, runtime, profile, curriculum, child-definition or assessment-answer authority', () => {
    const selection = readJson(selectionPath);
    const reviewDraft = readJson(reviewDraftPath);
    const ledger = readJson(ledgerPath);

    expect(selection.authorityBoundary).toEqual({
      createsSenseSelection: false,
      createsSemanticDisposition: false,
      countsAsResolved: false,
      removesBlocker: false,
      createsVisualStrategy: false,
      createsVisualVMaturityAuthority: false,
      createsRuntimeAuthority: false,
      createsProfileAuthority: false,
      createsCurriculumAuthority: false,
      createsChildDefinitionApproval: false,
      createsAssessmentAnswerAuthority: false,
      claimsHumanEditorialReview: false
    });
    expect(reviewDraft.authorityBoundary).toEqual({
      independentExternalReviewEvidencePresent: false,
      createsReviewedExactSense: false,
      createsSemanticDisposition: false,
      countsAsResolved: false,
      removesBlocker: false,
      registersWithReviewedBatchLedger: false,
      createsVisualStrategy: false,
      createsVisualVMaturityAuthority: false,
      createsRuntimeAuthority: false,
      createsProfileAuthority: false,
      createsCurriculumAuthority: false,
      createsChildDefinitionApproval: false,
      createsAssessmentAnswerAuthority: false,
      claimsHumanEditorialReview: false
    });
    expect(findForbiddenAuthorityKeys(selection.items)).toEqual([]);
    expect(findForbiddenAuthorityKeys(reviewDraft.entries)).toEqual([]);
    expect(JSON.stringify(ledger)).not.toContain('priority-sense-resolution-004');
    expect(JSON.stringify(ledger)).not.toContain(reviewDraftPath);
  });
});
