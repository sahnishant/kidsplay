import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const readText = (path) => readFileSync(path, 'utf8');
const writeText = (path, value) => writeFileSync(path, value, 'utf8');
const blobSha = (path) => execFileSync('git', ['hash-object', path], { encoding: 'utf8' }).trim();
const replaceOnce = (text, before, after, label) => {
  const index = text.indexOf(before);
  if (index < 0) throw new Error(`Missing replacement target: ${label}`);
  if (text.indexOf(before, index + 1) >= 0) throw new Error(`Replacement target is not unique: ${label}`);
  return `${text.slice(0, index)}${after}${text.slice(index + before.length)}`;
};
const replaceBlock = (text, startMarker, endMarker, replacement, label) => {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`Missing block markers: ${label}`);
  return `${text.slice(0, start)}${replacement}${text.slice(end)}`;
};

const reviewNodeId = 'PRR_kwDOUHzR8c8AAAABL6e00g';
const reviewedHeadSha = '21035772539059a62391741a4694bdb113891957';
const mainBaselineSha = '63b02776e067daea839a256c3ae0f30e9189b370';
const submittedAt = '2026-09-02T20:00:17Z';
const selectionPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-003.selection.json';
const draftPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-003.review-draft.json';
const itemsPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-003.items.json';
const manifestPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-003.json';
const unresolvedPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-003.unresolved.json';

const selection = readJson(selectionPath);
const draft = readJson(draftPath);
const selectionByLemma = new Map(selection.items.map((row) => [row.lemma, row]));
const exactRows = draft.entries.filter((row) => row.proposalDisposition === 'exact_candidate_proposed');
const blockedRows = draft.entries.filter((row) => row.proposalDisposition !== 'exact_candidate_proposed');
if (exactRows.length !== 22 || blockedRows.length !== 18) throw new Error(`Unexpected review cardinality ${exactRows.length}/${blockedRows.length}`);

const exactItems = exactRows.map((row) => {
  const selected = selectionByLemma.get(row.lemma);
  if (!selected || !selected.candidateIds.includes(row.proposedCandidateId)) throw new Error(`${row.lemma}: approved candidate is not pinned`);
  return {
    lemma: row.lemma,
    senseKey: row.proposedCandidateId,
    partOfSpeech: row.partOfSpeech,
    strategy: 'textual_only',
    maturity: 'V1',
    motionPolicy: 'none',
    answerSafety: 'neutral_safe',
    reviewSource: 'sol_max_row_level_exact_candidate_selection',
    sourceTrace: {
      sourceCorpusId: row.sourceCorpusId,
      grade: row.grade,
      candidateSenseCount: selected.candidateSenseCount,
      candidateIds: selected.candidateIds,
      selectedCandidateId: row.proposedCandidateId,
      polysemyRisk: selected.polysemyRisk,
      mediumQueueIndex: selected.freshMediumQueueIndex,
      globalQueueIndex: selected.globalQueueIndex
    }
  };
});

writeJson(itemsPath, {
  schemaVersion: 1,
  id: 'vocabulary.visual-strategy.priority-sense-resolution.batch.003',
  issueRef: 151,
  parentIssueRef: 76,
  status: 'sol_max_reviewed_exact_sense',
  policy: {
    bareLemmaMappingAllowed: false,
    definitionsIncluded: false,
    sourceGlossesIncluded: false,
    sourceExamplesIncluded: false,
    profilePlacementInferred: false,
    assessmentAnswerRevealAllowed: false,
    runtimeMappingCreated: false,
    childDefinitionApprovalInferred: false
  },
  reviewBasis: {
    candidateSource: 'Open English WordNet 2025 candidate records already imported under CC-BY-4.0',
    selectionRule: `Independent row-level acceptance from PR #152 review ${reviewNodeId}; all pinned candidates were inspected and only the 22 explicitly accepted exact candidates are retained.`,
    strategyRule: 'Exact-sense registration is conservative V1 textual-only; later semantic-depth work may add reusable scene grammar without changing the reviewed sense.',
    reviewNodeId,
    reviewedSemanticHeadSha: reviewedHeadSha
  },
  items: exactItems
});
const itemsBlobSha = blobSha(itemsPath);

