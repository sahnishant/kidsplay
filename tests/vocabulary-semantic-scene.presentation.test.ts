import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import type { SingleChoiceQuestion } from '../src/contracts/question';
import Scene from '../src/presentation/Scene.svelte';
import VocabularySemanticScene from '../src/presentation/VocabularySemanticScene.svelte';
import { resolveQuestionSceneId } from '../src/presentation/questionScene';
import { getVocabularyVisualRuntimePlans } from '../src/presentation/vocabularyVisualRegistry';
import Session from '../src/ui/SessionViewport.svelte';

afterEach(() => cleanup());

function vocabularyQuestion(knowledgeRef = 'kr.vocab.meaning.enormous.very-large'): SingleChoiceQuestion {
  return {
    id: 'test.vocabulary.visual.enormous.001',
    revision: 1,
    schemaVersion: 1,
    conceptIds: ['vocabulary.meaning.enormous'],
    knowledgeRefs: [knowledgeRef],
    difficulty: 1,
    language: 'en',
    prompt: { text: 'Which word means very large?' },
    interaction: {
      type: 'single_choice',
      version: 1,
      shuffleOptions: false,
      options: [
        { id: 'enormous', label: 'Enormous' },
        { id: 'tiny', label: 'Tiny' }
      ]
    },
    solution: { type: 'exact_option', correctOptionIds: ['enormous'] },
    feedback: { correct: 'Correct.', incorrect: 'Try again.' },
    authoring: { status: 'reviewed', source: 'behavior-test' }
  };
}

describe('semantic vocabulary scene runtime', () => {
  it('ships a small admitted runtime projection instead of the full audit corpus', () => {
    const plans = getVocabularyVisualRuntimePlans();
    const childPlans = plans.filter((plan) => plan.runtimeUsage === 'knowledge_reinforcement');
    const proofs = plans.filter((plan) => plan.runtimeUsage === 'template_proof');

    expect(childPlans).toHaveLength(18);
    expect(proofs).toHaveLength(5);
    expect(plans.length).toBeLessThan(50);
    expect(proofs.every((plan) => plan.knowledgeRef === null)).toBe(true);
    expect(childPlans.every((plan) => plan.knowledgeRef?.startsWith('kr.'))).toBe(true);
  });

  it('renders settlement, spatial, cause/effect, transition and comparison grammars from sense plans', () => {
    const cases = [
      ['village#settlement', 'settlement'],
      ['under#below-reference', 'spatial-relation'],
      ['pull#move-toward-by-force', 'cause-effect'],
      ['open#change-from-closed', 'state-transition'],
      ['same#matching-in-target-dimension', 'comparison']
    ] as const;

    for (const [senseKey, expectedKind] of cases) {
      const { container, unmount } = render(VocabularySemanticScene, { props: { senseKey } });
      expect(container.querySelector(`[data-vocabulary-sense="${senseKey}"]`)).toBeTruthy();
      expect(container.querySelector(`[data-scene-kind="${expectedKind}"]`)).toBeTruthy();
      unmount();
    }
  });

  it('keeps scene semantics visible without depending on animation', () => {
    const { container } = render(VocabularySemanticScene, { props: { senseKey: 'pull#move-toward-by-force' } });
    const scene = container.querySelector('[data-scene-kind="cause-effect"]');
    expect(scene?.getAttribute('data-action')).toBe('pull');
    expect(scene?.textContent).toContain('←');
    expect(container.querySelector('.movable-box')).toBeTruthy();
  });

  it('resolves a real vocabulary row only through inferred presentation and routes it through Scene.svelte', () => {
    const question = vocabularyQuestion();
    expect(resolveQuestionSceneId(question, false)).toBeNull();
    expect(resolveQuestionSceneId(question, true)).toBe('vocabulary:enormous#very-large-size');

    const { container } = render(Scene, { props: { sceneId: 'vocabulary:enormous#very-large-size' } });
    expect(container.querySelector('[data-vocabulary-sense="enormous#very-large-size"]')).toBeTruthy();
    expect(container.querySelector('[data-scene-kind="attribute-contrast"]')).toBeTruthy();
  });

  it('shows vocabulary reinforcement only after submission in ordinary practice', async () => {
    const { container } = render(Session, {
      props: {
        title: 'Vocabulary Practice',
        questions: [vocabularyQuestion()],
        childName: 'Explorer',
        childAvatar: 'fox'
      }
    });

    expect(container.querySelector('[data-session-state="answer"]')).toBeTruthy();
    expect(container.querySelector('[data-vocabulary-sense]')).toBeNull();

    await fireEvent.click(screen.getByRole('button', { name: 'Enormous' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(container.querySelector('[data-session-state="reaction"]')).toBeTruthy();
    expect(container.querySelector('[data-vocabulary-sense="enormous#very-large-size"]')).toBeTruthy();
  });

  it('suppresses inferred vocabulary reinforcement inside structured assessment', async () => {
    const { container } = render(Session, {
      props: {
        title: 'Vocabulary Mock',
        questions: [vocabularyQuestion()],
        sections: [{ id: 'vocabulary', title: 'Vocabulary', startIndex: 0, count: 1, marksPerQuestion: 1 }],
        childName: 'Explorer',
        childAvatar: 'fox'
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Enormous' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(container.querySelector('[data-session-state="reaction"]')).toBeTruthy();
    expect(container.querySelector('[data-vocabulary-sense]')).toBeNull();
  });
});
