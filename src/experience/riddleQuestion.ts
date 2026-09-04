import type { SingleChoiceQuestion } from '../contracts/question';
import type { ClueRecord } from './clueContract';

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

export function riddleKnowledgeRefs(item: RiddleProductionItem): string[] {
  return [...new Set(item.clue.clues.flatMap((clue) => clue.evidenceRefs ?? []))];
}

/** Shared clue -> existing single_choice@1 question projection. No evaluator is defined here. */
export function riddleToSingleChoiceQuestion(item: RiddleProductionItem): SingleChoiceQuestion {
  const answerSemanticRef = item.clue.answerSemanticRef;
  if (!answerSemanticRef) throw new Error(`${item.clue.clueSetId}: production semantic riddle requires answerSemanticRef`);
  const correct = item.candidates.find((candidate) => candidate.semanticRef === answerSemanticRef);
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
    feedback: { correct: 'You got it!', incorrect: 'Try again. You can use another clue.' },
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
