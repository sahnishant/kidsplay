import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const outputUrl = new URL('content/vocabulary-visuals/batches/__generated-priority-batch-003.json', root);
const sourceSnapshotUrl = new URL('content/vocabulary-visuals/__generated-priority-gap-pre-batch-003.json', root);
const gapBuilderPath = fileURLToPath(new URL('./build-priority-gap-queue.mjs', import.meta.url));
const batchName = '__generated-priority-batch-003.json';

// Rebuild the source queue while excluding this generated batch. This makes the
// factory idempotent even when npm scripts compile the content more than once
// in the same workspace and batch 003 already exists from an earlier pass.
execFileSync(process.execPath, [gapBuilderPath, `--exclude-batch=${batchName}`], { stdio: 'inherit' });
const source = readJson('content/vocabulary-visuals/__generated-priority-gap.json');
if (source?.schemaVersion !== 1 || source?.parentIssueRef !== 76 || source?.status !== 'generated_review_queue_only') {
  throw new Error('Batch 003 requires the deterministic #76 live priority review queue');
}
if (!Array.isArray(source.items) || source.items.length === 0) {
  throw new Error('Batch 003 source queue is unexpectedly empty; terminal Phase B sweep has no reproducible source');
}

const sourceSnapshot = {
  ...source,
  issueRef: 93,
  sourceQueueIssueRef: source.issueRef,
  status: 'generated_review_queue_pre_batch_003',
  policy: {
    ...source.policy,
    batch003CreatesOnlyTerminalV1Dispositions: true
  }
};
writeFileSync(sourceSnapshotUrl, `${JSON.stringify(sourceSnapshot, null, 2)}\n`, 'utf8');

let exactSingleCandidate = 0;
let unresolvedPolysemy = 0;
let unresolvedMissingCandidate = 0;
const items = source.items.map((candidate) => {
  const lemma = String(candidate?.lemma ?? '').trim();
  const partOfSpeech = String(candidate?.partOfSpeech ?? '').trim();
  const candidateIds = [...new Set((candidate?.candidateIds ?? []).map(String).filter(Boolean))].sort();
  const candidateSenseCount = Number(candidate?.candidateSenseCount ?? candidateIds.length);
  if (!lemma || !partOfSpeech || candidateSenseCount !== candidateIds.length) {
    throw new Error(`${lemma || '<unknown>'}: invalid batch-003 source candidate metadata`);
  }

  const sourceTrace = {
    sourceCorpusId: candidate.sourceCorpusId,
    grade: candidate.grade,
    candidateSenseCount,
    candidateIds,
    polysemyRisk: candidate.polysemyRisk
  };

  if (candidateSenseCount === 1) {
    const senseKey = candidateIds[0];
    if (!senseKey.startsWith(`${lemma}#`)) throw new Error(`${lemma}: exact candidate identifier ${senseKey} is not lemma-scoped`);
    exactSingleCandidate += 1;
    return {
      lemma,
      senseKey,
      partOfSpeech,
      strategy: 'textual_only',
      maturity: 'V1',
      motionPolicy: 'none',
      answerSafety: 'neutral_safe',
      reviewSource: 'single_candidate_terminal_text_only',
      sourceTrace
    };
  }

  if (candidateSenseCount === 0) unresolvedMissingCandidate += 1;
  else unresolvedPolysemy += 1;
  return {
    lemma,
    senseKey: `${lemma}#unresolved`,
    partOfSpeech,
    strategy: 'sense_unresolved',
    maturity: 'V1',
    motionPolicy: 'none',
    answerSafety: 'explanation_only',
    reviewSource: candidateSenseCount === 0 ? 'missing_candidate_terminal_unresolved' : 'polysemy_terminal_unresolved',
    sourceTrace
  };
});

const senseKeys = items.map((item) => item.senseKey);
if (new Set(senseKeys).size !== senseKeys.length) throw new Error('Batch 003 contains duplicate sense keys');
if (items.length !== source.items.length) throw new Error('Batch 003 must preserve one terminal disposition per source lemma');
if (exactSingleCandidate + unresolvedPolysemy + unresolvedMissingCandidate !== items.length) {
  throw new Error('Batch 003 terminal disposition accounting does not balance');
}

const output = {
  schemaVersion: 1,
  id: 'vocabulary.visual-strategy.priority-batch-003-terminal',
  issueRef: 93,
  parentIssueRef: 76,
  status: 'reviewed_terminal_visual_disposition',
  policy: {
    bareLemmaMappingAllowed: false,
    definitionsIncluded: false,
    sourceGlossesIncluded: false,
    sourceExamplesIncluded: false,
    profilePlacementInferred: false,
    assessmentAnswerRevealAllowed: false,
    runtimeMappingCreated: false,
    childDefinitionApprovalInferred: false,
    v2OrHigherMaturityCreated: false,
    exactSingleCandidateMayDefaultToTextualOnly: true,
    multiCandidateSenseSelectionAllowed: false
  },
  summary: {
    items: items.length,
    exactSingleCandidateTextualOnly: exactSingleCandidate,
    polysemyUnresolved: unresolvedPolysemy,
    missingCandidateUnresolved: unresolvedMissingCandidate,
    sceneStrategyItems: 0,
    directVisualItems: 0,
    runtimeMappings: 0
  },
  items
};
writeFileSync(outputUrl, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(
  `Built #93 terminal batch 003: ${items.length} disposition(s); ` +
  `${exactSingleCandidate} exact single-candidate textual-only; ` +
  `${unresolvedPolysemy} polysemy-unresolved; ${unresolvedMissingCandidate} missing-candidate unresolved.`
);

// Rebuild the real live queue with batch 003 included. Phase B is complete only
// if the permanent test/report sees this queue reach zero.
execFileSync(process.execPath, [gapBuilderPath], { stdio: 'inherit' });
