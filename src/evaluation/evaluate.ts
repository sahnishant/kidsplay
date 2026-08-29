import type { Question } from '../contracts/question';
import type { EvaluationResult } from '../contracts/runtime';

const sameStringSet = (actual: string[], expected: string[]): boolean => {
  if (actual.length !== expected.length) return false;
  const actualSet = new Set(actual);
  return expected.every((value) => actualSet.has(value));
};

const boundedScore = (correctParts: number, totalParts: number): number => {
  if (totalParts <= 0) return 0;
  return Math.max(0, Math.min(1, correctParts / totalParts));
};

export function evaluate(question: Question, response: unknown): EvaluationResult {
  let score = 0;

  if (question.solution.type === 'exact_option') {
    const payload = response as { selectedOptionIds?: unknown };
    const selected = Array.isArray(payload?.selectedOptionIds)
      ? payload.selectedOptionIds.filter((value): value is string => typeof value === 'string')
      : [];
    score = sameStringSet(selected, question.solution.correctOptionIds) ? 1 : 0;
  }

  if (question.solution.type === 'blank_answers') {
    const payload = response as { blankAnswers?: Record<string, unknown> };
    const entries = Object.entries(question.solution.answers);
    let correctParts = 0;

    for (const [blankId, acceptedWordIds] of entries) {
      const actual = payload?.blankAnswers?.[blankId];
      if (typeof actual === 'string' && acceptedWordIds.includes(actual)) correctParts += 1;
    }

    score = boundedScore(correctParts, entries.length);
  }

  if (question.solution.type === 'target_assignment') {
    const payload = response as { assignments?: Record<string, unknown> };
    const entries = Object.entries(question.solution.assignments);
    let correctParts = 0;

    for (const [itemId, expectedTargetId] of entries) {
      if (payload?.assignments?.[itemId] === expectedTargetId) correctParts += 1;
    }

    score = boundedScore(correctParts, entries.length);
  }

  if (question.solution.type === 'found_terms') {
    const payload = response as { foundTermIds?: unknown };
    const found = Array.isArray(payload?.foundTermIds)
      ? new Set(payload.foundTermIds.filter((value): value is string => typeof value === 'string'))
      : new Set<string>();
    const expected = question.solution.requiredTermIds;
    const correctParts = expected.filter((termId) => found.has(termId)).length;
    score = boundedScore(correctParts, expected.length);
  }

  const correct = score === 1;

  return {
    correct,
    score,
    maxScore: 1,
    feedbackKey: correct ? 'correct' : 'incorrect',
    masteryEvidence: question.conceptIds.map((conceptId) => ({
      conceptId,
      result: correct ? 'correct' : 'incorrect',
      weight: score
    }))
  };
}
