import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const readText = (path) => readFileSync(new URL(path, root), 'utf8');
const readJson = (path) => JSON.parse(readText(path));
const repositoryText = (text) => text.replace(/\r\n/g, '\n');
const gitBlobSha = (text) => {
  const canonical = repositoryText(text);
  return createHash('sha1')
    .update(`blob ${Buffer.byteLength(canonical)}\0`)
    .update(canonical)
    .digest('hex');
};
const clean = (value) => String(value ?? '').trim();
const slug = (value) => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const profileRef = 'SOF_INDIA_CLASS2';
const membershipPath = 'content/profile-memberships/SOF_INDIA_CLASS2.json';
const exactReviewPath = 'content/alignment-reviews/SOF_INDIA_CLASS2.json';
const recoveryPath = 'content/alignment-recovery/SOF_INDIA_CLASS2.json';
const terminalPath = 'content/alignment-terminal-reviews/SOF_INDIA_CLASS2.json';

const membershipText = readText(membershipPath);
const exactReviewText = readText(exactReviewPath);
const recoveryText = readText(recoveryPath);
const membership = JSON.parse(membershipText);
const exactReview = JSON.parse(exactReviewText);
const recovery = JSON.parse(recoveryText);
const terminal = readJson(terminalPath);
const registry = readJson('content/alignment-sources/registry.json');
const sourceById = new Map((registry.sources ?? []).map((source) => [source.id, source]));
const failures = [];

const requiredExclusions = new Set([
  'syllabus_topic_only',
  'near_match_or_keyword_overlap',
  'visual_inference_without_reproducible_text_fact',
  'paid_or_access_restricted_material',
  'wrong_olympiad',
  'third_party_mirror'
]);
const terminalRecoveryStatuses = new Set([
  'blocked_uninspectable',
  'rejected_wrong_olympiad',
  'saturated_no_official_artifact',
  'blocked_year_unbound'
]);
const editorialDisposition = 'human_editorial_placement_no_official_anchor_claim';

if (terminal.profileRef !== profileRef || membership.profileRef !== profileRef || exactReview.profileRef !== profileRef || recovery.profileRef !== profileRef) {
  failures.push('all provenance artifacts must bind to SOF_INDIA_CLASS2');
}
if (terminal.schemaVersion !== 1 || terminal.status !== 'completed') {
  failures.push('terminal review must use schemaVersion 1 and status=completed');
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(terminal.reviewedAt ?? '')) failures.push('terminal review requires a YYYY-MM-DD reviewedAt date');

const members = membership.members ?? [];
const memberIds = members.map((member) => member.rowId);
const memberSet = new Set(memberIds);
if (memberIds.length !== memberSet.size) failures.push('Class 2 membership contains duplicate rowIds');
if ((membership.inherits ?? []).length > 0) failures.push('Class 2 terminal review expects a direct-only membership snapshot');

const evidence = exactReview.rowEvidence ?? [];
const evidenceRowIds = evidence.map((item) => item.rowId);
const evidenceSet = new Set(evidenceRowIds);
if (evidenceRowIds.length !== evidenceSet.size) failures.push('exact rowEvidence contains duplicate rowIds');
for (const item of evidence) {
  if (!memberSet.has(item.rowId)) failures.push(`exact rowEvidence references non-member ${item.rowId}`);
  if (!item.sourceRef || !item.locator || !item.evidenceType || !item.temporalBasis) {
    failures.push(`${item.rowId}: exact evidence must keep sourceRef, locator, evidenceType and temporalBasis`);
    continue;
  }
  const source = sourceById.get(item.sourceRef);
  if (!source) {
    failures.push(`${item.rowId}: missing registered source ${item.sourceRef}`);
    continue;
  }
  if (source.type !== 'official_assessment' || source.authority !== 'Science Olympiad Foundation' || source.status !== 'reviewed') {
    failures.push(`${item.rowId}: exact source ${item.sourceRef} must be a reviewed official SOF assessment`);
  }
  if (!/^https:\/\/(www\.)?sofworld\.org\//.test(source.url ?? '')) {
    failures.push(`${item.rowId}: exact source ${item.sourceRef} must resolve to sofworld.org`);
  }
}