writeJson(manifestPath, {
  schemaVersion: 1,
  id: 'priority-sense-resolution-003',
  sequence: 6,
  issueRef: 151,
  parentIssueRef: 76,
  status: 'sol_max_reviewed_exact_sense',
  authority: {
    defaultKind: 'sol_max_reviewed_exact_sense',
    referenceState: 'sol_max_reviewed_exact_reference',
    resolutionState: 'sol_max_resolved',
    dispositionState: 'reviewed_strategy',
    runtimeAuthority: 'none'
  },
  source: {
    kind: 'reviewed_items_file',
    reviewDataPath: itemsPath,
    expectedItemCount: 22,
    expectedGitBlobSha: itemsBlobSha,
    historicalStatus: 'sol_max_reviewed_exact_sense'
  },
  reviewEvidence: {
    kind: 'sol_max_row_level_acceptance',
    pullRequest: 152,
    reviewNodeId,
    reviewedSemanticHeadSha: reviewedHeadSha,
    mergedMainSha: mainBaselineSha,
    mainBaselineAtRegistration: mainBaselineSha,
    submittedAt,
    acceptedRows: 22,
    claimsHumanEditorialReview: false
  },
  output: {
    path: 'content/vocabulary-visuals/batches/__generated-priority-sense-resolution-batch-003.json',
    projectionMode: 'authority_corrected_review_projection'
  },
  supersession: {
    resolvesPriorUnresolvedForSameLemma: true,
    doesNotDeleteHistoricalDisposition: true
  },
  policy: {
    bareLemmaMappingAllowed: false,
    definitionsIncluded: false,
    sourceGlossesIncluded: false,
    sourceExamplesIncluded: false,
    profilePlacementInferred: false,
    assessmentAnswerRevealAllowed: false,
    runtimeMappingCreated: false,
    childDefinitionApprovalInferred: false,
    selectedCandidateMustBePinned: true,
    selectedCandidateMustEqualSenseKey: true,
    claimsHumanEditorialReview: false,
    requiresExternalReviewEvidence: true,
    maxMaturity: 'V1'
  }
});

writeJson(unresolvedPath, {
  schemaVersion: 1,
  id: 'vocabulary.semantic-priority-medium-risk-tranche-003.reviewed-unresolved',
  issueRef: 151,
  parentIssueRef: 76,
  authorityKind: 'sol_max_reviewed_unresolved_reference',
  status: 'sol_max_reviewed_unresolved_reference',
  reviewEvidence: {
    kind: 'sol_max_row_level_unresolved_acceptance',
    pullRequest: 152,
    reviewNodeId,
    reviewedSemanticHeadSha: reviewedHeadSha,
    submittedAt,
    reviewedRows: 18,
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
  },
  entries: blockedRows.map((row) => ({
    lemma: row.lemma,
    candidateIds: row.candidateIds,
    reviewDisposition: 'unresolved_confirmed',
    reasonCode: row.reasonCode,
    reason: row.reason
  }))
});
const unresolvedBlobSha = blobSha(unresolvedPath);

const ledgerPath = 'content/vocabulary-visuals/review-batches/ledger.json';
const ledger = readJson(ledgerPath);
ledger.batches = (ledger.batches ?? []).filter((entry) => entry.id !== 'priority-sense-resolution-003');
ledger.batches.push({ id: 'priority-sense-resolution-003', sequence: 6, issueRef: 151, manifest: manifestPath });
ledger.batches.sort((a, b) => a.sequence - b.sequence || a.id.localeCompare(b.id));
writeJson(ledgerPath, ledger);

const inventoryPath = 'content/vocabulary-visuals/review-batches/artifact-inventory.json';
const inventory = readJson(inventoryPath);
inventory.semanticSources = (inventory.semanticSources ?? []).filter((entry) => !['priority-sense-resolution-003', 'priority-sense-resolution-003-reviewed-unresolved'].includes(entry.id));
const candidateIndex = inventory.semanticSources.findIndex((entry) => entry.id === 'phase-c-candidate-relevance-review');
if (candidateIndex < 0) throw new Error('Missing candidate relevance inventory anchor');
inventory.semanticSources.splice(candidateIndex, 0,
  {
    id: 'priority-sense-resolution-003',
    artifactKind: 'manifest_sol_max_reviewed_projection',
    authorityKind: 'sol_max_reviewed_exact_sense',
    lifecycle: 'manifest_source_generated_projection',
    order: 58,
    manifest: manifestPath,
    generatedPath: 'content/vocabulary-visuals/batches/__generated-priority-sense-resolution-batch-003.json',
    supersession: 'resolves_prior_unresolved_for_same_lemma_without_deleting_history'
  },
  {
    id: 'priority-sense-resolution-003-reviewed-unresolved',
    path: unresolvedPath,
    artifactKind: 'sol_max_reviewed_unresolved_reference',
    authorityKind: 'sol_max_reviewed_unresolved_reference',
    lifecycle: 'committed_review_reference',
    order: 59,
    expectedGitBlobSha: unresolvedBlobSha,
    supersession: 'later_exact_review_may_resolve_blocker_without_deleting_review_history'
  }
);
writeJson(inventoryPath, inventory);

