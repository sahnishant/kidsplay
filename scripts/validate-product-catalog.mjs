import { readdirSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const errors = [];

const registry = readJson('content/learning-profiles/registry.json');
const profileIds = new Set((registry.profiles ?? []).map((profile) => profile.id));
const packFiles = readdirSync(new URL('content/packs/', root))
  .filter((name) => name.endsWith('.json'))
  .sort();
const questionFiles = readdirSync(new URL('content/questions/', root))
  .filter((name) => name.endsWith('.json'))
  .sort();
const questions = questionFiles.flatMap((file) => {
  const value = readJson(`content/questions/${file}`);
  return Array.isArray(value) ? value : [];
});
const membershipFiles = readdirSync(new URL('content/profile-memberships/', root))
  .filter((name) => name.endsWith('.json'))
  .sort();
const memberships = new Map(
  membershipFiles.map((file) => {
    const membership = readJson(`content/profile-memberships/${file}`);
    return [membership.profileRef, membership];
  })
);

let goalCount = 0;
for (const file of packFiles) {
  const pack = readJson(`content/packs/${file}`);
  const prefix = pack.id ?? file;

  if (pack.kind === 'goal_path') {
    goalCount += 1;
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
        const runnableQuestions = questions.filter((question) => {
          const refs = question.knowledgeRefs ?? [];
          return refs.length > 0 && refs.every((rowId) => memberRows.has(rowId));
        });
        if (!runnableQuestions.length) {
          errors.push(`${prefix}: profile ${pack.profileRef} has no generated knowledge-backed questions`);
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
    `Product catalog OK: ${packFiles.length} pack(s), ${goalCount} profile-driven goal(s), ` +
    `${profileIds.size} learning profile(s).`
  );
}
