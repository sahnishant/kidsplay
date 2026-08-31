import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const readItems = (directory) => readdirSync(new URL(directory, root))
  .filter((name) => name.endsWith('.json'))
  .sort()
  .flatMap((name) => {
    const value = readJson(`${directory}${name}`);
    return Array.isArray(value) ? value : [value];
  });

const PROFILES = [2, 3, 4, 5, 6].map((grade) => `SOF_INDIA_CLASS${grade}`);
const UPPER_PRIMARY = [3, 4, 5, 6];
const failures = [];

function runJson(script, args) {
  return JSON.parse(execFileSync(process.execPath, [script, ...args, '--json'], {
    cwd: new URL('../', import.meta.url),
    encoding: 'utf8'
  }));
}

const maturity = runJson('scripts/report-profile-maturity.mjs', [`--profiles=${PROFILES.join(',')}`]);
const questions = readItems('content/questions/');

for (const report of maturity.profiles ?? []) {
  if (report.runnable?.uncoveredRows !== 0) {
    failures.push(`${report.profileRef}: ${report.runnable?.uncoveredRows ?? 'unknown'} membership row(s) are not runnable`);
  }
  if (report.free?.uncoveredRows !== 0) {
    failures.push(`${report.profileRef}: ${report.free?.uncoveredRows ?? 'unknown'} membership row(s) are missing free-foundation delivery`);
  }
  if (!report.assessment) {
    failures.push(`${report.profileRef}: assessment blueprint is missing`);
  } else {
    for (const section of report.assessment.sections ?? []) {
      if (!section.readyByCount) {
        failures.push(`${report.profileRef}: assessment section ${section.id} has ${section.candidatePool}/${section.required} candidates`);
      }
    }
  }
}

for (const grade of UPPER_PRIMARY) {
  const profileRef = `SOF_INDIA_CLASS${grade}`;
  const previousProfileRef = `SOF_INDIA_CLASS${grade - 1}`;
  const report = maturity.profiles.find((item) => item.profileRef === profileRef);
  const scope = runJson('scripts/report-profile-scope.mjs', [`--profile=${profileRef}`]);
  const rawMembership = readJson(`content/profile-memberships/${profileRef}.json`);
  const directRows = new Set((rawMembership.members ?? []).map((member) => member.rowId));
  const blueprint = readItems('content/assessment-blueprints/').find((item) => item.profileRef === profileRef);
  const achieverSection = (blueprint?.sections ?? []).find((section) => section.selector === 'achiever_hots');
  const scienceSection = (blueprint?.sections ?? []).find((section) => section.selector === 'science_core');
  const policy = blueprint?.selectionPolicy;

  if (!(rawMembership.inherits ?? []).some((item) => item.profileRef === previousProfileRef && item.memberScope === 'direct')) {
    failures.push(`${profileRef}: must inherit the previous class direct rows for the published Level-I review component`);
  }
  if ((scope.missingCurrentGroups ?? []).length > 0) {
    failures.push(`${profileRef}: ${scope.missingCurrentGroups.length} required current-class scope group(s) are missing`);
  }
  if (scope.level1Mix?.currentClassPercent !== 60 || scope.level1Mix?.previousClassPercent !== 40 || scope.level1Mix?.achieversCurrentClassOnly !== true) {
    failures.push(`${profileRef}: scope target must preserve the 60/40 Level-I rule and current-class-only Achievers`);
  }
  if (!policy || policy.achieversCurrentClassOnly !== true) {
    failures.push(`${profileRef}: assessment selection policy must mark Achievers current-class-only`);
  }
  if (scienceSection && policy) {
    if (policy.currentClassScienceCount + policy.previousClassScienceCount !== scienceSection.count) {
      failures.push(`${profileRef}: science selection counts do not add up to the Science section size`);
    }
    if (policy.currentClassScienceCount * 100 !== scienceSection.count * 60 || policy.previousClassScienceCount * 100 !== scienceSection.count * 40) {
      failures.push(`${profileRef}: Science section selection policy is not exactly 60% current / 40% previous class`);
    }
  }

  const currentClassHots = questions.filter((question) => {
    const refs = question.knowledgeRefs ?? [];
    return question.authoring?.source === 'kidsplay-editorial-hots'
      && refs.length > 0
      && refs.every((rowId) => directRows.has(rowId))
      && refs.some((rowId) => rowId.startsWith(`kr.sof${grade}.`));
  });
  if (achieverSection && currentClassHots.length < achieverSection.count) {
    failures.push(`${profileRef}: only ${currentClassHots.length}/${achieverSection.count} Achievers candidates are tied exclusively to current direct Class ${grade} rows`);
  }

  const foreignDirectScienceRows = (rawMembership.members ?? [])
    .map((member) => member.rowId)
    .filter((rowId) => /^kr\.sof\d+\./.test(rowId) && !rowId.startsWith(`kr.sof${grade}.`));
  if (foreignDirectScienceRows.length > 0) {
    failures.push(`${profileRef}: ${foreignDirectScienceRows.length} previous/foreign class science row(s) were copied into direct membership instead of inherited canonically`);
  }

  if (!report?.membership?.inheritedFromProfiles?.includes(previousProfileRef)) {
    failures.push(`${profileRef}: resolved maturity report does not expose ${previousProfileRef} inheritance`);
  }
}

if (failures.length) {
  console.error(`Production profile maturity validation failed with ${failures.length} error(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Production profile maturity OK: ${PROFILES.join(', ')} have runnable/free closure; Classes 3-6 have direct scope closure, canonical previous-class inheritance, 60/40 Science selection, current-class-only Achievers depth and direct-membership isolation.`);
