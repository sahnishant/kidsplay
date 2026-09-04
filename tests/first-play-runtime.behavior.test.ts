import { describe, expect, it } from 'vitest';
import type { SingleChoiceQuestion } from '../src/contracts/question';
import { evaluate } from '../src/evaluation/evaluate';
import { applyFirstPlayEvidencePolicy, resolveFirstPlayFeedback } from '../src/experience/firstPlayRuntime';
import { validateFirstPlayRecipePolicy } from '../src/experience/firstPlayPolicy';

const listenFindQuestion: SingleChoiceQuestion = {
  id: 'first-play.listen-find.test',
  revision: 1,
  schemaVersion: 1,
  conceptIds: ['concept.test.object'],
  knowledgeRefs: ['knowledge.test.object'],
  difficulty: 1,
  language: 'en',
  prompt: { text: 'Find it' },
  feedback: { correct: 'Yes!', incorrect: 'Try again' },
  authoring: { status: 'reviewed', source: 'test' },
  interaction: {
    type: 'single_choice',
    version: 1,
    shuffleOptions: true,
    options: [
      { id: 'option.target', label: 'Target', semanticRef: 'semantic.target' },
      { id: 'option.other', label: 'Other', semanticRef: 'semantic.other' }
    ]
  },
  solution: { type: 'exact_option', correctOptionIds: ['option.target'] }
};

describe('First Play runtime policy', () => {
  it('proves FP0 exploration can emit no mastery or knowledge evidence', () => {
    const evaluated = evaluate(listenFindQuestion, { selectedOptionIds: ['option.target'] });
    const gated = applyFirstPlayEvidencePolicy('exploration', evaluated);
    expect(gated.correct).toBe(true);
    expect(gated.masteryEvidence).toEqual([]);
    expect(gated.knowledgeEvidence).toEqual([]);
    expect(resolveFirstPlayFeedback('exploration')).toBe('discovery');
  });

  it('proves FP1 two-choice Listen & Find reuses the existing evaluator', () => {
    validateFirstPlayRecipePolicy({
      stage: 'fp1_listen_find',
      evidenceClass: 'guided_practice',
      readingRequired: false,
      instructionSteps: 1,
      initialChoiceCount: 2,
      primaryTargetScale: 'oversized',
      wrongActionRecovery: 'in_place',
      requiresSeparateSubmitAfterCommittedAction: false,
      action: 'find'
    });

    const correct = evaluate(listenFindQuestion, { selectedOptionIds: ['option.target'] });
    const wrong = evaluate(listenFindQuestion, { selectedOptionIds: ['option.other'] });
    expect(correct.correct).toBe(true);
    expect(wrong.correct).toBe(false);
    expect(resolveFirstPlayFeedback('guided_practice', correct)).toBe('celebrate');
    expect(resolveFirstPlayFeedback('guided_practice', wrong)).toBe('retry_in_place');
  });

  it('keeps guided practice feedback while blocking it from mastery', () => {
    const wrong = evaluate(listenFindQuestion, { selectedOptionIds: ['option.other'] });
    const gated = applyFirstPlayEvidencePolicy('guided_practice', wrong);
    expect(gated.correct).toBe(false);
    expect(gated.feedbackKey).toBe('incorrect');
    expect(gated.masteryEvidence).toEqual([]);
    expect(gated.knowledgeEvidence).toEqual([]);
  });

  it('allows evidence through only for explicitly evaluative First Play', () => {
    const correct = evaluate(listenFindQuestion, { selectedOptionIds: ['option.target'] });
    expect(applyFirstPlayEvidencePolicy('evaluative', correct)).toEqual(correct);
  });
});
