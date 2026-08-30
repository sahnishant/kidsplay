import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));

const questions = readdirSync(new URL('content/questions/', root))
  .filter((name) => name.endsWith('.json'))
  .sort()
  .flatMap((name) => {
    const value = readJson(`content/questions/${name}`);
    return Array.isArray(value) ? value : [];
  });
const membership = readJson('content/profile-memberships/SOF_INDIA_CLASS2.json');
const freePack = readJson('content/packs/free-animals.json');

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

const questionById = new Map(questions.map((question) => [question.id, question]));
const memberByRow = new Map((membership.members ?? []).map((member) => [member.rowId, member]));
const profileRows = new Set(memberByRow.keys());
const profileQuestions = questions.filter((question) => {
  const refs = question.knowledgeRefs ?? [];
  return refs.length > 0 && refs.every((rowId) => profileRows.has(rowId));
});
const freeQuestions = (freePack.questionRefs ?? [])
  .map((questionId) => questionById.get(questionId))
  .filter(Boolean);

const profileQuestionCountByRow = new Map();
const freeQuestionCountByRow = new Map();
const engineCounts = new Map();
const difficultyCounts = new Map();

for (const question of profileQuestions) {
  increment(engineCounts, question.interaction?.type ?? 'unknown');
  increment(difficultyCounts, String(question.difficulty ?? 'unknown'));
  for (const rowId of question.knowledgeRefs ?? []) increment(profileQuestionCountByRow, rowId);
}
for (const question of freeQuestions) {
  for (const rowId of question.knowledgeRefs ?? []) increment(freeQuestionCountByRow, rowId);
}

const rows = [...memberByRow.values()].map((member) => ({
  ...member,
  topic: topicForRow(member.rowId),
  profileQuestions: profileQuestionCountByRow.get(member.rowId) ?? 0,
  freeQuestions: freeQuestionCountByRow.get(member.rowId) ?? 0
}));
const coveredRows = rows.filter((row) => row.profileQuestions > 0);
const uncoveredRows = rows.filter((row) => row.profileQuestions === 0);
const freeCoveredRows = rows.filter((row) => row.freeQuestions > 0);
const freeUncoveredRows = rows.filter((row) => row.freeQuestions === 0);

const topicStats = [...new Set(rows.map((row) => row.topic))]
  .sort((left, right) => left.localeCompare(right))
  .map((topic) => {
    const topicRows = rows.filter((row) => row.topic === topic);
    return {
      topic,
      totalRows: topicRows.length,
      runnableRows: topicRows.filter((row) => row.profileQuestions > 0).length,
      freeRows: topicRows.filter((row) => row.freeQuestions > 0).length,
      questionCount: profileQuestions.filter((question) =>
        (question.knowledgeRefs ?? []).some((rowId) => topicForRow(rowId) === topic)
      ).length
    };
  });

const summarizeRows = (items) => prioritizedRows(items)
  .map(({ rowId, fit, topic }) => ({ rowId, fit, topic }));

const summary = {
  profileRef: membership.profileRef,
  membershipRows: rows.length,
  runnableProfileQuestions: profileQuestions.length,
  coveredProfileRows: coveredRows.length,
  uncoveredProfileRows: uncoveredRows.length,
  freePackQuestions: freeQuestions.length,
  freeCoveredProfileRows: freeCoveredRows.length,
  freeUncoveredProfileRows: freeUncoveredRows.length,
  engineCounts: Object.fromEntries([...engineCounts.entries()].sort()),
  difficultyCounts: Object.fromEntries([...difficultyCounts.entries()].sort()),
  topicStats,
  uncoveredRows: summarizeRows(uncoveredRows),
  freeUncoveredRows: summarizeRows(freeUncoveredRows)
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

console.log('# Learning coverage report');
console.log('');
console.log(`Profile: ${summary.profileRef}`);
console.log(`Runnable profile questions: ${summary.runnableProfileQuestions}`);
console.log(`Profile rows exercised by at least one runnable question: ${summary.coveredProfileRows}/${summary.membershipRows}`);
console.log(`Profile rows without a runnable question: ${summary.uncoveredProfileRows}`);
console.log(`Free-pack questions: ${summary.freePackQuestions}`);
console.log(`Profile rows exercised in free explore: ${summary.freeCoveredProfileRows}/${summary.membershipRows}`);
console.log(`Profile rows absent from free explore: ${summary.freeUncoveredProfileRows}`);
console.log(`Engine mix: ${Object.entries(summary.engineCounts).map(([engine, count]) => `${engine}=${count}`).join(', ')}`);
console.log(`Difficulty mix: ${Object.entries(summary.difficultyCounts).map(([difficulty, count]) => `${difficulty}=${count}`).join(', ')}`);
console.log('');
console.log('## Topic coverage');
console.log('');
console.log('| Topic | Runnable rows | Free rows | Total rows | Questions touching topic |');
console.log('| --- | ---: | ---: | ---: | ---: |');
for (const item of topicStats) {
  console.log(`| ${item.topic} | ${item.runnableRows} | ${item.freeRows} | ${item.totalRows} | ${item.questionCount} |`);
}
console.log('');
console.log('## Highest-priority rows without a runnable question');
console.log('');
if (!summary.uncoveredRows.length) {
  console.log('- None. Every profile row is exercised by at least one runnable question.');
} else {
  for (const row of summary.uncoveredRows.slice(0, 40)) {
    console.log(`- ${row.rowId} — topic=${row.topic}; fit=${row.fit}`);
  }
}
console.log('');
console.log('## Profile rows absent from free exploration');
console.log('');
if (!summary.freeUncoveredRows.length) {
  console.log('- None. Every current profile row is exercised in the free pack; paid value can stay in structure, diagnostics and goal sequencing.');
} else {
  for (const row of summary.freeUncoveredRows.slice(0, 40)) {
    console.log(`- ${row.rowId} — topic=${row.topic}; fit=${row.fit}`);
  }
}