const editorialReview = terminal.editorialPlacementReview ?? {};
if (editorialReview.status !== 'completed') failures.push('editorialPlacementReview must be completed');
if (editorialReview.reviewAuthority !== 'human_editor') failures.push('editorialPlacementReview requires human_editor authority');
if (!clean(editorialReview.reviewer)) failures.push('editorialPlacementReview requires reviewer identity');
if (!/^\d{4}-\d{2}-\d{2}$/.test(editorialReview.reviewedAt ?? '')) failures.push('editorialPlacementReview requires YYYY-MM-DD reviewedAt');
if (editorialReview.disposition !== editorialDisposition) failures.push(`editorialPlacementReview disposition must be ${editorialDisposition}`);
if (!(editorialReview.meaning ?? '').includes('does not claim')) failures.push('editorialPlacementReview must explicitly deny official-evidence inference');

const editorialRows = new Map();
for (const handoffPath of editorialReview.handoffRefs ?? []) {
  let handoff;
  try {
    handoff = readJson(handoffPath);
  } catch (error) {
    failures.push(`editorial placement handoff ${handoffPath} could not be read: ${error instanceof Error ? error.message : String(error)}`);
    continue;
  }
  const placementByLemma = new Map((handoff.profilePlacements ?? []).map((placement) => [clean(placement.lemma).toLowerCase(), placement]));
  const decisionByLemma = new Map((handoff.decisions ?? []).map((decision) => [clean(decision.lemma).toLowerCase(), decision]));
  for (const [lemma, placement] of placementByLemma) {
    if (!(placement.approvedProfileRefs ?? []).includes(profileRef)) continue;
    if (placement.status !== 'reviewed' || placement.reviewAuthority !== 'human_editor' || !clean(placement.reviewer) || !/^\d{4}-\d{2}-\d{2}$/.test(placement.reviewedAt ?? '')) {
      failures.push(`${handoffPath}/${lemma}: SOF placement requires terminal human_editor review metadata`);
      continue;
    }
    let rowId = clean(placement.rowId);
    if (!rowId) {
      const decision = decisionByLemma.get(lemma);
      if (!decision || decision.status !== 'reviewed' || decision.decision !== 'accept' || decision.reviewAuthority !== 'human_editor') {
        failures.push(`${handoffPath}/${lemma}: placement without rowId requires a matching accepted human meaning decision`);
        continue;
      }
      rowId = `kr.vocab.primary.meaning.${slug(lemma)}.${slug(decision.candidateId)}`;
    }
    if (!memberSet.has(rowId)) failures.push(`${handoffPath}/${lemma}: editorial placement row ${rowId} is not a current SOF member`);
    if (evidenceSet.has(rowId)) failures.push(`${handoffPath}/${lemma}: editorial-only row ${rowId} also has exact official evidence and must not use the editorial-only disposition`);
    if (editorialRows.has(rowId)) failures.push(`${rowId}: duplicate editorial placement across handoffs`);
    editorialRows.set(rowId, { handoffPath, lemma });
  }
}
const editorialSet = new Set(editorialRows.keys());
if (editorialReview.reviewedDirectRows !== editorialSet.size) {
  failures.push(`editorialPlacementReview reviewedDirectRows=${editorialReview.reviewedDirectRows} but approved handoffs resolve to ${editorialSet.size}`);
}

const audit = terminal.sourceAudit ?? {};
if (audit.scope !== 'accessible_public_official_corpus') failures.push('sourceAudit scope must be accessible_public_official_corpus');
if (!(audit.terminalMeaning ?? '').includes('does not claim')) failures.push('sourceAudit must explicitly limit the meaning of no-exact disposition');
if (!Number.isInteger(audit.auditedDirectRowCount) || audit.auditedDirectRowCount < 0) failures.push('sourceAudit requires auditedDirectRowCount');
if (!/^[0-9a-f]{40}$/.test(audit.auditedMembershipBlobSha ?? '')) failures.push('sourceAudit requires the historical auditedMembershipBlobSha');
if (audit.auditedDirectRowCount !== members.length - editorialSet.size) {
  failures.push(`sourceAudit auditedDirectRowCount=${audit.auditedDirectRowCount} but current non-editorial membership count is ${members.length - editorialSet.size}`);
}
const exclusions = new Set(audit.excludedEvidenceClasses ?? []);
for (const required of requiredExclusions) if (!exclusions.has(required)) failures.push(`sourceAudit missing exclusion ${required}`);
for (const sourceRef of audit.currentScopeRefs ?? []) {
  const source = sourceById.get(sourceRef);
  if (!source || source.authority !== 'Science Olympiad Foundation' || source.status !== 'reviewed') {
    failures.push(`current scope audit ref ${sourceRef} is not a reviewed official SOF source`);
  }
}

