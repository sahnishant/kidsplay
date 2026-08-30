import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const readJsonObjects = (directory) => readdirSync(new URL(directory, root))
  .filter((name) => name.endsWith('.json'))
  .sort()
  .flatMap((name) => {
    const value = readJson(`${directory}${name}`);
    return (Array.isArray(value) ? value : [value]).map((item) => ({ item, file: name }));
  });

function argValue(name, fallback = null) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function topicForRow(rowId) {
  const parts = String(rowId).split('.');
  if (parts[1] === 'choice' && parts[2]) return parts[2];
  return parts[1] || 'general';
}

function increment(map, key, amount = 1) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function prioritizedRows(rows) {
  const fitPriority = { core: 0, review: 1, stretch: 2, challenge: 3 };
  return [...rows].sort((left, right) => {
    const fitDelta = (fitPriority[left.fit] ?? 99) - (fitPriority[right.fit] ?? 99);
    if (fitDelta) return fitDelta;
    const topicDelta = left.topic.localeCompare(right.topic);
    return topicDelta || left.rowId.localeCompare(right.rowId);
  });
}

function rowRecordsForSource(source, file) {
  const records = [];
  const push = (row, entry = null) => {
    if (!row?.rowId) return;
    records.push({
      rowId: row.rowId,
      sourceId: source.id ?? 'unknown',
      sourceFile: file,
      sourceKind: source.kind ?? 'unknown',
      subject: source.subject ?? null,
      topic: source.topic ?? topicForRow(row.rowId),
      knowledgeLevel: row.meta?.knowledgeLevel ?? source.meta?.knowledgeLevel ?? null,
      skills: [...new Set([...(row.meta?.skills ?? []), ...(source.meta?.skills ?? [])])].sort(),
      conceptIds: [...new Set([...(row.conceptIds ?? []), ...(source.conceptIds ?? []), ...(entry?.conceptIds ?? [])])].sort()
    });
  };

  push(source);
  for (const entry of source.entries ?? []) push(entry, entry);
  for (const row of source.rows ?? []) push(row, row);
  return records;
}

function isLogicalReasoningQuestion(question) {
  const refs = question.knowledgeRefs ?? [];
  return refs.length > 0 && refs.every((rowId) => topicForRow(rowId) === 'reasoning');
}

function isAchieverQuestion(question) {
  return question.authoring?.source === 'kidsplay-editorial-hots' && !isLogicalReasoningQuestion(question);
}

function matchesAssessmentSelector(question, selector) {
  if (selector === 'logical_reasoning') return isLogicalReasoningQuestion(question);
  if (selector === 'achiever_hots') return isAchieverQuestion(question);
  return !isLogicalReasoningQuestion(question) && !isAchieverQuestion(question);
}

const profileRef = argValue('profile', 'SOF_INDIA_CLASS2');
const questions = readJsonObjects('content/questions/').flatMap(({ item }) => Array.isArray(item) ? item : [item]);
const memberships = readJsonObjects('content/profile-memberships/').map(({ item }) => item);
const membership = memberships.find((item) => item.profileRef === profileRef);
if (!membership) {
  throw new Error(`Unknown profile membership ${profileRef}`);
}

const profilesRegistry = readJson('content/learning-profiles/registry.json');
const profile = (profilesRegistry.profiles ?? []).find((item) => item.id === profileRef) ?? null;
const knowledgeRows = readJsonObjects('content/knowledge/')
  .flatMap(({ item, file }) => rowRecordsForSource(item, file));
const knowledgeByRow = new Map(knowledgeRows.map((row) => [row.rowId, row]));

const membershipProfilesByRow = new Map();
for (const item of memberships) {
  for (const member of item.members ?? []) {
    const profiles = membershipProfilesByRow.get(member.rowId) ?? new Set();
    profiles.add(item.profileRef);
    membershipProfilesByRow.set(member.rowId, profiles);
  }
}

const questionById = new Map(questions.map((question) => [question.id, question]));
const freePacks = readJsonObjects('content/packs/')
  .map(({ item }) => item)
  .filter((pack) => pack.kind === 'learning_pack' && pack.access?.type === 'free');
const freeQuestionIds = new Set(freePacks.flatMap((pack) => pack.questionRefs ?? []));
const freeQuestions = [...freeQuestionIds].map((questionId) => questionById.get(questionId)).filter(Boolean);

