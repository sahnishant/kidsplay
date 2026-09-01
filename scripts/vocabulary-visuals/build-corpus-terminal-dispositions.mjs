import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const batchOutputUrl = new URL('content/vocabulary-visuals/batches/__generated-corpus-terminal-dispositions.json', root);
const priorityQueueOutputUrl = new URL('content/vocabulary-visuals/__generated-priority-sense-resolution-queue.json', root);
const corpusQueueOutputUrl = new URL('content/vocabulary-visuals/__generated-corpus-sense-resolution-queue.json', root);
const ownBatchName = '__generated-corpus-terminal-dispositions.json';
const relevanceReviewPath = 'content/vocabulary-visuals/review-batches/candidate-relevance-review-001.json';
const reviewLedgerPath = 'content/vocabulary-visuals/review-batches/ledger.json';

const corpus = readJson('content/lexicon/open/primary-grade-corpus.json');
const corpusByLemma = new Map((corpus.entries ?? []).map((entry) => [entry.lemma, entry]));
const meaningQueueLemmas = new Set();
const candidateIdsByLemma = new Map();
for (let grade = 1; grade <= 6; grade += 1) {
  const review = readJson(`content/lexicon/open/sense-review/grade-${grade}-introduced-meaning-oewn.json`);
  for (const candidate of review.candidates ?? []) {
    meaningQueueLemmas.add(candidate.lemma);
    const values = candidateIdsByLemma.get(candidate.lemma) ?? [];
    values.push(candidate.candidateId);
    candidateIdsByLemma.set(candidate.lemma, values);
  }
  for (const missing of review.missing ?? []) meaningQueueLemmas.add(missing.lemma);
}

const batchNames = readdirSync(new URL('content/vocabulary-visuals/batches/', root))
  .filter((name) => name.endsWith('.json') && name !== ownBatchName)
  .sort();
const itemsByLemma = new Map();
for (const name of batchNames) {
  const batch = readJson(`content/vocabulary-visuals/batches/${name}`);
  for (const item of batch.items ?? []) {
    const values = itemsByLemma.get(item.lemma) ?? [];
    values.push({ ...item, batch: name });
    itemsByLemma.set(item.lemma, values);
  }
}

const reviewLedger = readJson(reviewLedgerPath);
const exactReviewedLemmas = new Set();
for (const entry of reviewLedger.batches ?? []) {
  const manifest = readJson(entry.manifest);
  if (manifest.source?.kind !== 'reviewed_items_file') continue;
  const outputPath = String(manifest.output?.path ?? '').trim();
  if (!outputPath || !existsSync(new URL(outputPath, root))) {
    throw new Error(`${entry.id}: exact-review projection is missing; run compile:vocabulary-visual-batches before Phase C accounting`);
  }
  const projection = readJson(outputPath);
  if (projection?.status !== manifest.status || !Array.isArray(projection?.items)) {
    throw new Error(`${entry.id}: exact-review projection does not match its manifest authority/status`);
  }
  for (const item of projection.items) {
    if (item?.strategy === 'sense_unresolved') throw new Error(`${entry.id}/${item?.lemma ?? '<unknown>'}: exact-review projection cannot remain sense_unresolved`);
    if (item?.lemma) exactReviewedLemmas.add(String(item.lemma));
  }
}

const relevanceReview = readJson(relevanceReviewPath);
if (relevanceReview?.schemaVersion !== 1 || relevanceReview?.parentIssueRef !== 76 || relevanceReview?.authorityKind !== 'approved_terminal_policy') {
  throw new Error('Phase C candidate-relevance review must use schemaVersion 1, parent #76 and approved_terminal_policy authority');
}
if (relevanceReview?.policy?.selectsSense !== false || relevanceReview?.policy?.claimsHumanExactSenseReview !== false || relevanceReview?.policy?.createsRuntimeAuthority !== false) {
  throw new Error('Phase C candidate-relevance review must remain reference/blocker data only');
}
const relevanceByLemma = new Map();
for (const entry of relevanceReview.entries ?? []) {
  const lemma = String(entry?.lemma ?? '').trim();
  const reason = String(entry?.reason ?? '').trim();
  const reasonCode = String(entry?.reasonCode ?? '').trim();
  if (!lemma || relevanceByLemma.has(lemma)) throw new Error(`Duplicate/missing candidate-relevance lemma ${lemma || '<empty>'}`);
  if (entry?.status !== 'candidate_relevance_review_required' || !reason || !reasonCode) {
    throw new Error(`${lemma}: candidate-relevance blocker requires status, reasonCode and reason`);
  }
  relevanceByLemma.set(lemma, entry);
}