const recoveryById = new Map((recovery.leads ?? []).map((lead) => [lead.id, lead]));
const auditedRecovery = new Set(audit.recoveryLeadRefs ?? []);
for (const lead of recovery.leads ?? []) {
  if (!auditedRecovery.has(lead.id)) failures.push(`recovery lead ${lead.id} has no terminal audit reference`);
  if (lead.evidenceEligible !== false) failures.push(`recovery lead ${lead.id} must remain evidenceEligible=false`);
  if (!terminalRecoveryStatuses.has(lead.status)) failures.push(`recovery lead ${lead.id} has non-terminal status ${lead.status}`);
}
for (const leadId of auditedRecovery) if (!recoveryById.has(leadId)) failures.push(`sourceAudit references unknown recovery lead ${leadId}`);

const terminalRows = memberIds.map((rowId) => ({
  rowId,
  disposition: evidenceSet.has(rowId)
    ? 'exact_official_anchor'
    : editorialSet.has(rowId)
      ? editorialDisposition
      : 'reviewed_no_exact_public_anchor'
}));
const exactCount = terminalRows.filter((row) => row.disposition === 'exact_official_anchor').length;
const editorialCount = terminalRows.filter((row) => row.disposition === editorialDisposition).length;
const noExactCount = terminalRows.filter((row) => row.disposition === 'reviewed_no_exact_public_anchor').length;
const pendingCount = memberIds.length - exactCount - editorialCount - noExactCount;
if (terminalRows.length !== members.length || pendingCount !== 0) failures.push('every direct membership row must resolve to exactly one terminal disposition');
if (noExactCount !== audit.auditedDirectRowCount - exactCount) {
  failures.push(`reviewed_no_exact_public_anchor count ${noExactCount} does not equal audited rows minus exact anchors (${audit.auditedDirectRowCount - exactCount})`);
}

const snapshot = terminal.membershipSnapshot ?? {};
const snapshotChecks = [
  ['directRowCount', members.length],
  ['exactOfficialAnchorCount', exactCount],
  ['reviewedNoExactPublicAnchorCount', noExactCount],
  ['humanEditorialPlacementCount', editorialCount],
  ['terminalRowCount', members.length]
];
for (const [key, actual] of snapshotChecks) {
  if (snapshot[key] !== actual) failures.push(`snapshot ${key}=${snapshot[key]} but current value is ${actual}`);
}
const shaChecks = [
  ['membershipBlobSha', gitBlobSha(membershipText)],
  ['exactReviewBlobSha', gitBlobSha(exactReviewText)],
  ['recoveryBlobSha', gitBlobSha(recoveryText)]
];
for (const [key, actual] of shaChecks) {
  if (snapshot[key] !== actual) failures.push(`snapshot ${key} is stale; expected current blob ${actual}`);
}

if (terminal.resolutionPolicy?.exactOfficialAnchor?.disposition !== 'exact_official_anchor') {
  failures.push('exact evidence resolution must be exact_official_anchor');
}
if (terminal.resolutionPolicy?.humanEditorialPlacement?.disposition !== editorialDisposition) {
  failures.push(`human editorial placement resolution must be ${editorialDisposition}`);
}
if (terminal.resolutionPolicy?.humanEditorialPlacement?.reviewRef !== editorialReview.id) {
  failures.push('human editorial placement resolution must bind to editorialPlacementReview id');
}
if (terminal.resolutionPolicy?.otherwise?.disposition !== 'reviewed_no_exact_public_anchor') {
  failures.push('non-exact terminal resolution must be reviewed_no_exact_public_anchor');
}
if (terminal.resolutionPolicy?.otherwise?.auditRef !== audit.id) {
  failures.push('non-exact terminal resolution must bind to the sourceAudit id');
}

if (failures.length) {
  console.error(`Terminal SOF Class 2 evidence review failed with ${failures.length} error(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Terminal SOF Class 2 evidence review OK: ${terminalRows.length}/${members.length} rows terminal; ${exactCount} exact_official_anchor; ${noExactCount} reviewed_no_exact_public_anchor; ${editorialCount} human_editorial_placement_no_official_anchor_claim; ${pendingCount} pending.`);
