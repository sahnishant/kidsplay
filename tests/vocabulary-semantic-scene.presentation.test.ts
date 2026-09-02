import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import maturityProofsJson from '../content/vocabulary-visuals/runtime-maturity-proofs.json';
import type { SingleChoiceQuestion } from '../src/contracts/question';
import Scene from '../src/presentation/Scene.svelte';
import VocabularySemanticScene from '../src/presentation/VocabularySemanticScene.svelte';
import { resolveQuestionSceneId } from '../src/presentation/questionScene';
import {
  getVocabularyVisualRuntimePlans,
  isVocabularyVisualPlanChildFacing,
  resolveVocabularyVisualPlanForKnowledgeRefs
} from '../src/presentation/vocabularyVisualRegistry';
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
      type: 'single_choice', version: 1, shuffleOptions: false,
      options: [{ id: 'enormous', label: 'Enormous' }, { id: 'tiny', label: 'Tiny' }]
    },
    solution: { type: 'exact_option', correctOptionIds: ['enormous'] },
    feedback: { correct: 'Correct.', incorrect: 'Try again.' },
    authoring: { status: 'reviewed', source: 'behavior-test' }
  };
}

const breadthMappings = [
  ['kr.vocab.primary.meaning.fast.fast-a-1', 'fast#a#1'],
  ['kr.vocab.primary.meaning.full.full-a-1', 'full#a#1'],
  ['kr.vocab.primary.meaning.library.library-n-3', 'library#n#3']
] as const;