const memberByRow = new Map((membership.members ?? []).map((member) => [member.rowId, member]));
const profileRows = new Set(memberByRow.keys());
const profileQuestions = questions.filter((question) => {
  const refs = question.knowledgeRefs ?? [];
  return refs.length > 0 && refs.every((rowId) => profileRows.has(rowId));
});
const freeProfileQuestions = freeQuestions.filter((question) => {
  const refs = question.knowledgeRefs ?? [];
  return refs.length > 0 && refs.every((rowId) => profileRows.has(rowId));
});

const profileQuestionCountByRow = new Map();
const freeQuestionCountByRow = new Map();
const engineFamiliesByRow = new Map();
const difficultyByRow = new Map();
const engineCounts = new Map();
const difficultyCounts = new Map();
const authoringSourceCounts = new Map();

for (const question of profileQuestions) {
  const engine = question.interaction?.type ?? 'unknown';
  const difficulty = String(question.difficulty ?? 'unknown');
  increment(engineCounts, engine);
  increment(difficultyCounts, difficulty);
  increment(authoringSourceCounts, question.authoring?.source ?? 'unknown');
  for (const rowId of question.knowledgeRefs ?? []) {
    increment(profileQuestionCountByRow, rowId);
    const engines = engineFamiliesByRow.get(rowId) ?? new Set();
    engines.add(engine);
    engineFamiliesByRow.set(rowId, engines);
    const difficulties = difficultyByRow.get(rowId) ?? new Set();
    difficulties.add(difficulty);
    difficultyByRow.set(rowId, difficulties);
  }
}
for (const question of freeProfileQuestions) {
  for (const rowId of question.knowledgeRefs ?? []) increment(freeQuestionCountByRow, rowId);
}

const gradeToken = profile?.grade ? `class${profile.grade}` : null;
const rows = [...memberByRow.values()].map((member) => {
  const knowledge = knowledgeByRow.get(member.rowId);
  const membershipProfiles = [...(membershipProfilesByRow.get(member.rowId) ?? new Set())].sort();
  const sourceId = knowledge?.sourceId ?? null;
  const gradeSpecificSource = Boolean(gradeToken && sourceId && sourceId.toLowerCase().includes(gradeToken));
  return {
    ...member,
    topic: knowledge?.topic ?? topicForRow(member.rowId),
    sourceId,
    sourceFile: knowledge?.sourceFile ?? null,
    knowledgeLevel: knowledge?.knowledgeLevel ?? null,
    skills: knowledge?.skills ?? [],
    membershipProfiles,
    reusedAcrossProfiles: membershipProfiles.length > 1,
    gradeSpecificSource,
    profileQuestions: profileQuestionCountByRow.get(member.rowId) ?? 0,
    freeQuestions: freeQuestionCountByRow.get(member.rowId) ?? 0,
    engineFamilies: [...(engineFamiliesByRow.get(member.rowId) ?? new Set())].sort(),
    difficultyLevels: [...(difficultyByRow.get(member.rowId) ?? new Set())].sort()
  };
});

const coveredRows = rows.filter((row) => row.profileQuestions > 0);
const uncoveredRows = rows.filter((row) => row.profileQuestions === 0);
const freeCoveredRows = rows.filter((row) => row.freeQuestions > 0);
const freeUncoveredRows = rows.filter((row) => row.freeQuestions === 0);
const multiFormatRows = rows.filter((row) => row.engineFamilies.length >= 2);
const shallowRows = rows.filter((row) => row.profileQuestions > 0 && row.engineFamilies.length < 2);
const reusedRows = rows.filter((row) => row.reusedAcrossProfiles);
const exclusiveRows = rows.filter((row) => !row.reusedAcrossProfiles);
const gradeSpecificRows = rows.filter((row) => row.gradeSpecificSource);
const sharedSourceRows = rows.filter((row) => row.sourceId && !row.gradeSpecificSource);

const topicStats = [...new Set(rows.map((row) => row.topic))]
  .sort((left, right) => left.localeCompare(right))
  .map((topic) => {
    const topicRows = rows.filter((row) => row.topic === topic);
    return {
      topic,
      totalRows: topicRows.length,
      runnableRows: topicRows.filter((row) => row.profileQuestions > 0).length,
      freeRows: topicRows.filter((row) => row.freeQuestions > 0).length,
      multiFormatRows: topicRows.filter((row) => row.engineFamilies.length >= 2).length,
      reusedRows: topicRows.filter((row) => row.reusedAcrossProfiles).length,
      questionCount: profileQuestions.filter((question) =>
        (question.knowledgeRefs ?? []).some((rowId) => (knowledgeByRow.get(rowId)?.topic ?? topicForRow(rowId)) === topic)
      ).length
    };
  });