const riskFor = (candidateCount) => candidateCount === 0 ? 'unresolved'
  : candidateCount === 1 ? 'candidate_relevance'
    : candidateCount === 2 ? 'medium' : 'high';
const priorityResolutionItems = [];
for (const lemma of meaningQueueLemmas) {
  if (exactReviewedLemmas.has(lemma)) continue;
  const corpusEntry = corpusByLemma.get(lemma);
  const dispositions = itemsByLemma.get(lemma) ?? [];
  const unresolved = dispositions.find((item) => item.strategy === 'sense_unresolved');
  const relevanceReviewEntry = relevanceByLemma.get(lemma);
  const relevanceBlocked = Boolean(relevanceReviewEntry);
  if (!unresolved && !relevanceBlocked) continue;

  const disposition = unresolved ?? dispositions.find((item) => item.sourceTrace?.candidateSenseCount === 1);
  if (!corpusEntry || !disposition) throw new Error(`${lemma}: priority blocker lacks corpus/disposition trace`);
  const candidateIds = [...new Set(disposition.sourceTrace?.candidateIds ?? candidateIdsByLemma.get(lemma) ?? [])].sort();
  priorityResolutionItems.push({
    lemma,
    partOfSpeech: corpusEntry.partOfSpeech,
    grade: corpusEntry.grade,
    sourceCorpusId: corpusEntry.id,
    candidateSenseCount: candidateIds.length,
    candidateIds,
    polysemyRisk: relevanceBlocked && !unresolved ? 'candidate_relevance' :
      (disposition.sourceTrace?.polysemyRisk ?? riskFor(candidateIds.length)),
    terminalDispositionSenseKey: disposition.senseKey,
    terminalStrategy: disposition.strategy,
    status: relevanceBlocked && !unresolved ? 'candidate_relevance_review_required' : 'human_sense_selection_required',
    ...(relevanceBlocked ? {
      candidateRelevanceReasonCode: relevanceReviewEntry.reasonCode,
      candidateRelevanceReason: relevanceReviewEntry.reason,
      candidateRelevanceReviewSource: relevanceReviewPath
    } : {})
  });
}
priorityResolutionItems.sort((left, right) =>
  left.grade - right.grade ||
  (corpusByLemma.get(left.lemma)?.gradeBandEvidence?.rank ?? Number.MAX_SAFE_INTEGER) -
    (corpusByLemma.get(right.lemma)?.gradeBandEvidence?.rank ?? Number.MAX_SAFE_INTEGER) ||
  left.lemma.localeCompare(right.lemma)
);

const alreadyDispositioned = new Set(itemsByLemma.keys());
const remaining = (corpus.entries ?? []).filter((entry) => !alreadyDispositioned.has(entry.lemma));
const previouslyDispositionedLemmas = corpus.entries.length - remaining.length;
const items = remaining.map((entry) => ({
  lemma: entry.lemma,
  senseKey: `${entry.lemma}#corpus-sense-unresolved`,
  partOfSpeech: entry.partOfSpeech,
  strategy: 'sense_unresolved',
  maturity: 'V1',
  motionPolicy: 'none',
  answerSafety: 'explanation_only',
  reviewSource: 'full_corpus_terminal_accounting',
  reviewDisposition: 'sense_candidate_or_human_selection_required'
}));
if (new Set(items.map((item) => item.lemma)).size !== items.length) throw new Error('Corpus terminal batch contains duplicate lemmas');
if (previouslyDispositionedLemmas + items.length !== corpus.entries.length) {
  throw new Error(`Corpus terminal accounting mismatch: ${previouslyDispositionedLemmas} existing + ${items.length} new != ${corpus.entries.length}`);
}

