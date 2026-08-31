import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const clean = (value) => String(value ?? '').trim();
const normalized = (value) => clean(value).replace(/\s+/g, ' ').toLowerCase();

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
  if (packet?.kind !== 'primary_vocabulary_editorial_packet') {
    throw new Error('Expected a primary vocabulary editorial packet');
  }
  if (packet?.generatedFrom?.sourceId !== 'open-english-wordnet' || packet?.generatedFrom?.license !== 'CC-BY-4.0') {
    throw new Error('Editorial packet must preserve OEWN CC-BY-4.0 provenance');
  }
  if (packet?.policy?.importedGlossRuntimeAllowed !== false || packet?.policy?.aiDraftMayCountAsReviewed !== false) {
    throw new Error('Editorial packet policy must preserve the no-auto-publish boundary');
  }
  if (packet?.policy?.requiredReviewAuthority !== 'human_editor') {
    throw new Error('Editorial packet must require human_editor review authority');
  }
}

function candidateMap(item) {
  return new Map((item?.candidateSenses ?? []).map((candidate) => [clean(candidate?.candidateId), candidate]));
}

function reviewedDecision(item) {
  const editorial = item?.editorial ?? {};
  if (editorial.status !== 'reviewed') return null;

  const lemma = clean(item?.lemma).toLowerCase();
  if (!lemma) throw new Error('Reviewed editorial item requires lemma');
  if (editorial.reviewAuthority !== 'human_editor') {
    throw new Error(`${lemma}: reviewed editorial item requires human_editor reviewAuthority`);
  }
  if (!['accept', 'reject'].includes(editorial.decision)) {
    throw new Error(`${lemma}: reviewed editorial item requires decision accept or reject`);
  }

  const selectedCandidateId = clean(editorial.selectedCandidateId);
  const candidates = candidateMap(item);
  if (!selectedCandidateId || !candidates.has(selectedCandidateId)) {
    throw new Error(`${lemma}: reviewed editorial item requires a selected candidateId from the packet`);
  }

  const reviewer = clean(editorial.reviewer);
  const reviewedAt = clean(editorial.reviewedAt);
  if (!reviewer || !/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(reviewedAt)) {
    throw new Error(`${lemma}: reviewed editorial item requires reviewer and ISO reviewedAt`);
  }

  const decision = {
    lemma,
    candidateId: selectedCandidateId,
    status: 'reviewed',
    decision: editorial.decision,
    reviewAuthority: 'human_editor',
    reviewer,
    reviewedAt
  };

  if (editorial.decision === 'accept') {
    const childDefinition = clean(editorial.draftChildDefinition);
    const childExample = clean(editorial.draftChildExample);
    if (childDefinition.length < 3 || childDefinition.length > 180) {
      throw new Error(`${lemma}: accepted item requires a concise independently authored child definition`);
    }
    const sourceDefinition = clean(candidates.get(selectedCandidateId)?.sourceSense?.definition);
    if (normalized(childDefinition) === normalized(sourceDefinition)) {
      throw new Error(`${lemma}: child definition must not copy the OEWN gloss verbatim`);
    }
    decision.childDefinition = childDefinition;
    if (childExample) decision.childExample = childExample;
  }

  const notes = clean(editorial.notes);
  if (notes) decision.notes = notes;
  return decision;
}

export function finalizeEditorialPacket(packet) {
  assertPacket(packet);
  const decisions = [];
  const profilePlacements = [];

  for (const item of packet.items ?? []) {
    const decision = reviewedDecision(item);
    if (decision) decisions.push(decision);

    const placement = item?.profilePlacement ?? {};
    if (placement.status === 'reviewed') {
      const lemma = clean(item?.lemma).toLowerCase();
      if (placement.reviewAuthority !== 'human_editor') {
        throw new Error(`${lemma}: reviewed profile placement requires human_editor reviewAuthority`);
      }
      const reviewer = clean(placement.reviewer);
      const reviewedAt = clean(placement.reviewedAt);
      if (!reviewer || !/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(reviewedAt)) {
        throw new Error(`${lemma}: reviewed profile placement requires reviewer and reviewedAt`);
      }
      const approvedProfileRefs = [...new Set((placement.approvedProfileRefs ?? []).map(clean).filter(Boolean))];
      profilePlacements.push({
        lemma,
        status: 'reviewed',
        reviewAuthority: 'human_editor',
        approvedProfileRefs,
        reviewer,
        reviewedAt,
        notes: clean(placement.notes) || null
      });
    }
  }

  decisions.sort((left, right) => left.lemma.localeCompare(right.lemma, 'en'));
  profilePlacements.sort((left, right) => left.lemma.localeCompare(right.lemma, 'en'));
  return {
    schemaVersion: 1,
    kind: 'primary_vocabulary_editorial_review_handoff',
    batchId: packet.batchId ?? null,
    grade: Number(packet.grade ?? 0),
    source: {
      packetKind: packet.kind,
      sourceId: 'open-english-wordnet',
      sourceVersion: packet?.generatedFrom?.sourceVersion ?? null,
      license: 'CC-BY-4.0'
    },
    policy: {
      importedGlossRuntimeAllowed: false,
      explicitEditorialReviewRequired: true,
      requiredReviewAuthority: 'human_editor',
      profilePlacementsAreReviewRecordsOnly: true
    },
    summary: {
      packetWords: (packet.items ?? []).length,
      reviewedDecisions: decisions.length,
      accepted: decisions.filter((item) => item.decision === 'accept').length,
      rejected: decisions.filter((item) => item.decision === 'reject').length,
      reviewedProfilePlacements: profilePlacements.length
    },
    decisions,
    profilePlacements
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.packet || !args.output) throw new Error('--packet and --output are required');
  const packet = JSON.parse(readFileSync(resolve(String(args.packet)), 'utf8'));
  const output = resolve(String(args.output));
  const handoff = finalizeEditorialPacket(packet);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(handoff, null, 2)}\n`, 'utf8');
  console.log(`Primary vocabulary editorial handoff finalized: reviewed=${handoff.summary.reviewedDecisions}, accepted=${handoff.summary.accepted}, rejected=${handoff.summary.rejected} -> ${output}`);
}

if (import.meta.url === `file://${resolve(process.argv[1] ?? '')}`) main();
