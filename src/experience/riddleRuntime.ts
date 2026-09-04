import type { SingleChoiceQuestion } from '../contracts/question';
import { validateClueRecord, type ClueRecord } from './clueContract';
import {
  projectSemanticRiddlePlacement,
  type RiddleSurface,
  type SemanticRiddlePlacement
} from './riddlePlacement';

export interface RiddleCandidatePresentation {
  optionId: string;
  semanticRef: string;
  label: string;
  visualRefs: readonly string[];
}

export interface RiddleProductionItem {
  clue: ClueRecord;
  conceptIds: readonly string[];
  candidates: readonly RiddleCandidatePresentation[];
}

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

export function riddleKnowledgeRefs(item: RiddleProductionItem): string[] {
  return [...new Set(item.clue.clues.flatMap((clue) => clue.evidenceRefs ?? []))];
}

export function riddleToSingleChoiceQuestion(item: RiddleProductionItem): SingleChoiceQuestion {
  if (!item.clue.answerSemanticRef) {
    throw new Error(`${item.clue.clueSetId}: production semantic riddle requires answerSemanticRef`);
  }
  const correct = item.candidates.find((candidate) => candidate.semanticRef === item.clue.answerSemanticRef);
  if (!correct) throw new Error(`${item.clue.clueSetId}: answer presentation is missing`);

  return {
    id: `question.${item.clue.clueSetId}`,
    revision: 1,
    schemaVersion: 1,
    conceptIds: [...item.conceptIds],
    knowledgeRefs: riddleKnowledgeRefs(item),
    difficulty: item.clue.demandBand === 'r0' ? 1 : 3,
    language: item.clue.language ?? 'en',
    prompt: { text: item.clue.demandBand === 'r0' ? 'Listen and choose.' : 'Who am I?' },
    feedback: {
      correct: 'You got it!',
      incorrect: 'Try again. You can use another clue.'
    },
    authoring: { status: 'draft', source: 'kidsplay-riddle-v1-candidate' },
    interaction: {
      type: 'single_choice',
      version: 1,
      shuffleOptions: true,
      options: item.candidates.map((candidate) => ({
        id: candidate.optionId,
        label: candidate.label,
        semanticRef: candidate.semanticRef,
        visualRefs: [...candidate.visualRefs]
      }))
    },
    solution: { type: 'exact_option', correctOptionIds: [correct.optionId] }
  };
}

/**
 * Surface projection is navigation/presentation-only. The same ClueRecord and
 * same existing SingleChoice evaluator contract are reused in Play, Learn About
 * and Adventure. Placement authority remains owned by riddlePlacement.ts.
 */
export function projectRiddleToSurface(item: RiddleProductionItem, surface: RiddleSurface): RiddleSurfaceProjection {
  const question = riddleToSingleChoiceQuestion(item);
  return {
    surface,
    clue: item.clue,
    question,
    placement: projectSemanticRiddlePlacement(item.clue, question, surface)
  };
}
