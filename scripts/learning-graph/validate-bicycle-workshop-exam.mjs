import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const read = (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const invariant = (condition, message) => { if (!condition) throw new Error(message); };

function readQuestions() {
  return readdirSync(resolve(ROOT, 'content/questions'))
    .filter((name) => name.startsWith('bicycle-workshop-') && name.endsWith('.json'))
    .sort()
    .flatMap((name) => read(`content/questions/${name}`));
}

export function validateBicycleWorkshopExam() {
  const blueprint = read('content/module-assessments/mridang/bicycle-workshop-exam-v1.json');
  const livePack = read('content/packs/free-bicycle-workshop-chapter-check.json');
  const projection = read('content/knowledge/bicycle-workshop-runtime-projection.json');
  const questions = readQuestions();
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const projectionById = new Map(projection.entries.map((row) => [row.rowId, row]));
  const allowedScopes = new Set(blueprint.scopePolicy.allowed);
  const excludedScopes = new Set(blueprint.scopePolicy.excluded);

  invariant(blueprint.officialBoardPaper === false, 'Companion check must not claim official-board-paper status');
  invariant(blueprint.sourceTextRequiredInRuntime === false, 'Exam companion must not require copied source text');
  invariant(blueprint.sourceArtworkRequiredInRuntime === false, 'Exam companion must not require source artwork');
  invariant(blueprint.totalQuestions === blueprint.sections.reduce((sum, section) => sum + section.count, 0), 'Section counts do not match totalQuestions');
  invariant(blueprint.totalMarks === blueprint.sections.reduce((sum, section) => sum + section.count * section.marksPerQuestion, 0), 'Section marks do not match totalMarks');
  invariant(blueprint.forms.length >= 3, 'At least three equivalent forms are required to prevent answer memorisation');

  for (const form of blueprint.forms) {
    invariant(form.questionRefs.length === blueprint.totalQuestions, `${form.id}: wrong question count`);
    invariant(new Set(form.questionRefs).size === form.questionRefs.length, `${form.id}: duplicate question`);
    for (const ref of form.questionRefs) {
      const question = questionById.get(ref);
      invariant(question, `${form.id}: unknown question ${ref}`);
      invariant(question.authoring?.source === 'kidsplay-independent-curriculum-companion', `${form.id}/${ref}: non-independent authoring source`);
      for (const rowId of question.knowledgeRefs ?? []) {
        const row = projectionById.get(rowId);
        invariant(row, `${form.id}/${ref}: unresolved knowledgeRef ${rowId}`);
        const scope = row.meta?.examScope;
        invariant(!excludedScopes.has(scope), `${form.id}/${ref}: excluded ${scope} row ${rowId}`);
        invariant(allowedScopes.has(scope), `${form.id}/${ref}: unadmitted exam scope ${scope} for ${rowId}`);
      }
    }

    const sectionSlices = [];
    let offset = 0;
    for (const section of blueprint.sections) {
      sectionSlices.push({ sectionId: section.id, questionRefs: form.questionRefs.slice(offset, offset + section.count) });
      offset += section.count;
    }
    invariant(sectionSlices.every((slice) => slice.questionRefs.length === 2), `${form.id}: every current section must contain two questions`);
  }

  const formA = blueprint.forms.find((form) => form.id === 'form-a');
  invariant(formA, 'Missing live form-a');
  invariant(livePack.assessmentBlueprintRef === blueprint.blueprintId, 'Live pack points to the wrong blueprint');
  invariant(livePack.assessmentFormRef === formA.id, 'Live pack points to the wrong form');
  invariant(JSON.stringify(livePack.questionRefs) === JSON.stringify(formA.questionRefs), 'Live pack must exactly match form-a membership and order');
  invariant(livePack.status === 'prototype', 'Chapter check must remain visibly prototype until human exam review');
  invariant(livePack.authoring.officialBoardPaper === false, 'Live pack must not claim official-board status');

  const semanticCoverage = {
    partsAndJobs: new Set(blueprint.forms.flatMap((form) => form.questionRefs.slice(0, 2))).size,
    words: new Set(blueprint.forms.flatMap((form) => form.questionRefs.slice(2, 4))).size,
    soundsAndSentences: new Set(blueprint.forms.flatMap((form) => form.questionRefs.slice(4, 6))).size,
    applyAndSafety: new Set(blueprint.forms.flatMap((form) => form.questionRefs.slice(6, 8))).size
  };
  invariant(Object.values(semanticCoverage).every((count) => count >= 3), 'Equivalent forms need meaningful question variation in every strand');

  return {
    blueprintId: blueprint.blueprintId,
    formCount: blueprint.forms.length,
    questionsPerForm: blueprint.totalQuestions,
    totalMarks: blueprint.totalMarks,
    livePackId: livePack.id,
    chapterContextRuntimeEnabled: blueprint.scopePolicy.chapterContextOverlayRuntimeEnabled,
    semanticCoverage
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const result = validateBicycleWorkshopExam();
    console.log(process.argv.includes('--json') ? JSON.stringify(result) : `Validated ${result.blueprintId}: ${result.formCount} forms × ${result.questionsPerForm} questions.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
