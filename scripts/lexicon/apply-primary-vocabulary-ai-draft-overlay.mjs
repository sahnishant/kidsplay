import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const clean = (value) => String(value ?? '').trim();
const normalized = (value) => clean(value).replace(/\s+/g, ' ').toLowerCase();
const PROHIBITED_SUGGESTION_FIELDS = new Set([
  'selectedCandidateId',
  'reviewAuthority',
  'reviewer',
  'reviewedAt',
  'decision',
  'approvedProfileRefs',
  'profilePlacement',
  'editorial'
]);

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

function assertPacket(packet) {
  if (packet?.kind !== 'primary_vocabulary_editorial_packet') throw new Error('Expected a primary vocabulary editorial packet');
  if (packet?.policy?.aiDraftAllowed !== true || packet?.policy?.aiDraftMayCountAsReviewed !== false) {
    throw new Error('Editorial packet must explicitly allow draft-only AI assistance and forbid it from counting as review');
  }
  if (packet?.policy?.requiredReviewAuthority !== 'human_editor') throw new Error('Editorial packet must require human_editor review authority');
}

function assertOverlay(overlay) {
  if (overlay?.kind !== 'primary_vocabulary_ai_draft_overlay' || overlay?.schemaVersion !== 1) {
    throw new Error('Expected schemaVersion 1 primary_vocabulary_ai_draft_overlay');
  }
  if (overlay?.policy?.publicationState !== 'draft_suggestions_only'
    || overlay?.policy?.mayCountAsHumanReview !== false
    || overlay?.policy?.maySetHumanReviewMetadata !== false
    || overlay?.policy?.mayApproveProfilePlacement !== false
    || overlay?.policy?.sourceGlossesReferenceOnly !== true) {
    throw new Error('AI draft overlay must preserve the draft-only editorial boundary');
  }
  const suggestions = overlay.suggestions ?? [];
  if (!suggestions.length) throw new Error('AI draft overlay requires at least one suggestion');
  if (suggestions.length > 20) throw new Error('AI draft overlay is intentionally bounded to at most 20 suggestions per batch');
}

function assertNoHumanReviewFields(suggestion, lemma) {
  for (const key of Object.keys(suggestion ?? {})) {
    if (PROHIBITED_SUGGESTION_FIELDS.has(key)) throw new Error(`${lemma}: AI suggestion may not set human review field ${key}`);
  }
}

export function applyAiDraftOverlay(packet, overlay) {
  assertPacket(packet);
  assertOverlay(overlay);
  if (Number(overlay.grade) !== Number(packet.grade)) throw new Error('AI draft overlay grade does not match editorial packet');
  if (clean(overlay.batchId) !== clean(packet.batchId)) throw new Error('AI draft overlay batchId does not match editorial packet');

  const items = new Map((packet.items ?? []).map((item) => [clean(item.lemma).toLowerCase(), item]));
  const seen = new Set();
  const applied = [];
  for (const suggestion of overlay.suggestions ?? []) {
    const lemma = clean(suggestion?.lemma).toLowerCase();
    if (!lemma || seen.has(lemma)) throw new Error(`${lemma || '<blank>'}: AI overlay lemma must be present and unique`);
    seen.add(lemma);
    assertNoHumanReviewFields(suggestion, lemma);
    const item = items.get(lemma);
    if (!item) throw new Error(`${lemma}: AI overlay suggestion is not present in the editorial packet`);
    const editorial = item.editorial ?? {};
    if (editorial.status !== 'draft' || editorial.decision != null || editorial.selectedCandidateId != null
      || editorial.reviewAuthority != null || editorial.reviewer != null || editorial.reviewedAt != null) {
      throw new Error(`${lemma}: AI overlay may only attach to an untouched draft editorial item`);
    }
    if ((item.profilePlacement?.approvedProfileRefs ?? []).length || item.profilePlacement?.status !== 'unreviewed') {
      throw new Error(`${lemma}: AI overlay may not attach after profile placement approval`);
    }

    const proposedCandidateId = clean(suggestion.proposedCandidateId);
    const candidate = (item.candidateSenses ?? []).find((entry) => clean(entry.candidateId) === proposedCandidateId);
    if (!candidate) throw new Error(`${lemma}: proposedCandidateId must reference a candidate sense in the packet`);
    const proposedChildDefinition = clean(suggestion.proposedChildDefinition);
    const proposedChildExample = clean(suggestion.proposedChildExample);
    if (proposedChildDefinition.length < 3 || proposedChildDefinition.length > 180) {
      throw new Error(`${lemma}: AI child-definition suggestion must be 3-180 characters`);
    }
    const sourceDefinition = clean(candidate?.sourceSense?.definition);
    if (normalized(proposedChildDefinition) === normalized(sourceDefinition)) {
      throw new Error(`${lemma}: AI child-definition suggestion must not copy the selected OEWN gloss verbatim`);
    }
    const sourceExamples = (candidate?.sourceSense?.examples ?? []).map(normalized).filter(Boolean);
    if (proposedChildExample && sourceExamples.includes(normalized(proposedChildExample))) {
      throw new Error(`${lemma}: AI child-example suggestion must not copy an OEWN example verbatim`);
    }

    item.aiDraft = {
      overlayId: clean(overlay.overlayId),
      status: 'suggestion_only_unreviewed',
      proposedCandidateId,
      proposedChildDefinition,
      proposedChildExample: proposedChildExample || null,
      rationale: clean(suggestion.rationale) || null,
      mayCountAsReviewed: false,
      humanReviewRequired: true,
      profilePlacementApproved: false
    };
    applied.push(lemma);
  }

  const result = structuredClone(packet);
  result.items = packet.items;
  result.aiDraftOverlay = {
    overlayId: clean(overlay.overlayId),
    generatedAt: clean(overlay.generatedAt) || null,
    generatedBy: overlay.generatedBy ?? { kind: 'ai_editorial_draft' },
    status: 'suggestions_attached_review_required',
    suggestionsApplied: applied.length,
    publicationState: 'blocked_pending_editorial_review'
  };
  result.summary = { ...result.summary, aiDraftSuggestions: applied.length };
  return result;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.packet || !args.overlay || !args.output) throw new Error('--packet, --overlay and --output are required');
  const packet = JSON.parse(readFileSync(resolve(String(args.packet)), 'utf8'));
  const overlay = JSON.parse(readFileSync(resolve(String(args.overlay)), 'utf8'));
  const output = resolve(String(args.output));
  const result = applyAiDraftOverlay(packet, overlay);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.log(`Primary vocabulary AI draft overlay applied: grade=${result.grade}, batch=${result.batchId}, suggestions=${result.aiDraftOverlay.suggestionsApplied} -> ${output}`);
}

if (import.meta.url === `file://${resolve(process.argv[1] ?? '')}`) main();
