import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
const readText = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const authorityPath = 'content/vocabulary-visuals/review-batches/authority-model.json';
const inventoryPath = 'content/vocabulary-visuals/review-batches/artifact-inventory.json';
const relevancePath = 'content/vocabulary-visuals/review-batches/candidate-relevance-review-001.json';
const reviewedUnresolvedPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-002.unresolved.json';
const exactReviewManifestPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-001.json';
const exactReviewManifest2Path = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-002.json';
const exactReviewManifest3Path = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-003.json';
const reviewedUnresolvedPath3 = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-003.unresolved.json';
const exactReviewManifest4Path = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-004.json';
const reviewedUnresolvedPath4 = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-004.unresolved.json';
const phaseCBuilderPath = 'scripts/vocabulary-visuals/build-corpus-terminal-dispositions.mjs';
const publicCompilerPath = 'scripts/vocabulary-visuals/compile-reviewed-batches.mjs';
const blockingLemmas = ['add', 'converse', 'customs', 'gay', 'guts', 'least', 'ness', 'pants', 'principal', 'rolling', 'slight', 'so'];
const reviewedUnresolvedLemmas = [
  'public', 'research', 'project', 'times', 'possible', 'probably', 'final', 'self', 'especially', 'increase',
  'recent', 'individual', 'imagine', 'judge', 'plus', 'pro', 'none', 'christmas', 'interview', 'therefore', 'worry', 'status'
];

const reportJson = () => JSON.parse(execFileSync(
  process.execPath,
  ['scripts/report-vocabulary-visual-coverage.mjs', '--json', '--limit=5'],
  { cwd: process.cwd(), encoding: 'utf8' }
));

const expectedRuntimeProofAccounting = () => {
  const runtime = readJson('content/vocabulary-visuals/__generated-runtime-plans.json');
  const knowledgePlans = (runtime.plans ?? []).filter((plan: any) => plan.runtimeUsage === 'knowledge_reinforcement');
  const childFacingPlans = knowledgePlans.filter((plan: any) => plan.maturity === 'V5' || plan.maturity === 'V6');
  return {
    childFacingPlans: childFacingPlans.length,
    childFacingSenses: new Set(childFacingPlans.map((plan: any) => plan.senseKey)).size,
    pendingProofPlans: knowledgePlans.length - childFacingPlans.length
  };
};

