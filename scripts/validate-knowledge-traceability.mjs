import { readdirSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const questionDirectory = new URL('content/questions/', root);
const errors = [];
const questions = readdirSync(questionDirectory)
  .filter((name) => name.endsWith('.json'))
  .sort()
  .flatMap((name) => {
    const value = JSON.parse(readFileSync(new URL(name, questionDirectory), 'utf8'));
    return Array.isArray(value) ? value : [];
  });

let traced = 0;
for (const question of questions) {
  if (!String(question.authoring?.source ?? '').startsWith('knowledge:')) continue;
  traced += 1;
  const refs = question.knowledgeRefs;
  if (!Array.isArray(refs) || !refs.length) {
    errors.push(`${question.id}: knowledge-generated question requires knowledgeRefs`);
    continue;
  }
  if (refs.some((rowId) => typeof rowId !== 'string' || !rowId.trim())) errors.push(`${question.id}: knowledgeRefs must contain non-empty row IDs`);
  if (new Set(refs).size !== refs.length) errors.push(`${question.id}: duplicate knowledgeRefs`);
}

if (!traced) errors.push('Expected at least one knowledge-generated question to prove traceability');

if (errors.length) {
  console.error(`Knowledge traceability failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Knowledge traceability OK: ${traced} generated question(s) carry stable row references.`);
}
