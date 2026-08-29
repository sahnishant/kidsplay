import type { Question } from '../contracts/question';
import type { EvaluationResult } from '../contracts/runtime';

const sameStringSet = (actual: string[], expected: string[]): boolean => {
  if (actual.length !== expected.length) return false;
  const actualSet = new Set(actual);
  return expected.every((value) => actualSet.has(value));
};
const boundedScore = (correctParts: number, totalParts: number): number => totalParts <= 0 ? 0 : Math.max(0, Math.min(1, correctParts / totalParts));
const pairKey = (first: string, second: string): string => first < second ? `${first}\u0000${second}` : `${second}\u0000${first}`;
const normalizeTextAnswer = (value: unknown): string => typeof value === 'string' ? value.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';

export function evaluate(question: Question, response: unknown): EvaluationResult {
  let score = 0;

  if (question.solution.type === 'exact_option') {
    const payload = response as { selectedOptionIds?: unknown };
    const selected = Array.isArray(payload?.selectedOptionIds) ? payload.selectedOptionIds.filter((value): value is string => typeof value === 'string') : [];
    score = sameStringSet(selected, question.solution.correctOptionIds) ? 1 : 0;
  }
  if (question.solution.type === 'blank_answers') {
    const payload = response as { blankAnswers?: Record<string, unknown> };
    const entries = Object.entries(question.solution.answers);
    score = boundedScore(entries.filter(([blankId, accepted]) => typeof payload?.blankAnswers?.[blankId] === 'string' && accepted.includes(payload.blankAnswers[blankId] as string)).length, entries.length);
  }
  if (question.solution.type === 'target_assignment') {
    const payload = response as { assignments?: Record<string, unknown> };
    const entries = Object.entries(question.solution.assignments);
    score = boundedScore(entries.filter(([itemId, targetId]) => payload?.assignments?.[itemId] === targetId).length, entries.length);
  }
  if (question.solution.type === 'found_terms') {
    const payload = response as { foundTermIds?: unknown };
    const found = new Set(Array.isArray(payload?.foundTermIds) ? payload.foundTermIds.filter((value): value is string => typeof value === 'string') : []);
    score = boundedScore(question.solution.requiredTermIds.filter((id) => found.has(id)).length, question.solution.requiredTermIds.length);
  }
  if (question.solution.type === 'pair_matches') {
    const expected = new Set(question.solution.pairs.map(([first, second]) => pairKey(first, second)));
    const payload = response as { matchedPairs?: unknown };
    const actual = new Set<string>();
    if (Array.isArray(payload?.matchedPairs)) for (const pair of payload.matchedPairs) if (Array.isArray(pair) && pair.length === 2 && typeof pair[0] === 'string' && typeof pair[1] === 'string') actual.add(pairKey(pair[0], pair[1]));
    score = boundedScore([...expected].filter((value) => actual.has(value)).length, expected.size);
  }
  if (question.solution.type === 'ordered_items') {
    const payload = response as { orderedItemIds?: unknown };
    const actual = Array.isArray(payload?.orderedItemIds) ? payload.orderedItemIds.filter((value): value is string => typeof value === 'string') : [];
    score = boundedScore(question.solution.orderedItemIds.filter((id, index) => actual[index] === id).length, question.solution.orderedItemIds.length);
  }
  if (question.solution.type === 'selected_regions') {
    const payload = response as { selectedRegionIds?: unknown };
    const actual = new Set(Array.isArray(payload?.selectedRegionIds) ? payload.selectedRegionIds.filter((value): value is string => typeof value === 'string') : []);
    const expected = new Set(question.solution.correctRegionIds);
    const union = new Set([...actual, ...expected]);
    score = boundedScore([...expected].filter((id) => actual.has(id)).length, union.size);
  }
  if (question.solution.type === 'crossword_answers') {
    const payload = response as { answers?: Record<string, unknown> };
    const expected = Object.entries(question.solution.answers);
    score = boundedScore(expected.filter(([id, answer]) => normalizeTextAnswer(payload?.answers?.[id]) === normalizeTextAnswer(answer)).length, expected.length);
  }
  if (question.solution.type === 'maze_goal') {
    const payload = response as { pathIndices?: unknown };
    const path = Array.isArray(payload?.pathIndices) ? payload.pathIndices.filter((value): value is number => Number.isInteger(value)) : [];
    score = path[path.length - 1] === question.solution.goalIndex ? 1 : 0;
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
