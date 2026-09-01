import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { basename } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const writeJson = (path, value) => writeFileSync(new URL(path, root), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const defaultLedgerPath = 'content/vocabulary-visuals/review-batches/ledger.json';
const gapBuilderPath = fileURLToPath(new URL('./build-priority-gap-queue.mjs', import.meta.url));
const forbiddenEditorialKeys = new Set([
  'definition', 'definitions', 'gloss', 'sourceGloss', 'example', 'examples', 'childDefinition', 'childExample',
  'profileRef', 'profileRefs', 'curriculumRef', 'curriculumRefs'
]);

const normalizeLemma = (value) => String(value ?? '').toLocaleLowerCase('en-US').trim();
const requiredString = (value, label) => {
  const result = String(value ?? '').trim();
  if (!result) throw new Error(`Review-batch factory requires ${label}`);
  return result;
};

const stableValue = (value) => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
};

export const stableJson = (value) => JSON.stringify(stableValue(value));
export const sha256 = (value) => createHash('sha256').update(value).digest('hex');

export const semanticFingerprintForQueue = (queue) => sha256(stableJson((queue.items ?? []).map((item) => ({
  lemma: item.lemma,
  partOfSpeech: item.partOfSpeech,
  grade: item.grade,
  sourceCorpusId: item.sourceCorpusId,
  candidateSenseCount: item.candidateSenseCount,
  candidateIds: item.candidateIds,
  polysemyRisk: item.polysemyRisk
}))));

export const itemFingerprint = (items) => sha256(stableJson(items));

export const assertSourceQueueMatchesManifest = (manifest, sourceQueue) => {
  const fingerprint = semanticFingerprintForQueue(sourceQueue);
  if (sourceQueue.items?.length !== manifest.source?.expectedItemCount || fingerprint !== manifest.source?.expectedSemanticFingerprint) {
    throw new Error(`${manifest.id}: stale source queue; expected ${manifest.source?.expectedItemCount}/${manifest.source?.expectedSemanticFingerprint}, got ${sourceQueue.items?.length}/${fingerprint}`);
  }
  return fingerprint;
};

const assertNoEditorialPayload = (value, path = '<root>') => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoEditorialPayload(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenEditorialKeys.has(key)) throw new Error(`${path}: reviewed visual manifests may not contain ${key}`);
    assertNoEditorialPayload(nested, `${path}.${key}`);
  }
};

const substituteLemma = (value, lemma) => {
  if (Array.isArray(value)) return value.map((item) => substituteLemma(item, lemma));
  if (!value || typeof value !== 'object') return value === '$lemma' ? lemma : value;
  return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, substituteLemma(nested, lemma)]));
};

