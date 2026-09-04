import type { SingleChoiceQuestion } from '../contracts/question';
import { validateClueRecord, type ClueRecord } from './clueContract';
import {
  riddleToSingleChoiceQuestion,
  type RiddleCandidatePresentation,
  type RiddleProductionItem
} from './riddleQuestion';
import {
  projectSemanticRiddlePlacement,
  type RiddleSurface,
  type SemanticRiddlePlacement
} from './riddlePlacement';

export type { RiddleCandidatePresentation, RiddleProductionItem } from './riddleQuestion';
export { riddleKnowledgeRefs, riddleToSingleChoiceQuestion } from './riddleQuestion';

export interface RiddleSurfaceProjection {
  surface: RiddleSurface;
  clue: ClueRecord;
  question: SingleChoiceQuestion;
  placement: SemanticRiddlePlacement;
}

export function validateRiddleProductionItem(value: {
  clue: unknown;
  conceptIds: readonly string[];
  candidates: readonly RiddleCandidatePresentation[];
}): RiddleProductionItem {
  const clue = validateClueRecord(value.clue);
  if (!value.conceptIds.length || value.conceptIds.some((id) => !id.trim())) {
    throw new Error(`${clue.clueSetId}: conceptIds are required`);
  }
  if (new Set(value.conceptIds).size !== value.conceptIds.length) {
    throw new Error(`${clue.clueSetId}: duplicate conceptIds`);
  }

  const declared = new Set(clue.candidateSemanticRefs);
  const presented = new Set(value.candidates.map((candidate) => candidate.semanticRef));
  if (declared.size !== presented.size || [...declared].some((semanticRef) => !presented.has(semanticRef))) {
    throw new Error(`${clue.clueSetId}: candidate presentation must exactly match the declared candidate universe`);
  }
  if (new Set(value.candidates.map((candidate) => candidate.optionId)).size !== value.candidates.length) {
    throw new Error(`${clue.clueSetId}: duplicate option ids`);
  }
  for (const candidate of value.candidates) {
    if (!candidate.optionId.trim() || !candidate.label.trim() || candidate.visualRefs.length === 0) {
      throw new Error(`${clue.clueSetId}: every production candidate needs an option id, label and semantic visual`);
    }
  }

  return {
    clue,
    conceptIds: [...value.conceptIds],
    candidates: value.candidates.map((candidate) => ({ ...candidate, visualRefs: [...candidate.visualRefs] }))
  };
}

/** Surface adapter only; validation/evaluator identity remains owned by the shared contract. */
export function projectRiddleToSurface(item: RiddleProductionItem, surface: RiddleSurface): RiddleSurfaceProjection {
  const question = riddleToSingleChoiceQuestion(item);
  return {
    surface,
    clue: item.clue,
    question,
    placement: projectSemanticRiddlePlacement(item.clue, question, surface)
  };
}
