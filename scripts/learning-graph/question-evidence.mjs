import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadObjectiveSystem, validateObjectiveSystem } from './objective-projection.mjs';
import { indexRecords, validateCanonicalGraph } from './canonical-graph.mjs';
import { validateQuestionSemanticTarget } from './question-semantic-targets.mjs';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const must = (condition, message) => { if (!condition) throw new Error(message); };
const sameSet = (left, right) => {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
  const a = [...left].sort();
  const b = [...right].sort();
  return a.every((value, index) => value === b[index]);
};
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const unique = (values, label) => {
  must(Array.isArray(values) && new Set(values).size === values.length, `${label}: expected a unique array`);
  return values;
};

function readQuestions(root, directoryPath) {
  must(typeof directoryPath === 'string' && directoryPath.startsWith('content/') && !directoryPath.includes('..'), 'Question evidence policy requires a repository-local content questionDirectory');
  const directory = resolve(root, directoryPath);
  return readdirSync(directory)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .flatMap((name) => JSON.parse(readFileSync(resolve(directory, name), 'utf8')));
}

export function validateQuestionEvidencePolicy({ root = ROOT, modulePath } = {}) {
  const system = loadObjectiveSystem(root, modulePath);
  validateCanonicalGraph(system.graph);
  validateObjectiveSystem(system);

  const graph = system.graph;
  must(typeof graph.questionEvidenceFile === 'string' && graph.questionEvidenceFile, 'Graph must register a question evidence policy');
  const policy = JSON.parse(readFileSync(resolve(root, graph.questionEvidenceFile), 'utf8'));
  must(policy.schemaVersion === 1 && typeof policy.policyId === 'string' && policy.policyId, 'Unsupported question evidence policy');
  must(policy.moduleRef === graph.runtimeCompanionRef, 'Question evidence policy/module mismatch');
  must(policy.review?.status === 'editorial_candidate' && policy.review?.publishable === false, 'Question evidence migration cannot imply human approval');
  must(policy.rules?.naturalLanguageEntailmentCertified === false, 'Natural-language entailment cannot be silently certified');
  must(policy.rules?.supportingKnowledgeNeverRecordsEvidence === true, 'Supporting knowledge must remain non-evidentiary');

  const questions = readQuestions(root, policy.questionDirectory);
  const questionById = indexRecords(questions, 'question');
  const objectives = indexRecords(system.objectives, 'objective');
  const claims = indexRecords(graph.claims, 'claim');
  const processes = indexRecords(graph.processes ?? [], 'process');
  const projectedClaims = new Set(system.compatibility.projection.entries.map((entry) => entry.claimRef));

  const objectiveByLegacyId = new Map();
  for (const objective of objectives.values()) {
    for (const legacyId of objective.legacyConceptIds ?? []) {
      must(!objectiveByLegacyId.has(legacyId), `Legacy progress ID ${legacyId} maps to more than one objective`);
      objectiveByLegacyId.set(legacyId, objective);
    }
  }

  unique(policy.questionRefs, policy.policyId);
  must(sameSet(policy.questionRefs, [...questionById.keys()]), 'Question evidence policy must cover every configured question exactly once');
  const strongRefs = new Set(unique(policy.strongSemanticTargetRefs, 'strongSemanticTargetRefs'));
  const practiceOnlyRefs = new Set(unique(policy.practiceOnlyQuestionRefs, 'practiceOnlyQuestionRefs'));
  const capabilityOnlyRefs = new Set(unique(policy.capabilityOnlyQuestionRefs, 'capabilityOnlyQuestionRefs'));
  const knowledgeForbiddenRefs = new Set(unique(policy.knowledgeEvidenceForbiddenQuestionRefs, 'knowledgeEvidenceForbiddenQuestionRefs'));
  const practiceOnlyInteractionTypes = new Set(unique(policy.practiceOnlyInteractionTypes, 'practiceOnlyInteractionTypes'));

  for (const ref of [...strongRefs, ...practiceOnlyRefs, ...capabilityOnlyRefs, ...knowledgeForbiddenRefs]) {
    must(questionById.has(ref), `${policy.policyId}: unknown question ref ${ref}`);
  }

  const embeddedSemanticRefs = questions.filter((question) => question.semanticTarget).map((question) => question.id);
  must(sameSet([...strongRefs], embeddedSemanticRefs), 'Strong semantic target registry must exactly match embedded semantic targets');

  let evidenceEligibleCount = 0;
  let claimEvidenceQuestionCount = 0;
  for (const question of questions) {
    must(Array.isArray(question.conceptIds) && question.conceptIds.length > 0, `${question.id}: conceptIds required`);
    const questionObjectives = new Set();
    for (const legacyId of question.conceptIds) {
      const objective = objectiveByLegacyId.get(legacyId);
      must(objective, `${question.id}: legacy concept ${legacyId} has no canonical objective`);
      questionObjectives.add(objective.id);
    }

    const practiceOnly = question.evidencePolicy === 'practice_only';
    must(practiceOnly === practiceOnlyRefs.has(question.id), `${question.id}: evidencePolicy disagrees with canonical policy`);
    if (!practiceOnly) evidenceEligibleCount += 1;

    if (strongRefs.has(question.id)) validateQuestionSemanticTarget(question, system);

    const knowledgeRefs = unique(question.knowledgeRefs ?? [], `${question.id}.knowledgeRefs`);
    for (const ref of knowledgeRefs) {
      const claim = claims.get(ref);
      must(claim, `${question.id}: unknown canonical knowledge claim ${ref}`);
      must(projectedClaims.has(ref), `${question.id}: knowledge claim ${ref} is not admitted to runtime projection`);
      must(claim.scope?.kind === 'shared' && claim.polarity === 'positive', `${question.id}: evidence must use positive shared knowledge`);
      if (!practiceOnly) {
        must((claim.objectiveRefs ?? []).some((objectiveRef) => questionObjectives.has(objectiveRef)), `${question.id}: ${ref} does not support any objective named by the question`);
      }
    }
    if (!practiceOnly && knowledgeRefs.length > 0) claimEvidenceQuestionCount += 1;

    if (knowledgeForbiddenRefs.has(question.id)) {
      must(knowledgeRefs.length === 0, `${question.id}: policy forbids knowledge mastery evidence`);
    }
    if (practiceOnlyInteractionTypes.has(question.interaction?.type)) {
      must(practiceOnly && knowledgeRefs.length === 0, `${question.id}: ${question.interaction.type} must remain practice-only with no knowledge evidence`);
    }

    if (capabilityOnlyRefs.has(question.id)) {
      must(!practiceOnly, `${question.id}: capability-only assessment must remain evidence eligible`);
      must(knowledgeRefs.length === 0, `${question.id}: capability-only activity cannot write knowledge evidence`);
      for (const objectiveRef of questionObjectives) {
        const objective = objectives.get(objectiveRef);
        must((objective.capabilityRefs ?? []).length > 0 && (objective.targetClaimRefs ?? []).length === 0, `${question.id}: capability-only registry contains a knowledge objective`);
      }
    }
  }

  const supportingEntries = Object.entries(policy.supportingKnowledgeByQuestion ?? {});
  for (const [questionId, refs] of supportingEntries) {
    const question = questionById.get(questionId);
    must(question, `Supporting knowledge points to unknown question ${questionId}`);
    must(knowledgeForbiddenRefs.has(questionId), `${questionId}: supporting-only knowledge requires an explicit no-knowledge-evidence question policy`);
    must((question.knowledgeRefs ?? []).length === 0, `${questionId}: supporting knowledge leaked into evidence refs`);
    for (const ref of unique(refs, `${questionId}.supportingKnowledge`)) {
      const claim = claims.get(ref);
      must(claim && claim.scope?.kind === 'shared' && claim.polarity === 'positive', `${questionId}: invalid supporting claim ${ref}`);
      must(projectedClaims.has(ref), `${questionId}: supporting claim ${ref} is not admitted to runtime`);
    }
  }

  const processEntries = Object.entries(policy.processTargets ?? {});
  for (const [questionId, processId] of processEntries) {
    const question = questionById.get(questionId);
    const process = processes.get(processId);
    must(question?.interaction?.type === 'sequence_order', `${questionId}: process target requires sequence_order`);
    must(process && Array.isArray(process.orderedEdgeRefs), `${questionId}: unknown ordered process ${processId}`);
    must(same(question.knowledgeRefs ?? [], process.orderedEdgeRefs), `${questionId}: sequence evidence must exactly match canonical process order`);
  }

  must(policy.rules.knowledgeRefsMustBeCanonical === true, 'Canonical knowledge-ref rule weakened');
  must(policy.rules.evidenceEligibleKnowledgeMustMatchQuestionObjectives === true, 'Objective/evidence compatibility rule weakened');
  must(policy.rules.knowledgeEvidenceForbiddenRefsRequired === true, 'Explicit no-knowledge-evidence registry rule weakened');
  must(policy.rules.practiceOnlyInteractionTypesRequired === true, 'Practice-only interaction registry rule weakened');

  const practiceOnlyInteractionCoverage = questions
    .filter((question) => practiceOnlyInteractionTypes.has(question.interaction?.type))
    .every((question) => question.evidencePolicy === 'practice_only' && !(question.knowledgeRefs?.length));

  return {
    policyId: policy.policyId,
    questionCount: questions.length,
    strongSemanticTargetCount: strongRefs.size,
    practiceOnlyCount: practiceOnlyRefs.size,
    evidenceEligibleCount,
    capabilityOnlyCount: capabilityOnlyRefs.size,
    claimEvidenceQuestionCount,
    processQuestionCount: processEntries.length,
    supportingKnowledgeQuestionCount: supportingEntries.length,
    knowledgeEvidenceForbiddenCount: knowledgeForbiddenRefs.size,
    practiceOnlyInteractionTypeCount: practiceOnlyInteractionTypes.size,
    practiceOnlyInteractionCoverage,
    naturalLanguageEntailmentCertified: false
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const moduleArg = process.argv.find((arg) => arg.startsWith('--module='));
    console.log(JSON.stringify(validateQuestionEvidencePolicy({ modulePath: moduleArg?.slice('--module='.length) })));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
