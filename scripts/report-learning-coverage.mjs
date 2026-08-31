import { readFileSync, readdirSync } from 'node:fs';
import { createMembershipResolver, readMembershipCollections } from './profileMemberships.mjs';
import { packMap, resolvePackQuestionRefs } from './learningPacks.mjs';

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

function rowRecordsForSource(source, file) {
  const records = [];
  const push = (row) => {
    if (!row?.rowId) return;
    records.push({
      rowId: row.rowId,
      sourceId: source.id ?? 'unknown',
      sourceFile: file,
      topic: source.topic ?? topicForRow(row.rowId),
      knowledgeLevel: row.meta?.knowledgeLevel ?? source.meta?.knowledgeLevel ?? null,
      skills: [...new Set([...(row.meta?.skills ?? []), ...(source.meta?.skills ?? [])])].sort()
    });
  };
  push(source);
  for (const entry of source.entries ?? []) push(entry);
  for (const row of source.rows ?? []) push(row);
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
const questions = readJsonObjects('content/questions/').map(({ item }) => item);
const membershipCollections = readMembershipCollections(root);
const resolver = createMembershipResolver(membershipCollections);
const rawMembership = resolver.byProfile.get(profileRef);
if (!rawMembership) throw new Error(`Unknown profile membership ${profileRef}`);
const membership = resolver.resolve(profileRef);
const memberships = membershipCollections.map(({ value }) => resolver.resolve(value.profileRef));

const profilesRegistry = readJson('content/learning-profiles/registry.json');
const profile = (profilesRegistry.profiles ?? []).find((item) => item.id === profileRef) ?? null;
const knowledgeRows = readJsonObjects('content/knowledge/').flatMap(({ item, file }) => rowRecordsForSource(item, file));
const knowledgeByRow = new Map(knowledgeRows.map((row) => [row.rowId, row]));

const membershipProfilesByRow = new Map();
for (const item of memberships) {
  for (const member of item.members ?? []) {
    const profileRefs = membershipProfilesByRow.get(member.rowId) ?? new Set();
    profileRefs.add(item.profileRef);
    membershipProfilesByRow.set(member.rowId, profileRefs);
  }
}

const questionById = new Map(questions.map((question) => [question.id, question]));
const learningPacks = readJsonObjects('content/packs/').map(({ item }) => item).filter((pack) => pack.kind === 'learning_pack');
const learningPackById = packMap(learningPacks);
const freePacks = learningPacks.filter((pack) => pack.access?.type === 'free');
const freeQuestionIds = new Set(freePacks.flatMap((pack) => resolvePackQuestionRefs(learningPackById, pack.id)));
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
  const membershipProfileRefs = [...(membershipProfilesByRow.get(member.rowId) ?? new Set())].sort();
  const sourceId = knowledge?.sourceId ?? null;
  const gradeSpecificSource = Boolean(gradeToken && sourceId && sourceId.toLowerCase().includes(gradeToken));
  return {
    ...member,
    membershipOrigin: member.origin ?? 'direct',
    membershipSourceProfileRef: member.inheritedFromProfileRef ?? profileRef,
    topic: knowledge?.topic ?? topicForRow(member.rowId),
    sourceId,
    sourceFile: knowledge?.sourceFile ?? null,
    knowledgeLevel: knowledge?.knowledgeLevel ?? null,
    skills: knowledge?.skills ?? [],
    membershipProfiles: membershipProfileRefs,
    reusedAcrossProfiles: membershipProfileRefs.length > 1,
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
const inheritedRows = rows.filter((row) => row.membershipOrigin === 'inherited');

const topicStats = [...new Set(rows.map((row) => row.topic))]
  .sort((left, right) => left.localeCompare(right))
  .map((topic) => {
    const topicRows = rows.filter((row) => row.topic === topic);
    return {
      topic,
      totalRows: topicRows.length,
      directRows: topicRows.filter((row) => row.membershipOrigin === 'direct').length,
      includedRows: topicRows.filter((row) => row.membershipOrigin === 'inherited').length,
      runnableRows: topicRows.filter((row) => row.profileQuestions > 0).length,
      freeRows: topicRows.filter((row) => row.freeQuestions > 0).length,
      multiFormatRows: topicRows.filter((row) => row.engineFamilies.length >= 2).length,
      reusedRows: topicRows.filter((row) => row.reusedAcrossProfiles).length,
      questionCount: profileQuestions.filter((question) =>
        (question.knowledgeRefs ?? []).some((rowId) => (knowledgeByRow.get(rowId)?.topic ?? topicForRow(rowId)) === topic)
      ).length
    };
  });

const skillStats = [...new Set(rows.flatMap((row) => row.skills))].sort().map((skill) => {
  const skillRows = rows.filter((row) => row.skills.includes(skill));
  return {
    skill,
    totalRows: skillRows.length,
    runnableRows: skillRows.filter((row) => row.profileQuestions > 0).length,
    freeRows: skillRows.filter((row) => row.freeQuestions > 0).length,
    multiFormatRows: skillRows.filter((row) => row.engineFamilies.length >= 2).length
  };
});

const sourceStats = [...new Set(rows.map((row) => row.sourceId).filter(Boolean))].sort().map((sourceId) => {
  const sourceRows = rows.filter((row) => row.sourceId === sourceId);
  return {
    sourceId,
    totalRows: sourceRows.length,
    directRows: sourceRows.filter((row) => row.membershipOrigin === 'direct').length,
    includedRows: sourceRows.filter((row) => row.membershipOrigin === 'inherited').length,
    runnableRows: sourceRows.filter((row) => row.profileQuestions > 0).length,
    freeRows: sourceRows.filter((row) => row.freeQuestions > 0).length,
    multiFormatRows: sourceRows.filter((row) => row.engineFamilies.length >= 2).length,
    reusedRows: sourceRows.filter((row) => row.reusedAcrossProfiles).length,
    gradeSpecificSource: sourceRows.every((row) => row.gradeSpecificSource)
  };
});

const assessmentBlueprints = readJsonObjects('content/assessment-blueprints/')
  .map(({ item }) => item)
  .filter((blueprint) => blueprint.profileRef === profileRef)
  .map((blueprint) => {
    const sections = (blueprint.sections ?? []).map((section) => {
      const availableQuestions = profileQuestions.filter((question) => matchesAssessmentSelector(question, section.selector)).length;
      return {
        id: section.id,
        selector: section.selector,
        requiredQuestions: section.count,
        availableQuestions,
        ready: availableQuestions >= section.count
      };
    });
    return {
      id: blueprint.id,
      academicYear: blueprint.academicYear,
      totalQuestions: blueprint.totalQuestions,
      totalMarks: blueprint.totalMarks,
      sections,
      ready: sections.every((section) => section.ready)
    };
  });

const summarizeRows = (items) => [...items]
  .sort((left, right) => left.rowId.localeCompare(right.rowId))
  .map((row) => ({
    rowId: row.rowId,
    fit: row.fit,
    topic: row.topic,
    sourceId: row.sourceId,
    membershipOrigin: row.membershipOrigin,
    membershipSourceProfileRef: row.membershipSourceProfileRef,
    profileQuestions: row.profileQuestions,
    freeQuestions: row.freeQuestions,
    engineFamilies: row.engineFamilies,
    membershipProfiles: row.membershipProfiles
  }));

const summary = {
  profileRef: membership.profileRef,
  profile: profile ? {
    grade: profile.grade,
    pathway: profile.pathway,
    country: profile.country,
    alignmentStatus: profile.alignmentStatus
  } : null,
  directMembershipRows: rawMembership.members?.length ?? 0,
  includedProfileRefs: (rawMembership.inherits ?? []).map((inheritance) => inheritance.profileRef),
  includedMembershipRows: inheritedRows.length,
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
  assessmentBlueprints,
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
console.log(`Direct membership rows: ${summary.directMembershipRows}`);
console.log(`Inherited profile rows: ${summary.includedMembershipRows}${summary.includedProfileRefs.length ? ` from ${summary.includedProfileRefs.join(', ')}` : ''}`);
console.log(`Effective membership rows: ${summary.membershipRows}`);
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
console.log('## Assessment readiness');
if (!assessmentBlueprints.length) console.log('- No assessment blueprint targets this profile.');
for (const blueprint of assessmentBlueprints) {
  console.log(`- ${blueprint.id}: ${blueprint.ready ? 'READY' : 'NOT READY'}`);
  for (const section of blueprint.sections) {
    console.log(`  - ${section.id}: ${section.availableQuestions}/${section.requiredQuestions} compatible questions`);
  }
}
console.log('');
console.log('## Machine-readable gap summary');
console.log(`- Runnable gaps: ${summary.gaps.uncoveredRows.length}`);
console.log(`- Free gaps: ${summary.gaps.freeUncoveredRows.length}`);
console.log(`- Single-engine rows: ${summary.gaps.shallowRunnableRows.length}`);
for (const row of summary.gaps.uncoveredRows.slice(0, 40)) console.log(`  - uncovered ${row.rowId}`);
for (const row of summary.gaps.freeUncoveredRows.slice(0, 40)) console.log(`  - not-free ${row.rowId}`);
