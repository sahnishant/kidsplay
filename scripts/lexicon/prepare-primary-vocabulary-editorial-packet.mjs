import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const clean = (value) => String(value ?? '').trim();
const normalizedLemma = (value) => clean(value).toLowerCase();

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) args[key] = true;
    else { args[key] = next; index += 1; }
  }
  return args;
}

function parseCsvList(value) {
  if (!value) return [];
  return [...new Set(String(value).split(',').map(clean).filter(Boolean))];
}

function parseProfileTargets(value) {
  return parseCsvList(value);
}

function assertCuratorSlice(slice) {
  if (slice?.kind !== 'primary_vocabulary_curator_sense_slice') {
    throw new Error('Editorial packets must be prepared from a primary vocabulary curator sense slice');
  }
  if (slice?.generatedFrom?.sourceId !== 'open-english-wordnet' || slice?.generatedFrom?.license !== 'CC-BY-4.0') {
    throw new Error('Curator slice must preserve isolated Open English WordNet CC-BY-4.0 provenance');
  }
  if (slice?.policy?.importedGlossRuntimeAllowed !== false || slice?.policy?.explicitHumanDecisionRequired !== true) {
    throw new Error('Curator slice must preserve the no-auto-publish editorial boundary');
  }
  if (!Number.isInteger(Number(slice.grade)) || Number(slice.grade) < 1) {
    throw new Error('Curator slice requires a positive integer grade');
  }
}

function assertReviewHandoff(handoff, grade, ref = '<review-handoff>') {
  if (handoff?.kind !== 'primary_vocabulary_editorial_review_handoff' || handoff?.schemaVersion !== 1) {
    throw new Error(`${ref}: expected a schemaVersion 1 primary vocabulary editorial review handoff`);
  }
  if (Number(handoff.grade) !== Number(grade)) {
    throw new Error(`${ref}: review handoff grade ${handoff.grade} does not match curator grade ${grade}`);
  }
  if (handoff?.policy?.requiredReviewAuthority !== 'human_editor') {
    throw new Error(`${ref}: review handoff must require human_editor authority`);
  }
}

export function collectReviewedLemmas(reviewHandoffs, grade) {
  const lemmas = new Set();
  for (const [index, handoff] of (reviewHandoffs ?? []).entries()) {
    const ref = `<review-handoff-${index + 1}>`;
    assertReviewHandoff(handoff, grade, ref);
    for (const decision of handoff.decisions ?? []) {
      const lemma = normalizedLemma(decision?.lemma);
      if (!lemma) throw new Error(`${ref}: reviewed decision requires lemma`);
      if (decision?.status !== 'reviewed' || !['accept', 'reject'].includes(decision?.decision)) {
        throw new Error(`${ref}: ${lemma} must be a terminal reviewed accept/reject decision before exclusion`);
      }
      if (decision?.reviewAuthority !== 'human_editor') {
        throw new Error(`${ref}: ${lemma} exclusion requires human_editor review authority`);
      }
      if (!clean(decision?.reviewer) || !/^\d{4}-\d{2}-\d{2}$/.test(clean(decision?.reviewedAt))) {
        throw new Error(`${ref}: ${lemma} exclusion requires reviewer and ISO reviewedAt`);
      }
      lemmas.add(lemma);
    }
  }
  return [...lemmas].sort((left, right) => left.localeCompare(right, 'en'));
}

function referenceCandidate(candidate) {
  const candidateId = clean(candidate?.candidateId);
  if (!candidateId) throw new Error('Every editorial packet candidate requires candidateId');
  if (candidate?.provenance?.sourceId !== 'open-english-wordnet' || candidate?.provenance?.license !== 'CC-BY-4.0') {
    throw new Error(`${candidateId}: candidate must retain OEWN CC-BY-4.0 provenance`);
  }
  return {
    candidateId,
    partOfSpeech: candidate.partOfSpeech ?? null,
    referenceOnly: true,
    sourceSense: {
      senseId: candidate?.sourceSense?.senseId ?? null,
      synsetId: candidate?.sourceSense?.synsetId ?? null,
      definition: candidate?.sourceSense?.definition ?? null,
      examples: candidate?.sourceSense?.examples ?? [],
      synonyms: candidate?.sourceSense?.synonyms ?? []
    },
    provenance: candidate.provenance
  };
}

