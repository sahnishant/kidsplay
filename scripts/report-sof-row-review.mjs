import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const membershipPath = path.join(repoRoot, 'content/profile-memberships/SOF_INDIA_CLASS2.json');
const sourceRegistryPath = path.join(repoRoot, 'content/alignment-sources/registry.json');
const reviewPath = path.join(repoRoot, 'content/alignment-reviews/SOF_INDIA_CLASS2.json');

const membership = JSON.parse(await readFile(membershipPath, 'utf8'));
const sourceRegistry = JSON.parse(await readFile(sourceRegistryPath, 'utf8'));
const review = JSON.parse(await readFile(reviewPath, 'utf8'));
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

const fitCounts = members.reduce((counts, member) => {
  counts[member.fit] = (counts[member.fit] ?? 0) + 1;
  return counts;
}, {});
const evidenceRows = members.filter((member) => evidenceByRow.has(member.rowId));
const pendingRows = members.filter((member) => !evidenceByRow.has(member.rowId)).sort(sortByPriority);
const topicCounts = [...groups.entries()]
  .map(([topic, topicMembers]) => ({
    topic,
    total: topicMembers.length,
    evidenced: topicMembers.filter((member) => evidenceByRow.has(member.rowId)).length,
    pending: topicMembers.filter((member) => !evidenceByRow.has(member.rowId)).length
  }))
  .sort((left, right) => left.topic.localeCompare(right.topic));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({
    profileRef: membership.profileRef,
    provenance: membership.provenance?.status ?? 'unknown',
    totalRows: members.length,
    evidencedRows: evidenceRows.length,
    pendingRows: pendingRows.length,
    fitCounts,
    topicCounts,
    evidenced: evidenceRows.map((member) => ({
      rowId: member.rowId,
      fit: member.fit,
      topic: topicForRow(member.rowId),
      evidence: evidenceByRow.get(member.rowId)
    })),
    pending: pendingRows.map((member) => ({
      rowId: member.rowId,
      fit: member.fit,
      topic: topicForRow(member.rowId)
    }))
  }, null, 2));
  process.exit(0);
}

console.log('# SOF Class 2 row review report');
console.log('');
console.log(`Profile: \`${membership.profileRef}\``);
console.log(`Profile provenance: \`${membership.provenance?.status ?? 'unknown'}\``);
console.log(`Rows in prototype membership: **${members.length}**`);
console.log(`Rows with reproducible row/skill evidence recorded: **${evidenceRows.length}**`);
console.log(`Rows still pending row/skill evidence: **${pendingRows.length}**`);
console.log(`Fit distribution: ${Object.entries(fitCounts).map(([fit, count]) => `${fit}=${count}`).join(', ')}`);
console.log('');
console.log('## Scope sources');
console.log('');
for (const sourceRef of membership.provenance?.sourceRefs ?? []) {
  const source = sources.get(sourceRef);
  const label = source?.title ?? source?.name ?? sourceRef;
  const status = source?.reviewStatus ?? source?.status ?? 'unknown';
  console.log(`- \`${sourceRef}\` — ${label} (${status})`);
}
console.log('');
console.log('## Topic evidence coverage');
console.log('');
console.log('| Topic | Evidenced | Pending | Total |');
console.log('| --- | ---: | ---: | ---: |');
for (const item of topicCounts) {
  console.log(`| ${item.topic} | ${item.evidenced} | ${item.pending} | ${item.total} |`);
}
console.log('');
console.log('## Recorded row/skill evidence');
console.log('');
if (!evidenceRows.length) {
  console.log('- None yet.');
} else {
  for (const member of [...evidenceRows].sort(sortByPriority)) {
    const evidence = evidenceByRow.get(member.rowId);
    console.log(`- [x] \`${member.rowId}\` — fit: \`${member.fit}\`; ${evidence.evidenceType}; ${evidence.sourceRef}; ${evidence.locator}`);
  }
}
console.log('');
console.log('## Highest-priority pending rows');
console.log('');
console.log('Core rows are listed first so evidence work improves the most important profile claims before enrichment rows.');
console.log('');
for (const member of pendingRows.slice(0, 25)) {
  console.log(`- [ ] \`${member.rowId}\` — topic: \`${topicForRow(member.rowId)}\`; fit: \`${member.fit}\``);
}
console.log('');
console.log('## Remaining row-level review queue');
console.log('');
console.log('The profile itself remains prototype-unverified. A checked row means reproducible evidence has been recorded; it does not automatically promote the whole profile.');
console.log('');
for (const [topic, topicMembers] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const pendingTopicMembers = topicMembers.filter((member) => !evidenceByRow.has(member.rowId)).sort(sortByPriority);
  if (!pendingTopicMembers.length) continue;
  console.log(`### ${topic} (${pendingTopicMembers.length} pending)`);
  console.log('');
  for (const member of pendingTopicMembers) console.log(`- [ ] \`${member.rowId}\` — fit: \`${member.fit}\``);
  console.log('');
}
