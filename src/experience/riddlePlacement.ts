import type { SingleChoiceQuestion } from '../contracts/question';
import { validateClueRecord, type ClueRecord } from './clueContract';

export type RiddleSurface = 'play' | 'learn_about' | 'adventure';

export interface SemanticRiddlePlacement {
  surface: RiddleSurface;
  clueSetId: string;
  questionId: string;
  evaluatorKey: 'single_choice@1';
  answerSemanticRef: string;
  candidateSemanticRefs: string[];
  knowledgeRefs: string[];
}

const SURFACES = new Set<RiddleSurface>(['play', 'learn_about', 'adventure']);

/**
 * Surface adapter only. It does not evaluate an answer. The same validated clue
 * record and existing SingleChoice solution remain authoritative everywhere.
 */
export function projectSemanticRiddlePlacement(
  rawClue: ClueRecord,
  question: SingleChoiceQuestion,
  surface: RiddleSurface
): SemanticRiddlePlacement {
  const clue = validateClueRecord(rawClue);
  if (!SURFACES.has(surface)) throw new Error(`Unsupported riddle surface ${String(surface)}`);
  if (!clue.answerSemanticRef) throw new Error(`${clue.clueSetId}: semantic riddle placement requires answerSemanticRef`);
  if (question.interaction.type !== 'single_choice' || question.interaction.version !== 1) {
    throw new Error(`${clue.clueSetId}: R0 semantic placement requires single_choice@1`);
  }

  const optionSemanticRefs = question.interaction.options.map((option, index) => {
    if (!option.semanticRef) throw new Error(`${question.id}: option ${index} needs semanticRef for riddle placement`);
    return option.semanticRef;
  });
  if (new Set(optionSemanticRefs).size !== optionSemanticRefs.length) {
    throw new Error(`${question.id}: riddle option semantic refs must be unique`);
  }
  const declaredCandidates = new Set(clue.candidateSemanticRefs);
  if (optionSemanticRefs.length !== declaredCandidates.size || optionSemanticRefs.some((ref) => !declaredCandidates.has(ref))) {
    throw new Error(`${clue.clueSetId}: question options must exactly match declared clue candidates`);
  }

  if (question.solution.correctOptionIds.length !== 1) {
    throw new Error(`${question.id}: semantic riddle placement requires exactly one correct option`);
  }
  const correctOption = question.interaction.options.find((option) => option.id === question.solution.correctOptionIds[0]);
  if (!correctOption || correctOption.semanticRef !== clue.answerSemanticRef) {
    throw new Error(`${clue.clueSetId}: question solution does not match clue answerSemanticRef`);
  }

  const questionKnowledgeRefs = new Set(question.knowledgeRefs ?? []);
  const clueEvidenceRefs = [...new Set(clue.clues.flatMap((beat) => beat.evidenceRefs ?? []))];
  if (clueEvidenceRefs.some((ref) => !questionKnowledgeRefs.has(ref))) {
    throw new Error(`${clue.clueSetId}: question knowledge refs must cover every clue evidence ref`);
  }

  return {
    surface,
    clueSetId: clue.clueSetId,
    questionId: question.id,
    evaluatorKey: 'single_choice@1',
    answerSemanticRef: clue.answerSemanticRef,
    candidateSemanticRefs: [...clue.candidateSemanticRefs],
    knowledgeRefs: [...questionKnowledgeRefs].sort()
  };
}
