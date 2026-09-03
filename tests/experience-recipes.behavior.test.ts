import { describe, expect, it } from 'vitest';
import type { DragToTargetQuestion, Question, SequenceOrderQuestion, SingleChoiceQuestion } from '../src/contracts/question';
import {
  EXPERIENCE_RECIPE_DOCUMENT,
  getExperienceRecipes,
  resolveExperienceRecipe,
  validateExperienceRecipeDocument
} from '../src/experience/experienceRecipes';

function baseQuestion(): Omit<SingleChoiceQuestion, 'interaction' | 'solution'> {
  return {
    id: 'test.experience.question',
    revision: 1,
    schemaVersion: 1,
    conceptIds: ['animals'],
    knowledgeRefs: ['kr.animals.dog.home.kennel'],
    difficulty: 1,
    language: 'en',
    prompt: { text: 'Where should the dog go?' },
    feedback: { correct: 'Yes.', incorrect: 'Try again.' },
    authoring: { status: 'reviewed', source: 'test' }
  };
}

function singleChoice(conceptIds = ['animals']): SingleChoiceQuestion {
  return {
    ...baseQuestion(),
    conceptIds,
    interaction: {
      type: 'single_choice',
      version: 1,
      options: [
        { id: 'kennel', label: 'Kennel', semanticRef: 'kennel' },
        { id: 'pond', label: 'Pond', semanticRef: 'pond' }
      ]
    },
    solution: { type: 'exact_option', correctOptionIds: ['kennel'] }
  };
}

function dragToTarget(conceptIds = ['animal-home']): DragToTargetQuestion {
  return {
    ...baseQuestion(),
    conceptIds,
    interaction: {
      type: 'drag_to_target',
      version: 1,
      items: [{ id: 'dog', label: 'Dog', semanticRef: 'dog' }],
      targets: [{ id: 'kennel', label: 'Kennel', semanticRef: 'kennel' }]
    },
    solution: { type: 'target_assignment', assignments: { dog: 'kennel' } }
  };
}

function sequence(): SequenceOrderQuestion {
  return {
    ...baseQuestion(),
    conceptIds: ['plant-process'],
    interaction: {
      type: 'sequence_order',
      version: 1,
      seed: 7,
      items: [
        { id: 'seed', label: 'Seed' },
        { id: 'sprout', label: 'Sprout' },
        { id: 'plant', label: 'Plant' }
      ]
    },
    solution: { type: 'ordered_items', orderedItemIds: ['seed', 'sprout', 'plant'] }
  };
}

describe('experience recipe architecture', () => {
  it('ships every required reusable family without question-level answer authority', () => {
    expect(new Set(getExperienceRecipes().map((recipe) => recipe.family))).toEqual(new Set([
      'guide_to_home',
      'sort_or_match',
      'observe_choose',
      'sequence_process',
      'cause_effect_discovery'
    ]));

    const serialized = JSON.stringify(EXPERIENCE_RECIPE_DOCUMENT);
    expect(serialized).not.toContain('questionId');
    expect(serialized).not.toContain('correctOptionIds');
    expect(serialized).not.toContain('"solution"');
  });

  it('suppresses all pre-answer experience choreography in structured assessment', () => {
    expect(resolveExperienceRecipe(singleChoice(), 'assessment')).toBeNull();
    expect(resolveExperienceRecipe(dragToTarget(), 'assessment')).toBeNull();
    expect(resolveExperienceRecipe(sequence(), 'assessment')).toBeNull();
  });

  it('resolves specific semantic recipes before generic interaction-family fallbacks', () => {
    expect(resolveExperienceRecipe(dragToTarget(), 'story')?.family).toBe('guide_to_home');
    expect(resolveExperienceRecipe(dragToTarget(['classification']), 'story')?.family).toBe('sort_or_match');
    expect(resolveExperienceRecipe(singleChoice(['cause-effect']), 'story')?.family).toBe('cause_effect_discovery');
    expect(resolveExperienceRecipe(singleChoice(), 'story')?.family).toBe('observe_choose');
    expect(resolveExperienceRecipe(sequence(), 'free_play')?.family).toBe('sequence_process');
  });

  it('does not inspect solution data when resolving presentation choreography', () => {
    const original = singleChoice();
    const altered: SingleChoiceQuestion = {
      ...original,
      solution: { type: 'exact_option', correctOptionIds: ['pond'] }
    };

    expect(resolveExperienceRecipe(original, 'story')).toEqual(resolveExperienceRecipe(altered, 'story'));
  });

  it('fails closed when a recipe document attempts to own question or answer authority', () => {
    const withSolutionAuthority = structuredClone(EXPERIENCE_RECIPE_DOCUMENT) as unknown as {
      schemaVersion: 1;
      recipes: Array<Record<string, unknown>>;
    };
    withSolutionAuthority.recipes[0].solution = { correctOptionIds: ['kennel'] };
    expect(() => validateExperienceRecipeDocument(withSolutionAuthority)).toThrow(/forbidden/);

    const withQuestionAuthority = structuredClone(EXPERIENCE_RECIPE_DOCUMENT) as unknown as {
      schemaVersion: 1;
      recipes: Array<Record<string, unknown>>;
    };
    withQuestionAuthority.recipes[0].questionId = 'animals.dog.home.001';
    expect(() => validateExperienceRecipeDocument(withQuestionAuthority)).toThrow(/forbidden/);
  });

  it('fails closed on duplicate ids and unsupported assessment selectors', () => {
    const duplicate = structuredClone(EXPERIENCE_RECIPE_DOCUMENT);
    duplicate.recipes.push(structuredClone(duplicate.recipes[0]));
    expect(() => validateExperienceRecipeDocument(duplicate)).toThrow(/Duplicate experience recipe id/);

    const assessmentSelector = structuredClone(EXPERIENCE_RECIPE_DOCUMENT) as unknown as {
      schemaVersion: 1;
      recipes: Array<{ selector: { surfaces: string[] } }>;
    };
    assessmentSelector.recipes[0].selector.surfaces = ['assessment'];
    expect(() => validateExperienceRecipeDocument(assessmentSelector)).toThrow(/assessment surface/);
  });

  it('returns detached recipe copies so callers cannot mutate the canonical registry', () => {
    const first = resolveExperienceRecipe(singleChoice(), 'story');
    expect(first).not.toBeNull();
    if (!first) return;
    first.selector.interactionTypes.length = 0;

    const second = resolveExperienceRecipe(singleChoice(), 'story');
    expect(second?.selector.interactionTypes).toContain('single_choice');
  });

  it('fails closed when no recipe safely covers an interaction family yet', () => {
    const unsupported: Question = {
      ...baseQuestion(),
      interaction: {
        type: 'word_bank_fill',
        version: 1,
        segments: [{ type: 'blank', id: 'blank-1' }],
        wordBank: [{ id: 'dog', label: 'Dog' }]
      },
      solution: { type: 'blank_answers', answers: { 'blank-1': ['dog'] } }
    };

    expect(resolveExperienceRecipe(unsupported, 'story')).toBeNull();
  });
});