const phaseCPath = 'scripts/vocabulary-visuals/build-corpus-terminal-dispositions.mjs';
let phaseC = readText(phaseCPath);
phaseC = replaceOnce(
  phaseC,
  "const reviewedUnresolvedPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-002.unresolved.json';\nconst reviewLedgerPath = 'content/vocabulary-visuals/review-batches/ledger.json';",
  "const inventoryPath = 'content/vocabulary-visuals/review-batches/artifact-inventory.json';\nconst reviewLedgerPath = 'content/vocabulary-visuals/review-batches/ledger.json';\nconst inventory = readJson(inventoryPath);\nconst reviewedUnresolvedPaths = (inventory.semanticSources ?? [])\n  .filter((entry) => entry.authorityKind === 'sol_max_reviewed_unresolved_reference' && entry.path)\n  .sort((left, right) => (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER) || left.id.localeCompare(right.id))\n  .map((entry) => entry.path);\nif (!reviewedUnresolvedPaths.length) throw new Error('At least one reviewed-unresolved reference must be inventoried');",
  'reviewed-unresolved inventory discovery'
);
const unresolvedBlock = `const reviewedUnresolvedByLemma = new Map();
const allowedUnresolvedDispositions = new Set(['proposal_rejected_back_to_unresolved', 'unresolved_confirmed']);
for (const reviewedUnresolvedPath of reviewedUnresolvedPaths) {
  const reviewedUnresolved = readJson(reviewedUnresolvedPath);
  if (
    reviewedUnresolved?.schemaVersion !== 1 ||
    !Number.isInteger(reviewedUnresolved?.issueRef) || reviewedUnresolved.issueRef < 1 ||
    reviewedUnresolved?.parentIssueRef !== 76 ||
    reviewedUnresolved?.authorityKind !== 'sol_max_reviewed_unresolved_reference' ||
    reviewedUnresolved?.status !== 'sol_max_reviewed_unresolved_reference'
  ) {
    throw new Error(\`${reviewedUnresolvedPath}: reviewed-unresolved reference must use schemaVersion 1, parent #76 and the non-resolving Sol Max reference authority\`);
  }
  const unresolvedEvidence = reviewedUnresolved.reviewEvidence ?? {};
  if (
    unresolvedEvidence.kind !== 'sol_max_row_level_unresolved_acceptance' ||
    !Number.isInteger(unresolvedEvidence.pullRequest) || unresolvedEvidence.pullRequest < 1 ||
    !String(unresolvedEvidence.reviewNodeId ?? '').startsWith('PRR_') ||
    !/^[0-9a-f]{40}$/.test(String(unresolvedEvidence.reviewedSemanticHeadSha ?? '')) ||
    unresolvedEvidence.claimsHumanEditorialReview !== false
  ) {
    throw new Error(\`${reviewedUnresolvedPath}: reviewed-unresolved reference requires immutable non-human-editorial external review evidence\`);
  }
  const unresolvedPolicy = reviewedUnresolved.policy ?? {};
  for (const key of [
    'createsSenseSelection',
    'createsSemanticDisposition',
    'countsAsResolved',
    'removesBlocker',
    'createsRuntimeAuthority',
    'createsProfilePlacement',
    'createsChildDefinitionApproval',
    'copiesSourceGlossOrExample'
  ]) {
    if (unresolvedPolicy[key] !== false) throw new Error(\`${reviewedUnresolvedPath}: reviewed-unresolved policy ${key} must be false\`);
  }
  if (unresolvedPolicy.revisitRequiresNewContextOrEvidence !== true) {
    throw new Error(\`${reviewedUnresolvedPath}: reviewed-unresolved reference must require new context or evidence before revisit\`);
  }
  let reviewedRows = 0;
  for (const entry of reviewedUnresolved.entries ?? []) {
    const lemma = String(entry?.lemma ?? '').trim();
    const candidateIds = [...new Set(entry?.candidateIds ?? [])].map(String).sort();
    const pinnedCandidateIds = candidateIdsByLemma.get(lemma) ?? [];
    if (!lemma || reviewedUnresolvedByLemma.has(lemma)) throw new Error(\`Duplicate/missing reviewed-unresolved lemma ${lemma || '<empty>'}\`);
    if (candidateIds.length < 2 || JSON.stringify(candidateIds) !== JSON.stringify(pinnedCandidateIds)) {
      throw new Error(\`${lemma}: reviewed-unresolved candidate trace no longer matches the pinned OEWN candidate set\`);
    }
    if (!allowedUnresolvedDispositions.has(entry.reviewDisposition) || !String(entry.reasonCode ?? '').trim() || !String(entry.reason ?? '').trim()) {
      throw new Error(\`${lemma}: reviewed-unresolved entry requires an accepted unresolved disposition, reasonCode and reason\`);
    }
    for (const forbidden of ['senseKey', 'strategy', 'maturity', 'knowledgeRef', 'runtimeUsage', 'profileRef', 'childDefinition']) {
      if (forbidden in entry) throw new Error(\`${lemma}: reviewed-unresolved reference cannot create ${forbidden} authority\`);
    }
    reviewedUnresolvedByLemma.set(lemma, {
      ...entry,
      reviewSource: reviewedUnresolvedPath,
      reviewNodeId: unresolvedEvidence.reviewNodeId
    });
    reviewedRows += 1;
  }
  if (reviewedRows !== unresolvedEvidence.reviewedRows) {
    throw new Error(\`${reviewedUnresolvedPath}: reviewedRows evidence ${unresolvedEvidence.reviewedRows} does not match ${reviewedRows} entries\`);
  }
}
`;
phaseC = replaceBlock(
  phaseC,
  'const reviewedUnresolved = readJson(reviewedUnresolvedPath);',
  'const relevanceReview = readJson(relevanceReviewPath);',
  unresolvedBlock,
  'reviewed-unresolved loader'
);
phaseC = phaseC.replace('reviewedUnresolvedReviewSource: reviewedUnresolvedPath,', 'reviewedUnresolvedReviewSource: reviewedUnresolvedEntry.reviewSource,');
phaseC = phaseC.replace('reviewedUnresolvedReviewNodeId: unresolvedEvidence.reviewNodeId', 'reviewedUnresolvedReviewNodeId: reviewedUnresolvedEntry.reviewNodeId');
phaseC = phaseC.replaceAll('reviewedUnresolvedReference: reviewedUnresolvedPath,', 'reviewedUnresolvedReferences: reviewedUnresolvedPaths,');
writeText(phaseCPath, phaseC);

