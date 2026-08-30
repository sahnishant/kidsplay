import { describe, expect, it } from 'vitest';
import type { MazePathQuestion, Question } from '../src/contracts/question';
import { getFreeAnimalsQuestions } from '../src/content';
import { evaluate } from '../src/evaluation/evaluate';
import { canTravel } from '../src/mechanics/maze';

type MazeInteraction = MazePathQuestion['interaction'];

function findMazePath(interaction: MazeInteraction, questionId: string): number[] {
  const queue: number[][] = [[interaction.startIndex]];
  const visited = new Set([interaction.startIndex]);

  while (queue.length) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    if (current === interaction.goalIndex) return path;

    for (let next = 0; next < interaction.wallMasks.length; next += 1) {
      if (visited.has(next)) continue;
      if (!canTravel(interaction.wallMasks, interaction.rows, interaction.cols, current, next)) continue;
      visited.add(next);
      queue.push([...path, next]);
    }
  }

  throw new Error(`No path found for maze ${questionId}`);
}

function correctResponse(question: Question): unknown {
  switch (question.solution.type) {
    case 'exact_option':
      return { selectedOptionIds: [...question.solution.correctOptionIds] };
    case 'blank_answers':
      return {
        blankAnswers: Object.fromEntries(
          Object.entries(question.solution.answers).map(([id, accepted]) => [id, accepted[0]])
        )
      };
    case 'target_assignment':
      return { assignments: { ...question.solution.assignments } };
    case 'found_terms':
      return { foundTermIds: [...question.solution.requiredTermIds] };
    case 'pair_matches':
      return { matchedPairs: question.solution.pairs.map((pair) => [...pair]) };
    case 'ordered_items':
      return { orderedItemIds: [...question.solution.orderedItemIds] };
    case 'selected_regions':
      return { selectedRegionIds: [...question.solution.correctRegionIds] };
    case 'crossword_answers':
      return { answers: { ...question.solution.answers } };
    case 'maze_goal':
      if (question.interaction.type !== 'maze_path') throw new Error(`Maze solution without maze interaction: ${question.id}`);
      return { pathIndices: findMazePath(question.interaction, question.id) };
  }
}

function responseWithInvalidExtra(question: Question): unknown {
  const correct = correctResponse(question) as Record<string, unknown>;
  switch (question.solution.type) {
    case 'exact_option':
      return { selectedOptionIds: [...question.solution.correctOptionIds, '__invalid__'] };
    case 'blank_answers':
      return { blankAnswers: { ...(correct.blankAnswers as object), __invalid__: 'x' } };
    case 'target_assignment':
      return { assignments: { ...(correct.assignments as object), __invalid__: '__invalid__' } };
    case 'found_terms':
      return { foundTermIds: [...question.solution.requiredTermIds, '__invalid__'] };
    case 'pair_matches':
      return { matchedPairs: [...question.solution.pairs, ['__invalid_a__', '__invalid_b__']] };
    case 'ordered_items':
      return { orderedItemIds: [...question.solution.orderedItemIds, '__invalid__'] };
    case 'selected_regions':
      return { selectedRegionIds: [...question.solution.correctRegionIds, '__invalid__'] };
    case 'crossword_answers':
      return { answers: { ...(correct.answers as object), __invalid__: 'x' } };
    case 'maze_goal':
      if (question.interaction.type !== 'maze_path') throw new Error(`Maze solution without maze interaction: ${question.id}`);
      return { pathIndices: [question.interaction.goalIndex] };
  }
}

describe('shared evaluator integrity', () => {
  it('fully evaluates a valid response for every shipped interactive solution family', () => {
    const questions = getFreeAnimalsQuestions();
    const bySolution = new Map<string, Question>();
    for (const question of questions) {
      if (!bySolution.has(question.solution.type)) bySolution.set(question.solution.type, question);
    }

    expect([...bySolution.keys()].sort()).toEqual([
      'blank_answers',
      'crossword_answers',
      'exact_option',
      'found_terms',
      'maze_goal',
      'ordered_items',
      'pair_matches',
      'selected_regions',
      'target_assignment'
    ]);

    for (const question of bySolution.values()) {
      const result = evaluate(question, correctResponse(question));
      expect(result.correct, question.id).toBe(true);
      expect(result.score, question.id).toBe(1);
    }
  });

  it('does not award full credit when a response injects invalid extra answers or skips the maze path', () => {
    const questions = getFreeAnimalsQuestions();
    const bySolution = new Map<string, Question>();
    for (const question of questions) {
      if (!bySolution.has(question.solution.type)) bySolution.set(question.solution.type, question);
    }

    for (const question of bySolution.values()) {
      const result = evaluate(question, responseWithInvalidExtra(question));
      expect(result.correct, question.id).toBe(false);
      expect(result.score, question.id).toBeLessThan(1);
    }
  });
});