const expandReviews = (manifest, sourceQueue) => {
  const sourceByLemma = new Map((sourceQueue.items ?? []).map((item) => [normalizeLemma(item.lemma), item]));
  const defaults = manifest.defaults ?? {};
  const expanded = [];

  const addReviewedItem = (record, blockLabel) => {
    const lemma = normalizeLemma(record.lemma);
    if (!lemma) throw new Error(`${manifest.id}/${blockLabel}: reviewed item requires lemma`);
    const source = sourceByLemma.get(lemma);
    const reviewSource = record.reviewSource ?? defaults.reviewSource ?? 'single_candidate_priority_gap';
    let senseKey = String(record.senseKey ?? '').trim();
    let partOfSpeech = String(record.partOfSpeech ?? '').trim();

    if (reviewSource === 'human_reviewed_primary_meaning') {
      if (!senseKey || !partOfSpeech) throw new Error(`${manifest.id}/${lemma}: human-reviewed item requires explicit senseKey and partOfSpeech`);
    } else {
      if (!source) throw new Error(`${manifest.id}/${lemma}: reviewed item is absent from its frozen source queue`);
      if (!senseKey) {
        if (source.candidateSenseCount !== 1 || source.candidateIds?.length !== 1 || source.polysemyRisk !== 'low') {
          throw new Error(`${manifest.id}/${lemma}: implicit exact sense requires one pinned low-risk candidate`);
        }
        senseKey = String(source.candidateIds[0]);
      }
      if (!partOfSpeech) partOfSpeech = String(source.partOfSpeech ?? '').trim();
    }

    if (!senseKey.startsWith(`${lemma}#`)) throw new Error(`${manifest.id}/${lemma}: bare-lemma or cross-lemma sense mapping is forbidden (${senseKey})`);
    const strategy = requiredString(record.strategy, `${manifest.id}/${lemma} strategy`);
    const item = {
      lemma,
      senseKey,
      partOfSpeech: requiredString(partOfSpeech, `${manifest.id}/${lemma} partOfSpeech`),
      strategy,
      maturity: record.maturity ?? defaults.maturity ?? 'V1',
      motionPolicy: record.motionPolicy ?? defaults.motionPolicy ?? 'none',
      answerSafety: record.answerSafety ?? defaults.answerSafety ?? 'post_answer_only',
      reviewSource
    };
    if (record.sceneTemplate) item.sceneTemplate = record.sceneTemplate;
    if (record.parameters) item.parameters = substituteLemma(record.parameters, lemma);
    expanded.push({ item, source, runtimeProofCandidate: record.runtimeProofCandidate === true });
  };

  for (const [index, block] of (manifest.reviews ?? []).entries()) {
    if (block?.type === 'group') {
      const lemmas = block.lemmas ?? [];
      if (!Array.isArray(lemmas) || !lemmas.length) throw new Error(`${manifest.id}/reviews[${index}]: group requires lemmas`);
      for (const lemma of lemmas) {
        const parameters = block.parametersByLemma?.[lemma] ?? block.parameters;
        addReviewedItem({ ...block, lemma, parameters }, `reviews[${index}]`);
      }
    } else if (block?.type === 'item') {
      addReviewedItem(block, `reviews[${index}]`);
    } else {
      throw new Error(`${manifest.id}/reviews[${index}]: unsupported review block type ${String(block?.type)}`);
    }
  }

  if (manifest.terminalReview) {
    if (!manifest.terminalReview.coverEntireSource) throw new Error(`${manifest.id}: terminalReview must explicitly cover the entire frozen source`);
    for (const source of sourceQueue.items ?? []) {
      const matches = (manifest.terminalReview.rules ?? []).filter((rule) => {
        const when = rule.when ?? {};
        if (when.candidateSenseCount !== undefined && source.candidateSenseCount !== when.candidateSenseCount) return false;
        if (when.candidateSenseCountMin !== undefined && source.candidateSenseCount < when.candidateSenseCountMin) return false;
        if (when.candidateSenseCountMax !== undefined && source.candidateSenseCount > when.candidateSenseCountMax) return false;
        return true;
      });
      if (matches.length !== 1) throw new Error(`${manifest.id}/${source.lemma}: terminal review requires exactly one matching disposition rule; got ${matches.length}`);
      const rule = matches[0];
      const lemma = normalizeLemma(source.lemma);
      const senseKey = rule.senseKey === 'only_candidate'
        ? (source.candidateSenseCount === 1 && source.candidateIds?.length === 1 ? source.candidateIds[0] : '')
        : String(rule.senseKey ?? '').replaceAll('$lemma', lemma);
      const item = {
        lemma,
        senseKey,
        partOfSpeech: source.partOfSpeech,
        strategy: rule.strategy,
        maturity: rule.maturity ?? manifest.defaults?.maturity ?? 'V1',
        motionPolicy: rule.motionPolicy ?? manifest.defaults?.motionPolicy ?? 'none',
        answerSafety: rule.answerSafety,
        reviewSource: rule.reviewSource,
        sourceTrace: {
          sourceCorpusId: source.sourceCorpusId,
          grade: source.grade,
          candidateSenseCount: source.candidateSenseCount,
          candidateIds: source.candidateIds,
          polysemyRisk: source.polysemyRisk
        }
      };
      if (!item.senseKey?.startsWith(`${lemma}#`)) throw new Error(`${manifest.id}/${lemma}: terminal disposition produced invalid sense ${item.senseKey}`);
      if (item.strategy === 'textual_only') {
        if (source.candidateSenseCount !== 1 || source.candidateIds?.[0] !== item.senseKey) {
          throw new Error(`${manifest.id}/${lemma}: terminal textual_only requires its one exact pinned candidate`);
        }
      } else if (item.strategy === 'sense_unresolved') {
        if (source.candidateSenseCount < 2 || item.senseKey !== `${lemma}#unresolved`) {
          throw new Error(`${manifest.id}/${lemma}: polysemy must remain an unresolved lemma-scoped disposition`);
        }
      } else {
        throw new Error(`${manifest.id}/${lemma}: terminal review may only produce textual_only or sense_unresolved`);
      }
      expanded.push({ item, source, runtimeProofCandidate: false });
    }
  }

  return expanded;
};

const readHumanReviewedKnowledge = () => {
  const reviewedKnowledge = readJson('content/knowledge/english-vocabulary-primary-reviewed.json');
  const entries = (Array.isArray(reviewedKnowledge) ? reviewedKnowledge : [reviewedKnowledge]).flatMap((source) => source.entries ?? []);
  return new Map(entries.map((entry) => [normalizeLemma(entry.id), entry]));
};