export function buildEditorialPacket(curatorSlice, options = {}) {
  assertCuratorSlice(curatorSlice);
  const grade = Number(curatorSlice.grade);
  const limit = options.limit == null ? curatorSlice.items?.length ?? 0 : Number(options.limit);
  if (!Number.isInteger(limit) || limit < 1) throw new Error('limit must be a positive integer');
  const batchId = clean(options.batchId) || `grade-${grade}-batch-001`;
  const profileReviewTargets = [...new Set((options.profileReviewTargets ?? []).map(clean).filter(Boolean))];
  const excludedPriorReviewLemmas = [...new Set((options.excludeLemmas ?? []).map(normalizedLemma).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, 'en'));
  const excluded = new Set(excludedPriorReviewLemmas);
  const excludedReviewRefs = [...new Set((options.excludedReviewRefs ?? []).map(clean).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, 'en'));

  const rankedItems = [...(curatorSlice.items ?? [])]
    .sort((left, right) => Number(right.priorityScore ?? 0) - Number(left.priorityScore ?? 0) || clean(left.lemma).localeCompare(clean(right.lemma), 'en'));
  const sourceItems = rankedItems
    .filter((item) => !excluded.has(normalizedLemma(item?.lemma)))
    .slice(0, limit);

  const seen = new Set();
  const items = sourceItems.map((item) => {
    const lemma = normalizedLemma(item?.lemma);
    if (!lemma) throw new Error('Editorial packet item requires lemma');
    if (seen.has(lemma)) throw new Error(`${lemma}: duplicate lemma in editorial packet`);
    seen.add(lemma);
    const itemGrade = Number(item.grade ?? grade);
    if (itemGrade !== grade) throw new Error(`${lemma}: item grade ${itemGrade} does not match packet grade ${grade}`);
    const candidateSenses = (item?.candidateSenses ?? []).map(referenceCandidate);
    if (!candidateSenses.length) throw new Error(`${lemma}: editorial packet item requires at least one candidate sense`);

    return {
      lemma,
      grade: itemGrade,
      upstreamSourceGrade: item.upstreamSourceGrade ?? null,
      partOfSpeech: item.partOfSpeech ?? null,
      frequency: item.frequency ?? { zipf: null },
      priorityScore: item.priorityScore ?? null,
      candidateSenses,
      editorial: {
        status: 'draft',
        decision: null,
        selectedCandidateId: null,
        draftChildDefinition: null,
        draftChildExample: null,
        draftOrigin: null,
        notes: null,
        reviewAuthority: null,
        reviewer: null,
        reviewedAt: null
      },
      profilePlacement: {
        status: 'unreviewed',
        approvedProfileRefs: [],
        notes: null,
        reviewAuthority: null,
        reviewer: null,
        reviewedAt: null
      }
    };
  });

  return {
    schemaVersion: 1,
    kind: 'primary_vocabulary_editorial_packet',
    language: 'en',
    grade,
    batchId,
    purpose: 'Editorial sense selection, independently authored child-definition review and explicit profile-placement review before runtime publication.',
    generatedFrom: {
      curatorSliceKind: curatorSlice.kind,
      wordlistId: curatorSlice?.generatedFrom?.wordlistId ?? null,
      sourceId: 'open-english-wordnet',
      sourceVersion: curatorSlice?.generatedFrom?.sourceVersion ?? null,
      license: 'CC-BY-4.0'
    },
    selection: {
      requestedLimit: limit,
      excludedPriorReviewLemmas,
      excludedReviewRefs
    },
    policy: {
      publicationState: 'blocked_pending_editorial_review',
      importedGlossRuntimeAllowed: false,
      aiDraftAllowed: true,
      aiDraftMayCountAsReviewed: false,
      requiredReviewAuthority: 'human_editor',
      explicitReviewerRequiredForAcceptance: true,
      profilePlacementRequiresExplicitApproval: true,
      corpusGradeMayImplyBoardAlignment: false
    },
    profileReviewTargets,
    summary: {
      words: items.length,
      candidateSenses: items.reduce((sum, item) => sum + item.candidateSenses.length, 0),
      excludedPriorReview: rankedItems.filter((item) => excluded.has(normalizedLemma(item?.lemma))).length,
      reviewed: 0,
      accepted: 0,
      rejected: 0
    },
    items
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.slice || !args.output) throw new Error('--slice and --output are required');
  const curatorSlice = JSON.parse(readFileSync(resolve(String(args.slice)), 'utf8'));
  const output = resolve(String(args.output));
  const excludedReviewRefs = parseCsvList(args['exclude-reviews']);
  const reviewHandoffs = excludedReviewRefs.map((path) => JSON.parse(readFileSync(resolve(path), 'utf8')));
  const excludeLemmas = collectReviewedLemmas(reviewHandoffs, Number(curatorSlice.grade));
  const packet = buildEditorialPacket(curatorSlice, {
    batchId: args['batch-id'],
    limit: args.limit == null ? undefined : Number(args.limit),
    profileReviewTargets: parseProfileTargets(args['profile-targets']),
    excludeLemmas,
    excludedReviewRefs
  });
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(packet, null, 2)}\n`, 'utf8');
  console.log(`Primary vocabulary editorial packet prepared: grade=${packet.grade}, batch=${packet.batchId}, words=${packet.summary.words}, excluded=${packet.summary.excludedPriorReview} -> ${output}`);
}

if (import.meta.url === `file://${resolve(process.argv[1] ?? '')`) main();
