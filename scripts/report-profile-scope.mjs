import { existsSync, readFileSync } from 'node:fs';

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
const membership = readJson(`content/profile-memberships/${profileRef}.json`);
const index = readJson('content/index/__generated-learning-index.json');
const memberRows = new Set((membership.members ?? []).map((member) => member.rowId));
const allRows = new Set(index.map((row) => row.rowId));

const families = (target.families ?? []).map((family) => {
  const currentPrefixes = [...(family.currentClassPrefixes ?? []), ...(family.sharedPrefixes ?? [])];
  const previousPrefixes = family.previousClassPrefixes ?? [];
  const currentRows = [...memberRows]
    .filter((rowId) => matchesPrefixes(rowId, currentPrefixes))
    .sort();
  const previousClassRows = [...memberRows]
    .filter((rowId) => matchesPrefixes(rowId, previousPrefixes))
    .sort();
  const currentReuseCandidates = [...allRows]
    .filter((rowId) => !memberRows.has(rowId) && matchesPrefixes(rowId, currentPrefixes))
    .sort();
  const previousClassReuseCandidates = [...allRows]
    .filter((rowId) => !memberRows.has(rowId) && matchesPrefixes(rowId, previousPrefixes))
    .sort();

  return {
    section: family.section,
    id: family.id,
    label: family.label,
    currentClassRepresented: currentRows.length > 0,
    currentRows,
    previousClassRows,
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
    previousClassReuseCandidateCount: family.previousClassReuseCandidateCount,
    previousClassReuseCandidates: family.previousClassReuseCandidates
  }));

const summary = {
  profileRef,
  academicYear: target.academicYear,
  provenance: target.provenance,
  level1Mix: target.level1Mix,
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
console.log(`Provenance: ${target.provenance?.status ?? 'unknown'} — ${target.provenance?.placementBasis ?? 'unspecified'}`);
if (target.level1Mix) {
  console.log(
    `Level 1 scope mix: current class ${target.level1Mix.currentClassPercent}% / previous class ${target.level1Mix.previousClassPercent}%` +
    `${target.level1Mix.achieversCurrentClassOnly ? '; Achievers current-class only' : ''}`
  );
}
console.log('Previous-class rows are tracked separately and never close a current-class scope gap.');
console.log('');

for (const section of sections) {
  console.log(`## ${section.section}`);
  console.log('');
  console.log(`Current-class represented families: ${section.currentClassRepresentedFamilies}/${section.totalFamilies}`);
  console.log('| Family | Current rows | Previous-class rows | Previous-class candidates | Current state |');
  console.log('| --- | ---: | ---: | ---: | --- |');
  for (const family of families.filter((item) => item.section === section.section)) {
    console.log(
      `| ${family.label} | ${family.currentRows.length} | ${family.previousClassRows.length} | ${family.previousClassReuseCandidateCount} | ${family.currentClassRepresented ? 'represented' : 'CURRENT GAP'} |`
    );
  }
  console.log('');
}

console.log('## Missing current-class families and cheapest reuse opportunities');
console.log('');
if (!missingCurrentClassFamilies.length) {
  console.log('- None. Every declared current-class scope family has at least one profile row.');
} else {
  for (const family of missingCurrentClassFamilies) {
    console.log(
      `- ${family.label} (${family.section}) — current-class candidates=${family.currentReuseCandidateCount}; ` +
      `previous-class reuse candidates=${family.previousClassReuseCandidateCount}`
    );
    for (const rowId of family.previousClassReuseCandidates.slice(0, 12)) console.log(`  - previous-class reuse: ${rowId}`);
    for (const rowId of family.currentReuseCandidates.slice(0, 12)) console.log(`  - current-class candidate: ${rowId}`);
  }
}
