import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));

function argValue(name, fallback = null) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function matchesPrefixes(rowId, prefixes) {
  return prefixes.some((prefix) => rowId.startsWith(prefix));
}

const profileRef = argValue('profile', 'SOF_INDIA_CLASS3');
const targetPath = `content/profile-scope-targets/${profileRef}.json`;
if (!existsSync(new URL(targetPath, root))) {
  throw new Error(`No scope target file found for ${profileRef}`);
}

const target = readJson(targetPath);
const membership = readJson(`content/profile-memberships/${profileRef}.json`);
const index = readJson('content/index/__generated-learning-index.json');
const memberRows = new Set((membership.members ?? []).map((member) => member.rowId));
const allRows = new Set(index.map((row) => row.rowId));

const families = (target.families ?? []).map((family) => {
  const profileRows = [...memberRows].filter((rowId) => matchesPrefixes(rowId, family.rowPrefixes));
  const reuseCandidates = [...allRows]
    .filter((rowId) => !memberRows.has(rowId) && matchesPrefixes(rowId, family.rowPrefixes))
    .sort();
  return {
    section: family.section,
    id: family.id,
    label: family.label,
    represented: profileRows.length > 0,
    profileRows: profileRows.sort(),
    reuseCandidateCount: reuseCandidates.length,
    reuseCandidates
  };
});

const sections = [...new Set(families.map((family) => family.section))].map((section) => {
  const sectionFamilies = families.filter((family) => family.section === section);
  return {
    section,
    representedFamilies: sectionFamilies.filter((family) => family.represented).length,
    totalFamilies: sectionFamilies.length,
    missingFamilies: sectionFamilies.filter((family) => !family.represented).map((family) => family.id),
    reuseCandidateFamilies: sectionFamilies.filter((family) => family.reuseCandidateCount > 0).length
  };
});

const summary = {
  profileRef,
  academicYear: target.academicYear,
  provenance: target.provenance,
  level1Mix: target.level1Mix,
  sections,
  families,
  missingFamilies: families.filter((family) => !family.represented).map((family) => ({
    section: family.section,
    id: family.id,
    label: family.label,
    reuseCandidateCount: family.reuseCandidateCount,
    reuseCandidates: family.reuseCandidates
  }))
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

console.log('# Profile scope breadth report');
console.log('');
console.log(`Profile: ${profileRef}`);
console.log(`Academic year: ${target.academicYear}`);
console.log(`Provenance: ${target.provenance?.status ?? 'unknown'} — ${target.provenance?.placementBasis ?? 'unspecified'}`);
if (target.level1Mix) {
  console.log(
    `Level 1 scope mix: current class ${target.level1Mix.currentClassPercent}% / previous class ${target.level1Mix.previousClassPercent}%` +
    `${target.level1Mix.achieversCurrentClassOnly ? '; Achievers current-class only' : ''}`
  );
}
console.log('');

for (const section of sections) {
  console.log(`## ${section.section}`);
  console.log('');
  console.log(`Represented families: ${section.representedFamilies}/${section.totalFamilies}`);
  console.log('| Family | Profile rows | Reuse candidates outside profile | State |');
  console.log('| --- | ---: | ---: | --- |');
  for (const family of families.filter((item) => item.section === section.section)) {
    console.log(
      `| ${family.label} | ${family.profileRows.length} | ${family.reuseCandidateCount} | ${family.represented ? 'represented' : 'GAP'} |`
    );
  }
  console.log('');
}

console.log('## Missing families and cheapest reuse candidates');
console.log('');
if (!summary.missingFamilies.length) {
  console.log('- None. Every declared scope family has at least one profile row.');
} else {
  for (const family of summary.missingFamilies) {
    console.log(`- ${family.label} (${family.section}) — ${family.reuseCandidateCount} existing canonical candidate(s)`);
    for (const rowId of family.reuseCandidates.slice(0, 12)) console.log(`  - ${rowId}`);
  }
}
