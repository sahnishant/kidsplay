import type { EqualPartsQuestion, MazePathQuestion, Question, TracePathQuestion } from '../contracts/question';
import type { EvaluationResult } from '../contracts/runtime';
import { canTravel } from '../mechanics/maze';
import { traceCorridorScore } from '../mechanics/tracePath';
import { evaluateEqualParts } from '../mechanics/equalParts.mjs';

const sameStringSet = (actual: string[], expected: string[]): boolean => {
  if (actual.length !== expected.length) return false;
  const actualSet = new Set(actual);
  return actualSet.size === actual.length && expected.every((value) => actualSet.has(value));
};
const boundedScore = (correctParts: number, totalParts: number): number => totalParts <= 0 ? 0 : Math.max(0, Math.min(1, correctParts / totalParts));
const pairKey = (first: string, second: string): string => first < second ? `${first}\u0000${second}` : `${second}\u0000${first}`;
const normalizeTextAnswer = (value: unknown): string => typeof value === 'string' ? value.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
const normalizeVisibleDragValue = (value: unknown): string => typeof value === 'string' ? value.trim().toLocaleLowerCase().replace(/\s+/g, ' ') : '';

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

function targetAssignmentScore(question: Question, actual: Record<string, unknown> | undefined): number {
  if (question.solution.type !== 'target_assignment') return 0;

  const expectedEntries = Object.entries(question.solution.assignments);
  const actualEntries = Object.entries(actual ?? {}).filter((entry): entry is [string, string] => typeof entry[1] === 'string');
  const totalParts = new Set([
    ...expectedEntries.map(([itemId]) => itemId),
    ...actualEntries.map(([itemId]) => itemId)
  ]).size;

  if (question.interaction.type !== 'drag_to_target') {
    return recordAnswerScore(
      question.solution.assignments,
      actual,
      (_itemId, targetId, actualTargetId) => actualTargetId === targetId
    );
  }

  const itemById = new Map(question.interaction.items.map((item) => [item.id, item]));
  const visibleKey = (itemId: string): string => {
    const item = itemById.get(itemId);
    if (!item) return '';
    return `${normalizeVisibleDragValue(item.label)}\u0000${normalizeVisibleDragValue(item.symbol)}`;
  };

  const actualItemsByTarget = new Map<string, string[]>();
  for (const [itemId, targetId] of actualEntries) {
    const items = actualItemsByTarget.get(targetId) ?? [];
    items.push(itemId);
    actualItemsByTarget.set(targetId, items);
  }

  let correctParts = 0;
  for (const [expectedItemId, targetId] of expectedEntries) {
    const actualItems = actualItemsByTarget.get(targetId);
    if (!actualItems || actualItems.length !== 1) continue;

    const actualItemId = actualItems[0];
    if (actualItemId === expectedItemId) {
      correctParts += 1;
      continue;
    }

    const expectedKey = visibleKey(expectedItemId);
    const actualKey = visibleKey(actualItemId);
    if (expectedKey && expectedKey === actualKey) correctParts += 1;
  }

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

  if (question.solution.type === 'fraction_allocation' && question.interaction.type === 'equal_parts') {
    score = evaluateEqualParts(question as EqualPartsQuestion, response).correct ? 1 : 0;
  }
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
    score = targetAssignmentScore(question, payload?.assignments);
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
    score = traceCorridorScore(question as TracePathQuestion, response);
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
  const evidenceEligible = question.evidencePolicy !== 'practice_only';
  return {
    correct,
    score,
    maxScore: 1,
    feedbackKey: correct ? 'correct' : 'incorrect',
    masteryEvidence: evidenceEligible ? question.conceptIds.map((conceptId) => ({ conceptId, result, weight: score })) : [],
    knowledgeEvidence: evidenceEligible ? (question.knowledgeRefs ?? []).map((rowId) => ({ rowId, result, weight: score })) : []
  };
}
