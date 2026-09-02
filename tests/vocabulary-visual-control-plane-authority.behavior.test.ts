import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
const readText = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const authorityPath = 'content/vocabulary-visuals/review-batches/authority-model.json';
const inventoryPath = 'content/vocabulary-visuals/review-batches/artifact-inventory.json';
const relevancePath = 'content/vocabulary-visuals/review-batches/candidate-relevance-review-001.json';
const exactReviewManifestPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-001.json';
const exactReviewManifest2Path = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-002.json';
const phaseCBuilderPath = 'scripts/vocabulary-visuals/build-corpus-terminal-dispositions.mjs';
const publicCompilerPath = 'scripts/vocabulary-visuals/compile-reviewed-batches.mjs';
const blockingLemmas = ['add', 'converse', 'customs', 'gay', 'guts', 'least', 'ness', 'pants', 'principal', 'rolling', 'slight', 'so'];

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
    expect(byId.get('human_reviewed_exact_sense')).toMatchObject({ requiresHumanCurationEvidence: true, canClaimHumanReview: true, canSelectMultiCandidate: true, maxSemanticMaturity: 'V1', runtimeAuthority: 'none' });
    expect(byId.get('sol_max_reviewed_exact_sense')).toMatchObject({ requiresExternalReviewEvidence: true, canClaimHumanReview: false, canSelectMultiCandidate: true, maxSemanticMaturity: 'V2', runtimeAuthority: 'none' });
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

  it('preserves exact post-#106 terminal, resolved, blocked, queue and proof-derived runtime boundaries', () => {
    const report = reportJson();
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
      blockedSenseResolutionLemmas: 1798,
      auditedLemmaPercent: 100
    });
    expect(report.senseResolutionQueue.items).toBe(1798);
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
