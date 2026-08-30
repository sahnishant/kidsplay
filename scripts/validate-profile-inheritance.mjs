import { readFileSync } from 'node:fs';
import { allowedInheritanceScopes, createMembershipResolver, readMembershipCollections } from './profileMemberships.mjs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const taxonomy = readJson('content/taxonomies/learning.json');
const profileRegistry = readJson('content/learning-profiles/registry.json');
const allowedFits = new Set(taxonomy.placementFits ?? []);
const knownProfiles = new Set((profileRegistry.profiles ?? []).map((profile) => profile.id));
const collections = readMembershipCollections(root);
const resolver = createMembershipResolver(collections, allowedFits);
const errors = [];

for (const { name, value: membership } of collections) {
  const profileRef = membership.profileRef ?? name;
  if (!knownProfiles.has(profileRef)) errors.push(`${profileRef}: membership references unknown learning profile`);
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
    if (!resolver.byProfile.has(parent)) errors.push(`${profileRef}: inherited profile ${parent} has no membership collection`);
    const scope = inheritance?.memberScope ?? 'direct';
    if (!allowedInheritanceScopes.has(scope)) errors.push(`${profileRef}: unsupported inheritance memberScope ${scope}`);
    if (!allowedFits.has(inheritance?.fit)) errors.push(`${profileRef}: inherited profile ${parent} has unsupported fit ${inheritance?.fit}`);
    if (inheritance?.basis !== undefined && !String(inheritance.basis ?? '').trim()) {
      errors.push(`${profileRef}: inheritance basis must be non-empty when provided`);
    }
  }

  try {
    const resolved = resolver.resolve(profileRef);
    const rowIds = resolved.members.map((member) => member.rowId);
    if (new Set(rowIds).size !== rowIds.length) errors.push(`${profileRef}: resolved inheritance contains duplicate rows`);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
}

if (errors.length) {
  console.error(`Profile inheritance validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const inheritedProfiles = collections.filter(({ value }) => (value.inherits ?? []).length > 0);
const inheritedLinks = inheritedProfiles.reduce((sum, { value }) => sum + value.inherits.length, 0);
console.log(`Profile inheritance OK: ${inheritedLinks} direct inheritance link(s) across ${inheritedProfiles.length} profile(s); inherited rows remain canonical references.`);
