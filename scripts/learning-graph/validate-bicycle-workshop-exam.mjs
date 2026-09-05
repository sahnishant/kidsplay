import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const read = (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const invariant = (condition, message) => { if (!condition) throw new Error(message); };

function readQuestions() {
  return readdirSync(resolve(ROOT, 'content/curriculum-runtime/bicycle-workshop/questions'))
    .filter((name) => name.endsWith('.json'))
    .sort()
    .flatMap((name) => read(`content/curriculum-runtime/bicycle-workshop/questions/${name}`));
}

export function validateBicycleWorkshopExam() {
  const blueprint = read('content/module-assessments/mridang/bicycle-workshop-exam-v1.json');
  const livePack = read('content/curriculum-runtime/bicycle-workshop/packs/chapter-check.json');
  const projection = read('content/knowledge/bicycle-workshop-runtime-projection.json');
  const questions = readQuestions();
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const projectionById = new Map(projection.entries.map((row) => [row.rowId, row]));
  const allowedScopes = new Set(blueprint.scopePolicy.allowed);
  const excludedScopes = new Set(blueprint.scopePolicy.excluded);
  const claimScopes = blueprint.scopePolicy.claimScopes ?? {};

  invariant(blueprint.officialBoardPaper === false, 'Companion check must not claim official-board-paper status');
  invariant(blueprint.sourceTextRequiredInRuntime === false, 'Exam companion must not require copied source text');
  invariant(blueprint.sourceArtworkRequiredInRuntime === false, 'Exam companion must not require source artwork');
  invariant(blueprint.totalQuestions === blueprint.sections.reduce((sum, section) => sum + section.count, 0), 'Section counts do not match totalQuestions');
  invariant(blueprint.totalMarks === blueprint.sections.reduce((sum, section) => sum + section.count * section.marksPerQuestion, 0), 'Section marks do not match totalMarks');
  invariant(blueprint.forms.length >= 3, 'At least three equivalent forms are required to prevent answer memorisation');

  /*
   * Exam scope belongs to the curriculum/assessment overlay, not to a shared
   * canonical fact. The same fact may be core in one chapter and enrichment
   * in another, so every admitted projection row is classified explicitly
   * in this blueprint.
   */
  for (const rowId of projectionById.keys()) {
    invariant(typeof claimScopes[rowId] === 'string', `Missing explicit exam scope for ${rowId}`);
  }
  for (const [rowId, scope] of Object.entries(claimScopes)) {
    invariant(projectionById.has(rowId), `Exam scope references unknown projection row ${rowId}`);
    invariant(allowedScopes.has(scope) || excludedScopes.has(scope), `Unknown exam scope ${scope} for ${rowId}`);
  }

  for (const form of blueprint.forms) {
    invariant(form.questionRefs.length === blueprint.totalQuestions, `${form.id}: wrong question count`);
    invariant(new Set(form.questionRefs).size === form.questionRefs.length, `${form.id}: duplicate question`);
    for (const ref of form.questionRefs) {
      const question = questionById.get(ref);
      invariant(question, `${form.id}: unknown question ${ref}`);
      invariant(question.authoring?.source === 'kidsplay-independent-curriculum-companion', `${form.id}/${ref}: non-independent authoring source`);
      for (const rowId of question.knowledgeRefs ?? []) {
        invariant(projectionById.has(rowId), `${form.id}/${ref}: unresolved knowledgeRef ${rowId}`);
        const scope = claimScopes[rowId];
        invariant(typeof scope === 'string', `${form.id}/${ref}: missing explicit exam scope for ${rowId}`);
        invariant(!excludedScopes.has(scope), `${form.id}/${ref}: excluded ${scope} row ${rowId}`);
        invariant(allowedScopes.has(scope), `${form.id}/${ref}: unadmitted exam scope ${scope} for ${rowId}`);
      }
    }
  }

  invariant(livePack.id === blueprint.livePracticePackRef, 'Live chapter-check pack ID does not match the blueprint');
  invariant(livePack.status === 'reviewed', 'Live chapter check must remain a reviewed formative companion');
  invariant(livePack.questionRefs.length === 8, 'Live chapter check must contain eight questions');
  invariant(new Set(livePack.questionRefs).size === livePack.questionRefs.length, 'Live chapter check contains duplicate questions');
  invariant(livePack.assessmentScope?.officialPaperClaimed === false, 'Live pack must not claim official-board status');
  invariant(livePack.assessmentScope?.sourcePassageReproduced === false, 'Live pack must not reproduce the source passage');
  for (const ref of livePack.questionRefs) invariant(questionById.has(ref), `Live chapter check has unknown question ${ref}`);

  const semanticCoverage = {
    partsAndJobs: new Set(blueprint.forms.flatMap((form) => form.questionRefs.slice(0, 2))).size,
    words: new Set(blueprint.forms.flatMap((form) => form.questionRefs.slice(2, 4))).size,
    soundsAndSentences: new Set(blueprint.forms.flatMap((form) => form.questionRefs.slice(4, 6))).size,
    applyAndSafety: new Set(blueprint.forms.flatMap((form) => form.questionRefs.slice(6, 8))).size
  };
  invariant(Object.values(semanticCoverage).every((count) => count >= 3), 'Equivalent forms need meaningful question variation in every strand');

  const scopeCounts = Object.values(claimScopes).reduce((counts, scope) => {
    counts[scope] = (counts[scope] ?? 0) + 1;
    return counts;
  }, {});

  return {
    blueprintId: blueprint.blueprintId,
    formCount: blueprint.forms.length,
    questionsPerForm: blueprint.totalQuestions,
    totalMarks: blueprint.totalMarks,
    livePackId: livePack.id,
    livePackQuestionCount: livePack.questionRefs.length,
    chapterContextRuntimeEnabled: blueprint.scopePolicy.chapterContextOverlayRuntimeEnabled,
    explicitScopeCount: Object.keys(claimScopes).length,
    scopeCounts,
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
