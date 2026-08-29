import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const membershipPath = path.join(repoRoot, 'content/profile-memberships/SOF_INDIA_CLASS2.json');
const sourceRegistryPath = path.join(repoRoot, 'content/alignment-sources/registry.json');

const membership = JSON.parse(await readFile(membershipPath, 'utf8'));
const sourceRegistry = JSON.parse(await readFile(sourceRegistryPath, 'utf8'));
const sources = new Map((sourceRegistry.sources ?? []).map((source) => [source.id, source]));

function topicForRow(rowId) {
  const parts = rowId.split('.');
  if (parts[1] === 'choice' && parts[2]) return parts[2];
  return parts[1] || 'general';
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

console.log(`# SOF Class 2 row review report`);
console.log('');
console.log(`Profile: \`${membership.profileRef}\``);
console.log(`Profile provenance: \`${membership.provenance?.status ?? 'unknown'}\``);
console.log(`Rows in prototype membership: **${members.length}**`);
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
console.log('## Row-level review queue');
console.log('');
console.log('The profile remains prototype-unverified, so every row below is pending exact row-level evidence review.');
console.log('Record a source reference plus exact page/section/anchor outside this generated report before promoting a row mapping.');
console.log('');
for (const [topic, topicMembers] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`### ${topic} (${topicMembers.length})`);
  console.log('');
  for (const member of topicMembers) console.log(`- [ ] \`${member.rowId}\` — fit: \`${member.fit}\``);
  console.log('');
}
