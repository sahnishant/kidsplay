import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../../', import.meta.url);
const coreCompilerPath = fileURLToPath(new URL('./compile-reviewed-batches-core.mjs', import.meta.url));
const defaultLedgerPath = 'content/vocabulary-visuals/review-batches/ledger.json';
const authorityModelPath = 'content/vocabulary-visuals/review-batches/authority-model.json';
const inventoryPath = 'content/vocabulary-visuals/review-batches/artifact-inventory.json';
const relevanceReviewPath = 'content/vocabulary-visuals/review-batches/candidate-relevance-review-001.json';

const fileTarget = (path) => isAbsolute(path) ? path : new URL(path, root);
const readText = (path) => readFileSync(fileTarget(path), 'utf8');
const readJson = (path) => JSON.parse(readText(path));
const fileExists = (path) => existsSync(fileTarget(path));
const normalizeLemma = (value) => String(value ?? '').toLocaleLowerCase('en-US').trim();
const gitBlobSha = (text) => createHash('sha1').update(`blob ${Buffer.byteLength(text)}\0${text}`).digest('hex');

const authorityModel = readJson(authorityModelPath);
const inventory = readJson(inventoryPath);
const authorityKinds = new Map((authorityModel.authorityKinds ?? []).map((entry) => [entry.id, entry]));
const maturityLevels = authorityModel.dimensions?.maturityLevels ?? [];
const maturityRank = new Map(maturityLevels.map((id, index) => [id, index]));
const dimensions = Object.fromEntries(Object.entries(authorityModel.dimensions ?? {}).map(([key, values]) => [key, new Set(values)]));

const authority = (id, context) => {
  const value = authorityKinds.get(id);
  if (!value) throw new Error(`${context}: unknown authority kind ${id}`);
  return value;
};
const assertDimension = (name, value, context) => {
  if (!dimensions[name]?.has(value)) throw new Error(`${context}: invalid ${name} ${String(value)}`);
};
const assertAllowed = (allowed, value, context) => {
  if (Array.isArray(allowed) && !allowed.includes(value)) throw new Error(`${context}: authority does not allow ${value}`);
};

const validateAuthorityModel = () => {
  if (authorityModel?.schemaVersion !== 1 || authorityModel?.parentIssueRef !== 76) {
    throw new Error('Vocabulary authority model must use schemaVersion 1 and parent #76');
  }
  if (authorityKinds.size !== (authorityModel.authorityKinds ?? []).length) throw new Error('Duplicate vocabulary authority kind');
  for (const key of [
    'v1AloneImpliesResolution',
    'singleCandidateAloneImpliesHumanReview',
    'senseUnresolvedCountsAsResolved',
    'semanticManifestMayGrantRuntimeAuthority',
    'terminalPolicyMayClaimHumanExactSenseReview',
    'runtimeProofMayCreateSemanticDisposition'
  ]) {
    if (authorityModel.invariants?.[key] !== false) throw new Error(`Vocabulary authority invariant ${key} must remain false`);
  }
  for (const entry of authorityKinds.values()) {
    if (!maturityRank.has(entry.maxSemanticMaturity)) throw new Error(`${entry.id}: unknown maxSemanticMaturity ${entry.maxSemanticMaturity}`);
    assertDimension('runtimeAuthorityStates', entry.runtimeAuthority, `${entry.id} authority`);
  }
};