const corpusQueueItems = remaining.map((entry) => ({
  lemma: entry.lemma,
  partOfSpeech: entry.partOfSpeech,
  grade: entry.grade,
  sourceGrade: entry.sourceGrade ?? null,
  sourceCorpusId: entry.id,
  reviewStatus: entry.reviewStatus,
  zipf: entry.frequency?.zipf ?? null,
  priorityRank: entry.gradeBandEvidence?.rank ?? null,
  corpusProvenance: entry.provenance ?? null,
  terminalDispositionSenseKey: `${entry.lemma}#corpus-sense-unresolved`,
  status: 'sense_candidate_or_human_selection_required'
}));

const commonPolicy = {
  bareLemmaMappingAllowed: false,
  definitionsIncluded: false,
  sourceGlossesIncluded: false,
  profilePlacementInferred: false,
  assessmentAnswerRevealAllowed: false,
  runtimeMappingCreated: false,
  childDefinitionApprovalInferred: false
};
writeFileSync(batchOutputUrl, `${JSON.stringify({
  schemaVersion: 1,
  id: 'vocabulary.visual-strategy.full-corpus-terminal-dispositions',
  issueRef: 76,
  status: 'sense_resolution_required',
  reviewBasis: {
    corpus: 'content/lexicon/open/primary-grade-corpus.json',
    candidateRelevanceReview: relevanceReviewPath,
    exactReviewLedger: reviewLedgerPath,
    rule: 'Every corpus lemma not already covered by a reviewed strategy receives an explicit fail-closed disposition. Later exact reviewed senses supersede active blocker status for the same lemma without deleting the historical unresolved record.'
  },
  policy: commonPolicy,
  summary: {
    corpusLemmas: corpus.entries.length,
    previouslyDispositionedLemmas,
    exactReviewedSupersedingLemmas: exactReviewedLemmas.size,
    senseUnresolvedItems: items.length,
    finalTerminalDispositionLemmas: previouslyDispositionedLemmas + items.length
  },
  items
}, null, 2)}\n`, 'utf8');

const countBy = (values, key) => values.reduce((counts, item) => {
  const value = String(item[key]);
  counts[value] = (counts[value] ?? 0) + 1;
  return counts;
}, {});
writeFileSync(priorityQueueOutputUrl, `${JSON.stringify({
  schemaVersion: 1,
  issueRef: 76,
  status: 'human_sense_selection_queue',
  reviewBasis: { candidateRelevanceReview: relevanceReviewPath, exactReviewLedger: reviewLedgerPath },
  policy: {
    candidateIdsAreReferenceOnly: true,
    selectsSense: false,
    createsVisualStrategy: false,
    importsGlossOrExample: false,
    unresolvedItemsRemainReportVisible: true
  },
  summary: {
    items: priorityResolutionItems.length,
    exactReviewedSupersededBlockers: exactReviewedLemmas.size,
    byRisk: countBy(priorityResolutionItems, 'polysemyRisk'),
    byStatus: countBy(priorityResolutionItems, 'status')
  },
  items: priorityResolutionItems
}, null, 2)}\n`, 'utf8');

writeFileSync(corpusQueueOutputUrl, `${JSON.stringify({
  schemaVersion: 1,
  issueRef: 76,
  status: 'corpus_sense_resolution_queue',
  policy: {
    createsSenseSelection: false,
    createsVisualStrategy: false,
    importsGlossOrExample: false,
    unresolvedItemsRemainReportVisible: true,
    priorityQueueRemainsSeparate: true
  },
  summary: { items: corpusQueueItems.length, byReviewStatus: countBy(corpusQueueItems, 'reviewStatus') },
  items: corpusQueueItems
}, null, 2)}\n`, 'utf8');

console.log(
  `Built #76 Phase C terminal accounting: ${previouslyDispositionedLemmas} existing + ${items.length} blocker(s) = ` +
  `${corpus.entries.length}/${corpus.entries.length}; exact reviewed supersessions ${exactReviewedLemmas.size}; priority resolution queue ${priorityResolutionItems.length}.`
);
