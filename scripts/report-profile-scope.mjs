import { existsSync, readFileSync } from 'node:fs';
import { createMembershipResolver, readMembershipCollections } from './profileMemberships.mjs';

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
const resolver = createMembershipResolver(readMembershipCollections(root));
const rawMembership = resolver.byProfile.get(profileRef);
if (!rawMembership) throw new Error(`Unknown profile membership ${profileRef}`);
const membership = resolver.resolve(profileRef);
const index = readJson('content/index/__generated-learning-index.json');
const directMemberRows = new Set((rawMembership.members ?? []).map((member) => member.rowId));
const effectiveMembersByRow = new Map((membership.members ?? []).map((member) => [member.rowId, member]));
const effectiveMemberRows = new Set(effectiveMembersByRow.keys());
const allRows = new Set(index.map((row) => row.rowId));

const families = (target.families ?? []).map((family) => {
  const groups = (family.requiredGroups ?? []).map((group) => {
    const directRows = [...directMemberRows].filter((rowId) => matchesPrefixes(rowId, group.prefixes)).sort();
    const inheritedRows = [...effectiveMembersByRow.values()]
      .filter((member) => member.origin === 'inherited' && matchesPrefixes(member.rowId, group.prefixes))
      .map((member) => member.rowId)
      .sort();
    const directReuseCandidates = [...allRows]
      .filter((rowId) => !directMemberRows.has(rowId) && matchesPrefixes(rowId, group.prefixes))
      .sort();
    return {
      id: group.id,
      label: group.label,
      representedDirectly: directRows.length > 0,
      directRows,
      inheritedRows,
      directReuseCandidates
    };
  });

  const missingGroups = groups.filter((group) => !group.representedDirectly);
  const previousPrefixes = family.previousClassPrefixes ?? [];
  const inheritedPreviousClassRows = [...effectiveMembersByRow.values()]
    .filter((member) => member.origin === 'inherited' && matchesPrefixes(member.rowId, previousPrefixes))
    .map((member) => member.rowId)
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
      inheritedRows: group.inheritedRows,
      directReuseCandidates: group.directReuseCandidates
    })),
    directCurrentRows: [...new Set(groups.flatMap((group) => group.directRows))].sort(),
    inheritedPreviousClassRows
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
    )
  };
});

const missingCurrentClassFamilies = families
  .filter((family) => !family.currentClassRepresented)
  .map((family) => ({
    section: family.section,
    id: family.id,
    label: family.label,
    missingGroups: family.missingGroups
  }));

const summary = {
  profileRef,
  academicYear: target.academicYear,
  provenance: target.provenance,
  level1Mix: target.level1Mix,
  directMembershipRows: directMemberRows.size,
  effectiveMembershipRows: effectiveMemberRows.size,
  inheritedProfileRefs: (rawMembership.inherits ?? []).map((inheritance) => inheritance.profileRef),
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
console.log(`Inherited profiles: ${summary.inheritedProfileRefs.join(', ') || 'none'}`);
console.log(`Provenance: ${target.provenance?.status ?? 'unknown'} — ${target.provenance?.placementBasis ?? 'unspecified'}`);
if (target.level1Mix) {
  console.log(`Level I scope mix: current class ${target.level1Mix.currentClassPercent}% / previous class ${target.level1Mix.previousClassPercent}%${target.level1Mix.achieversCurrentClassOnly ? '; Achievers current-class only' : ''}`);
}
console.log('Inherited previous-class rows never close a current-class scope group unless the same canonical row is intentionally placed directly in the current profile.');
console.log('');

for (const section of sections) {
  console.log(`## ${section.section}`);
  console.log('');
  console.log(`Represented families: ${section.currentClassRepresentedFamilies}/${section.totalFamilies}; required groups: ${section.representedGroups}/${section.totalGroups}`);
  console.log('| Family | Groups | Direct rows | State |');
  console.log('| --- | ---: | ---: | --- |');
  for (const family of families.filter((item) => item.section === section.section)) {
    const missing = family.missingGroups.map((group) => group.label).join(', ');
    console.log(`| ${family.label} | ${family.representedGroups}/${family.totalGroups} | ${family.directCurrentRows.length} | ${family.currentClassRepresented ? 'represented' : `GAP: ${missing}`} |`);
  }
  console.log('');
}

console.log('## Missing required groups and cheapest canonical reuse candidates');
console.log('');
if (!summary.missingCurrentGroups.length) {
  console.log('- None. Every required subgroup has an intentional direct current/shared placement.');
} else {
  for (const group of summary.missingCurrentGroups) {
    console.log(`- ${group.familyLabel} → ${group.label} (${group.section})`);
    for (const rowId of group.inheritedRows.slice(0, 5)) console.log(`  - already inherited; candidate for intentional direct reuse: ${rowId}`);
    for (const rowId of group.directReuseCandidates.filter((rowId) => !group.inheritedRows.includes(rowId)).slice(0, 5)) {
      console.log(`  - existing canonical reuse candidate: ${rowId}`);
    }
  }
}
