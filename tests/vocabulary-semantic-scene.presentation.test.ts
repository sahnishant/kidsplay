import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import maturityProofsJson from '../content/vocabulary-visuals/runtime-maturity-proofs.json';
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
  it('ships a bounded admitted runtime projection instead of the full audit corpus', () => {
    const plans = getVocabularyVisualRuntimePlans();
    const childPlans = plans.filter((plan) => plan.runtimeUsage === 'knowledge_reinforcement');
    const proofs = plans.filter((plan) => plan.runtimeUsage === 'template_proof');

    expect(childPlans.length).toBeGreaterThanOrEqual(18);
    expect(proofs.length).toBeGreaterThanOrEqual(4);
    expect(plans.length).toBeLessThan(50);
    expect(proofs.every((plan) => plan.knowledgeRef === null)).toBe(true);
    expect(childPlans.every((plan) => plan.knowledgeRef?.startsWith('kr.'))).toBe(true);
    expect(new Set(childPlans.map((plan) => plan.knowledgeRef)).size).toBe(childPlans.length);

    expect(childPlans).toEqual(expect.arrayContaining([
      expect.objectContaining({
        knowledgeRef: 'kr.vocab.force.pull.can-move-object-toward',
        senseKey: 'pull#move-toward-by-force',
        maturity: 'V4',
        semanticDepthPatternRefs: expect.arrayContaining(['pull-direction-explanation'])
      })
    ]));
    expect(proofs.some((plan) => plan.senseKey === 'pull#move-toward-by-force')).toBe(false);
  });

  it('derives every runtime maturity from the recorded exact proof instead of assuming child-facing means V5', () => {
    const plans = getVocabularyVisualRuntimePlans();
    const proofBySenseKey = new Map(
      maturityProofsJson.promotions.map((promotion) => [promotion.senseKey, promotion])
    );

    expect(plans.every((plan) => proofBySenseKey.get(plan.senseKey)?.maturity === plan.maturity)).toBe(true);

    const pullPlan = plans.find((plan) => plan.senseKey === 'pull#move-toward-by-force');
    expect(pullPlan).toMatchObject({
      runtimeUsage: 'knowledge_reinforcement',
      maturity: 'V4'
    });
    expect(proofBySenseKey.get('pull#move-toward-by-force')).toMatchObject({
      maturity: 'V4',
      basis: 'renderer_template_plus_meaningful_motion_proof'
    });

    const provenV5ChildPlans = plans.filter((plan) =>
      plan.runtimeUsage === 'knowledge_reinforcement' &&
      proofBySenseKey.get(plan.senseKey)?.basis === 'child_facing_post_answer_reinforcement'
    );
    expect(provenV5ChildPlans.length).toBeGreaterThanOrEqual(17);
    expect(provenV5ChildPlans.every((plan) => plan.maturity === 'V5')).toBe(true);
  });

  it('renders settlement, spatial, cause/effect, transition and comparison grammars from sense plans', () => {
    const cases = [
      ['village#settlement', 'place'],
      ['under#below-reference', 'spatial-relation'],
      ['pull#move-toward-by-force', 'cause-effect'],
      ['open#change-from-closed', 'state-transition'],
      ['same#matching-in-target-dimension', 'comparison']
    ] as const;

    for (const [senseKey, expectedKind] of cases) {
      const { container, unmount } = render(VocabularySemanticScene, { props: { senseKey } });
      const root = container.querySelector(`[data-vocabulary-sense="${senseKey}"]`);
      expect(root).toBeTruthy();
      expect(container.querySelector(`[data-scene-kind="${expectedKind}"]`)).toBeTruthy();
      if (senseKey === 'village#settlement') expect(root?.getAttribute('data-scene-template')).toBe('settlement');
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
