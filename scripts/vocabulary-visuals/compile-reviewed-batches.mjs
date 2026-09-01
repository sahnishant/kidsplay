import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../../', import.meta.url);
const coreCompilerPath = fileURLToPath(new URL('./compile-reviewed-batches-core.mjs', import.meta.url));
const gapBuilderPath = fileURLToPath(new URL('./build-priority-gap-queue.mjs', import.meta.url));
const defaultLedgerPath = 'content/vocabulary-visuals/review-batches/ledger.json';
const authorityModelPath = 'content/vocabulary-visuals/review-batches/authority-model.json';
const inventoryPath = 'content/vocabulary-visuals/review-batches/artifact-inventory.json';
const relevanceReviewPath = 'content/vocabulary-visuals/review-batches/candidate-relevance-review-001.json';

const fileTarget = (path) => isAbsolute(path) ? path : new URL(path, root);
const readText = (path) => readFileSync(fileTarget(path), 'utf8');
const readJson = (path) => JSON.parse(readText(path));
const writeText = (path, value) => writeFileSync(fileTarget(path), value, 'utf8');
const fileExists = (path) => existsSync(fileTarget(path));
const normalizeLemma = (value) => String(value ?? '').toLocaleLowerCase('en-US').trim();
const requiredString = (value, label) => {
  const result = String(value ?? '').trim();
  if (!result) throw new Error(`Review authority requires ${label}`);
  return result;
};
const normalizeRepositoryText = (text) => String(text).replace(/\r\n?/g, '\n');
const gitBlobSha = (text) => {
  const canonical = normalizeRepositoryText(text);
  return createHash('sha1').update(`blob ${Buffer.byteLength(canonical)}\0${canonical}`).digest('hex');
};

const authorityModel = readJson(authorityModelPath);
const inventory = readJson(inventoryPath);
const authorityKinds = new Map((authorityModel.authorityKinds ?? []).map((entry) => [entry.id, entry]));
const maturityRanks = new Map((authorityModel.dimensions?.maturityLevels ?? []).map((id, index) => [id, index]));
const dimensionSets = Object.fromEntries(Object.entries(authorityModel.dimensions ?? {}).map(([key, values]) => [key, new Set(values)]));

const authority = (id, context) => {
  const result = authorityKinds.get(id);
  if (!result) throw new Error(`${context}: unknown authority kind ${id}`);
  return result;
};
const assertDimension = (dimension, value, context) => {
  if (!dimensionSets[dimension]?.has(value)) throw new Error(`${context}: invalid ${dimension} value ${String(value)}`);
};
const assertAllowed = (allowed, value, context) => {
  if (Array.isArray(allowed) && !allowed.includes(value)) throw new Error(`${context}: authority does not allow ${value}`);
};

const validateAuthorityModel = () => {
  if (authorityModel?.schemaVersion !== 1 || authorityModel?.parentIssueRef !== 76) throw new Error('Vocabulary authority model must use schemaVersion 1 and parent #76');
  if (authorityKinds.size !== (authorityModel.authorityKinds ?? []).length) throw new Error('Vocabulary authority model contains duplicate authority ids');
  const invariants = authorityModel.invariants ?? {};
  for (const key of ['v1AloneImpliesResolution', 'singleCandidateAloneImpliesHumanReview', 'senseUnresolvedCountsAsResolved', 'semanticManifestMayGrantRuntimeAuthority', 'terminalPolicyMayClaimHumanExactSenseReview', 'runtimeProofMayCreateSemanticDisposition']) {
    if (invariants[key] !== false) throw new Error(`Vocabulary authority invariant ${key} must be false`);
  }
  for (const entry of authorityKinds.values()) {
    if (!maturityRanks.has(entry.maxSemanticMaturity)) throw new Error(`${entry.id}: unknown maxSemanticMaturity ${entry.maxSemanticMaturity}`);
    assertDimension('runtimeAuthorityStates', entry.runtimeAuthority, `${entry.id} authority`);
  }
};

