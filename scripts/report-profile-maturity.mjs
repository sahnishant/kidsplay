import { existsSync, readFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const readItems = (directory) => readdirSync(new URL(directory, root))
  .filter((name) => name.endsWith('.json'))
  .sort()
  .flatMap((name) => {
    const value = readJson(`${directory}${name}`);
    if (Array.isArray(value)) return value;
    return value && typeof value === 'object' ? [value] : [];
  });
const increment = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);
const percent = (part, total) => total ? Math.round((part / total) * 1000) / 10 : 0;
const normalize = (value) => String(value ?? '')
  .toLowerCase()
  .replace(/[’']/g, '')
  .replace(/[-_]+/g, ' ')
  .replace(/[.,!?;:()]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const failOnUncovered = args.includes('--fail-on-uncovered');
const profilesArg = args.find((arg) => arg.startsWith('--profiles='));
const profileArg = args.find((arg) => arg.startsWith('--profile='));
const profileRefs = profilesArg
  ? profilesArg.split('=')[1].split(',').map((item) => item.trim()).filter(Boolean)
  : profileArg
    ? [profileArg.split('=')[1].trim()].filter(Boolean)
    : ['SOF_INDIA_CLASS2', 'SOF_INDIA_CLASS3'];

const indexPath = 'content/index/__generated-learning-index.json';
const membershipsPath = 'content/index/__generated-profile-memberships.json';
if (!existsSync(new URL(indexPath, root)) || !existsSync(new URL(membershipsPath, root))) {
  console.error('Profile maturity report requires compiled index/memberships. Run `npm run compile:content` first.');
  process.exit(2);
}

const index = readJson(indexPath);
const resolvedMemberships = readJson(membershipsPath);
const rawMemberships = readdirSync(new URL('content/profile-memberships/', root))
  .filter((name) => name.endsWith('.json'))
  .sort()
  .map((name) => readJson(`content/profile-memberships/${name}`));
const rawMembershipByProfile = new Map(rawMemberships.map((item) => [item.profileRef, item]));
const membershipByProfile = new Map(resolvedMemberships.map((item) => [item.profileRef, item]));
const indexByRow = new Map(index.map((row) => [row.rowId, row]));
const questions = readItems('content/questions/');
const blueprints = readItems('content/assessment-blueprints/');
const blueprintByProfile = new Map(blueprints.map((item) => [item.profileRef, item]));

const freeQuestionIds = new Set();
for (const pack of readItems('content/packs/')) {
  if (pack?.access?.type !== 'free') continue;
  for (const id of pack.questionRefs ?? []) freeQuestionIds.add(id);
}

const visualIds = new Set();
const visualByAlias = new Map();
const visualBySemantic = new Map();
for (const visual of readItems('content/visuals/')) {
  if (!visual?.id) continue;
  visualIds.add(visual.id);
  for (const alias of visual.aliases ?? []) {
    const key = normalize(alias);
    if (!visualByAlias.has(key)) visualByAlias.set(key, visual.id);
    if (!visualBySemantic.has(key)) visualBySemantic.set(key, visual.id);
  }
  const parts = visual.id.split('.');
  const key = normalize(parts[parts.length - 1]);
  if (key && !visualBySemantic.has(key)) visualBySemantic.set(key, visual.id);
}

const resolveLabelVisuals = (label) => {
  const direct = visualByAlias.get(normalize(label));
  if (direct) return [direct];
  const normalized = normalize(label);
  if (!normalized || normalized.length > 48) return [];
  const parts = String(label).split(/\s*(?:\+|&|\band\b)\s*/i).map(normalize).filter(Boolean);
  if (parts.length < 2 || parts.length > 3) return [];
  const refs = parts.map((part) => visualByAlias.get(part));
  return refs.some((ref) => !ref) ? [] : [...new Set(refs)];
};
const itemHasVisual = (item) =>
  (Array.isArray(item?.visualRefs) && item.visualRefs.some((ref) => visualIds.has(ref)))
  || (item?.semanticRef && visualBySemantic.has(normalize(item.semanticRef)))
  || resolveLabelVisuals(item?.label).length > 0;
const visualItems = (question) => {
  const interaction = question?.interaction;
  if (!interaction) return [];
  if (interaction.type === 'single_choice') return interaction.options ?? [];
  if (interaction.type === 'word_bank_fill') return interaction.wordBank ?? [];
  if (interaction.type === 'memory_pairs') return interaction.cards ?? [];
  if (interaction.type === 'sequence_order') return interaction.items ?? [];
  if (interaction.type === 'hotspot') return interaction.board?.regions ?? [];
  return [];
};

const isLogical = (question) => {
  const refs = question.knowledgeRefs ?? [];
  return refs.length > 0 && refs.every((rowId) => rowId.startsWith('kr.reasoning.'));
};
const isAchiever = (question) => question.authoring?.source === 'kidsplay-editorial-hots' && !isLogical(question);

function assessmentSignals(profileQuestions, blueprint) {
  if (!blueprint) return null;
  const pools = {
    logical_reasoning: profileQuestions.filter(isLogical),
    science_core: profileQuestions.filter((question) => !isLogical(question) && !isAchiever(question)),
    achiever_hots: profileQuestions.filter(isAchiever)
  };
  return {
    blueprintId: blueprint.id,
    totalQuestions: blueprint.totalQuestions,
    totalMarks: blueprint.totalMarks,
    selectionPolicy: blueprint.selectionPolicy ?? null,
    sections: (blueprint.sections ?? []).map((section) => ({
      id: section.id,
      selector: section.selector,
      required: section.count,
      candidatePool: pools[section.selector]?.length ?? 0,
      readyByCount: (pools[section.selector]?.length ?? 0) >= section.count
    }))
  };
}

function buildReport(profileRef) {
  const membership = membershipByProfile.get(profileRef);
  const rawMembership = rawMembershipByProfile.get(profileRef);
  if (!membership || !rawMembership) throw new Error(`Unknown profile membership ${profileRef}`);
  const profileRows = new Set(membership.members.map((member) => member.rowId));
  const profileQuestions = questions.filter((question) => {
    const refs = question.knowledgeRefs ?? [];
    return refs.length > 0 && refs.every((rowId) => profileRows.has(rowId));
  });
  const freeQuestions = profileQuestions.filter((question) => freeQuestionIds.has(question.id));

  const questionCountByRow = new Map();
  const freeCountByRow = new Map();
  for (const question of profileQuestions) for (const rowId of question.knowledgeRefs ?? []) increment(questionCountByRow, rowId);
  for (const question of freeQuestions) for (const rowId of question.knowledgeRefs ?? []) increment(freeCountByRow, rowId);

  const rows = membership.members.map((member) => {
    const indexed = indexByRow.get(member.rowId);
    return {
      rowId: member.rowId,
      fit: member.fit,
      origin: member.origin ?? 'direct',
      inheritedFromProfileRef: member.inheritedFromProfileRef ?? null,
      topic: indexed?.topic ?? 'Unknown',
      sourceRef: indexed?.sourceRef ?? null,
      skills: indexed?.skills ?? [],
      runnableQuestions: questionCountByRow.get(member.rowId) ?? 0,
      freeQuestions: freeCountByRow.get(member.rowId) ?? 0
    };
  });

  const engineCounts = new Map();
  const difficultyCounts = new Map();
  for (const question of profileQuestions) {
    increment(engineCounts, question.interaction?.type ?? 'unknown');
    increment(difficultyCounts, String(question.difficulty ?? 'unknown'));
  }

  let eligibleVisualItems = 0;
  let resolvedVisualItems = 0;
  for (const question of profileQuestions) {
    for (const item of visualItems(question)) {
      eligibleVisualItems += 1;
      if (itemHasVisual(item)) resolvedVisualItems += 1;
    }
  }

  const topics = [...new Set(rows.map((row) => row.topic))].sort().map((topic) => {
    const topicRows = rows.filter((row) => row.topic === topic);
    const topicRowIds = new Set(topicRows.map((row) => row.rowId));
    const topicQuestions = profileQuestions.filter((question) =>
      (question.knowledgeRefs ?? []).some((rowId) => topicRowIds.has(rowId))
    );
    return {
      topic,
      rows: topicRows.length,
      directRows: topicRows.filter((row) => row.origin === 'direct').length,
      inheritedRows: topicRows.filter((row) => row.origin === 'inherited').length,
      runnableRows: topicRows.filter((row) => row.runnableQuestions > 0).length,
      freeRows: topicRows.filter((row) => row.freeQuestions > 0).length,
      questions: topicQuestions.length
    };
  });

  const skillCounts = new Map();
  const runnableSkillCounts = new Map();
  for (const row of rows) {
    for (const skill of row.skills) {
      increment(skillCounts, skill);
      if (row.runnableQuestions > 0) increment(runnableSkillCounts, skill);
    }
  }
  const skillCoverage = [...skillCounts.keys()].sort().map((skill) => ({
    skill,
    rows: skillCounts.get(skill),
    runnableRows: runnableSkillCounts.get(skill) ?? 0
  }));

  const uncoveredRows = rows.filter((row) => row.runnableQuestions === 0);
  const freeUncoveredRows = rows.filter((row) => row.freeQuestions === 0);
  const directRows = rows.filter((row) => row.origin === 'direct');
  const inheritedRows = rows.filter((row) => row.origin === 'inherited');
  const assessment = assessmentSignals(profileQuestions, blueprintByProfile.get(profileRef));
  const gaps = [];
  if (uncoveredRows.length) gaps.push({ type: 'uncovered_rows', count: uncoveredRows.length, rowIds: uncoveredRows.map((row) => row.rowId) });
  if (freeUncoveredRows.length) gaps.push({ type: 'free_uncovered_rows', count: freeUncoveredRows.length, rowIds: freeUncoveredRows.map((row) => row.rowId) });
  for (const topic of topics) if (topic.questions < 3) gaps.push({ type: 'thin_topic_question_pool', topic: topic.topic, questions: topic.questions, rows: topic.rows });
  if ((difficultyCounts.get('3') ?? 0) === 0) gaps.push({ type: 'missing_difficulty', difficulty: 3 });
  for (const section of assessment?.sections ?? []) {
    if (!section.readyByCount) gaps.push({ type: 'assessment_pool_shortfall', section: section.id, required: section.required, candidatePool: section.candidatePool });
  }

  return {
    profileRef,
    provenanceStatus: rawMembership.provenance?.status ?? 'unknown',
    membershipRows: rows.length,
    membership: {
      directRows: directRows.length,
      inheritedRows: inheritedRows.length,
      inheritedPercent: percent(inheritedRows.length, rows.length),
      inheritedFromProfiles: [...new Set(inheritedRows.map((row) => row.inheritedFromProfileRef).filter(Boolean))].sort()
    },
    runnable: {
      questions: profileQuestions.length,
      coveredRows: rows.length - uncoveredRows.length,
      uncoveredRows: uncoveredRows.length,
      rowCoveragePercent: percent(rows.length - uncoveredRows.length, rows.length)
    },
    free: {
      questions: freeQuestions.length,
      coveredRows: rows.length - freeUncoveredRows.length,
      uncoveredRows: freeUncoveredRows.length,
      rowCoveragePercent: percent(rows.length - freeUncoveredRows.length, rows.length)
    },
    engines: Object.fromEntries([...engineCounts.entries()].sort()),
    difficulties: Object.fromEntries([...difficultyCounts.entries()].sort()),
    skillCoverage,
    topics,
    visuals: {
      resolvedItems: resolvedVisualItems,
      eligibleItems: eligibleVisualItems,
      coveragePercent: percent(resolvedVisualItems, eligibleVisualItems)
    },
    assessment,
    gaps,
    directRows: directRows.map((row) => ({ rowId: row.rowId, topic: row.topic, sourceRef: row.sourceRef })),
    inheritedRows: inheritedRows.map((row) => ({ rowId: row.rowId, topic: row.topic, inheritedFromProfileRef: row.inheritedFromProfileRef }))
  };
}

let reports;
try {
  reports = profileRefs.map(buildReport);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(2);
}

const result = { generatedAt: new Date().toISOString(), profiles: reports };
const shouldFail = failOnUncovered && reports.some((report) => report.runnable.uncoveredRows > 0);

if (jsonMode) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(shouldFail ? 1 : 0);
}

console.log('# Profile maturity report');
for (const report of reports) {
  console.log(`\n## ${report.profileRef}`);
  console.log(`Provenance: ${report.provenanceStatus}`);
  console.log(`Rows: ${report.membershipRows} (${report.membership.directRows} direct/current, ${report.membership.inheritedRows} inherited/previous)`);
  console.log(`Runnable: ${report.runnable.coveredRows}/${report.membershipRows} rows (${report.runnable.rowCoveragePercent}%) through ${report.runnable.questions} profile-safe question(s)`);
  console.log(`Free: ${report.free.coveredRows}/${report.membershipRows} rows (${report.free.rowCoveragePercent}%) through ${report.free.questions} free question(s)`);
  console.log(`Visual-friendly coverage: ${report.visuals.resolvedItems}/${report.visuals.eligibleItems} (${report.visuals.coveragePercent}%)`);
  console.log(`Engine mix: ${Object.entries(report.engines).map(([engine, count]) => `${engine}=${count}`).join(', ') || 'none'}`);
  console.log(`Difficulty mix: ${Object.entries(report.difficulties).map(([difficulty, count]) => `${difficulty}=${count}`).join(', ') || 'none'}`);
  console.log('Topic maturity:');
  for (const topic of report.topics) {
    console.log(`- ${topic.topic}: ${topic.runnableRows}/${topic.rows} runnable; ${topic.freeRows}/${topic.rows} free; ${topic.questions} question(s); direct=${topic.directRows}, inherited=${topic.inheritedRows}`);
  }
  console.log('Assessment pool signals:');
  if (!report.assessment) console.log('- no blueprint');
  else for (const section of report.assessment.sections) {
    console.log(`- ${section.id}: ${section.candidatePool} candidate(s) for ${section.required} slot(s) — ${section.readyByCount ? 'count-ready' : 'shortfall'}`);
  }
  console.log('Machine-readable gap summary:');
  if (!report.gaps.length) console.log('- none');
  else for (const gap of report.gaps) console.log(`- ${JSON.stringify(gap)}`);
}

if (shouldFail) {
  console.error('Profile maturity gate failed because at least one requested profile has uncovered membership rows.');
  process.exit(1);
}