const skillNames = [...new Set(rows.flatMap((row) => row.skills))].sort();
const skillStats = skillNames.map((skill) => {
  const skillRows = rows.filter((row) => row.skills.includes(skill));
  return {
    skill,
    totalRows: skillRows.length,
    runnableRows: skillRows.filter((row) => row.profileQuestions > 0).length,
    freeRows: skillRows.filter((row) => row.freeQuestions > 0).length,
    multiFormatRows: skillRows.filter((row) => row.engineFamilies.length >= 2).length
  };
});

const sourceIds = [...new Set(rows.map((row) => row.sourceId).filter(Boolean))].sort();
const sourceStats = sourceIds.map((sourceId) => {
  const sourceRows = rows.filter((row) => row.sourceId === sourceId);
  return {
    sourceId,
    totalRows: sourceRows.length,
    runnableRows: sourceRows.filter((row) => row.profileQuestions > 0).length,
    freeRows: sourceRows.filter((row) => row.freeQuestions > 0).length,
    multiFormatRows: sourceRows.filter((row) => row.engineFamilies.length >= 2).length,
    reusedRows: sourceRows.filter((row) => row.reusedAcrossProfiles).length,
    gradeSpecificSource: sourceRows.every((row) => row.gradeSpecificSource)
  };
});

const blueprints = readJsonObjects('content/assessment-blueprints/')
  .map(({ item }) => item)
  .filter((blueprint) => blueprint.profileRef === profileRef)
  .map((blueprint) => ({
    id: blueprint.id,
    academicYear: blueprint.academicYear,
    totalQuestions: blueprint.totalQuestions,
    totalMarks: blueprint.totalMarks,
    sections: (blueprint.sections ?? []).map((section) => {
      const availableQuestions = profileQuestions.filter((question) => matchesAssessmentSelector(question, section.selector)).length;
      return {
        id: section.id,
        selector: section.selector,
        requiredQuestions: section.count,
        availableQuestions,
        ready: availableQuestions >= section.count
      };
    })
  }));
for (const blueprint of blueprints) {
  blueprint.ready = blueprint.sections.every((section) => section.ready);
}

const summarizeRows = (items) => prioritizedRows(items).map((row) => ({
  rowId: row.rowId,
  fit: row.fit,
  topic: row.topic,
  sourceId: row.sourceId,
  profileQuestions: row.profileQuestions,
  freeQuestions: row.freeQuestions,
  engineFamilies: row.engineFamilies,
  membershipProfiles: row.membershipProfiles
}));