const validateArtifactInventory = () => {
  if (inventory?.schemaVersion !== 1 || inventory?.parentIssueRef !== 76 || inventory?.authorityModel !== authorityModelPath) {
    throw new Error('Vocabulary artifact inventory must use schemaVersion 1, parent #76 and the canonical authority model');
  }
  const orders = new Set();
  const ids = new Set();
  const committedBatchInventory = new Map();
  for (const entry of inventory.semanticSources ?? []) {
    if (!entry?.id || ids.has(entry.id)) throw new Error(`Duplicate/missing semantic inventory id ${entry?.id ?? '<empty>'}`);
    ids.add(entry.id);
    if (entry.order !== undefined) {
      if (!Number.isInteger(entry.order) || orders.has(entry.order)) throw new Error(`${entry.id}: duplicate/invalid semantic inventory order ${entry.order}`);
      orders.add(entry.order);
    }
    const kind = authority(entry.authorityKind, `${entry.id} inventory`);
    if (kind.semanticReviewAuthority !== true) throw new Error(`${entry.id}: semantic source must use semantic-review authority`);
    if (entry.path) {
      if (!fileExists(entry.path)) throw new Error(`${entry.id}: inventoried source path is missing: ${entry.path}`);
      if (entry.path.startsWith('content/vocabulary-visuals/batches/') && !entry.path.includes('__generated-')) committedBatchInventory.set(entry.path, entry);
      if (entry.expectedGitBlobSha) {
        const actual = gitBlobSha(readText(entry.path));
        if (actual !== entry.expectedGitBlobSha) throw new Error(`${entry.id}: historical source blob drift; expected ${entry.expectedGitBlobSha}, got ${actual}`);
      }
    }
    if (entry.manifest && !fileExists(entry.manifest)) throw new Error(`${entry.id}: inventoried manifest is missing: ${entry.manifest}`);
  }
  const committedBatchPaths = readdirSync(new URL('content/vocabulary-visuals/batches/', root))
    .filter((name) => name.endsWith('.json') && !name.startsWith('__generated-'))
    .sort()
    .map((name) => `content/vocabulary-visuals/batches/${name}`);
  for (const path of committedBatchPaths) if (!committedBatchInventory.has(path)) throw new Error(`Unclassified committed semantic batch ${path}`);
  for (const path of committedBatchInventory.keys()) if (!committedBatchPaths.includes(path)) throw new Error(`Inventory claims absent committed semantic batch ${path}`);

  for (const entry of inventory.runtimeBoundary ?? []) {
    if (!fileExists(entry.path)) throw new Error(`${entry.id}: runtime boundary path is missing: ${entry.path}`);
    const kind = authority(entry.authorityKind, `${entry.id} runtime boundary`);
    if (entry.semanticReviewAuthority !== false || kind.semanticReviewAuthority !== false) throw new Error(`${entry.id}: runtime proof/mapping data must remain outside semantic-review authority`);
  }
  const generated = JSON.stringify(inventory.generatedArtifacts ?? []);
  for (const required of [
    'content/vocabulary-visuals/__generated-priority-gap',
    'content/vocabulary-visuals/batches/__generated-priority-batch-',
    'content/vocabulary-visuals/batches/__generated-priority-sense-resolution-batch-',
    'content/vocabulary-visuals/batches/__generated-corpus-terminal-dispositions.json',
    'content/vocabulary-visuals/__generated-priority-sense-resolution-queue.json',
    'content/vocabulary-visuals/__generated-corpus-sense-resolution-queue.json',
    'content/vocabulary-visuals/__generated-runtime-plans.json'
  ]) if (!generated.includes(required)) throw new Error(`Artifact inventory is missing generated lifecycle classification for ${required}`);
};

const readHumanReviewedKnowledge = () => {
  const value = readJson('content/knowledge/english-vocabulary-primary-reviewed.json');
  const entries = (Array.isArray(value) ? value : [value]).flatMap((source) => source.entries ?? []);
  return new Map(entries.map((entry) => [normalizeLemma(entry.id), entry]));
};

const resolveOverride = (manifest, lemma) => {
  const matches = (manifest.authority?.overrides ?? []).filter((override) => (override.lemmas ?? []).map(normalizeLemma).includes(lemma));
  if (matches.length > 1) throw new Error(`${manifest.id}/${lemma}: multiple authority overrides match`);
  return matches[0] ?? null;
};

