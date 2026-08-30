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
if (!existsSync(new URL(targetPath, root))) {
  throw new Error(`No scope target file found for ${profileRef}`);
}

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
  const currentPrefixes = [...(family.currentClassPrefixes ?? []), ...(family.sharedPrefixes ?? [])];
  const previousPrefixes = family.previousClassPrefixes ?? [];
  const currentRows = [...effectiveMemberRows]
    .filter((rowId) => matchesPrefixes(rowId, currentPrefixes))
    .sort();
  const directCurrentRows = currentRows.filter((rowId) => directMemberRows.has(rowId));
  const includedCurrentRows = currentRows.filter((rowId) => !directMemberRows.has(rowId));
  const previousClassRows = [...effectiveMemberRows]
    .filter((rowId) => matchesPrefixes(rowId, previousPrefixes))
    .sort();
  const includedPreviousClassRows = previousClassRows.filter((rowId) =>
    effectiveMembersByRow.get(rowId)?.membershipOrigin === 'included'
  );
  const currentReuseCandidates = [...allRows]
    .filter((rowId) => !effectiveMemberRows.has(rowId) && matchesPrefixes(rowId, currentPrefixes))
    .sort();
  const previousClassReuseCandidates = [...allRows]
    .filter((rowId) => !effectiveMemberRows.has(rowId) && matchesPrefixes(rowId, previousPrefixes))
    .sort();

  return {
    section: family.section,
    id: family.id,
    label: family.label,
    currentClassRepresented: currentRows.length > 0,
    currentRows,
    directCurrentRows,
    includedCurrentRows,
    previousClassRows,
    includedPreviousClassRows,
    currentReuseCandidateCount: currentReuseCandidates.length,
    currentReuseCandidates,
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
    missingCurrentClassFamilies: sectionFamilies
      .filter((family) => !family.currentClassRepresented)
      .map((family) => family.id),
    familiesWithPreviousClassRows: sectionFamilies.filter((family) => family.previousClassRows.length > 0).length,
    familiesWithIncludedPreviousClassRows: sectionFamilies
      .filter((family) => family.includedPreviousClassRows.length > 0).length,
    familiesWithPreviousClassReuseCandidates: sectionFamilies
      .filter((family) => family.previousClassReuseCandidateCount > 0).length
  };
});

const missingCurrentClassFamilies = families
  .filter((family) => !family.currentClassRepresented)
  .map((family) => ({
    section: family.section,
    id: family.id,
    label: family.label,
    currentReuseCandidateCount: family.currentReuseCandidateCount,
    currentReuseCandidates: family.currentReuseCandidates,
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
  missingCurrentClassFamilies
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
console.log('Previous-class rows are tracked separately and never close a current-class science scope gap.');
console.log('');

for (const section of sections) {
  console.log(`## ${section.section}`);
  console.log('');
  console.log(`Current-class represented families: ${section.currentClassRepresentedFamilies}/${section.totalFamilies}`);
  console.log('| Family | Direct current | Included/shared current | Previous-class rows | Previous candidates | Current state |');
  console.log('| --- | ---: | ---: | ---: | ---: | --- |');
  for (const family of families.filter((item) => item.section === section.section)) {
    console.log(
      `| ${family.label} | ${family.directCurrentRows.length} | ${family.includedCurrentRows.length} | ` +
      `${family.previousClassRows.length} | ${family.previousClassReuseCandidateCount} | ` +
      `${family.currentClassRepresented ? 'represented' : 'CURRENT GAP'} |`
    );
  }
  console.log('');
}

console.log('## Missing current-class families and reuse context');
console.log('');
if (!missingCurrentClassFamilies.length) {
  console.log('- None. Every declared current-class scope family has at least one effective current/shared row.');
} else {
  for (const family of missingCurrentClassFamilies) {
    console.log(
      `- ${family.label} (${family.section}) — previous-class rows already included=${family.previousClassRows.length}; ` +
      `current-class candidates=${family.currentReuseCandidateCount}; remaining previous-class candidates=${family.previousClassReuseCandidateCount}`
    );
    for (const rowId of family.currentReuseCandidates.slice(0, 12)) console.log(`  - current-class candidate: ${rowId}`);
    for (const rowId of family.previousClassReuseCandidates.slice(0, 12)) console.log(`  - unused previous-class candidate: ${rowId}`);
  }
}