const validateReviewedItems = (manifest, expanded, humanReviewedByLemma, seenLemmas, seenSenseKeys) => {
  const localLemmas = new Set();
  const localSenseKeys = new Set();
  for (const { item, source } of expanded) {
    const label = `${manifest.id}/${item.lemma}`;
    assertNoEditorialPayload(item, label);
    if (item.maturity !== 'V1') throw new Error(`${label}: reviewed manifest compilation may only establish V1`);
    const isHumanReviewedSense = item.reviewSource === 'human_reviewed_primary_meaning';
    if (isHumanReviewedSense) {
      const curation = humanReviewedByLemma.get(item.lemma)?.meta?.curation;
      if (curation?.status !== 'reviewed' || curation?.candidateId !== item.senseKey || curation?.sourceGlossCopied !== false) {
        throw new Error(`${label}: #51 reviewed sense evidence does not match ${item.senseKey}`);
      }
      if (source?.candidateIds?.length && !source.candidateIds.includes(item.senseKey)) {
        throw new Error(`${label}: #51 sense ${item.senseKey} is absent from the pinned source candidate set`);
      }
    } else if (item.reviewSource === 'single_candidate_priority_gap') {
      if (!source || source.polysemyRisk !== 'low' || source.candidateSenseCount !== 1 || source.candidateIds?.[0] !== item.senseKey) {
        throw new Error(`${label}: single-candidate reviewed strategy no longer matches its frozen source basis`);
      }
    }
    if (localLemmas.has(item.lemma)) throw new Error(`${label}: duplicate lemma inside one reviewed batch`);
    if (seenLemmas.has(item.lemma) && !isHumanReviewedSense) throw new Error(`${label}: duplicate reviewed lemma across batch history`);
    if (localSenseKeys.has(item.senseKey) || seenSenseKeys.has(item.senseKey)) throw new Error(`${label}: duplicate reviewed sense across batch history`);
    localLemmas.add(item.lemma);
    localSenseKeys.add(item.senseKey);
  }
  for (const lemma of localLemmas) seenLemmas.add(lemma);
  for (const senseKey of localSenseKeys) seenSenseKeys.add(senseKey);
};

const deriveSummary = (expanded) => {
  const items = expanded.map(({ item }) => item);
  return {
    items: items.length,
    sceneGrammarItems: items.filter((item) => Boolean(item.sceneTemplate)).length,
    textualOnlyItems: items.filter((item) => item.strategy === 'textual_only').length,
    humanReviewedSenseItems: items.filter((item) => item.reviewSource === 'human_reviewed_primary_meaning').length,
    runtimeProofCandidates: expanded.filter((entry) => entry.runtimeProofCandidate).length,
    directVisualItems: items.filter((item) => item.strategy === 'direct_entity').length,
    newAssetBlockers: 0,
    exactSingleCandidateTextualOnly: items.filter((item) => item.reviewSource === 'single_candidate_terminal_text_only').length,
    polysemyUnresolved: items.filter((item) => item.reviewSource === 'polysemy_terminal_unresolved').length,
    missingCandidateUnresolved: items.filter((item) => item.reviewSource === 'missing_candidate_terminal_unresolved').length,
    sceneStrategyItems: items.filter((item) => Boolean(item.sceneTemplate)).length,
    runtimeMappings: 0
  };
};

export const validateLedgerShape = (ledger, manifests) => {
  if (ledger?.schemaVersion !== 1 || ledger?.parentIssueRef !== 76 || ledger?.generatedFilePolicy !== 'rebuild_and_ignore') {
    throw new Error('Vocabulary review-batch ledger must use schemaVersion 1, parent #76 and rebuild_and_ignore generated policy');
  }
  if (!Array.isArray(ledger.batches) || !ledger.batches.length) throw new Error('Vocabulary review-batch ledger must contain at least one batch');
  const ids = new Set();
  const sequences = new Set();
  const issues = new Set();
  const manifestPaths = new Set();
  const outputs = new Set();
  for (const entry of ledger.batches) {
    const manifest = manifests.get(entry.manifest);
    if (!manifest) throw new Error(`${entry.id}: ledger manifest ${entry.manifest} is missing`);
    if (entry.id !== manifest.id || entry.sequence !== manifest.sequence || entry.issueRef !== manifest.issueRef || manifest.parentIssueRef !== 76) {
      throw new Error(`${entry.id}: ledger metadata does not match its manifest`);
    }
    if (ids.has(entry.id)) throw new Error(`Duplicate review batch id ${entry.id}`);
    if (sequences.has(entry.sequence)) throw new Error(`Duplicate review batch sequence ${entry.sequence}`);
    if (issues.has(entry.issueRef)) throw new Error(`Duplicate review batch issueRef ${entry.issueRef}`);
    if (manifestPaths.has(entry.manifest)) throw new Error(`Duplicate review manifest path ${entry.manifest}`);
    if (outputs.has(manifest.output?.path)) throw new Error(`Duplicate review batch output ${manifest.output?.path}`);
    ids.add(entry.id);
    sequences.add(entry.sequence);
    issues.add(entry.issueRef);
    manifestPaths.add(entry.manifest);
    outputs.add(manifest.output?.path);
  }
};