describe('#76 vocabulary visual control-plane authority', () => {
  it('keeps reference, resolution, disposition, maturity and runtime authority as independent dimensions', () => {
    const model = readJson(authorityPath);
    expect(model).toMatchObject({ schemaVersion: 1, parentIssueRef: 76 });
    expect(model.dimensions.referenceStates).toEqual(expect.arrayContaining(['candidate_only', 'human_reviewed_exact_reference', 'sol_max_reviewed_exact_reference']));
    expect(model.dimensions.resolutionStates).toEqual(expect.arrayContaining(['blocked_unresolved', 'human_resolved', 'sol_max_resolved']));
    expect(model.dimensions.dispositionStates).toEqual(expect.arrayContaining(['terminal_textual', 'terminal_unresolved', 'reviewed_strategy']));
    expect(model.dimensions.maturityLevels).toEqual(['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6']);
    expect(model.dimensions.runtimeAuthorityStates).toEqual(['none', 'mapping_config_only', 'external_proof_only']);
    expect(model.invariants).toEqual({
      v1AloneImpliesResolution: false,
      singleCandidateAloneImpliesHumanReview: false,
      senseUnresolvedCountsAsResolved: false,
      semanticManifestMayGrantRuntimeAuthority: false,
      terminalPolicyMayClaimHumanExactSenseReview: false,
      runtimeProofMayCreateSemanticDisposition: false
    });

    const byId = new Map(model.authorityKinds.map((entry: any) => [entry.id, entry]));
    expect(byId.get('candidate_reference')).toMatchObject({ semanticReviewAuthority: false, canCreateDisposition: false, canResolveSense: false, maxSemanticMaturity: 'V0' });
    expect(byId.get('approved_terminal_policy')).toMatchObject({ semanticReviewAuthority: true, canClaimHumanReview: false, canSelectMultiCandidate: false, maxSemanticMaturity: 'V1', runtimeAuthority: 'none' });
    expect(byId.get('human_reviewed_exact_sense')).toMatchObject({ requiresHumanCurationEvidence: true, requiresExternalHumanSemanticReviewEvidence: true, canClaimHumanReview: true, canSelectMultiCandidate: true, maxSemanticMaturity: 'V1', runtimeAuthority: 'none' });
    expect(byId.get('human_reviewed_unresolved_reference')).toMatchObject({
      semanticReviewAuthority: true,
      requiresPinnedCandidateTrace: true,
      requiresExternalHumanSemanticReviewEvidence: true,
      canCreateDisposition: false,
      canResolveSense: false,
      canSelectMultiCandidate: false,
      canClaimHumanReview: true,
      maxSemanticMaturity: 'V0',
      runtimeAuthority: 'none'
    });
    expect(byId.get('sol_max_reviewed_exact_sense')).toMatchObject({ requiresExternalReviewEvidence: true, canClaimHumanReview: false, canSelectMultiCandidate: true, maxSemanticMaturity: 'V2', runtimeAuthority: 'none' });
    expect(byId.get('sol_max_reviewed_unresolved_reference')).toMatchObject({
      semanticReviewAuthority: true,
      requiresPinnedCandidateTrace: true,
      requiresExternalReviewEvidence: true,
      canCreateDisposition: false,
      canResolveSense: false,
      canSelectMultiCandidate: false,
      canClaimHumanReview: false,
      maxSemanticMaturity: 'V0',
      runtimeAuthority: 'none'
    });
    expect(byId.get('external_runtime_proof')).toMatchObject({ semanticReviewAuthority: false, runtimeAuthority: 'external_proof_only' });
  });

  it('inventories every committed semantic batch and keeps runtime proof outside semantic-review authority', () => {
    const inventory = readJson(inventoryPath);
    expect(inventory).toMatchObject({ schemaVersion: 1, parentIssueRef: 76, authorityModel: authorityPath });

    const committedBatchPaths = readdirSync(resolve(process.cwd(), 'content/vocabulary-visuals/batches'))
      .filter((name) => name.endsWith('.json') && !name.startsWith('__generated-'))
      .sort()
      .map((name) => `content/vocabulary-visuals/batches/${name}`);
    const inventoriedBatchPaths = inventory.semanticSources
      .map((entry: any) => entry.path)
      .filter((path: unknown): path is string => typeof path === 'string' && path.startsWith('content/vocabulary-visuals/batches/'))
      .sort();
    expect(inventoriedBatchPaths).toEqual(committedBatchPaths);

    expect(inventory.semanticSources).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'priority-batch-001', authorityKind: 'historical_reviewed_strategy' }),
      expect.objectContaining({ id: 'polysemy-watchlist-001', authorityKind: 'historical_unresolved_watchlist' }),
      expect.objectContaining({ id: 'runtime-vocabulary-batch-002', authorityKind: 'historical_reviewed_strategy' }),
      expect.objectContaining({ id: 'priority-batch-002', manifest: 'content/vocabulary-visuals/review-batches/priority-batch-002.json' }),
      expect.objectContaining({ id: 'priority-batch-003', manifest: 'content/vocabulary-visuals/review-batches/priority-batch-003.json' }),
      expect.objectContaining({ id: 'priority-sense-resolution-001', authorityKind: 'sol_max_reviewed_exact_sense', manifest: exactReviewManifestPath }),
      expect.objectContaining({ id: 'priority-sense-resolution-002', authorityKind: 'sol_max_reviewed_exact_sense', manifest: exactReviewManifest2Path }),
      expect.objectContaining({ id: 'priority-sense-resolution-003', authorityKind: 'sol_max_reviewed_exact_sense', manifest: exactReviewManifest3Path }),
      expect.objectContaining({ id: 'priority-sense-resolution-003-reviewed-unresolved', authorityKind: 'sol_max_reviewed_unresolved_reference', path: reviewedUnresolvedPath3 }),
      expect.objectContaining({
        id: 'priority-sense-resolution-002-reviewed-unresolved',
        authorityKind: 'sol_max_reviewed_unresolved_reference',
        path: reviewedUnresolvedPath,
        expectedGitBlobSha: 'e1d5c901525378fa00e51e0d706443e5b66b1249'
      }),
      expect.objectContaining({ id: 'priority-sense-resolution-004', authorityKind: 'human_reviewed_exact_sense', manifest: exactReviewManifest4Path }),
      expect.objectContaining({ id: 'priority-sense-resolution-004-reviewed-unresolved', authorityKind: 'human_reviewed_unresolved_reference', path: reviewedUnresolvedPath4 }),
      expect.objectContaining({ id: 'phase-c-candidate-relevance-review', path: relevancePath }),
      expect.objectContaining({ id: 'phase-c-corpus-terminal-policy', path: phaseCBuilderPath })
    ]));

    expect(inventory.runtimeBoundary.every((entry: any) => entry.semanticReviewAuthority === false)).toBe(true);
    expect(inventory.runtimeBoundary.map((entry: any) => entry.id)).toEqual(expect.arrayContaining([
      'runtime-reinforcement-config',
      'runtime-template-proof-config',
      'runtime-maturity-proofs',
      'runtime-generated-projection'
    ]));
  });

  it('stores all twelve Phase C candidate-relevance decisions in reviewed data instead of production JavaScript', () => {
    const review = readJson(relevancePath);
    expect(review).toMatchObject({ schemaVersion: 1, issueRef: 96, parentIssueRef: 76, authorityKind: 'approved_terminal_policy' });
    expect(review.policy).toMatchObject({ selectsSense: false, claimsHumanExactSenseReview: false, createsRuntimeAuthority: false, createsProfilePlacement: false, copiesSourceGloss: false });
    expect(review.entries).toHaveLength(12);
    expect(review.entries.map((entry: any) => entry.lemma).sort()).toEqual([...blockingLemmas].sort());
    expect(review.entries.every((entry: any) => entry.status === 'candidate_relevance_review_required' && Boolean(entry.reasonCode) && Boolean(entry.reason))).toBe(true);

    const productionSource = readText(phaseCBuilderPath);
    for (const lemma of blockingLemmas) {
      expect(productionSource).not.toContain(`'${lemma}'`);
      expect(productionSource).not.toContain(`\"${lemma}\"`);
    }
    expect(productionSource).toContain('candidate-relevance-review-001.json');
  });

  it('persists the 22 tranche-002 independently reviewed unresolved outcomes as non-resolving reference data', () => {
    const review = readJson(reviewedUnresolvedPath);
    expect(review).toMatchObject({
      schemaVersion: 1,
      issueRef: 106,
      parentIssueRef: 76,
      authorityKind: 'sol_max_reviewed_unresolved_reference',
      status: 'sol_max_reviewed_unresolved_reference',
      reviewEvidence: {
        kind: 'sol_max_row_level_unresolved_acceptance',
        pullRequest: 109,
        reviewNodeId: 'PRR_kwDOUHzR8c8AAAABLo97tQ',
        reviewedSemanticHeadSha: 'c37833a9fafd8c6fc71dcd25b858e5b11b9a46c9',
        reviewedRows: 22,
        claimsHumanEditorialReview: false
      },
      policy: {
        createsSenseSelection: false,
        createsSemanticDisposition: false,
        countsAsResolved: false,
        removesBlocker: false,
        createsRuntimeAuthority: false,
        createsProfilePlacement: false,
        createsChildDefinitionApproval: false,
        copiesSourceGlossOrExample: false,
        revisitRequiresNewContextOrEvidence: true
      }
    });
    expect(review.entries).toHaveLength(22);
    expect(review.entries.map((entry: any) => entry.lemma).sort()).toEqual([...reviewedUnresolvedLemmas].sort());
    expect(review.entries.every((entry: any) =>
      entry.candidateIds.length === 2 &&
      ['proposal_rejected_back_to_unresolved', 'unresolved_confirmed'].includes(entry.reviewDisposition) &&
      Boolean(entry.reasonCode) && Boolean(entry.reason) &&
      !('senseKey' in entry) && !('strategy' in entry) && !('maturity' in entry)
    )).toBe(true);

    const productionSource = readText(phaseCBuilderPath);
    for (const entry of review.entries) {
      expect(productionSource).not.toContain(`\"${entry.lemma}\"`);
      for (const candidateId of entry.candidateIds) expect(productionSource).not.toContain(candidateId);
    }
    expect(productionSource).toContain('sol_max_reviewed_unresolved_reference');
    expect(productionSource).toContain('human_reviewed_unresolved_reference');
  });

  it('preserves exact post-tranche-004 terminal, resolved, blocked, queue and proof-derived runtime boundaries', () => {
    const report = reportJson();
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
      blockedSenseResolutionLemmas: 1746,
      auditedLemmaPercent: 100
    });
    expect(report.senseResolutionQueue.items).toBe(1746);
    expect(report.corpusSenseResolutionQueue.items).toBe(7565);
    expect(report.runtime).toMatchObject(expectedRuntimeProofAccounting());
    expect(report.summary.errors).toBe(0);
  });

  it('has one atomic production command with no numbered or Phase C package backdoor', () => {
    const packageJson = readJson('package.json');
    const scripts = JSON.stringify(packageJson.scripts ?? {});
    expect(scripts).not.toContain('build-priority-batch-002.mjs');
    expect(scripts).not.toContain('build-priority-batch-003.mjs');
    expect(scripts).not.toContain('compile:vocabulary-visual-batch002');
    expect(scripts).not.toContain('compile:vocabulary-visual-batch003');
    expect(packageJson.scripts).not.toHaveProperty('compile:vocabulary-visual-corpus-terminal');
    expect(packageJson.scripts['compile:vocabulary-visual-batches']).toBe('node scripts/vocabulary-visuals/compile-reviewed-batches.mjs');
    expect(packageJson.scripts['compile:content'].match(/compile:vocabulary-visual-batches/g)).toHaveLength(1);
    expect(packageJson.scripts['compile:content']).not.toContain('build-corpus-terminal-dispositions');
    expect(readText(publicCompilerPath)).toContain("./build-corpus-terminal-dispositions.mjs");
    expect(readText(publicCompilerPath)).toContain('if (isDefaultLedger)');
  });
});
