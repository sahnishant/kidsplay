import type { PresentableItem, Question } from '../contracts/question';
import { resolveVisualRecipeForSemantic } from './visualRecipeRegistry';

function resolveSingleFeedbackRecipeId(items: PresentableItem[], itemIds: string[]): string | null {
  const selectedIds = new Set(itemIds);
  const recipeIds = [...new Set(
    items
      .filter((item) => selectedIds.has(item.id) && item.semanticRef)
      .map((item) => resolveVisualRecipeForSemantic(item.semanticRef, 'feedback')?.id ?? null)
      .filter((recipeId): recipeId is string => Boolean(recipeId))
  )].sort((left, right) => left.localeCompare(right));

  return recipeIds.length === 1 ? recipeIds[0] : null;
}

/**
 * Resolve a single exact authored semantic recipe for post-answer teaching.
 * This deliberately reads the solution contract, never the submitted answer,
 * and never falls back to display labels or fuzzy matching. Ambiguous/multiple
 * recipe results fail closed so a feedback visual cannot teach the wrong idea.
 */
export function resolveQuestionFeedbackRecipeId(question: Question): string | null {
  if (question.interaction.type === 'single_choice' && question.solution.type === 'exact_option') {
    return resolveSingleFeedbackRecipeId(question.interaction.options, question.solution.correctOptionIds);
  }

  if (question.interaction.type === 'word_bank_fill' && question.solution.type === 'blank_answers') {
    return resolveSingleFeedbackRecipeId(
      question.interaction.wordBank,
      Object.values(question.solution.answers).flat()
    );
  }

  if (question.interaction.type === 'drag_to_target' && question.solution.type === 'target_assignment') {
    const assignmentIds = Object.entries(question.solution.assignments)
      .flatMap(([itemId, targetId]) => [itemId, targetId]);
    return resolveSingleFeedbackRecipeId(
      [...question.interaction.items, ...question.interaction.targets],
      assignmentIds
    );
  }

  if (question.interaction.type === 'word_search' && question.solution.type === 'found_terms') {
    return resolveSingleFeedbackRecipeId(question.interaction.terms, question.solution.requiredTermIds);
  }

  if (question.interaction.type === 'memory_pairs' && question.solution.type === 'pair_matches') {
    return resolveSingleFeedbackRecipeId(question.interaction.cards, question.solution.pairs.flat());
  }

  if (question.interaction.type === 'sequence_order' && question.solution.type === 'ordered_items') {
    return resolveSingleFeedbackRecipeId(question.interaction.items, question.solution.orderedItemIds);
  }

  if (question.interaction.type === 'hotspot' && question.solution.type === 'selected_regions') {
    return resolveSingleFeedbackRecipeId(question.interaction.board.regions, question.solution.correctRegionIds);
  }

  return null;
}
