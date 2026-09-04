import { describe, expect, it } from 'vitest';
import type { Question } from '../src/contracts/question';
import { projectAdaptiveRecommendation } from '../src/runtime/adaptiveRecommendation';
import type { ProgressSnapshot } from '../src/runtime/localProgress';

const choice: Question = {
  id: 'adaptive.projection.choice', revision: 1, schemaVersion: 1,
  conceptIds: ['animals.projection.dog'], knowledgeRefs: ['kr.animals.projection-dog'], difficulty: 1,
  language: 'en-IN', prompt: { text: 'Pick.' }, feedback: { correct: 'Yes.', incorrect: 'Again.' },
  authoring: { status: 'reviewed', source: 'adaptive-projection-test' },
  interaction: { type: 'single_choice', version: 1, options: [{ id: 'dog', label: 'Dog' }] },
  solution: { type: 'exact_option', correctOptionIds: ['dog'] }
};
const drag: Question = {
  id: 'adaptive.projection.drag', revision: 1, schemaVersion: 1,
  conceptIds: ['animals.projection.dog'], knowledgeRefs: ['kr.animals.projection-dog'], difficulty: 1,
  language: 'en-IN', prompt: { text: 'Match.' }, feedback: { correct: 'Yes.', incorrect: 'Again.' },
  authoring: { status: 'reviewed', source: 'adaptive-projection-test' },
  interaction: { type: 'drag_to_target', version: 1, items: [{ id: 'dog', label: 'Dog' }], targets: [{ id: 'home', label: 'Home' }] },
  solution: { type: 'target_assignment', assignments: { dog: 'home' } }
};

const progress: ProgressSnapshot = {
  version: 1,
  attempts: [{
    sessionId: 'projection.session', questionId: choice.id, submittedAt: '2026-09-01T08:00:00.000Z', durationMs: 1000,
    correct: true, score: 1, maxScore: 1, knowledgeRefs: ['kr.animals.projection-dog'], conceptIds: ['animals.projection.dog'],
    attemptNumber: 1, attemptKind: 'independent', assistanceKinds: [], countsTowardAccuracy: true, masteryWeight: 1
  }],
  knowledge: {}, concepts: {}, updatedAt: '2026-09-01T08:00:00.000Z'
};

const context = {
  progress,
  questionBank: [choice, drag],
  currentWorldId: 'forest',
  currentWorldTopics: ['animals'],
  worldHasProgress: true,
  now: '2026-09-02T09:00:00.000Z'
} as const;

describe('adaptive cross-surface recommendation projection', () => {
  it('projects the same deterministic due concept and recipe into Play and Learn About without a second evidence model', () => {
    const play = projectAdaptiveRecommendation('play', context);
    const learnAbout = projectAdaptiveRecommendation('learn_about', context);
    expect(play).toMatchObject({ reason: 'review_due', questionId: drag.id, conceptId: 'animals.projection.dog' });
    expect(learnAbout).toMatchObject({ reason: 'review_due', questionId: drag.id, conceptId: 'animals.projection.dog' });
    expect(play?.questionId).toBe(learnAbout?.questionId);
    expect(progress.attempts).toHaveLength(1);
  });
});
