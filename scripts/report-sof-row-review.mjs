import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (relativePath) => JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf8'));
const membership = readJson('content/profile-memberships/SOF_INDIA_CLASS2.json');
const sourceRegistry = readJson('content/alignment-sources/registry.json');
const review = readJson('content/alignment-reviews/SOF_INDIA_CLASS2.json');
const terminalReview = readJson('content/alignment-terminal-reviews/SOF_INDIA_CLASS2.json');
const sources = new Map((sourceRegistry.sources ?? []).map((source) => [source.id, source]));
const evidenceByRow = new Map((review.rowEvidence ?? []).map((entry) => [entry.rowId, entry]));
const fitPriority = { core: 0, review: 1, stretch: 2, challenge: 3 };

function topicForRow(rowId) {
  const parts = rowId.split('.');
  if (parts[1] === 'choice' && parts[2]) return parts[2];
  return parts[1] || 'general';
}

function sortByPriority(left, right) {
  const fitDelta = (fitPriority[left.fit] ?? 99) - (fitPriority[right.fit] ?? 99);
  if (fitDelta) return fitDelta;
  const topicDelta = topicForRow(left.rowId).localeCompare(topicForRow(right.rowId));
  if (topicDelta) return topicDelta;
  return left.rowId.localeCompare(right.rowId);
}

const members = membership.members ?? [];
const groups = new Map();
for (const member of members) {
  const topic = topicForRow(member.rowId);
  groups.set(topic, [...(groups.get(topic) ?? []), member]);
}
const resolveDisposition = (rowId) => evidenceByRow.has(rowId)
  ? terminalReview.resolutionPolicy.exactOfficialAnchor.disposition
  : terminalReview.resolutionPolicy.otherwise.disposition;
const terminalRows = members.map((member) => ({ ...member, disposition: resolveDisposition(member.rowId) }));
const exactRows = terminalRows.filter((member) => member.disposition === 'exact_official_anchor');
const reviewedNoExactRows = terminalRows.filter((member) => member.disposition === 'reviewed_no_exact_public_anchor');
const pendingRows = terminalRows.filter((member) => !['exact_official_anchor', 'reviewed_no_exact_public_anchor'].includes(member.disposition));

const fitCounts = members.reduce((counts, member) => {
  counts[member.fit] = (counts[member.fit] ?? 0) + 1;
  return counts;
}, {});
const temporalCounts = exactRows.reduce((counts, member) => {
  const basis = evidenceByRow.get(member.rowId)?.temporalBasis ?? 'unknown';
  counts[basis] = (counts[basis] ?? 0) + 1;
  return counts;
}, {});
const fitBasisCounts = exactRows.reduce((counts, member) => {
  const basis = evidenceByRow.get(member.rowId)?.fitBasis ?? 'unknown';
  counts[basis] = (counts[basis] ?? 0) + 1;
  return counts;
}, {});
const topicCounts = [...groups.entries()]
  .map(([topic, topicMembers]) => ({
    topic,
    total: topicMembers.length,
    exactOfficialAnchors: topicMembers.filter((member) => evidenceByRow.has(member.rowId)).length,
    currentYear: topicMembers.filter((member) => evidenceByRow.get(member.rowId)?.temporalBasis === 'current_year').length,
    historical: topicMembers.filter((member) => evidenceByRow.get(member.rowId)?.temporalBasis === 'historical_class2').length,
    reviewedNoExactPublicAnchor: topicMembers.filter((member) => !evidenceByRow.has(member.rowId)).length,
    terminal: topicMembers.length
  }))
  .sort((left, right) => left.topic.localeCompare(right.topic));

const result = {
  profileRef: membership.profileRef,
  provenance: membership.provenance?.status ?? 'unknown',
  terminalReviewStatus: terminalReview.status,
  reviewedAt: terminalReview.reviewedAt,
  totalRows: members.length,
  exactOfficialAnchors: exactRows.length,
  evidencedRows: exactRows.length,
  reviewedNoExactPublicAnchor: reviewedNoExactRows.length,
  terminalRows: terminalRows.length - pendingRows.length,
  terminalPercent: members.length ? Math.round(((terminalRows.length - pendingRows.length) / members.length) * 1000) / 10 : 0,
  pendingRows: pendingRows.length,
  temporalCounts,
  fitBasisCounts,
  fitCounts,
  topicCounts,
  terminal: terminalRows.map((member) => ({
    rowId: member.rowId,
    fit: member.fit,
    topic: topicForRow(member.rowId),
    disposition: member.disposition,
    evidence: evidenceByRow.get(member.rowId) ?? null
  })),
  pending: pendingRows.map((member) => ({ rowId: member.rowId, fit: member.fit, topic: topicForRow(member.rowId) }))
};

