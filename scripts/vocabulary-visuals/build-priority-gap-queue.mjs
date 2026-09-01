import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const currentOutputUrl = new URL('content/vocabulary-visuals/__generated-priority-gap.json', root);
const preBatchOutputUrl = new URL('content/vocabulary-visuals/__generated-priority-gap-pre-batch-002.json', root);
const excludeBatchArg = process.argv.find((arg) => arg.startsWith('--exclude-batch='));
const excludedBatchName = excludeBatchArg?.slice('--exclude-batch='.length).trim() || null;

const corpus = readJson('content/lexicon/open/primary-grade-corpus.json');
const corpusByLemma = new Map((corpus.entries ?? []).map((entry) => [String(entry.lemma), entry]));
const allBatchNames = readdirSync(new URL('content/vocabulary-visuals/batches/', root))
  .filter((name) => name.endsWith('.json'))
  .sort();
const preBatchNames = allBatchNames.filter((name) => !name.startsWith('__generated-'));
const currentBatchNames = excludedBatchName
  ? allBatchNames.filter((name) => name !== excludedBatchName)
  : allBatchNames;

const senseCandidatesByLemma = new Map();
for (let grade = 1; grade <= 6; grade += 1) {
  const review = readJson(`content/lexicon/open/sense-review/grade-${grade}-introduced-meaning-oewn.json`);
  for (const candidate of review.candidates ?? []) {
    const lemma = String(candidate?.lemma ?? '').toLocaleLowerCase('en-US').trim();
    const candidateId = String(candidate?.candidateId ?? '').trim();
    if (!lemma || !candidateId) continue;
    const existing = senseCandidatesByLemma.get(lemma) ?? [];
    existing.push(candidateId);
    senseCandidatesByLemma.set(lemma, existing);
  }
}
for (const [lemma, candidateIds] of senseCandidatesByLemma) {
  senseCandidatesByLemma.set(lemma, [...new Set(candidateIds)].sort());
}

const templateCandidatesForPos = (partOfSpeech) => {
  switch (partOfSpeech) {
    case 'noun': return ['direct_entity', 'place_scene', 'person_role', 'part_whole', 'comparison_scene'];
    case 'verb': return ['action_scene', 'cause_effect', 'process_scene', 'sequence_scene'];
    case 'adjective': return ['attribute_contrast', 'state_scene', 'expression_scene', 'comparison_scene'];
    case 'adverb': return ['sequence_scene', 'attribute_contrast', 'state_scene'];
    default: return ['symbolic', 'textual_only'];
  }
};

const familyForPos = (partOfSpeech) => {
  switch (partOfSpeech) {
    case 'noun': return 'entity_place_person_or_part_review';
    case 'verb': return 'action_process_or_cause_review';
    case 'adjective': return 'attribute_state_or_expression_review';
    case 'adverb': return 'manner_time_or_degree_review';
    default: return 'semantic_review_required';
  }
};

const motionPotentialForPos = (partOfSpeech) => {
  if (partOfSpeech === 'verb') return 'high';
  if (partOfSpeech === 'adverb' || partOfSpeech === 'adjective') return 'medium';
  return 'low';
};

const polysemyRiskFor = (candidateCount) => {
  if (candidateCount === 0) return 'unresolved';
  if (candidateCount === 1) return 'low';
  if (candidateCount === 2) return 'medium';
  return 'high';
};

const reviewScoreFor = (entry, candidateCount) => {
  const zipf = Number(entry?.sourceZipf ?? entry?.frequency?.zipf ?? 0);
  const rank = Number(entry?.priorityRank ?? entry?.gradeBandEvidence?.rank ?? 99999);
  const grade = Number(entry?.sourceGrade ?? entry?.grade ?? 6);
  const posBonus = entry?.partOfSpeech === 'verb' ? 5
    : entry?.partOfSpeech === 'noun' ? 4
      : entry?.partOfSpeech === 'adjective' ? 3
        : entry?.partOfSpeech === 'adverb' ? 1 : 0;
  const sensePenalty = Math.max(0, candidateCount - 1) * 1.25;
  return Number((zipf * 10 + (7 - grade) * 3 + posBonus - Math.log10(Math.max(1, rank)) - sensePenalty).toFixed(3));
};

const auditedSetsFor = (batchNames) => {
  const lemmas = new Set();
  const senseKeys = new Set();
  for (const name of batchNames) {
    const batch = readJson(`content/vocabulary-visuals/batches/${name}`);
    for (const item of batch.items ?? []) {
      const lemma = String(item?.lemma ?? '').toLocaleLowerCase('en-US').trim();
      const senseKey = String(item?.senseKey ?? '').trim();
      if (lemma) lemmas.add(lemma);
      if (senseKey) senseKeys.add(senseKey);
    }
  }
  return { lemmas, senseKeys };
};