const validateAuthorityState = (kind, state, context) => {
  assertDimension('referenceStates', state.referenceState, context);
  assertDimension('resolutionStates', state.resolutionState, context);
  assertDimension('dispositionStates', state.dispositionState, context);
  assertAllowed(kind.allowedResolutionStates, state.resolutionState, `${context} resolutionState`);
  assertAllowed(kind.allowedDispositionStates, state.dispositionState, `${context} dispositionState`);
};

const validateManifestAuthority = (manifest, humanReviewedByLemma) => {
  const defaultKind = authority(manifest.authority?.defaultKind, `${manifest.id} default`);
  if (defaultKind.semanticReviewAuthority !== true || defaultKind.canCreateDisposition !== true) throw new Error(`${manifest.id}: default authority cannot create semantic dispositions`);
  if (manifest.authority?.runtimeAuthority !== 'none' || defaultKind.runtimeAuthority !== 'none') throw new Error(`${manifest.id}: semantic manifest cannot grant runtime authority`);
  if (defaultKind.historicalMigrationOnly) {
    if (manifest.authority?.historicalMigration !== true || !manifest.source?.expectedSemanticFingerprint || !manifest.output?.expectedItemFingerprint) {
      throw new Error(`${manifest.id}: historical authority requires explicit migration and frozen source/output fingerprints`);
    }
  }
  if (defaultKind.allowedManifestStatuses) assertAllowed(defaultKind.allowedManifestStatuses, manifest.status, `${manifest.id} manifest status`);
  if (manifest.authority?.referenceState) validateAuthorityState(defaultKind, manifest.authority, `${manifest.id} default authority`);

  const overrideLemmas = new Set();
  for (const override of manifest.authority?.overrides ?? []) {
    const kind = authority(override.kind, `${manifest.id} authority override`);
    if (kind.semanticReviewAuthority !== true || kind.canCreateDisposition !== true || kind.runtimeAuthority !== 'none') throw new Error(`${manifest.id}: override ${override.kind} is not semantic-only disposition authority`);
    validateAuthorityState(kind, override, `${manifest.id}/${override.kind} override`);
    for (const rawLemma of override.lemmas ?? []) {
      const lemma = normalizeLemma(rawLemma);
      if (!lemma || overrideLemmas.has(lemma)) throw new Error(`${manifest.id}: duplicate/missing authority override lemma ${lemma || '<empty>'}`);
      overrideLemmas.add(lemma);
    }
  }

  const validateReviewedRecord = (record, lemma) => {
    const override = resolveOverride(manifest, lemma);
    const kindId = override?.kind ?? manifest.authority.defaultKind;
    const kind = authority(kindId, `${manifest.id}/${lemma}`);
    const maturity = record.maturity ?? manifest.defaults?.maturity ?? 'V1';
    if (!maturityRanks.has(maturity) || maturityRanks.get(maturity) > maturityRanks.get(kind.maxSemanticMaturity)) throw new Error(`${manifest.id}/${lemma}: ${kindId} cannot establish maturity ${maturity}`);
    if (record.strategy && Array.isArray(kind.allowedStrategies) && !kind.allowedStrategies.includes(record.strategy)) throw new Error(`${manifest.id}/${lemma}: ${kindId} cannot create strategy ${record.strategy}`);
    if (kindId === 'human_reviewed_exact_sense') {
      if (record.reviewSource !== 'human_reviewed_primary_meaning') throw new Error(`${manifest.id}/${lemma}: human authority requires human_reviewed_primary_meaning source`);
      const senseKey = requiredString(record.senseKey, `${manifest.id}/${lemma} exact human senseKey`);
      const curation = humanReviewedByLemma.get(lemma)?.meta?.curation;
      if (curation?.status !== 'reviewed' || curation?.candidateId !== senseKey || curation?.sourceGlossCopied !== false) throw new Error(`${manifest.id}/${lemma}: human authority does not match #51 curation evidence`);
    } else if (record.reviewSource === 'human_reviewed_primary_meaning') {
      throw new Error(`${manifest.id}/${lemma}: human review source requires human_reviewed_exact_sense authority`);
    }
  };

  for (const block of manifest.reviews ?? []) {
    if (block.type === 'group') for (const rawLemma of block.lemmas ?? []) validateReviewedRecord(block, normalizeLemma(rawLemma));
    else if (block.type === 'item') validateReviewedRecord(block, normalizeLemma(block.lemma));
  }

  if (manifest.terminalReview) {
    if (manifest.authority.defaultKind !== 'approved_terminal_policy') throw new Error(`${manifest.id}: terminal review requires approved_terminal_policy authority`);
    for (const rule of manifest.terminalReview.rules ?? []) {
      validateAuthorityState(defaultKind, rule, `${manifest.id} terminal rule`);
      if (!defaultKind.allowedStrategies?.includes(rule.strategy)) throw new Error(`${manifest.id}: terminal authority cannot create strategy ${rule.strategy}`);
      if (rule.resolutionState === 'blocked_unresolved' && (rule.strategy !== 'sense_unresolved' || !String(rule.senseKey).includes('unresolved'))) throw new Error(`${manifest.id}: blocked terminal rule must remain sense_unresolved`);
      if (rule.resolutionState === 'candidate_exact_terminal' && (rule.strategy !== 'textual_only' || rule.senseKey !== 'only_candidate')) throw new Error(`${manifest.id}: candidate-exact terminal policy may only create textual_only from the one candidate`);
      if (rule.reviewSource === 'human_reviewed_primary_meaning') throw new Error(`${manifest.id}: terminal policy cannot claim human exact-sense review`);
    }
  }
};

