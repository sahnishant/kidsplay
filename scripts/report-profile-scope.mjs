import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { membershipMap, resolveMembership } from './profileMemberships.mjs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));

function argValue(name, fallback = null) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function matchesPrefixes(rowId, prefixes = []) {
  return prefixes.some((prefix) => rowId.startsWith(prefix));
}

const profileRef = argValue('profile', 'SOF_INDIA_CLASS3');
const targetPath = `content/profile-scope-targets/${profileRef}.json`;
if (!existsSync(new URL(targetPath, root))) throw new Error(`No scope target file found for ${profileRef}`);

const target = readJson(targetPath);
const rawMemberships = readdirSync(new URL('content/profile-memberships/', root))
  .filter((name) => name.endsWith('.json'))
  .sort()
  .map((name) => readJson(`content/profile-memberships/${name}`));
const membershipByRef = membershipMap(rawMemberships);
const rawMembership = membershipByRef.get(profileRef);
if (!rawMembership) throw new Error(`Unknown profile membership ${profileRef}`);
const membership = resolveMembership(membershipByRef, profileRef);
const index = readJson('content/index/__generated-learning-index.json');
const directMemberRows = new Set((rawMembership.members ?? []).map((member) => member.rowId));
const effectiveMembersByRow = new Map((membership.members ?? []).map((member) => [member.rowId, member]));
const effectiveMemberRows = new Set(effectiveMembersByRow.keys());
const allRows = new Set(index.map((row) => row.rowId));

const families = (target.families ?? []).map((family) => {
  const previousPrefixes = family.previousClassPrefixes ?? [];
  const groups = (family.requiredGroups ?? []).map((group) => {
    const directRows = [...directMemberRows].filter((rowId) => matchesPrefixes(rowId, group.prefixes)).sort();
    const includedRows = [...effectiveMemberRows]
      .filter((rowId) => !directMemberRows.has(rowId) && matchesPrefixes(rowId, group.prefixes))
      .sort();
    const directReuseCandidates = [...allRows]
      .filter((rowId) => !directMemberRows.has(rowId) && matchesPrefixes(rowId, group.prefixes))
      .sort();
    return {
      id: group.id,
      label: group.label,
      representedDirectly: directRows.length > 0,
      directRows,
      includedRows,
      directReuseCandidates
    };
  });
  const directCurrentRows = [...new Set(groups.flatMap((group) => group.directRows))].sort();
  const includedCurrentRows = [...new Set(groups.flatMap((group) => group.includedRows))].sort();
  const missingGroups = groups.filter((group) => !group.representedDirectly);
  const previousClassRows = [...effectiveMemberRows]
    .filter((rowId) => matchesPrefixes(rowId, previousPrefixes))
    .sort();
  const includedPreviousClassRows = previousClassRows.filter((rowId) =>
    effectiveMembersByRow.get(rowId)?.membershipOrigin === 'included'
  );
  const previousClassReuseCandidates = [...allRows]
    .filter((rowId) => !effectiveMemberRows.has(rowId) && matchesPrefixes(rowId, previousPrefixes))
    .sort();

  return {
    section: family.section,
    id: family.id,
    label: family.label,
    currentClassRepresented: missingGroups.length === 0,
    representedGroups: groups.length - missingGroups.length,
    totalGroups: groups.length,
    groups,
    missingGroups: missingGroups.map((group) => ({
      id: group.id,
      label: group.label,
      includedRows: group.includedRows,
      directReuseCandidates: group.directReuseCandidates
    })),
    directCurrentRows,
    includedCurrentRows,
    previousClassRows,
    includedPreviousClassRows,
    previousClassReuseCandidateCount: previousClassReuseCandidates.length,
    previousClassReuseCandidates
  };
});