const validateInventory = () => {
  if (inventory?.schemaVersion !== 1 || inventory?.parentIssueRef !== 76 || inventory?.authorityModel !== authorityModelPath) {
    throw new Error('Vocabulary artifact inventory must use schemaVersion 1, parent #76 and canonical authority model');
  }
  const committedBatchInventory = new Map();
  const ids = new Set();
  const orders = new Set();
  for (const entry of inventory.semanticSources ?? []) {
    if (!entry?.id || ids.has(entry.id)) throw new Error(`Duplicate/missing semantic inventory id ${entry?.id ?? '<empty>'}`);
    ids.add(entry.id);
    if (entry.order !== undefined) {
      if (!Number.isInteger(entry.order) || orders.has(entry.order)) throw new Error(`${entry.id}: duplicate/invalid inventory order ${entry.order}`);
      orders.add(entry.order);
    }
    const kind = authority(entry.authorityKind, `${entry.id} inventory`);
    if (kind.semanticReviewAuthority !== true) throw new Error(`${entry.id}: semantic source lacks semantic-review authority`);
    if (entry.path) {
      if (!fileExists(entry.path)) throw new Error(`${entry.id}: inventoried path is missing: ${entry.path}`);
      if (entry.path.startsWith('content/vocabulary-visuals/batches/') && !entry.path.includes('__generated-')) committedBatchInventory.set(entry.path, entry);
      if (entry.expectedGitBlobSha && gitBlobSha(readText(entry.path)) !== entry.expectedGitBlobSha) throw new Error(`${entry.id}: frozen historical/review source blob drift`);
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
    if (!fileExists(entry.path)) throw new Error(`${entry.id}: runtime boundary path is missing`);
    const kind = authority(entry.authorityKind, `${entry.id} runtime boundary`);
    if (entry.semanticReviewAuthority !== false || kind.semanticReviewAuthority !== false) throw new Error(`${entry.id}: runtime data cannot act as semantic-review authority`);
  }
};

const readHumanReviewedKnowledge = () => {
  const value = readJson('content/knowledge/english-vocabulary-primary-reviewed.json');
  const entries = (Array.isArray(value) ? value : [value]).flatMap((source) => source.entries ?? []);
  return new Map(entries.map((entry) => [normalizeLemma(entry.id), entry]));
};

const validateState = (kind, state, context) => {
  assertDimension('referenceStates', state.referenceState, context);
  assertDimension('resolutionStates', state.resolutionState, context);
  assertDimension('dispositionStates', state.dispositionState, context);
  assertAllowed(kind.allowedResolutionStates, state.resolutionState, `${context} resolutionState`);
  assertAllowed(kind.allowedDispositionStates, state.dispositionState, `${context} dispositionState`);
};

const validatePriorityManifest = (manifest, humanReviewedByLemma) => {
  if (manifest?.schemaVersion !== 1 || manifest?.parentIssueRef !== 76 || manifest?.source?.kind !== 'priority_gap') {
    throw new Error(`${manifest?.id ?? '<unknown>'}: priority authority core accepts priority_gap manifests only`);
  }
  const defaultKind = authority(manifest.authority?.defaultKind, `${manifest.id} default`);
  if (defaultKind.semanticReviewAuthority !== true || defaultKind.canCreateDisposition !== true || defaultKind.runtimeAuthority !== 'none') {
    throw new Error(`${manifest.id}: default authority cannot create semantic-only dispositions`);
  }
  if (manifest.authority?.runtimeAuthority !== 'none') throw new Error(`${manifest.id}: semantic manifest cannot grant runtime authority`);
  assertAllowed(defaultKind.allowedManifestStatuses, manifest.status, `${manifest.id} manifest status`);
  if (manifest.authority?.referenceState) validateState(defaultKind, manifest.authority, `${manifest.id} default authority`);
  if (defaultKind.historicalMigrationOnly && (manifest.authority?.historicalMigration !== true || !manifest.source?.expectedSemanticFingerprint || !manifest.output?.expectedItemFingerprint)) {
    throw new Error(`${manifest.id}: historical migration authority requires frozen source/output fingerprints`);
  }

  const overrideByLemma = new Map();
  for (const override of manifest.authority?.overrides ?? []) {
    const kind = authority(override.kind, `${manifest.id} override`);
    if (kind.semanticReviewAuthority !== true || kind.canCreateDisposition !== true || kind.runtimeAuthority !== 'none') throw new Error(`${manifest.id}: invalid semantic authority override ${override.kind}`);
    validateState(kind, override, `${manifest.id}/${override.kind}`);
    for (const rawLemma of override.lemmas ?? []) {
      const lemma = normalizeLemma(rawLemma);
      if (!lemma || overrideByLemma.has(lemma)) throw new Error(`${manifest.id}: duplicate/missing override lemma ${lemma || '<empty>'}`);
      overrideByLemma.set(lemma, kind);
    }
  }

  const validateRecord = (record, rawLemma) => {
    const lemma = normalizeLemma(rawLemma);
    const kind = overrideByLemma.get(lemma) ?? defaultKind;
    const maturity = record.maturity ?? manifest.defaults?.maturity ?? 'V1';
    if (!maturityRank.has(maturity) || maturityRank.get(maturity) > maturityRank.get(kind.maxSemanticMaturity)) throw new Error(`${manifest.id}/${lemma}: authority ${kind.id} cannot establish maturity ${maturity}`);
    if (Array.isArray(kind.allowedStrategies) && !kind.allowedStrategies.includes(record.strategy)) throw new Error(`${manifest.id}/${lemma}: authority ${kind.id} cannot create strategy ${record.strategy}`);
    if (kind.id === 'human_reviewed_exact_sense') {
      if (record.reviewSource !== 'human_reviewed_primary_meaning') throw new Error(`${manifest.id}/${lemma}: human authority requires human_reviewed_primary_meaning`);
      const curation = humanReviewedByLemma.get(lemma)?.meta?.curation;
      if (curation?.status !== 'reviewed' || curation?.candidateId !== record.senseKey || curation?.sourceGlossCopied !== false) throw new Error(`${manifest.id}/${lemma}: human authority does not match #51 curation evidence`);
    } else if (record.reviewSource === 'human_reviewed_primary_meaning') {
      throw new Error(`${manifest.id}/${lemma}: human review source requires human_reviewed_exact_sense authority`);
    }
  };

  for (const block of manifest.reviews ?? []) {
    if (block.type === 'group') for (const lemma of block.lemmas ?? []) validateRecord(block, lemma);
    else if (block.type === 'item') validateRecord(block, block.lemma);
    else throw new Error(`${manifest.id}: unsupported review block type ${String(block.type)}`);
  }

  if (manifest.terminalReview) {
    if (defaultKind.id !== 'approved_terminal_policy') throw new Error(`${manifest.id}: terminal review requires approved_terminal_policy authority`);
    for (const rule of manifest.terminalReview.rules ?? []) {
      validateState(defaultKind, rule, `${manifest.id} terminal rule`);
      if (!defaultKind.allowedStrategies?.includes(rule.strategy)) throw new Error(`${manifest.id}: terminal authority cannot create strategy ${rule.strategy}`);
      if (rule.resolutionState === 'blocked_unresolved' && (rule.strategy !== 'sense_unresolved' || !String(rule.senseKey).includes('unresolved'))) throw new Error(`${manifest.id}: blocked terminal rule must remain sense_unresolved`);
      if (rule.resolutionState === 'candidate_exact_terminal' && (rule.strategy !== 'textual_only' || rule.senseKey !== 'only_candidate')) throw new Error(`${manifest.id}: single-candidate terminal rule may only create textual_only from the one candidate`);
      if (rule.reviewSource === 'human_reviewed_primary_meaning') throw new Error(`${manifest.id}: terminal policy cannot claim human exact-sense review`);
    }
  }
};

const validateCandidateRelevanceData = () => {
  const review = readJson(relevanceReviewPath);
  const kind = authority(review.authorityKind, 'candidate relevance review');
  if (review?.schemaVersion !== 1 || review?.parentIssueRef !== 76 || kind.id !== 'approved_terminal_policy' || kind.canClaimHumanReview !== false || kind.runtimeAuthority !== 'none') {
    throw new Error('Candidate relevance blockers require approved_terminal_policy semantic-only authority');
  }
  const lemmas = new Set();
  for (const entry of review.entries ?? []) {
    const lemma = normalizeLemma(entry.lemma);
    if (!lemma || lemmas.has(lemma)) throw new Error(`Duplicate/missing candidate relevance lemma ${lemma || '<empty>'}`);
    if (entry.status !== 'candidate_relevance_review_required' || !String(entry.reasonCode ?? '').trim() || !String(entry.reason ?? '').trim()) throw new Error(`${lemma}: candidate relevance review requires status, reasonCode and reason`);
    lemmas.add(lemma);
  }
  if (lemmas.size !== 12) throw new Error(`Candidate relevance review must preserve 12 reviewed blockers; got ${lemmas.size}`);
};

validateAuthorityModel();
validateInventory();
validateCandidateRelevanceData();
const ledgerArg = process.argv.find((arg) => arg.startsWith('--ledger='));
const ledgerPath = ledgerArg?.slice('--ledger='.length) || defaultLedgerPath;
const ledger = readJson(ledgerPath);
const humanReviewedByLemma = readHumanReviewedKnowledge();
for (const entry of ledger.batches ?? []) {
  const manifest = readJson(entry.manifest);
  if (entry.id !== manifest.id || entry.sequence !== manifest.sequence || entry.issueRef !== manifest.issueRef) throw new Error(`${entry.id}: ledger metadata does not match priority manifest`);
  validatePriorityManifest(manifest, humanReviewedByLemma);
}

// The fingerprint core receives the exact validated priority-only ledger path.
// Do not forward process.argv wholesale and do not fall back to the canonical ledger.
execFileSync(process.execPath, [coreCompilerPath, `--ledger=${ledgerPath}`], { stdio: 'inherit' });
console.log(`Priority review authority/inventory gate passed for ${ledger.batches?.length ?? 0} manifest(s); fingerprint core used explicit ledger ${ledgerPath}.`);