const validateLedgerAuthority = (ledgerPath) => {
  const ledger = readJson(ledgerPath);
  const humanReviewedByLemma = readHumanReviewedKnowledge();
  const inventoryManifestEntries = new Map((inventory.semanticSources ?? []).filter((entry) => entry.manifest).map((entry) => [entry.manifest, entry]));
  for (const entry of ledger.batches ?? []) {
    const manifest = readJson(entry.manifest);
    validateManifestAuthority(manifest, humanReviewedByLemma);
    if (ledgerPath === defaultLedgerPath) {
      const inventoried = inventoryManifestEntries.get(entry.manifest);
      if (!inventoried || inventoried.id !== entry.id || inventoried.generatedPath !== manifest.output?.path) throw new Error(`${entry.id}: default ledger manifest is not classified consistently in artifact inventory`);
    }
  }
};

const validateCandidateRelevanceData = () => {
  const review = readJson(relevanceReviewPath);
  const kind = authority(review.authorityKind, 'candidate relevance review');
  if (kind.id !== 'approved_terminal_policy' || kind.canClaimHumanReview !== false || kind.runtimeAuthority !== 'none') throw new Error('Candidate relevance blockers require non-human approved_terminal_policy authority');
  const lemmas = new Set();
  for (const entry of review.entries ?? []) {
    const lemma = normalizeLemma(entry.lemma);
    if (!lemma || lemmas.has(lemma)) throw new Error(`Duplicate/missing candidate relevance lemma ${lemma || '<empty>'}`);
    if (entry.status !== 'candidate_relevance_review_required' || !String(entry.reasonCode ?? '').trim() || !String(entry.reason ?? '').trim()) throw new Error(`${lemma}: candidate relevance review requires explicit status, reasonCode and reason`);
    lemmas.add(lemma);
  }
  if (lemmas.size !== 12) throw new Error(`Candidate relevance review must preserve the 12 Phase C reviewed blockers; got ${lemmas.size}`);
};

