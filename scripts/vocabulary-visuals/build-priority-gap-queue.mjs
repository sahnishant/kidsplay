import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const outputUrl = new URL('content/vocabulary-visuals/__generated-priority-gap.json', root);
const EXPECTED_GRADES = [1, 2, 3, 4, 5, 6];

const cleanLemma = (value) => String(value ?? '').toLocaleLowerCase('en-US').trim();

function discoverGradeFiles(directory, pattern, label) {
  const discovered = readdirSync(new URL(directory, root))
    .map((name) => {
      const match = name.match(pattern);
      return match ? { grade: Number(match[1]), name, path: `${directory}${name}` } : null;
    })
    .filter(Boolean)
    .sort((left, right) => left.grade - right.grade || left.name.localeCompare(right.name));

  const grades = discovered.map((item) => item.grade);
  if (JSON.stringify(grades) !== JSON.stringify(EXPECTED_GRADES)) {
    throw new Error(
      `${label}: expected exactly canonical grades ${EXPECTED_GRADES.join(',')}; discovered ` +
      `${grades.length ? grades.join(',') : 'none'}`
    );
  }
  return discovered;
}

const wordlistFiles = discoverGradeFiles(
  'content/lexicon/open/review-wordlists/',
  /^grade-([1-6])-introduced-meaning\.json$/,
  'Priority meaning wordlists'
);
const senseReviewFiles = discoverGradeFiles(
  'content/lexicon/open/sense-review/',
  /^grade-([1-6])-introduced-meaning-oewn\.json$/,
  'OEWN sense-review files'
);

const corpus = readJson('content/lexicon/open/primary-grade-corpus.json');
const corpusByLemma = new Map((corpus.entries ?? []).map((entry) => [cleanLemma(entry.lemma), entry]));

const auditedLemmas = new Set();
const auditedSenseKeys = new Set();
const batchNames = readdirSync(new URL('content/vocabulary-visuals/batches/', root))
  .filter((name) => name.endsWith('.json'))
  .sort();
for (const name of batchNames) {
  const batch = readJson(`content/vocabulary-visuals/batches/${name}`);
  for (const item of batch.items ?? []) {
    const lemma = cleanLemma(item?.lemma);
    const senseKey = String(item?.senseKey ?? '').trim();
    if (lemma) auditedLemmas.add(lemma);
    if (senseKey) auditedSenseKeys.add(senseKey);
  }
}

const senseCandidatesByLemma = new Map();
for (const source of senseReviewFiles) {
  const review = readJson(source.path);
  for (const candidate of review.candidates ?? []) {
    const lemma = cleanLemma(candidate?.lemma);
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
    case 'noun':
      return ['direct_entity', 'place_scene', 'person_role', 'part_whole', 'comparison_scene'];
    case 'verb':
      return ['action_scene', 'cause_effect', 'process_scene', 'sequence_scene'];
    case 'adjective':
      return ['attribute_contrast', 'state_scene', 'expression_scene', 'comparison_scene'];
    case 'adverb':
      return ['sequence_scene', 'attribute_contrast', 'state_scene'];
    default:
      return ['symbolic', 'textual_only'];
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
  if (partOfSpeech === 'adverb') return 'medium';
  if (partOfSpeech === 'adjective') return 'medium';
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
        : entry?.partOfSpeech === 'adverb' ? 1
          : 0;
  const sensePenalty = Math.max(0, candidateCount - 1) * 1.25;
  return Number((zipf * 10 + (7 - grade) * 3 + posBonus - Math.log10(Math.max(1, rank)) - sensePenalty).toFixed(3));
};

const priorityByLemma = new Map();
for (const source of wordlistFiles) {
  const wordlist = readJson(source.path);
  for (const rawItem of wordlist.items ?? []) {
    const lemma = cleanLemma(rawItem?.lemma);
    if (!lemma || auditedLemmas.has(lemma)) continue;
    const corpusEntry = corpusByLemma.get(lemma);
    if (!corpusEntry) throw new Error(`Priority visual gap candidate ${lemma} is missing from the 10,000-word corpus`);
    const candidateIds = senseCandidatesByLemma.get(lemma) ?? [];
    const partOfSpeech = rawItem.partOfSpeech ?? corpusEntry.partOfSpeech;
    const item = {
      lemma,
      partOfSpeech,
      grade: rawItem.sourceGrade ?? corpusEntry.grade ?? source.grade,
      upstreamSourceGrade: rawItem.upstreamSourceGrade ?? corpusEntry.sourceGrade ?? null,
      sourceCorpusId: rawItem.sourceCorpusId ?? corpusEntry.id,
      sourcePriorityList: source.path,
      sourceSenseReview: senseReviewFiles.find((item) => item.grade === source.grade)?.path ?? null,
      zipf: rawItem.sourceZipf ?? corpusEntry.frequency?.zipf ?? null,
      priorityRank: rawItem.priorityRank ?? corpusEntry.gradeBandEvidence?.rank ?? null,
      priorityScore: rawItem.priorityScore ?? null,
      reviewStatus: rawItem.reviewStatus ?? corpusEntry.reviewStatus ?? null,
      corpusProvenance: rawItem.provenance ?? corpusEntry.provenance ?? null,
      candidateSenseCount: candidateIds.length,
      candidateIds,
      polysemyRisk: polysemyRiskFor(candidateIds.length),
      likelyVisualFamily: familyForPos(partOfSpeech),
      existingStrategyCandidates: templateCandidatesForPos(partOfSpeech),
      motionPotential: motionPotentialForPos(partOfSpeech),
      visualReviewScore: reviewScoreFor({ ...rawItem, partOfSpeech }, candidateIds.length),
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
  right.visualReviewScore - left.visualReviewScore ||
  Number(left.grade) - Number(right.grade) ||
  String(left.lemma).localeCompare(String(right.lemma))
);

const byPos = {};
const byRisk = {};
const byGrade = {};
for (const item of queue) {
  byPos[item.partOfSpeech] = (byPos[item.partOfSpeech] ?? 0) + 1;
  byRisk[item.polysemyRisk] = (byRisk[item.polysemyRisk] ?? 0) + 1;
  byGrade[String(item.grade)] = (byGrade[String(item.grade)] ?? 0) + 1;
}

const output = {
  schemaVersion: 1,
  issueRef: 88,
  parentIssueRef: 76,
  status: 'generated_review_queue_only',
  generatedFrom: {
    priorityMeaningLists: wordlistFiles.map((item) => item.path),
    senseReviewFiles: senseReviewFiles.map((item) => item.path),
    senseReviewLane: 'Open English WordNet 2025 candidate identifiers only',
    corpus: 'content/lexicon/open/primary-grade-corpus.json',
    visualBatches: batchNames
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

writeFileSync(outputUrl, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(
  `Built #88 priority visual gap queue with ${queue.length} unaudited priority lemma(s); ` +
  `excluded ${auditedLemmas.size} already-audited lemma(s); risks=${JSON.stringify(byRisk)}.`
);
