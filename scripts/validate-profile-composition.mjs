import { readFileSync } from 'node:fs';
import { allowedInheritanceScopes, createMembershipResolver, readMembershipCollections } from './profileMemberships.mjs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const taxonomy = readJson('content/taxonomies/learning.json');
const allowedFits = new Set(taxonomy.placementFits ?? []);
const collections = readMembershipCollections(root);
const resolver = createMembershipResolver(collections, allowedFits);
const errors = [];

for (const { name, value: membership } of collections) {
  const profileRef = membership.profileRef ?? name;
  if (membership.inherits !== undefined && !Array.isArray(membership.inherits)) {
    errors.push(`${profileRef}: inherits must be an array when provided`);
    continue;
  }

  const seenParents = new Set();
  for (const inheritance of membership.inherits ?? []) {
    const parent = inheritance?.profileRef;
    if (!String(parent ?? '').trim()) errors.push(`${profileRef}: inheritance requires profileRef`);
    if (parent === profileRef) errors.push(`${profileRef}: cannot inherit itself`);
    if (seenParents.has(parent)) errors.push(`${profileRef}: duplicate inherited profile ${parent}`);
    seenParents.add(parent);
    if (!resolver.byProfile.has(parent)) errors.push(`${profileRef}: unknown inherited profile ${parent}`);
    const scope = inheritance?.memberScope ?? 'direct';
    if (!allowedInheritanceScopes.has(scope)) errors.push(`${profileRef}: unsupported inheritance memberScope ${scope}`);
    if (!allowedFits.has(inheritance?.fit)) errors.push(`${profileRef}: unsupported inheritance fit ${inheritance?.fit}`);
    if (!String(inheritance?.basis ?? '').trim()) errors.push(`${profileRef}: inheritance from ${parent} requires a non-empty basis`);
  }

  try {
    const resolved = resolver.resolve(profileRef);
    const rowIds = resolved.members.map((member) => member.rowId);
    if (new Set(rowIds).size !== rowIds.length) errors.push(`${profileRef}: resolved composition contains duplicate rows`);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
}

if (errors.length) {
  console.error(`Profile composition failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const composed = collections.filter(({ value }) => (value.inherits?.length ?? 0) > 0);
  const links = composed.reduce((sum, { value }) => sum + value.inherits.length, 0);
  console.log(`Profile composition OK: ${collections.length} membership collection(s), ${composed.length} composed profile(s), ${links} direct inheritance link(s), canonical rows deduplicated.`);
}