if (process.argv.includes('--json')) {
  writeFileSync(1, `${JSON.stringify(result, null, 2)}\n`);
  process.exit(pendingRows.length ? 1 : 0);
}

console.log('# SOF Class 2 row review report');
console.log('');
console.log(`Profile: \`${membership.profileRef}\``);
console.log(`Profile provenance: \`${membership.provenance?.status ?? 'unknown'}\``);
console.log(`Rows in prototype membership: **${members.length}**`);
console.log(`Rows with reproducible exact official row/skill anchors: **${exactRows.length}**`);
console.log(`- current-year direct evidence: **${temporalCounts.current_year ?? 0}**`);
console.log(`- historical Class 2 direct evidence with current-year scope retained: **${temporalCounts.historical_class2 ?? 0}**`);
console.log(`Rows terminally reviewed with no exact public official anchor found: **${reviewedNoExactRows.length}**`);
console.log(`Rows with a terminal evidence disposition: **${result.terminalRows}/${members.length} (${result.terminalPercent}%)**`);
console.log(`Rows still pending terminal evidence review: **${pendingRows.length}**`);
console.log(`Recorded fit basis for exact anchors: ${Object.entries(fitBasisCounts).map(([basis, count]) => `${basis}=${count}`).join(', ') || 'none'}`);
console.log(`Fit distribution: ${Object.entries(fitCounts).map(([fit, count]) => `${fit}=${count}`).join(', ')}`);
console.log('');
console.log('`reviewed_no_exact_public_anchor` is a terminal audit disposition, not an official provenance claim and not a claim that the fact never appeared in SOF.');
console.log('Exact anchors remain reproducible official assessment evidence. Syllabus headings, near matches, paid/access-restricted content, wrong-olympiad material, visual inference without a reproducible fact, and third-party mirrors are excluded from exact-row promotion.');
console.log('Historical Class 2 evidence proves prior Class 2 assessment use only; it does not imply recurrence. Editorial core/review/stretch/challenge fit remains separate unless explicitly source-supported.');
console.log('');
console.log('## Scope sources');
console.log('');
for (const sourceRef of membership.provenance?.sourceRefs ?? []) {
  const source = sources.get(sourceRef);
  const label = source?.title ?? source?.name ?? sourceRef;
  const status = source?.status ?? 'unknown';
  console.log(`- \`${sourceRef}\` — ${label} (${status})`);
}
console.log('');
console.log('## Topic terminal coverage');
console.log('');
console.log('| Topic | Current-year exact | Historical exact | Exact anchors | Reviewed no exact public anchor | Terminal | Total |');
console.log('| --- | ---: | ---: | ---: | ---: | ---: | ---: |');
for (const item of topicCounts) {
  console.log(`| ${item.topic} | ${item.currentYear} | ${item.historical} | ${item.exactOfficialAnchors} | ${item.reviewedNoExactPublicAnchor} | ${item.terminal} | ${item.total} |`);
}
console.log('');
console.log('## Exact official row/skill anchors');
console.log('');
for (const member of [...exactRows].sort(sortByPriority)) {
  const evidence = evidenceByRow.get(member.rowId);
  console.log(`- [x] \`${member.rowId}\` — fit: \`${member.fit}\` (${evidence.fitBasis}); ${evidence.evidenceType}; ${evidence.temporalBasis}; ${evidence.sourceRef}; ${evidence.locator}`);
}
console.log('');
console.log('## Terminal rows without exact public official anchors');
console.log('');
console.log(`Audit: \`${terminalReview.sourceAudit.id}\``);
for (const member of [...reviewedNoExactRows].sort(sortByPriority)) {
  console.log(`- [~] \`${member.rowId}\` — topic: \`${topicForRow(member.rowId)}\`; fit: \`${member.fit}\`; disposition: \`reviewed_no_exact_public_anchor\``);
}
