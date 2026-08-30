import { readdirSync, readFileSync } from 'node:fs';
import { membershipMap, resolveMembership } from './profileMemberships.mjs';
import { packMap, resolvePackQuestionRefs } from './learningPacks.mjs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const errors = [];

const registry = readJson('content/learning-profiles/registry.json');
const profileIds = new Set((registry.profiles ?? []).map((profile) => profile.id));
const packFiles = readdirSync(new URL('content/packs/', root))
  .filter((name) => name.endsWith('.json'))
  .sort();
const packs = packFiles.map((file) => ({ file, pack: readJson(`content/packs/${file}`) }));
const learningPacks = packs.map(({ pack }) => pack).filter((pack) => pack.kind === 'learning_pack');
const learningPackById = packMap(learningPacks);
const questionFiles = readdirSync(new URL('content/questions/', root))
  .filter((name) => name.endsWith('.json'))
  .sort();
const questions = questionFiles.flatMap((file) => {
  const value = readJson(`content/questions/${file}`);
  return Array.isArray(value) ? value : [];
});
const questionById = new Map(questions.map((question) => [question.id, question]));
const membershipFiles = readdirSync(new URL('content/profile-memberships/', root))
  .filter((name) => name.endsWith('.json'))
  .sort();
const rawMemberships = membershipFiles.map((file) => readJson(`content/profile-memberships/${file}`));
const membershipByRef = membershipMap(rawMemberships);
const memberships = new Map(
  rawMemberships.map((membership) => [membership.profileRef, resolveMembership(membershipByRef, membership.profileRef)])
);

const freeRows = new Set();
for (const { pack } of packs) {
  if (pack.kind !== 'learning_pack' || pack.access?.type !== 'free') continue;
  let questionRefs = [];
  try {
    questionRefs = resolvePackQuestionRefs(learningPackById, pack.id);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    continue;
  }
  for (const questionId of questionRefs) {
    const question = questionById.get(questionId);
    if (!question) continue;
    for (const rowId of question.knowledgeRefs ?? []) freeRows.add(rowId);
  }
}

const seenPackIds = new Set();
const allowedKnowledgePolicies = new Set(['reuse_free_knowledge', 'goal_specific_knowledge']);
let goalCount = 0;
let sharedKnowledgeGoalCount = 0;
let composedLearningPackCount = 0;

for (const { file, pack } of packs) {
  const prefix = pack.id ?? file;
  if (!pack.id || typeof pack.id !== 'string') {
    errors.push(`${file}: pack requires id`);
  } else if (seenPackIds.has(pack.id)) {
    errors.push(`${file}: duplicate pack id ${pack.id}`);
  } else {
    seenPackIds.add(pack.id);
  }

  let effectiveQuestionRefs = Array.isArray(pack.questionRefs) ? pack.questionRefs : [];
  if (pack.kind === 'learning_pack') {
    if ((pack.includePackRefs?.length ?? 0) > 0) composedLearningPackCount += 1;
    try {
      effectiveQuestionRefs = resolvePackQuestionRefs(learningPackById, pack.id);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  const packQuestions = [];
  if (!Array.isArray(pack.questionRefs)) {
    errors.push(`${prefix}: questionRefs must be an array`);
  } else {
    const refs = new Set();
    for (const questionId of pack.questionRefs) {
      if (refs.has(questionId)) errors.push(`${prefix}: duplicate questionRef ${questionId}`);
      refs.add(questionId);
    }
  }
  for (const questionId of effectiveQuestionRefs) {
    const question = questionById.get(questionId);
    if (!question) errors.push(`${prefix}: unknown effective questionRef ${questionId}`);
    else packQuestions.push(question);
  }

  if (pack.kind === 'goal_path') {
    goalCount += 1;
    if (!Array.isArray(pack.questionRefs) || pack.questionRefs.length === 0) {
      errors.push(`${prefix}: goal_path requires at least one questionRef`);
    }
    if (!allowedKnowledgePolicies.has(pack.knowledgeAccessPolicy)) {
      errors.push(
        `${prefix}: goal_path requires knowledgeAccessPolicy ` +
        `(reuse_free_knowledge or goal_specific_knowledge)`
      );
    }
    if (!pack.profileRef) {
      errors.push(`${prefix}: goal_path requires profileRef`);
    } else if (!profileIds.has(pack.profileRef)) {
      errors.push(`${prefix}: unknown profileRef ${pack.profileRef}`);
    } else {
      const membership = memberships.get(pack.profileRef);
      if (!membership) {
        errors.push(`${prefix}: profile ${pack.profileRef} has no membership collection`);
      } else {
        const memberRows = new Set((membership.members ?? []).map((member) => member.rowId));
        for (const question of packQuestions) {
          const refs = question.knowledgeRefs ?? [];
          if (!refs.length) {
            errors.push(`${prefix}/${question.id}: goal question requires knowledgeRefs for profile traceability`);
            continue;
          }
          const outsideRows = refs.filter((rowId) => !memberRows.has(rowId));
          if (outsideRows.length) {
            errors.push(`${prefix}/${question.id}: knowledgeRefs outside effective profile ${pack.profileRef}: ${outsideRows.join(', ')}`);
          }
        }

        if (pack.knowledgeAccessPolicy === 'reuse_free_knowledge') {
          sharedKnowledgeGoalCount += 1;
          const missingFreeRows = [...memberRows].filter((rowId) => !freeRows.has(rowId));
          if (missingFreeRows.length) {
            const examples = missingFreeRows.slice(0, 8).join(', ');
            errors.push(
              `${prefix}: reuse_free_knowledge requires every effective profile row to be represented in free content; ` +
              `${missingFreeRows.length} missing (${examples}${missingFreeRows.length > 8 ? ', ...' : ''})`
            );
          }
        }
      }
    }
  }

  if (!pack.access || !['free', 'purchase'].includes(pack.access.type)) {
    errors.push(`${prefix}: access.type must be free or purchase`);
  }
  if (pack.access?.type === 'purchase' && !String(pack.access.productId ?? '').trim()) {
    errors.push(`${prefix}: purchase access requires productId`);
  }
}

if (errors.length) {
  console.error(`Product catalog validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Product catalog OK: ${packFiles.length} pack(s), ${composedLearningPackCount} composed learning pack(s), ` +
    `${goalCount} profile-driven goal(s), ${sharedKnowledgeGoalCount} goal(s) reusing free knowledge, ` +
    `${profileIds.size} learning profile(s); effective goal questions remain profile-traceable.`
  );
}
