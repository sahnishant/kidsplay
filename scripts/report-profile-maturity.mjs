import { existsSync, readFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const readJsonObjects = (directory) => readdirSync(new URL(directory, root))
  .filter((name) => name.endsWith('.json'))
  .sort()
  .flatMap((name) => {
    const value = readJson(`${directory}${name}`);
    return [{ file: name, value }];
  });
const increment = (map, key, amount = 1) => map.set(key, (map.get(key) ?? 0) + amount);
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
const profileArg = args.find((arg) => arg.startsWith('--profile='));
const profilesArg = args.find((arg) => arg.startsWith('--profiles='));

const requestedProfiles = profilesArg
  ? profilesArg.split('=')[1].split(',').map((item) => item.trim()).filter(Boolean)
  : profileArg
    ? [profileArg.split('=')[1].trim()].filter(Boolean)
    : ['SOF_INDIA_CLASS2', 'SOF_INDIA_CLASS3'];

if (!requestedProfiles.length) {
  console.error('Profile maturity report requires at least one profile.');
  process.exit(2);
}

const questionDirectory = new URL('content/questions/', root);
const generatedQuestionPath = new URL('content/questions/__generated-from-knowledge.json', root);
if (!existsSync(generatedQuestionPath)) {
  console.error('Generated questions are missing. Run `npm run compile:content` before the maturity report.');
  process.exit(2);
}

const questionFiles = readdirSync(questionDirectory).filter((name) => name.endsWith('.json')).sort();
const questions = questionFiles.flatMap((name) => {
  const value = readJson(`content/questions/${name}`);
  return Array.isArray(value) ? value : [];
});
const questionById = new Map(questions.map((question) => [question.id, question]));

const membershipFiles = readJsonObjects('content/profile-memberships/');
const membershipByProfile = new Map();
const profilesByRow = new Map();
for (const { value } of membershipFiles) {
  if (!value?.profileRef || !Array.isArray(value.members)) continue;
  membershipByProfile.set(value.profileRef, value);
  for (const member of value.members) {
    if (!profilesByRow.has(member.rowId)) profilesByRow.set(member.rowId, new Set());
    profilesByRow.get(member.rowId).add(value.profileRef);
  }
}

const knowledgeByRow = new Map();
for (const { file, value } of readJsonObjects('content/knowledge/')) {
  const sources = Array.isArray(value) ? value : [value];
  for (const source of sources) {
    if (!source?.id) continue;
    if (source.kind === 'association_set' && Array.isArray(source.entries)) {
      for (const entry of source.entries) {
        if (!entry?.rowId) continue;
        knowledgeByRow.set(entry.rowId, {
          file,
          sourceId: source.id,
          topic: source.topic ?? 'Unknown',
          conceptIds: entry.conceptIds ?? [],
          skills: entry.meta?.skills ?? [],
          knowledgeLevel: entry.meta?.knowledgeLevel ?? null,
          subjectSemanticRef: entry.subject?.id ?? null,
          objectSemanticRef: entry.object?.id ?? null
        });
      }
    } else if (source.kind === 'choice_item' && source.rowId) {
      knowledgeByRow.set(source.rowId, {
        file,
        sourceId: source.id,
        topic: source.topic ?? 'Unknown',
        conceptIds: source.conceptIds ?? [],
        skills: source.meta?.skills ?? [],
        knowledgeLevel: source.meta?.knowledgeLevel ?? null,
        subjectSemanticRef: source.prompt?.id ?? null,
        objectSemanticRef: null
      });
    }
  }
}

const freeQuestionIds = new Set();
for (const { value: pack } of readJsonObjects('content/packs/')) {
  if (pack?.access?.type !== 'free') continue;
  for (const questionId of pack.questionRefs ?? []) freeQuestionIds.add(questionId);
}

const visualIds = new Set();
const visualByAlias = new Map();
const visualBySemantic = new Map();
for (const { value } of readJsonObjects('content/visuals/')) {
  const visuals = Array.isArray(value) ? value : [];
  for (const visual of visuals) {
    if (!visual?.id) continue;
    visualIds.add(visual.id);
    for (const alias of visual.aliases ?? []) {
      const key = normalize(alias);
      if (!visualByAlias.has(key)) visualByAlias.set(key, visual.id);
      if (!visualBySemantic.has(key)) visualBySemantic.set(key, visual.id);
    }
    const idParts = visual.id.split('.');
    const semanticKey = normalize(idParts[idParts.length - 1]);
    if (semanticKey && !visualBySemantic.has(semanticKey)) visualBySemantic.set(semanticKey, visual.id);
  }
}

const resolveLabelVisual = (label) => {
  const direct = visualByAlias.get(normalize(label));
  if (direct) return [direct];
  const normalized = normalize(label);
  if (!normalized || normalized.length > 48) return [];
  const parts = String(label)
    .split(/\s*(?:\+|&|\band\b)\s*/i)
    .map(normalize)
    .filter(Boolean);
  if (parts.length < 2 || parts.length > 3) return [];
  const refs = parts.map((part) => visualByAlias.get(part));
  return refs.some((ref) => !ref) ? [] : [...new Set(refs)];
};
const itemHasVisual = (item) => {
  if (Array.isArray(item?.visualRefs) && item.visualRefs.some((ref) => visualIds.has(ref))) return true;
  if (item?.semanticRef && visualBySemantic.has(normalize(item.semanticRef))) return true;
  return resolveLabelVisual(item?.label).length > 0;
};
const visualFriendlyItems = (question) => {
  const interaction = question?.interaction;
  if (!interaction) return [];
  if (interaction.type === 'single_choice') return interaction.options ?? [];
  if (interaction.type === 'word_bank_fill') return interaction.wordBank ?? [];
  if (interaction.type === 'memory_pairs') return interaction.cards ?? [];
  if (interaction.type === 'sequence_order') return interaction.items ?? [];
  if (interaction.type === 'hotspot') return interaction.board?.regions ?? [];
  return [];
};

const blueprintFiles = readJsonObjects('content/assessment-blueprints/');
const blueprintByProfile = new Map();
for (const { value } of blueprintFiles) {
  if (value?.profileRef) blueprintByProfile.set(value.profileRef, value);
}

function assessmentPoolSignals(profileQuestions, blueprint) {
  if (!blueprint) return null;
  const isLogical = (question) => {
    const refs = question.knowledgeRefs ?? [];
    return refs.length > 0 && refs.every((rowId) => rowId.startsWith('kr.reasoning.'));
  };
  const logical = profileQuestions.filter(isLogical);
  const science = profileQuestions.filter((question) => !isLogical(question));
  const achiever = science.filter((question) => Number(question.difficulty ?? 0) >= 3);
  const poolBySelector = new Map([
    ['logical_reasoning', logical],
    ['science_core', science],
    ['achiever_hots', achiever]
  ]);
  const sections = (blueprint.sections ?? []).map((section) => {
    const pool = poolBySelector.get(section.selector) ?? [];
    return {
      id: section.id,
      selector: section.selector,
      required: section.count,
      candidatePool: pool.length,
      readyByCount: pool.length >= section.count
    };
  });
  return {
    blueprintId: blueprint.id,
    totalQuestions: blueprint.totalQuestions,
    totalMarks: blueprint.totalMarks,
    totalRunnablePool: profileQuestions.length,
    readyByTotalCount: profileQuestions.length >= blueprint.totalQuestions,
    sections,
    note: 'Pool signals are maturity diagnostics. Runtime assessment selection/validation remains authoritative.'
  };
}

function buildProfileReport(profileRef) {
  const membership = membershipByProfile.get(profileRef);
  if (!membership) throw new Error(`Unknown profile membership ${profileRef}`);
  const members = membership.members ?? [];
  const profileRows = new Set(members.map((member) => member.rowId));
  const profileQuestions = questions.filter((question) => {
    const refs = question.knowledgeRefs ?? [];
    return refs.length > 0 && refs.every((rowId) => profileRows.has(rowId));
  });
  const freeQuestions = profileQuestions.filter((question) => freeQuestionIds.has(question.id));

  const questionCountByRow = new Map();
  const freeQuestionCountByRow = new Map();
  for (const question of profileQuestions) {
    for (const rowId of question.knowledgeRefs ?? []) increment(questionCountByRow, rowId);
  }
  for (const question of freeQuestions) {
    for (const rowId of question.knowledgeRefs ?? []) increment(freeQuestionCountByRow, rowId);
  }

  const rows = members.map((member) => {
    const knowledge = knowledgeByRow.get(member.rowId) ?? null;
    const otherProfiles = [...(profilesByRow.get(member.rowId) ?? [])]
      .filter((candidate) => candidate !== profileRef)
      .sort();
    return {
      rowId: member.rowId,
      fit: member.fit,
      topic: knowledge?.topic ?? 'Unknown',
      sourceId: knowledge?.sourceId ?? null,
      sourceFile: knowledge?.file ?? null,
      skills: knowledge?.skills ?? [],
      knowledgeLevel: knowledge?.knowledgeLevel ?? null,
      runnableQuestions: questionCountByRow.get(member.rowId) ?? 0,
      freeQuestions: freeQuestionCountByRow.get(member.rowId) ?? 0,
      reused: otherProfiles.length > 0,
      reusedWithProfiles: otherProfiles
    };
  });

  const engineCounts = new Map();
  const difficultyCounts = new Map();
  for (const question of profileQuestions) {
    increment(engineCounts, question.interaction?.type ?? 'unknown');
    increment(difficultyCounts, String(question.difficulty ?? 'unknown'));
  }

  const skillRows = new Map();
  const skillCoveredRows = new Map();
  for (const row of rows) {
    for (const skill of row.skills) {
      increment(skillRows, skill);
      if (row.runnableQuestions > 0) increment(skillCoveredRows, skill);
    }
  }

  const topics = [...new Set(rows.map((row) => row.topic))].sort().map((topic) => {
    const topicRows = rows.filter((row) => row.topic === topic);
    const questionIds = new Set(profileQuestions
      .filter((question) => (question.knowledgeRefs ?? []).some((rowId) => topicRows.some((row) => row.rowId === rowId)))
      .map((question) => question.id));
    return {
      topic,
      rows: topicRows.length,
      runnableRows: topicRows.filter((row) => row.runnableQuestions > 0).length,
      freeRows: topicRows.filter((row) => row.freeQuestions > 0).length,
      reusedRows: topicRows.filter((row) => row.reused).length,
      profileSpecificRows: topicRows.filter((row) => !row.reused).length,
      questions: questionIds.size
    };
  });

  const sourceFamilies = [...new Set(rows.map((row) => row.sourceFile ?? 'unknown'))].sort().map((sourceFile) => {
    const sourceRows = rows.filter((row) => (row.sourceFile ?? 'unknown') === sourceFile);
    return {
      sourceFile,
      rows: sourceRows.length,
      runnableRows: sourceRows.filter((row) => row.runnableQuestions > 0).length,
      freeRows: sourceRows.filter((row) => row.freeQuestions > 0).length
    };
  });

  let visualItems = 0;
  let resolvedVisualItems = 0;
  for (const question of profileQuestions) {
    for (const item of visualFriendlyItems(question)) {
      visualItems += 1;
      if (itemHasVisual(item)) resolvedVisualItems += 1;
    }
  }

  const uncoveredRows = rows.filter((row) => row.runnableQuestions === 0);
  const freeUncoveredRows = rows.filter((row) => row.freeQuestions === 0);
  const reusedRows = rows.filter((row) => row.reused);
  const profileSpecificRows = rows.filter((row) => !row.reused);
  const skillCoverage = [...skillRows.keys()].sort().map((skill) => ({
    skill,
    rows: skillRows.get(skill) ?? 0,
    runnableRows: skillCoveredRows.get(skill) ?? 0
  }));
  const assessment = assessmentPoolSignals(profileQuestions, blueprintByProfile.get(profileRef));

  const gaps = [];
  if (uncoveredRows.length) gaps.push({ type: 'uncovered_rows', count: uncoveredRows.length, rowIds: uncoveredRows.map((row) => row.rowId) });
  if (freeUncoveredRows.length) gaps.push({ type: 'free_uncovered_rows', count: freeUncoveredRows.length, rowIds: freeUncoveredRows.map((row) => row.rowId) });
  for (const topic of topics) {
    if (topic.questions < 3) gaps.push({ type: 'thin_topic_question_pool', topic: topic.topic, questions: topic.questions, rows: topic.rows });
  }
  if (!Object.keys(Object.fromEntries(engineCounts)).includes('single_choice')) gaps.push({ type: 'missing_engine', engine: 'single_choice' });
  if ((difficultyCounts.get('3') ?? 0) === 0) gaps.push({ type: 'missing_difficulty', difficulty: 3, note: 'No profile-safe difficulty-3 question exists.' });
  if (assessment) {
    for (const section of assessment.sections) {
      if (!section.readyByCount) gaps.push({ type: 'assessment_pool_shortfall', section: section.id, required: section.required, candidatePool: section.candidatePool });
    }
  }

  return {
    profileRef,
    provenanceStatus: membership.provenance?.status ?? 'unknown',
    membershipRows: rows.length,
    reuse: {
      sharedRows: reusedRows.length,
      profileSpecificRows: profileSpecificRows.length,
      sharedPercent: percent(reusedRows.length, rows.length)
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
    sourceFamilies,
    visuals: {
      resolvedItems: resolvedVisualItems,
      eligibleItems: visualItems,
      coveragePercent: percent(resolvedVisualItems, visualItems),
      policy: 'single-choice, word-bank, memory, sequence and hotspot surfaces; matching/drag excluded from inference'
    },
    assessment,
    gaps,
    uncoveredRows,
    freeUncoveredRows,
    sharedRows: reusedRows.map((row) => ({ rowId: row.rowId, topic: row.topic, reusedWithProfiles: row.reusedWithProfiles })),
    profileSpecificRows: profileSpecificRows.map((row) => ({ rowId: row.rowId, topic: row.topic, sourceFile: row.sourceFile }))
  };
}

let reports;
try {
  reports = requestedProfiles.map(buildProfileReport);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(2);
}

const result = {
  generatedAt: new Date().toISOString(),
  profiles: reports
};

const shouldFail = failOnUncovered && reports.some((report) => report.runnable.uncoveredRows > 0);

if (jsonMode) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(shouldFail ? 1 : 0);
}

console.log('# Profile maturity report');
for (const report of reports) {
  console.log(`\n## ${report.profileRef}`);
  console.log(`Provenance: ${report.provenanceStatus}`);
  console.log(`Rows: ${report.membershipRows} (${report.reuse.sharedRows} shared/reused, ${report.reuse.profileSpecificRows} profile-specific)`);
  console.log(`Runnable: ${report.runnable.coveredRows}/${report.membershipRows} rows (${report.runnable.rowCoveragePercent}%) through ${report.runnable.questions} profile-safe question(s)`);
  console.log(`Free: ${report.free.coveredRows}/${report.membershipRows} rows (${report.free.rowCoveragePercent}%) through ${report.free.questions} free question(s)`);
  console.log(`Visual-friendly coverage: ${report.visuals.resolvedItems}/${report.visuals.eligibleItems} (${report.visuals.coveragePercent}%)`);
  console.log(`Engine mix: ${Object.entries(report.engines).map(([engine, count]) => `${engine}=${count}`).join(', ') || 'none'}`);
  console.log(`Difficulty mix: ${Object.entries(report.difficulties).map(([difficulty, count]) => `${difficulty}=${count}`).join(', ') || 'none'}`);
  console.log('Topic maturity:');
  for (const topic of report.topics) {
    console.log(`- ${topic.topic}: rows ${topic.runnableRows}/${topic.rows} runnable; ${topic.freeRows}/${topic.rows} free; ${topic.questions} question(s); ${topic.reusedRows} shared row(s)`);
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