const validateReviewedItemsFile = (manifest) => {
  const sourcePath = requiredString(manifest.source?.reviewDataPath, `${manifest.id} reviewDataPath`);
  const sourceText = readText(sourcePath);
  const actualBlobSha = gitBlobSha(sourceText);
  if (actualBlobSha !== manifest.source?.expectedGitBlobSha) {
    throw new Error(`${manifest.id}: reviewed source blob drift; expected ${manifest.source?.expectedGitBlobSha}, got ${actualBlobSha}`);
  }
  const source = JSON.parse(sourceText);
  if (source?.schemaVersion !== 1 || source?.issueRef !== manifest.issueRef || source?.parentIssueRef !== 76 || source?.status !== manifest.status) {
    throw new Error(`${manifest.id}: reviewed source metadata does not match its manifest`);
  }
  if (!Array.isArray(source.items) || source.items.length !== manifest.source?.expectedItemCount) {
    throw new Error(`${manifest.id}: reviewed source expected ${manifest.source?.expectedItemCount} items, got ${source.items?.length ?? 0}`);
  }
  const seenSenseKeys = new Set();
  for (const item of source.items) {
    const lemma = normalizeLemma(item.lemma);
    const selected = String(item.sourceTrace?.selectedCandidateId ?? '').trim();
    const candidates = item.sourceTrace?.candidateIds ?? [];
    if (!lemma || item.senseKey !== selected || !Array.isArray(candidates) || !candidates.includes(selected) || item.sourceTrace?.candidateSenseCount !== candidates.length) {
      throw new Error(`${manifest.id}/${lemma || '<empty>'}: exact reviewed candidate trace is inconsistent`);
    }
    if (seenSenseKeys.has(item.senseKey)) throw new Error(`${manifest.id}/${lemma}: duplicate exact reviewed sense ${item.senseKey}`);
    seenSenseKeys.add(item.senseKey);
    const maturity = String(item.maturity ?? '');
    if (!['V1', 'V2'].includes(maturity)) throw new Error(`${manifest.id}/${lemma}: reviewed-items projection may only preserve V1/V2; got ${maturity}`);
    if ('knowledgeRef' in item || 'runtimeUsage' in item) throw new Error(`${manifest.id}/${lemma}: reviewed-items source cannot create runtime or knowledge authority`);
  }
  return normalizeRepositoryText(sourceText);
};

const validatePostCompile = () => {
  const batch3 = readJson('content/vocabulary-visuals/batches/__generated-priority-batch-003.json');
  const byLemma = new Map((batch3.items ?? []).map((item) => [normalizeLemma(item.lemma), item]));
  const relevance = readJson(relevanceReviewPath);
  for (const entry of relevance.entries ?? []) {
    const item = byLemma.get(normalizeLemma(entry.lemma));
    if (!item || item.strategy !== 'textual_only' || item.sourceTrace?.candidateSenseCount !== 1 || item.sourceTrace?.candidateIds?.[0] !== item.senseKey) throw new Error(`${entry.lemma}: relevance blocker must remain a one-candidate textual terminal disposition until human review`);
  }
};

validateAuthorityModel();
validateArtifactInventory();
validateCandidateRelevanceData();
const ledgerArg = process.argv.find((arg) => arg.startsWith('--ledger='));
const ledgerPath = ledgerArg?.slice('--ledger='.length) || defaultLedgerPath;
validateLedgerAuthority(ledgerPath);

const ledger = readJson(ledgerPath);
const priorityGapEntries = [];
const reviewedItemsEntries = [];
for (const entry of ledger.batches ?? []) {
  const manifest = readJson(entry.manifest);
  if (manifest.source?.kind === 'priority_gap') priorityGapEntries.push(entry);
  else if (manifest.source?.kind === 'reviewed_items_file') reviewedItemsEntries.push({ entry, manifest });
  else throw new Error(`${entry.id}: unsupported reviewed-batch source kind ${String(manifest.source?.kind)}`);
}

for (const { manifest } of reviewedItemsEntries) {
  if (fileExists(manifest.output.path)) unlinkSync(fileTarget(manifest.output.path));
}

const priorityLedgerPath = `content/vocabulary-visuals/__generated-priority-core-ledger-${process.pid}.json`;
writeText(priorityLedgerPath, `${JSON.stringify({ ...ledger, batches: priorityGapEntries }, null, 2)}\n`);
try {
  execFileSync(process.execPath, [coreCompilerPath, `--ledger=${priorityLedgerPath}`], { stdio: 'inherit' });
} finally {
  if (fileExists(priorityLedgerPath)) unlinkSync(fileTarget(priorityLedgerPath));
}

for (const { entry, manifest } of reviewedItemsEntries) {
  const canonicalSource = validateReviewedItemsFile(manifest);
  writeText(manifest.output.path, canonicalSource);
  console.log(`Compiled ${entry.id}: ${manifest.source.expectedItemCount} exact reviewed item(s) from immutable review data.`);
}

execFileSync(process.execPath, [gapBuilderPath], { stdio: 'inherit' });
validatePostCompile();
console.log(`Vocabulary review authority/inventory gate passed; compiled ${priorityGapEntries.length + reviewedItemsEntries.length} ledger batch(es) with source-kind isolation.`);