const summary = {
  profileRef: membership.profileRef,
  profile: profile ? { grade: profile.grade, pathway: profile.pathway, country: profile.country, alignmentStatus: profile.alignmentStatus } : null,
  membershipRows: rows.length,
  runnableProfileQuestions: profileQuestions.length,
  coveredProfileRows: coveredRows.length,
  uncoveredProfileRows: uncoveredRows.length,
  freePackCount: freePacks.length,
  freePackQuestions: freeProfileQuestions.length,
  freeCoveredProfileRows: freeCoveredRows.length,
  freeUncoveredProfileRows: freeUncoveredRows.length,
  reusedAcrossProfilesRows: reusedRows.length,
  exclusiveToProfileRows: exclusiveRows.length,
  gradeSpecificSourceRows: gradeSpecificRows.length,
  sharedCanonicalSourceRows: sharedSourceRows.length,
  multiFormatRows: multiFormatRows.length,
  shallowRunnableRows: shallowRows.length,
  reasoningQuestions: profileQuestions.filter((question) => (question.knowledgeRefs?.length ?? 0) >= 2 && Number(question.difficulty ?? 0) >= 3).length,
  hotsQuestions: profileQuestions.filter((question) => question.authoring?.source === 'kidsplay-editorial-hots').length,
  explicitVisualStimulusQuestions: profileQuestions.filter((question) => Boolean(question.stimulus)).length,
  engineCounts: Object.fromEntries([...engineCounts.entries()].sort()),
  difficultyCounts: Object.fromEntries([...difficultyCounts.entries()].sort()),
  authoringSourceCounts: Object.fromEntries([...authoringSourceCounts.entries()].sort()),
  topicStats,
  skillStats,
  sourceStats,
  assessmentBlueprints: blueprints,
  gaps: {
    uncoveredRows: summarizeRows(uncoveredRows),
    freeUncoveredRows: summarizeRows(freeUncoveredRows),
    shallowRunnableRows: summarizeRows(shallowRows)
  }
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

const ratio = (value, total) => `${value}/${total}${total ? ` (${(value / total * 100).toFixed(1)}%)` : ''}`;
console.log('# Learning profile maturity report');
console.log('');
console.log(`Profile: ${summary.profileRef}${profile?.grade ? ` (grade ${profile.grade})` : ''}`);
console.log(`Runnable profile questions: ${summary.runnableProfileQuestions}`);
console.log(`Runnable row coverage: ${ratio(summary.coveredProfileRows, summary.membershipRows)}`);
console.log(`Free row coverage: ${ratio(summary.freeCoveredProfileRows, summary.membershipRows)}`);
console.log(`Multi-format row coverage: ${ratio(summary.multiFormatRows, summary.membershipRows)}`);
console.log(`Rows reused across profiles: ${ratio(summary.reusedAcrossProfilesRows, summary.membershipRows)}`);
console.log(`Rows exclusive to this profile: ${summary.exclusiveToProfileRows}`);
console.log(`Rows from grade-specific knowledge sources: ${summary.gradeSpecificSourceRows}`);
console.log(`Rows from shared canonical sources: ${summary.sharedCanonicalSourceRows}`);
console.log(`Reasoning questions: ${summary.reasoningQuestions}; HOTS questions: ${summary.hotsQuestions}; explicit visual-stimulus questions: ${summary.explicitVisualStimulusQuestions}`);
console.log(`Engine mix: ${Object.entries(summary.engineCounts).map(([engine, count]) => `${engine}=${count}`).join(', ') || 'none'}`);
console.log(`Difficulty mix: ${Object.entries(summary.difficultyCounts).map(([difficulty, count]) => `${difficulty}=${count}`).join(', ') || 'none'}`);
console.log('');
console.log('## Topic maturity');
console.log('');
console.log('| Topic | Runnable | Free | Multi-format | Reused | Total rows | Questions |');
console.log('| --- | ---: | ---: | ---: | ---: | ---: | ---: |');
for (const item of topicStats) {
  console.log(`| ${item.topic} | ${item.runnableRows} | ${item.freeRows} | ${item.multiFormatRows} | ${item.reusedRows} | ${item.totalRows} | ${item.questionCount} |`);
}
console.log('');
console.log('## Skill maturity');
console.log('');
if (!skillStats.length) {
  console.log('- No row-level skill metadata found.');
} else {
  console.log('| Skill | Runnable | Free | Multi-format | Total rows |');
  console.log('| --- | ---: | ---: | ---: | ---: |');
  for (const item of skillStats) {
    console.log(`| ${item.skill} | ${item.runnableRows} | ${item.freeRows} | ${item.multiFormatRows} | ${item.totalRows} |`);
  }
}
console.log('');
console.log('## Assessment readiness');
console.log('');
if (!blueprints.length) {
  console.log('- No assessment blueprint targets this profile.');
} else {
  for (const blueprint of blueprints) {
    console.log(`- ${blueprint.id}: ${blueprint.ready ? 'READY' : 'NOT READY'}`);
    for (const section of blueprint.sections) {
      console.log(`  - ${section.id}: ${section.availableQuestions}/${section.requiredQuestions} compatible questions`);
    }
  }
}
console.log('');
console.log('## Highest-priority rows without a runnable question');
console.log('');
if (!summary.gaps.uncoveredRows.length) {
  console.log('- None. Every profile row is exercised by at least one runnable question.');
} else {
  for (const row of summary.gaps.uncoveredRows.slice(0, 40)) {
    console.log(`- ${row.rowId} — topic=${row.topic}; fit=${row.fit}; source=${row.sourceId ?? 'unknown'}`);
  }
}
console.log('');
console.log('## Profile rows absent from free exploration');
console.log('');
if (!summary.gaps.freeUncoveredRows.length) {
  console.log('- None. Every current profile row is exercised by a declared free learning pack.');
} else {
  for (const row of summary.gaps.freeUncoveredRows.slice(0, 40)) {
    console.log(`- ${row.rowId} — topic=${row.topic}; fit=${row.fit}; source=${row.sourceId ?? 'unknown'}`);
  }
}
console.log('');
console.log('## Runnable rows with only one interaction family');
console.log('');
if (!summary.gaps.shallowRunnableRows.length) {
  console.log('- None. Every runnable row has at least two interaction families.');
} else {
  for (const row of summary.gaps.shallowRunnableRows.slice(0, 40)) {
    console.log(`- ${row.rowId} — engines=${row.engineFamilies.join(',') || 'none'}; questions=${row.profileQuestions}`);
  }
}