const frontierTestPath = 'tests/vocabulary-visual-review-frontier.behavior.test.ts';
let frontier = readText(frontierTestPath);
frontier = replaceOnce(frontier,
  "const ledgerPath = 'content/vocabulary-visuals/review-batches/ledger.json';",
  "const ledgerPath = 'content/vocabulary-visuals/review-batches/ledger.json';\nconst manifestPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-003.json';\nconst itemsPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-003.items.json';\nconst unresolvedPath = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-003.unresolved.json';",
  'frontier constants'
);
const firstTestStart = "  it('pins exactly the first 40 fresh medium-risk blockers after #149 review deferrals', () => {";
const secondTestStart = "  it('keeps tranche selection explicitly non-authoritative until row review and independent PR acceptance exist', () => {";
const newFirstTest = `  it('preserves the immutable 40-row source selection after independent registration', () => {
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

`;
frontier = replaceBlock(frontier, firstTestStart, secondTestStart, newFirstTest, 'frontier source-selection test');
frontier = frontier.replace("    expect(JSON.stringify(ledger)).not.toContain('priority-sense-resolution-003');", "    expect(JSON.stringify(ledger)).toContain('priority-sense-resolution-003');");
const accountingMarker = "  it('does not change terminal, resolved, blocker or runtime accounting', () => {";
const registrationTest = `  it('registers only the independently approved exact candidates and preserves every non-selected row as a blocker', () => {
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
        reviewNodeId: '${reviewNodeId}',
        reviewedSemanticHeadSha: '${reviewedHeadSha}',
        acceptedRows: 22,
        claimsHumanEditorialReview: false
      }
    });
    expect(items.items).toHaveLength(22);
    expect(items.items.every((row: any) => row.senseKey === row.sourceTrace.selectedCandidateId && row.strategy === 'textual_only' && row.maturity === 'V1')).toBe(true);
    expect(unresolved).toMatchObject({
      issueRef: 151,
      authorityKind: 'sol_max_reviewed_unresolved_reference',
      reviewEvidence: { reviewNodeId: '${reviewNodeId}', reviewedRows: 18, claimsHumanEditorialReview: false }
    });
    expect(unresolved.entries).toHaveLength(18);
    expect(unresolved.entries.find((row: any) => row.lemma === 'hat')).toMatchObject({ reasonCode: 'pos_intent_mismatch', reviewDisposition: 'unresolved_confirmed' });
    expect(unresolved.entries.every((row: any) => !('senseKey' in row) && !('strategy' in row) && !('maturity' in row))).toBe(true);
    expect(ledger.batches).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'priority-sense-resolution-003', sequence: 6, manifest: manifestPath })]));
  });

`;
frontier = frontier.replace(accountingMarker, `${registrationTest}${accountingMarker}`);
frontier = frontier.replace('resolvedStrategyLemmas: 635,\n      blockedSenseResolutionLemmas: 9365,\n      exactReviewedSupersedingLemmas: 48,', 'resolvedStrategyLemmas: 657,\n      blockedSenseResolutionLemmas: 9343,\n      exactReviewedSupersedingLemmas: 70,');
frontier = frontier.replace('resolvedStrategyLemmas: 602,\n      blockedSenseResolutionLemmas: 1798', 'resolvedStrategyLemmas: 624,\n      blockedSenseResolutionLemmas: 1776');
frontier = frontier.replace('expect(report.senseResolutionQueue.items).toBe(1798);', 'expect(report.senseResolutionQueue.items).toBe(1776);');
writeText(frontierTestPath, frontier);

