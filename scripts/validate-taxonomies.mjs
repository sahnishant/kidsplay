import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const taxonomy = readJson('content/taxonomies/learning.json');
const profiles = readJson('content/learning-profiles/registry.json').profiles ?? [];
const errors = [];

const uniqueIds = (items, label, idFor = (item) => item.id) => {
  const seen = new Set();
  for (const item of items) {
    const id = idFor(item);
    if (!String(id ?? '').trim()) { errors.push(`${label} contains an empty id`); continue; }
    if (seen.has(id)) errors.push(`Duplicate ${label} id ${id}`);
    seen.add(id);
  }
};

uniqueIds(taxonomy.knowledgeLevels ?? [], 'knowledgeLevel');
uniqueIds(taxonomy.skills ?? [], 'skill');
uniqueIds((taxonomy.placementFits ?? []).map((id) => ({ id })), 'placement fit');
uniqueIds(profiles, 'profile');

const ranks = new Set();
for (const level of taxonomy.knowledgeLevels ?? []) {
  if (!Number.isInteger(level.rank) || level.rank < 1) errors.push(`${level.id}: knowledge level rank must be a positive integer`);
  if (ranks.has(level.rank)) errors.push(`Duplicate knowledge level rank ${level.rank}`);
  ranks.add(level.rank);
}

for (const profile of profiles) {
  if (!/^[A-Z]{2}$/.test(profile.country ?? '')) errors.push(`${profile.id}: country must be an ISO-style two-letter uppercase code`);
  if (!['school', 'competition', 'goal'].includes(profile.pathway)) errors.push(`${profile.id}: unsupported pathway ${profile.pathway}`);
  if (!Number.isInteger(profile.grade) || profile.grade < 1) errors.push(`${profile.id}: grade must be a positive integer`);
  if (!profile.alignmentStatus) errors.push(`${profile.id}: alignmentStatus is required`);
}

if (errors.length) {
  console.error(`Taxonomy/profile validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Taxonomy/profile OK: ${(taxonomy.knowledgeLevels ?? []).length} levels, ${(taxonomy.skills ?? []).length} skills, ${profiles.length} profiles.`);
}