const buildQueue = (batchNames, status) => {
  const { lemmas: auditedLemmas, senseKeys: auditedSenseKeys } = auditedSetsFor(batchNames);
  const priorityByLemma = new Map();
  for (let grade = 1; grade <= 6; grade += 1) {
    const wordlist = readJson(`content/lexicon/open/review-wordlists/grade-${grade}-introduced-meaning.json`);
    for (const rawItem of wordlist.items ?? []) {
      const lemma = String(rawItem?.lemma ?? '').toLocaleLowerCase('en-US').trim();
      if (!lemma || auditedLemmas.has(lemma)) continue;
      const corpusEntry = corpusByLemma.get(lemma);
      if (!corpusEntry) throw new Error(`Priority visual gap candidate ${lemma} is missing from the 10,000-word corpus`);
      const candidateIds = senseCandidatesByLemma.get(lemma) ?? [];
      const item = {
        lemma,
        partOfSpeech: rawItem.partOfSpeech ?? corpusEntry.partOfSpeech,
        grade: rawItem.sourceGrade ?? corpusEntry.grade,
        upstreamSourceGrade: rawItem.upstreamSourceGrade ?? corpusEntry.sourceGrade ?? null,
        sourceCorpusId: rawItem.sourceCorpusId ?? corpusEntry.id,
        zipf: rawItem.sourceZipf ?? corpusEntry.frequency?.zipf ?? null,
        priorityRank: rawItem.priorityRank ?? corpusEntry.gradeBandEvidence?.rank ?? null,
        priorityScore: rawItem.priorityScore ?? null,
        reviewStatus: rawItem.reviewStatus ?? corpusEntry.reviewStatus ?? null,
        corpusProvenance: rawItem.provenance ?? corpusEntry.provenance ?? null,
        candidateSenseCount: candidateIds.length,
        candidateIds,
        polysemyRisk: polysemyRiskFor(candidateIds.length),
        likelyVisualFamily: familyForPos(rawItem.partOfSpeech ?? corpusEntry.partOfSpeech),
        existingStrategyCandidates: templateCandidatesForPos(rawItem.partOfSpeech ?? corpusEntry.partOfSpeech),
        motionPotential: motionPotentialForPos(rawItem.partOfSpeech ?? corpusEntry.partOfSpeech),
        visualReviewScore: reviewScoreFor(rawItem, candidateIds.length),
        status: 'candidate_only_not_v1',
        policy: {
          senseApproved: false,
          visualStrategyApproved: false,
          profilePlacementInferred: false,
          childDefinitionImported: false
        }
      };
      const existing = priorityByLemma.get(lemma);
      if (!existing || item.visualReviewScore > existing.visualReviewScore ||
        (item.visualReviewScore === existing.visualReviewScore && Number(item.grade) < Number(existing.grade))) {
        priorityByLemma.set(lemma, item);
      }
    }
  }

  const queue = [...priorityByLemma.values()].sort((left, right) =>
    right.visualReviewScore - left.visualReviewScore || Number(left.grade) - Number(right.grade) || String(left.lemma).localeCompare(String(right.lemma))
  );
  const byPos = {};
  const byRisk = {};
  const byGrade = {};
  for (const item of queue) {
    byPos[item.partOfSpeech] = (byPos[item.partOfSpeech] ?? 0) + 1;
    byRisk[item.polysemyRisk] = (byRisk[item.polysemyRisk] ?? 0) + 1;
    byGrade[String(item.grade)] = (byGrade[String(item.grade)] ?? 0) + 1;
  }

  return {
    schemaVersion: 1,
    issueRef: 88,
    parentIssueRef: 76,
    status,
    generatedFrom: {
      priorityMeaningLists: [1, 2, 3, 4, 5, 6].map((grade) => `content/lexicon/open/review-wordlists/grade-${grade}-introduced-meaning.json`),
      senseReviewLane: 'Open English WordNet 2025 candidate identifiers only',
      corpus: 'content/lexicon/open/primary-grade-corpus.json',
      visualBatches: batchNames,
      excludedGeneratedBatch: excludedBatchName
    },
    policy: {
      bareLemmaSenseApprovalAllowed: false,
      candidateQueueCreatesV1: false,
      candidateQueueCreatesRuntimeMapping: false,
      candidateQueueInfersProfilePlacement: false,
      importedGlossOrExampleAllowed: false
    },
    summary: {
      priorityCandidates: queue.length,
      alreadyAuditedLemmasExcluded: auditedLemmas.size,
      alreadyAuditedSenseKeysObserved: auditedSenseKeys.size,
      byPartOfSpeech: byPos,
      byPolysemyRisk: byRisk,
      byGrade
    },
    items: queue
  };
};

const preBatch = buildQueue(preBatchNames, 'generated_review_queue_pre_batch_002');
const current = buildQueue(currentBatchNames, 'generated_review_queue_only');
writeFileSync(preBatchOutputUrl, `${JSON.stringify(preBatch, null, 2)}\n`, 'utf8');
writeFileSync(currentOutputUrl, `${JSON.stringify(current, null, 2)}\n`, 'utf8');
console.log(
  `Built priority visual queues: pre-batch-002 ${preBatch.items.length} gap(s) / ${preBatch.summary.alreadyAuditedLemmasExcluded} audited; ` +
  `current ${current.items.length} gap(s) / ${current.summary.alreadyAuditedLemmasExcluded} audited` +
  `${excludedBatchName ? ` (excluding ${excludedBatchName})` : ''}.`
);