const controlPath = 'tests/vocabulary-visual-control-plane-authority.behavior.test.ts';
let control = readText(controlPath);
control = replaceOnce(control,
  "const exactReviewManifest2Path = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-002.json';",
  "const exactReviewManifest2Path = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-002.json';\nconst exactReviewManifest3Path = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-003.json';\nconst reviewedUnresolvedPath3 = 'content/vocabulary-visuals/review-batches/priority-sense-resolution-003.unresolved.json';",
  'control constants'
);
control = control.replace(
  "      expect.objectContaining({ id: 'priority-sense-resolution-002', authorityKind: 'sol_max_reviewed_exact_sense', manifest: exactReviewManifest2Path }),",
  "      expect.objectContaining({ id: 'priority-sense-resolution-002', authorityKind: 'sol_max_reviewed_exact_sense', manifest: exactReviewManifest2Path }),\n      expect.objectContaining({ id: 'priority-sense-resolution-003', authorityKind: 'sol_max_reviewed_exact_sense', manifest: exactReviewManifest3Path }),\n      expect.objectContaining({ id: 'priority-sense-resolution-003-reviewed-unresolved', authorityKind: 'sol_max_reviewed_unresolved_reference', path: reviewedUnresolvedPath3 }),"
);
control = control.replace("    expect(productionSource).toContain('priority-sense-resolution-002.unresolved.json');", "    expect(productionSource).toContain('sol_max_reviewed_unresolved_reference');");
control = control.replace('resolvedStrategyLemmas: 635,\n      blockedSenseResolutionLemmas: 9365,\n      exactReviewedSupersedingLemmas: 48,', 'resolvedStrategyLemmas: 657,\n      blockedSenseResolutionLemmas: 9343,\n      exactReviewedSupersedingLemmas: 70,');
control = control.replace('resolvedStrategyLemmas: 602,\n      blockedSenseResolutionLemmas: 1798,', 'resolvedStrategyLemmas: 624,\n      blockedSenseResolutionLemmas: 1776,');
control = control.replace('expect(report.senseResolutionQueue.items).toBe(1798);', 'expect(report.senseResolutionQueue.items).toBe(1776);');
writeText(controlPath, control);