const baselineReviewedSets = (generatedOutputNames) => {
  const lemmas = new Set();
  const senseKeys = new Set();
  for (const name of readdirSync(new URL('content/vocabulary-visuals/batches/', root)).filter((name) => name.endsWith('.json')).sort()) {
    if (generatedOutputNames.has(name) || name.startsWith('__generated-')) continue;
    const batch = readJson(`content/vocabulary-visuals/batches/${name}`);
    for (const item of batch.items ?? []) {
      const lemma = normalizeLemma(item.lemma);
      const senseKey = String(item.senseKey ?? '').trim();
      if (lemma) lemmas.add(lemma);
      if (senseKey) senseKeys.add(senseKey);
    }
  }
  return { lemmas, senseKeys };
};

export const compileReviewedBatches = ({ ledgerPath = defaultLedgerPath } = {}) => {
  const ledger = readJson(ledgerPath);
  const manifests = new Map((ledger.batches ?? []).map((entry) => [entry.manifest, readJson(entry.manifest)]));
  validateLedgerShape(ledger, manifests);
  const ordered = [...ledger.batches].sort((left, right) => left.sequence - right.sequence || left.id.localeCompare(right.id));
  const generatedOutputNames = new Set(ordered.map((entry) => basename(manifests.get(entry.manifest).output.path)));
  const { lemmas: seenLemmas, senseKeys: seenSenseKeys } = baselineReviewedSets(generatedOutputNames);
  const humanReviewedByLemma = readHumanReviewedKnowledge();
  const results = [];

  for (const [index, entry] of ordered.entries()) {
    const manifest = manifests.get(entry.manifest);
    assertNoEditorialPayload(manifest, manifest.id);
    const laterOutputNames = ordered.slice(index).map((candidate) => basename(manifests.get(candidate.manifest).output.path));
    execFileSync(process.execPath, [gapBuilderPath, ...laterOutputNames.map((name) => `--exclude-batch=${name}`)], { stdio: 'inherit' });
    const sourceQueue = readJson('content/vocabulary-visuals/__generated-priority-gap.json');
    const sourceFingerprint = assertSourceQueueMatchesManifest(manifest, sourceQueue);

    const snapshot = {
      ...sourceQueue,
      issueRef: manifest.issueRef,
      ...(manifest.source?.sourceQueueIssueRef ? { sourceQueueIssueRef: manifest.source.sourceQueueIssueRef } : {}),
      parentIssueRef: 76,
      status: manifest.source.snapshotStatus,
      generatedFrom: {
        ...sourceQueue.generatedFrom,
        reviewBatchId: manifest.id,
        sourceSemanticFingerprint: sourceFingerprint
      }
    };
    writeJson(manifest.source.snapshotPath, snapshot);

    const expanded = expandReviews(manifest, sourceQueue);
    validateReviewedItems(manifest, expanded, humanReviewedByLemma, seenLemmas, seenSenseKeys);
    const items = expanded.map(({ item }) => item);
    const fingerprint = itemFingerprint(items);
    if (fingerprint !== manifest.output?.expectedItemFingerprint) {
      throw new Error(`${manifest.id}: historical reviewed-item fingerprint drift; expected ${manifest.output?.expectedItemFingerprint}, got ${fingerprint}`);
    }
    const summary = deriveSummary(expanded);
    const output = {
      schemaVersion: 1,
      id: manifest.output.outputId,
      issueRef: manifest.issueRef,
      parentIssueRef: 76,
      status: manifest.status,
      ...(manifest.reviewBasis ? { reviewBasis: manifest.reviewBasis } : {}),
      policy: manifest.policy,
      summary,
      items
    };
    writeJson(manifest.output.path, output);
    results.push({ id: manifest.id, sourceItems: sourceQueue.items.length, sourceFingerprint, itemFingerprint: fingerprint, summary });
    console.log(`Compiled ${manifest.id}: ${items.length} reviewed disposition(s); source fingerprint ${sourceFingerprint}; item fingerprint ${fingerprint}.`);
  }

  execFileSync(process.execPath, [gapBuilderPath], { stdio: 'inherit' });
  return results;
};

const ledgerArg = process.argv.find((arg) => arg.startsWith('--ledger='));
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const results = compileReviewedBatches({ ledgerPath: ledgerArg?.slice('--ledger='.length) || defaultLedgerPath });
  console.log(`Generic vocabulary review-batch factory compiled ${results.length} batch(es) in ledger order.`);
}
