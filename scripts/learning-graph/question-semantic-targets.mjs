import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadObjectiveSystem, validateObjectiveSystem } from './objective-projection.mjs';
import { indexRecords, validateCanonicalGraph } from './canonical-graph.mjs';

const must = (condition, message) => { if (!condition) throw new Error(message); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
export function validateQuestionSemanticTarget(question, system) {
  const target = question.semanticTarget;
  must(target?.schemaVersion === 1 && ['select_subject','select_object'].includes(target.kind), `${question.id}: typed semantic target required`);
  must(question.interaction.type === 'single_choice' && question.solution.type === 'exact_option', `${question.id}: unsupported target interaction`);
  const claims = indexRecords(system.graph.claims, 'claim'), nodes = indexRecords(system.graph.nodes, 'node');
  const claim = claims.get(target.claimRef);
  must(claim && claim.polarity === 'positive' && claim.scope.kind === 'shared', `${question.id}: unresolved positive shared claim`);
  must(target.claimRevision === claim.revision, `${question.id}: stale claim revision`);
  must(target.promptBinding === question.prompt.text, `${question.id}: unreviewed prompt drift`);
  must(target.feedbackBinding?.correct === question.feedback.correct && target.feedbackBinding?.incorrect === question.feedback.incorrect, `${question.id}: unreviewed feedback drift`);
  must(target.query?.predicate === claim.predicate, `${question.id}: predicate does not match the tested claim`);
  const fixedSide = target.kind === 'select_subject' ? 'objectRef' : 'subjectRef';
  const answerSide = target.kind === 'select_subject' ? 'subjectRef' : 'objectRef';
  must(target.query[fixedSide] === claim[fixedSide], `${question.id}: fixed endpoint does not match the tested claim`);
  must(same(target.query.qualifiers, claim.qualifiers), `${question.id}: qualifier/condition loss`);
  const objective = system.objectives.find((item) => item.id === target.objectiveRef);
  must(objective?.targetClaimRefs.includes(claim.id) && claim.objectiveRefs.includes(objective.id), `${question.id}: target is outside the objective's claims`);
  must(objective.legacyConceptIds.some((id) => question.conceptIds.includes(id)), `${question.id}: target does not bind the existing progress ID`);
  must(question.knowledgeRefs?.includes(claim.id), `${question.id}: question omits its actual target evidence`);
  const options = question.interaction.options, mappings = target.optionNodeRefs;
  must(mappings && Object.keys(mappings).length === options.length && options.every((item) => Object.hasOwn(mappings, item.id) && nodes.has(mappings[item.id])), `${question.id}: incomplete option-to-node binding`);
  const answers = options.filter((option) => mappings[option.id] === claim[answerSide]).map((option) => option.id);
  must(answers.length === 1 && same(answers, question.solution.correctOptionIds), `${question.id}: answer does not match the canonical claim endpoint`);
  must(target.review?.status === 'editorial_candidate' && target.review.publishable === false, `${question.id}: target migration cannot claim editorial approval`);
  must(question.evidencePolicy === 'practice_only', `${question.id}: unapproved semantic targets cannot refresh mastery`);
  return { questionId: question.id, claimRef: claim.id, targetObjectiveRef: objective.id };
}
export function validateBicycleSemanticTargets(root = ROOT) {
  const system = loadObjectiveSystem(root);
  validateCanonicalGraph(system.graph); validateObjectiveSystem(system);
  const targets = JSON.parse(readFileSync(resolve(root, system.graph.assessmentTargetFile), 'utf8'));
  const questions = readdirSync(resolve(root, 'content/curriculum-runtime/bicycle-workshop/questions')).filter((file) => file.endsWith('.json')).flatMap((file) => JSON.parse(readFileSync(resolve(root, 'content/curriculum-runtime/bicycle-workshop/questions', file), 'utf8')));
  const byId = indexRecords(questions, 'question');
  must(targets.questionRefs.length === 8 && new Set(targets.questionRefs).size === 8, 'Eight revised semantic pilot targets must remain registered');
  for (const id of targets.questionRefs) validateQuestionSemanticTarget(byId.get(id) ?? { id }, system);
  for (const question of questions) if (question.semanticTarget) must(targets.questionRefs.includes(question.id), `${question.id}: unregistered semantic target`);
  return { semanticTargetCount: targets.questionRefs.length, naturalLanguageEntailmentCertified: false, unapprovedTargetsPracticeOnly: true };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(validateBicycleSemanticTargets())); }
  catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
}