const corpusTestPath = 'tests/vocabulary-visual-corpus-terminal.behavior.test.ts';
let corpusTest = readText(corpusTestPath);
corpusTest = replaceOnce(corpusTest,
  "];\n\nconst expectedRuntimeProofAccounting",
  "];\nconst reviewedUnresolvedLemmas003 = [\n  'prevent', 'improve', 'holiday', 'discuss', 'favourite', 'rice', 'bathroom', 'calm', 'hat', 'witness',\n  'parent', 'chemical', 'lane', 'unlike', 'x-ray', 'tradition', 'historic', 'basketball'\n];\n\nconst expectedRuntimeProofAccounting",
  'corpus unresolved tranche 003 list'
);
corpusTest = corpusTest.replace('exactReviewedSupersedingLemmas: 48,', 'exactReviewedSupersedingLemmas: 70,');
corpusTest = corpusTest.replace('items: 1798,\n        exactReviewedSupersededBlockers: 48,\n        reviewedUnresolvedRevisitOnly: 22,\n        firstPassHumanSenseSelection: 1764,\n        byRisk: { candidate_relevance: 13, medium: 481, high: 1304 },\n        byStatus: {\n          candidate_relevance_review_required: 12,\n          reviewed_unresolved_revisit_only: 22,\n          human_sense_selection_required: 1764', 'items: 1776,\n        exactReviewedSupersededBlockers: 70,\n        reviewedUnresolvedRevisitOnly: 40,\n        firstPassHumanSenseSelection: 1724,\n        byRisk: { candidate_relevance: 13, medium: 459, high: 1304 },\n        byStatus: {\n          candidate_relevance_review_required: 12,\n          reviewed_unresolved_revisit_only: 40,\n          human_sense_selection_required: 1724');
corpusTest = corpusTest.replace("    expect(revisitOnly.map((item: { lemma: string }) => item.lemma).sort()).toEqual([...reviewedUnresolvedLemmas].sort());", "    expect(revisitOnly.map((item: { lemma: string }) => item.lemma).sort()).toEqual([...reviewedUnresolvedLemmas, ...reviewedUnresolvedLemmas003].sort());");
const oldRevisitAssertion = `    expect(revisitOnly.every((item: {
      candidateSenseCount: number;
      terminalStrategy: string;
      reviewedUnresolvedReviewNodeId: string;
      reviewedUnresolvedReviewSource: string;
    }) =>
      item.candidateSenseCount === 2 &&
      item.terminalStrategy === 'sense_unresolved' &&
      item.reviewedUnresolvedReviewNodeId === 'PRR_kwDOUHzR8c8AAAABLo97tQ' &&
      item.reviewedUnresolvedReviewSource === 'content/vocabulary-visuals/review-batches/priority-sense-resolution-002.unresolved.json'
    )).toBe(true);
    expect(unresolved).toHaveLength(1764);`;
const newRevisitAssertion = `    const revisitByLemma = new Map(revisitOnly.map((item: any) => [item.lemma, item]));
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
        reviewedUnresolvedReviewNodeId: '${reviewNodeId}',
        reviewedUnresolvedReviewSource: 'content/vocabulary-visuals/review-batches/priority-sense-resolution-003.unresolved.json'
      });
    }
    expect(unresolved).toHaveLength(1724);`;
corpusTest = replaceOnce(corpusTest, oldRevisitAssertion, newRevisitAssertion, 'corpus revisit assertions');
corpusTest = corpusTest.replace('resolvedStrategyLemmas: 635,\n      blockedSenseResolutionLemmas: 9365,', 'resolvedStrategyLemmas: 657,\n      blockedSenseResolutionLemmas: 9343,');
corpusTest = corpusTest.replace('resolvedStrategyLemmas: 602,\n      blockedSenseResolutionLemmas: 1798', 'resolvedStrategyLemmas: 624,\n      blockedSenseResolutionLemmas: 1776');
corpusTest = corpusTest.replace('expect(report.senseResolutionQueue.items).toBe(1798);', 'expect(report.senseResolutionQueue.items).toBe(1776);');
writeText(corpusTestPath, corpusTest);

console.log(`Prepared approved semantic tranche 003: ${exactRows.length} exact / ${blockedRows.length} blockers; item blob ${itemsBlobSha}; unresolved blob ${unresolvedBlobSha}`);