const sections = [...new Set(families.map((family) => family.section))].map((section) => {
  const sectionFamilies = families.filter((family) => family.section === section);
  return {
    section,
    currentClassRepresentedFamilies: sectionFamilies.filter((family) => family.currentClassRepresented).length,
    totalFamilies: sectionFamilies.length,
    representedGroups: sectionFamilies.reduce((sum, family) => sum + family.representedGroups, 0),
    totalGroups: sectionFamilies.reduce((sum, family) => sum + family.totalGroups, 0),
    missingCurrentClassFamilies: sectionFamilies.filter((family) => !family.currentClassRepresented).map((family) => family.id),
    missingCurrentGroups: sectionFamilies.flatMap((family) =>
      family.missingGroups.map((group) => `${family.id}:${group.id}`)
    ),
    familiesWithIncludedPreviousClassRows: sectionFamilies.filter((family) => family.includedPreviousClassRows.length > 0).length
  };
});

const missingCurrentClassFamilies = families
  .filter((family) => !family.currentClassRepresented)
  .map((family) => ({
    section: family.section,
    id: family.id,
    label: family.label,
    missingGroups: family.missingGroups,
    previousClassRows: family.previousClassRows,
    previousClassReuseCandidateCount: family.previousClassReuseCandidateCount,
    previousClassReuseCandidates: family.previousClassReuseCandidates
  }));

const summary = {
  profileRef,
  academicYear: target.academicYear,
  provenance: target.provenance,
  level1Mix: target.level1Mix,
  directMembershipRows: directMemberRows.size,
  effectiveMembershipRows: effectiveMemberRows.size,
  includedProfileRefs: (rawMembership.includeProfiles ?? []).map((include) => include.profileRef),
  sections,
  families,
  missingCurrentClassFamilies,
  missingCurrentGroups: missingCurrentClassFamilies.flatMap((family) =>
    family.missingGroups.map((group) => ({ section: family.section, familyId: family.id, familyLabel: family.label, ...group }))
  )
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

console.log('# Profile scope breadth report');
console.log('');
console.log(`Profile: ${profileRef}`);
console.log(`Academic year: ${target.academicYear}`);
console.log(`Direct membership rows: ${summary.directMembershipRows}`);
console.log(`Effective membership rows: ${summary.effectiveMembershipRows}`);
console.log(`Included profiles: ${summary.includedProfileRefs.join(', ') || 'none'}`);
console.log(`Provenance: ${target.provenance?.status ?? 'unknown'} — ${target.provenance?.placementBasis ?? 'unspecified'}`);
if (target.level1Mix) {
  console.log(
    `Level 1 scope mix: current class ${target.level1Mix.currentClassPercent}% / previous class ${target.level1Mix.previousClassPercent}%` +
    `${target.level1Mix.achieversCurrentClassOnly ? '; Achievers current-class only' : ''}`
  );
}
console.log('A compound family is complete only when every required subgroup has a direct Class 3/shared placement. Included previous-class rows are reported separately.');
console.log('');

for (const section of sections) {
  console.log(`## ${section.section}`);
  console.log('');
  console.log(`Represented families: ${section.currentClassRepresentedFamilies}/${section.totalFamilies}; required groups: ${section.representedGroups}/${section.totalGroups}`);
  console.log('| Family | Required groups | Direct rows | Included matching rows | State |');
  console.log('| --- | ---: | ---: | ---: | --- |');
  for (const family of families.filter((item) => item.section === section.section)) {
    const missing = family.missingGroups.map((group) => group.label).join(', ');
    console.log(`| ${family.label} | ${family.representedGroups}/${family.totalGroups} | ${family.directCurrentRows.length} | ${family.includedCurrentRows.length} | ${family.currentClassRepresented ? 'represented' : `GAP: ${missing}`} |`);
  }
  console.log('');
}

console.log('## Missing required groups and cheapest direct-reuse candidates');
console.log('');
if (!summary.missingCurrentGroups.length) {
  console.log('- None. Every required subgroup has a direct current/shared placement.');
} else {
  for (const group of summary.missingCurrentGroups) {
    console.log(`- ${group.familyLabel} → ${group.label} (${group.section})`);
    for (const rowId of group.includedRows.slice(0, 8)) console.log(`  - already inherited; can be explicitly reused directly: ${rowId}`);
    for (const rowId of group.directReuseCandidates.filter((rowId) => !group.includedRows.includes(rowId)).slice(0, 8)) {
      console.log(`  - existing canonical direct-reuse candidate: ${rowId}`);
    }
  }
}
