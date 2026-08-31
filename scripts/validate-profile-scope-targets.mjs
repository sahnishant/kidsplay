import { existsSync, readFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const errors = [];
const directory = new URL('content/profile-scope-targets/', root);

if (!existsSync(directory)) {
  console.log('Profile scope targets OK: no scope-target directory present.');
  process.exit(0);
}

const profileRegistry = readJson('content/learning-profiles/registry.json');
const profileIds = new Set((profileRegistry.profiles ?? []).map((profile) => profile.id));
const alignmentRegistry = readJson('content/alignment-sources/registry.json');
const alignmentSourceIds = new Set((alignmentRegistry.sources ?? []).map((source) => source.id));
const files = readdirSync(directory).filter((name) => name.endsWith('.json')).sort();
let familyCount = 0;
let groupCount = 0;

for (const file of files) {
  const target = readJson(`content/profile-scope-targets/${file}`);
  const prefix = target.profileRef ?? file;
  if (!profileIds.has(target.profileRef)) errors.push(`${prefix}: unknown profileRef ${target.profileRef}`);
  if (target.schemaVersion !== 3) errors.push(`${prefix}: schemaVersion must be 3`);
  if (!String(target.academicYear ?? '').trim()) errors.push(`${prefix}: academicYear is required`);
  if (target.provenance?.status !== 'reviewed_scope_only') {
    errors.push(`${prefix}: provenance.status must be reviewed_scope_only`);
  }
  if (target.provenance?.placementBasis !== 'official_topic_headings_only') {
    errors.push(`${prefix}: placementBasis must remain official_topic_headings_only`);
  }
  for (const sourceRef of target.provenance?.sourceRefs ?? []) {
    if (!alignmentSourceIds.has(sourceRef)) errors.push(`${prefix}: unknown provenance sourceRef ${sourceRef}`);
  }

  const mix = target.level1Mix;
  if (mix) {
    if (!Number.isFinite(mix.currentClassPercent) || !Number.isFinite(mix.previousClassPercent)) {
      errors.push(`${prefix}: level1Mix percentages must be numeric`);
    } else if (mix.currentClassPercent + mix.previousClassPercent !== 100) {
      errors.push(`${prefix}: level1Mix percentages must sum to 100`);
    }
  }

  if (!Array.isArray(target.families) || target.families.length === 0) {
    errors.push(`${prefix}: families must be a non-empty array`);
    continue;
  }
  const familyIds = new Set();
  for (const family of target.families) {
    familyCount += 1;
    if (!String(family.id ?? '').trim()) errors.push(`${prefix}: family id is required`);
    if (familyIds.has(family.id)) errors.push(`${prefix}: duplicate family id ${family.id}`);
    familyIds.add(family.id);
    if (!String(family.section ?? '').trim()) errors.push(`${prefix}/${family.id}: section is required`);
    if (!String(family.label ?? '').trim()) errors.push(`${prefix}/${family.id}: label is required`);

    const current = family.currentClassPrefixes ?? [];
    const shared = family.sharedPrefixes ?? [];
    const previous = family.previousClassPrefixes ?? [];
    if (![current, shared, previous].every(Array.isArray)) {
      errors.push(`${prefix}/${family.id}: prefix fields must be arrays`);
      continue;
    }
    if (current.length + shared.length === 0) {
      errors.push(`${prefix}/${family.id}: requires currentClassPrefixes or sharedPrefixes`);
    }
    for (const rowPrefix of [...current, ...shared, ...previous]) {
      if (typeof rowPrefix !== 'string' || !rowPrefix.startsWith('kr.')) {
        errors.push(`${prefix}/${family.id}: invalid row prefix ${String(rowPrefix)}`);
      }
    }

    if (!Array.isArray(family.requiredGroups) || family.requiredGroups.length === 0) {
      errors.push(`${prefix}/${family.id}: requiredGroups must be a non-empty array`);
      continue;
    }
    const groupIds = new Set();
    for (const group of family.requiredGroups) {
      groupCount += 1;
      if (!String(group.id ?? '').trim()) errors.push(`${prefix}/${family.id}: group id is required`);
      if (groupIds.has(group.id)) errors.push(`${prefix}/${family.id}: duplicate group id ${group.id}`);
      groupIds.add(group.id);
      if (!String(group.label ?? '').trim()) errors.push(`${prefix}/${family.id}/${group.id}: label is required`);
      if (!Array.isArray(group.prefixes) || group.prefixes.length === 0) {
        errors.push(`${prefix}/${family.id}/${group.id}: prefixes must be a non-empty array`);
        continue;
      }
      for (const rowPrefix of group.prefixes) {
        if (typeof rowPrefix !== 'string' || !rowPrefix.startsWith('kr.')) {
          errors.push(`${prefix}/${family.id}/${group.id}: invalid row prefix ${String(rowPrefix)}`);
        }
      }
    }
  }
}

if (errors.length) {
  console.error(`Profile scope-target validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Profile scope targets OK: ${files.length} target file(s), ${familyCount} topic family/families, ${groupCount} required subgroup(s), provenance and Level-I mix guarded.`);
}
