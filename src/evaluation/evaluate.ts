import type { MazePathQuestion, Question } from '../contracts/question';
import type { EvaluationResult } from '../contracts/runtime';
import { canTravel } from '../mechanics/maze';
import { traceCorridorScore } from '../mechanics/tracePath';

const sameStringSet = (actual: string[], expected: string[]): boolean => {
  if (actual.length !== expected.length) return false;
  const actualSet = new Set(actual);
  return actualSet.size === actual.length && expected.every((value) => actualSet.has(value));
};
const boundedScore = (correctParts: number, totalParts: number): number => totalParts <= 0 ? 0 : Math.max(0, Math.min(1, correctParts / totalParts));
const pairKey = (first: string, second: string): string => first < second ? `${first}\u0000${second}` : `${second}\u0000${first}`;
const normalizeTextAnswer = (value: unknown): string => typeof value === 'string' ? value.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';

type MazeInteraction = MazePathQuestion['interaction'];

function setOverlapScore(expected: Set<string>, actual: Set<string>): number {
  const union = new Set([...expected, ...actual]);
  const correct = [...expected].filter((value) => actual.has(value)).length;
  return boundedScore(correct, union.size);
}

function recordAnswerScore(
  expected: Record<string, unknown>,
  actual: Record<string, unknown> | undefined,
  isCorrect: (key: string, expectedValue: unknown, actualValue: unknown) => boolean
): number {
  const expectedEntries = Object.entries(expected);
  const actualKeys = actual ? Object.keys(actual) : [];
  const totalParts = new Set([...expectedEntries.map(([key]) => key), ...actualKeys]).size;
  const correctParts = expectedEntries.filter(([key, expectedValue]) =>
    isCorrect(key, expectedValue, actual?.[key])
  ).length;
  return boundedScore(correctParts, totalParts);
}

function isValidMazePath(interaction: MazeInteraction, goalIndex: number, path: number[]): boolean {
  if (!path.length || path[0] !== interaction.startIndex || path[path.length - 1] !== goalIndex) return false;
  if (goalIndex !== interaction.goalIndex) return false;

  for (let index = 1; index < path.length; index += 1) {
    if (!canTravel(interaction.wallMasks, interaction.rows, interaction.cols, path[index - 1], path[index])) return false;
  }
  return true;
}

function sequenceOrderScore(question: Question, actual: string[]): number {
  if (question.solution.type !== 'ordered_items') return 0;
  const expected = question.solution.orderedItemIds;
  const scoreById = (): number => {
    const correctPositions = expected.filter((id, index) => actual[index] === id).length;
    return boundedScore(correctPositions, Math.max(expected.length, actual.length));
  };

  if (question.interaction.type !== 'sequence_order') return scoreById();

  const items = question.interaction.items;
  const itemById = new Map(items.map((item) => [item.id, item]));
  const letterSequence = items.length >= 2 && items.every(
    (item) => Array.from(item.label).length === 1 && /^[A-Z0-9]$/i.test(item.label)
  );
  const actualIdsAreValid = actual.every((id) => itemById.has(id)) && new Set(actual).size === actual.length;
  if (!letterSequence || !actualIdsAreValid) return scoreById();

  const comparableKey = (id: string | undefined): string | undefined => {
    if (!id) return undefined;
    return itemById.get(id)?.label.toUpperCase();
  };
  const correctPositions = expected.filter(
    (id, index) => comparableKey(actual[index]) === comparableKey(id)
  ).length;
  return boundedScore(correctPositions, Math.max(expected.length, actual.length));
}

export function evaluate(question: Question, response: unknown): EvaluationResult {
  let score = 0;

  if (question.solution.type === 'exact_option') {
    const payload = response as { selectedOptionIds?: unknown };
    const selected = Array.isArray(payload?.selectedOptionIds) ? payload.selectedOptionIds.filter((value): value is string => typeof value === 'string') : [];
    score = sameStringSet(selected, question.solution.correctOptionIds) ? 1 : 0;
  }
  if (question.solution.type === 'blank_answers') {
    const payload = response as { blankAnswers?: Record<string, unknown> };
    score = recordAnswerScore(
      question.solution.answers,
      payload?.blankAnswers,
      (_blankId, accepted, actual) => typeof actual === 'string' && Array.isArray(accepted) && accepted.includes(actual)
    );
  }
  if (question.solution.type === 'target_assignment') {
    const payload = response as { assignments?: Record<string, unknown> };
    score = recordAnswerScore(
      question.solution.assignments,
      payload?.assignments,
      (_itemId, targetId, actual) => actual === targetId
    );
  }
  if (question.solution.type === 'found_terms') {
    const payload = response as { foundTermIds?: unknown };
    const found = new Set(Array.isArray(payload?.foundTermIds) ? payload.foundTermIds.filter((value): value is string => typeof value === 'string') : []);
    score = setOverlapScore(new Set(question.solution.requiredTermIds), found);
  }
  if (question.solution.type === 'pair_matches') {
    const expected = new Set(question.solution.pairs.map(([first, second]) => pairKey(first, second)));
    const payload = response as { matchedPairs?: unknown };
    const actual = new Set<string>();
    if (Array.isArray(payload?.matchedPairs)) {
      for (const pair of payload.matchedPairs) {
        if (Array.isArray(pair) && pair.length === 2 && typeof pair[0] === 'string' && typeof pair[1] === 'string') {
          actual.add(pairKey(pair[0], pair[1]));
        }
      }
    }
    score = setOverlapScore(expected, actual);
  }
  if (question.solution.type === 'ordered_items') {
    const payload = response as { orderedItemIds?: unknown };
    const actual = Array.isArray(payload?.orderedItemIds) ? payload.orderedItemIds.filter((value): value is string => typeof value === 'string') : [];
    score = sequenceOrderScore(question, actual);
  }
  if (question.solution.type === 'selected_regions') {
    const payload = response as { selectedRegionIds?: unknown };
    const actual = new Set(Array.isArray(payload?.selectedRegionIds) ? payload.selectedRegionIds.filter((value): value is string => typeof value === 'string') : []);
    score = setOverlapScore(new Set(question.solution.correctRegionIds), actual);
  }
  if (question.solution.type === 'trace_corridor' && question.interaction.type === 'trace_path') {
    score = traceCorridorScore(question, response);
  }
  if (question.solution.type === 'crossword_answers') {
    const payload = response as { answers?: Record<string, unknown> };
    score = recordAnswerScore(
      question.solution.answers,
      payload?.answers,
      (_id, answer, actual) => normalizeTextAnswer(actual) === normalizeTextAnswer(answer)
    );
  }
  if (question.solution.type === 'maze_goal' && question.interaction.type === 'maze_path') {
    const payload = response as { pathIndices?: unknown };
    const path = Array.isArray(payload?.pathIndices) ? payload.pathIndices.filter((value): value is number => Number.isInteger(value)) : [];
    score = isValidMazePath(question.interaction, question.solution.goalIndex, path) ? 1 : 0;
  }

  const correct = score === 1;
  const result = correct ? 'correct' : 'incorrect';
  return {
    correct,
    score,
    maxScore: 1,
    feedbackKey: correct ? 'correct' : 'incorrect',
    masteryEvidence: question.conceptIds.map((conceptId) => ({ conceptId, result, weight: score })),
    knowledgeEvidence: (question.knowledgeRefs ?? []).map((rowId) => ({ rowId, result, weight: score }))
  };
}