describe('semantic vocabulary scene runtime', () => {
  it('ships a bounded runtime projection instead of the full audit corpus', () => {
    const plans = getVocabularyVisualRuntimePlans();
    const knowledgePlans = plans.filter((plan) => plan.runtimeUsage === 'knowledge_reinforcement');
    const proofs = plans.filter((plan) => plan.runtimeUsage === 'template_proof');

    expect(knowledgePlans.length).toBeGreaterThanOrEqual(22);
    expect(plans.length).toBeLessThan(60);
    expect(proofs.every((plan) => plan.knowledgeRef === null)).toBe(true);
    expect(knowledgePlans.every((plan) => plan.knowledgeRef?.startsWith('kr.'))).toBe(true);
    expect(new Set(knowledgePlans.map((plan) => plan.knowledgeRef)).size).toBe(knowledgePlans.length);

    expect(knowledgePlans).toEqual(expect.arrayContaining([
      expect.objectContaining({
        knowledgeRef: 'kr.vocab.force.pull.can-move-object-toward',
        senseKey: 'pull#move-toward-by-force',
        semanticDepthPatternRefs: expect.arrayContaining(['pull-direction-explanation'])
      })
    ]));
    expect(proofs.some((plan) => plan.senseKey === 'pull#move-toward-by-force')).toBe(false);
  });

  it('requires proof-backed V5/V6 before a knowledge mapping becomes child-facing', () => {
    const plans = getVocabularyVisualRuntimePlans();
    const proofBySenseKey = new Map(
      maturityProofsJson.promotions.map((promotion) => [promotion.senseKey, promotion])
    );

    for (const plan of plans) {
      const proof = proofBySenseKey.get(plan.senseKey);
      if (proof) {
        expect(proof.maturity).toBe(plan.maturity);
      } else if (plan.runtimeUsage === 'knowledge_reinforcement') {
        expect(['V1', 'V2', 'V3', 'V4']).toContain(plan.maturity);
        expect(isVocabularyVisualPlanChildFacing(plan)).toBe(false);
        expect(resolveVocabularyVisualPlanForKnowledgeRefs([plan.knowledgeRef!])).toBeNull();
      }
    }

    const pullPlan = plans.find((plan) => plan.senseKey === 'pull#move-toward-by-force');
    const pullProof = proofBySenseKey.get('pull#move-toward-by-force');
    expect(pullPlan).toMatchObject({ runtimeUsage: 'knowledge_reinforcement', maturity: pullProof?.maturity });
    expect([
      'child_facing_post_answer_reinforcement',
      'child_facing_semantic_depth_explanation'
    ]).toContain(pullProof?.basis);

    const provenChildPlans = plans.filter((plan) => {
      const proof = proofBySenseKey.get(plan.senseKey);
      return isVocabularyVisualPlanChildFacing(plan) &&
        ['child_facing_post_answer_reinforcement', 'child_facing_semantic_depth_explanation'].includes(String(proof?.basis));
    });
    expect(provenChildPlans.length).toBeGreaterThanOrEqual(18);
  });

  it('keeps the three meaning-faithful #88 mappings fail-closed until proof promotion', () => {
    const plans = getVocabularyVisualRuntimePlans();
    const proofBySenseKey = new Map(maturityProofsJson.promotions.map((promotion) => [promotion.senseKey, promotion]));

    for (const [knowledgeRef, senseKey] of breadthMappings) {
      const plan = plans.find((candidate) => candidate.knowledgeRef === knowledgeRef);
      expect(plan).toMatchObject({ knowledgeRef, senseKey, runtimeUsage: 'knowledge_reinforcement' });
      const proof = proofBySenseKey.get(senseKey);
      const resolved = resolveVocabularyVisualPlanForKnowledgeRefs([knowledgeRef]);
      if (proof?.maturity === 'V5' || proof?.maturity === 'V6') {
        expect(resolved).toMatchObject({ senseKey, maturity: proof.maturity });
      } else {
        expect(plan?.maturity).toBe('V1');
        expect(resolved).toBeNull();
      }
    }
  });

  it('renders the three #88 proof candidates with meaning-faithful static semantics', () => {
    const cases = [
      { senseKey: 'fast#a#1', kind: 'attribute-contrast', attribute: 'data-dimension', value: 'speed', text: ['Fast', 'Slow'] },
      { senseKey: 'full#a#1', kind: 'attribute-contrast', attribute: 'data-dimension', value: 'fill-level', text: ['Full', 'Empty'] },
      { senseKey: 'library#n#3', kind: 'place', attribute: 'data-place-kind', value: 'library', text: ['Library'] }
    ] as const;

    for (const candidate of cases) {
      const { container, unmount } = render(VocabularySemanticScene, { props: { senseKey: candidate.senseKey } });
      const root = container.querySelector(`[data-vocabulary-sense="${candidate.senseKey}"]`);
      const scene = container.querySelector(`[data-scene-kind="${candidate.kind}"]`);
      expect(root).toBeTruthy();
      expect(scene).toBeTruthy();
      expect(scene?.getAttribute(candidate.attribute)).toBe(candidate.value);
      for (const expectedText of candidate.text) expect(root?.textContent).toContain(expectedText);
      unmount();
    }
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
      props: { title: 'Vocabulary Practice', questions: [vocabularyQuestion()], childName: 'Explorer', childAvatar: 'fox' }
    });

    expect(container.querySelector('[data-session-state="answer"]')).toBeTruthy();
    expect(container.querySelector('[data-vocabulary-sense]')).toBeNull();

    await fireEvent.click(screen.getByRole('button', { name: 'Enormous' }));

    expect(container.querySelector('[data-session-state="reaction"]')).toBeTruthy();
    expect(container.querySelector('[data-vocabulary-sense="enormous#very-large-size"]')).toBeTruthy();
  });

  it('suppresses inferred vocabulary reinforcement inside structured assessment', async () => {
    const { container } = render(Session, {
      props: {
        title: 'Vocabulary Mock', questions: [vocabularyQuestion()],
        sections: [{ id: 'vocabulary', title: 'Vocabulary', startIndex: 0, count: 1, marksPerQuestion: 1 }],
        childName: 'Explorer', childAvatar: 'fox'
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Enormous' }));

    expect(container.querySelector('[data-session-state="reaction"]')).toBeTruthy();
    expect(container.querySelector('[data-vocabulary-sense]')).toBeNull();
  });
});