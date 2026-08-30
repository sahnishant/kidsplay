import { readdirSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const questionDirectory = new URL('content/questions/', root);
const indexUrl = new URL('content/index/__generated-learning-index.json', root);
const errors = [];
const questions = readdirSync(questionDirectory)
  .filter((name) => name.endsWith('.json'))
  .sort()
  .flatMap((name) => {
    const value = JSON.parse(readFileSync(new URL(name, questionDirectory), 'utf8'));
    return Array.isArray(value) ? value : [];
  });
const index = JSON.parse(readFileSync(indexUrl, 'utf8'));
const rowById = new Map(index.map((row) => [row.rowId, row]));

let generatedTraced = 0;
let manualTraced = 0;
let reasoningTraced = 0;

for (const question of questions) {
  const source = String(question.authoring?.source ?? '');
  const generated = source.startsWith('knowledge:');
  const reasoning = source === 'kidsplay-editorial-hots';
  const refs = question.knowledgeRefs;

  if (generated) generatedTraced += 1;
  if (reasoning) reasoningTraced += 1;

  if (generated && (!Array.isArray(refs) || !refs.length)) {
    errors.push(`${question.id}: knowledge-generated question requires knowledgeRefs`);
    continue;
  }
  if (reasoning && (!Array.isArray(refs) || refs.length < 2)) {
    errors.push(`${question.id}: HOTS question requires at least two knowledgeRefs`);
    continue;
  }
  if (reasoning && (!Number.isFinite(question.difficulty) || question.difficulty < 3)) {
    errors.push(`${question.id}: HOTS question must use difficulty >= 3`);
  }
  if (!Array.isArray(refs) || !refs.length) continue;

  if (!generated) manualTraced += 1;
  if (refs.some((rowId) => typeof rowId !== 'string' || !rowId.trim())) {
    errors.push(`${question.id}: knowledgeRefs must contain non-empty row IDs`);
    continue;
  }
  if (new Set(refs).size !== refs.length) errors.push(`${question.id}: duplicate knowledgeRefs`);

  const referencedConceptIds = new Set();
  for (const rowId of refs) {
    const row = rowById.get(rowId);
    if (!row) {
      errors.push(`${question.id}: unknown knowledgeRef ${rowId}`);
      continue;
    }
    for (const conceptId of row.conceptIds ?? []) referencedConceptIds.add(conceptId);
  }

  const questionConceptIds = new Set(question.conceptIds ?? []);
  if (questionConceptIds.size !== (question.conceptIds ?? []).length) {
    errors.push(`${question.id}: duplicate conceptIds`);
  }

  if (generated || reasoning) {
    for (const conceptId of referencedConceptIds) {
      if (!questionConceptIds.has(conceptId)) {
        errors.push(`${question.id}: ${generated ? 'generated' : 'HOTS'} question omits referenced concept ${conceptId}`);
      }
    }
  } else if (referencedConceptIds.size > 0) {
    const hasConceptOverlap = [...referencedConceptIds].some((conceptId) => questionConceptIds.has(conceptId));
    if (!hasConceptOverlap) {
      errors.push(`${question.id}: manually traced question has no concept overlap with its knowledgeRefs`);
    }
  }
}

if (!generatedTraced) errors.push('Expected at least one knowledge-generated question to prove traceability');
if (!reasoningTraced) errors.push('Expected at least one multi-knowledge HOTS question to prove reasoning traceability');

if (errors.length) {
  console.error(`Knowledge traceability failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Knowledge traceability OK: ${generatedTraced} generated question(s), ` +
    `${manualTraced} manually-authored traced question(s), ${reasoningTraced} HOTS question(s) ` +
    `all reference canonical rows with compatible concept traces.`
  );
}
