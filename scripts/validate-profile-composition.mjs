import { readdirSync, readFileSync } from 'node:fs';
import { membershipMap, resolveMembership } from './profileMemberships.mjs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const memberships = readdirSync(new URL('content/profile-memberships/', root))
  .filter((name) => name.endsWith('.json'))
  .sort()
  .map((name) => readJson(`content/profile-memberships/${name}`));
const taxonomy = readJson('content/taxonomies/learning.json');
const allowedFits = new Set(taxonomy.placementFits ?? []);
const byRef = membershipMap(memberships);
const errors = [];

for (const membership of memberships) {
  const profileRef = membership.profileRef ?? '<unknown-profile>';
  const includes = membership.includeProfiles ?? [];
  if (!Array.isArray(includes)) {
    errors.push(`${profileRef}: includeProfiles must be an array`);
    continue;
  }
  const seen = new Set();
  for (const include of includes) {
    if (!include || typeof include !== 'object') {
      errors.push(`${profileRef}: includeProfiles entries must be objects`);
      continue;
    }
    if (typeof include.profileRef !== 'string' || !include.profileRef.trim()) {
      errors.push(`${profileRef}: included profileRef is required`);
      continue;
    }
    if (include.profileRef === profileRef) errors.push(`${profileRef}: profile cannot include itself`);
    if (seen.has(include.profileRef)) errors.push(`${profileRef}: duplicate included profile ${include.profileRef}`);
    seen.add(include.profileRef);
    if (!byRef.has(include.profileRef)) errors.push(`${profileRef}: unknown included profile ${include.profileRef}`);
    if (include.mode !== undefined && include.mode !== 'direct') {
      errors.push(`${profileRef}/${include.profileRef}: only mode=direct is supported`);
    }
    if (include.fit !== undefined && !allowedFits.has(include.fit)) {
      errors.push(`${profileRef}/${include.profileRef}: unsupported fit override ${include.fit}`);
    }
    if (typeof include.reason !== 'string' || !include.reason.trim()) {
      errors.push(`${profileRef}/${include.profileRef}: inclusion reason is required`);
    }
  }

  try {
    resolveMembership(byRef, profileRef);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
}

if (errors.length) {
  console.error(`Profile composition failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const composed = memberships.filter((membership) => (membership.includeProfiles?.length ?? 0) > 0);
  console.log(`Profile composition OK: ${memberships.length} membership collection(s), ${composed.length} composed profile(s), direct-only inheritance with cycle guards.`);
}
