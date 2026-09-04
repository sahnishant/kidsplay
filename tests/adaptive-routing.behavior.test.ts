import { beforeEach, describe, expect, it } from 'vitest';
import type { Question } from '../src/contracts/question';
import type { ProgressSnapshot, StoredAttempt } from '../src/runtime/localProgress';
import { loadProgress } from '../src/runtime/localProgress';
import {
  ADAPTIVE_REVIEW_INTERVALS_MS,
  ADAPTIVE_ROUTING_POLICY_VERSION,
  buildConceptReviewStates,
  decideAdaptiveExperience
} from '../src/runtime/adaptiveRouting';

const T0 = '2026-09-01T08:00:00.000Z';
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function at(offsetMs: number): string {
  return new Date(Date.parse(T0) + offsetMs).toISOString();
}

function choiceQuestion(id: string, conceptId: string, topic = 'animals', difficulty = 1): Question {
  return {
    id,
    revision: 1,
    schemaVersion: 1,
    conceptIds: [conceptId],
    knowledgeRefs: [`kr.${topic}.${id}`],
    difficulty,
    language: 'en-IN',
    prompt: { text: 'Pick one.' },
    feedback: { correct: 'Yes.', incorrect: 'Try again.' },
    authoring: { status: 'reviewed', source: 'adaptive-routing-test' },
    interaction: {
      type: 'single_choice',
      version: 1,
      shuffleOptions: false,
      options: [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }]
    },
    solution: { type: 'exact_option', correctOptionIds: ['yes'] }
  };
}

function dragQuestion(id: string, conceptId: string, topic = 'animals', difficulty = 1): Question {
  return {
    id,
    revision: 1,
    schemaVersion: 1,
    conceptIds: [conceptId],
    knowledgeRefs: [`kr.${topic}.${id}`],
    difficulty,
    language: 'en-IN',
    prompt: { text: 'Match it.' },
    feedback: { correct: 'Yes.', incorrect: 'Try again.' },
    authoring: { status: 'reviewed', source: 'adaptive-routing-test' },
    interaction: {
      type: 'drag_to_target',
      version: 1,
      items: [{ id: 'dog', label: 'Dog' }],
      targets: [{ id: 'home', label: 'Home' }]
    },
    solution: { type: 'target_assignment', assignments: { dog: 'home' } }
  };
}

function storedAttempt(options: {
  sessionId?: string;
  questionId: string;
  conceptId: string;
  submittedAt: string;
  correct: boolean;
  attemptKind?: 'independent' | 'retry';
  attemptNumber?: number;
  assistanceKinds?: StoredAttempt['assistanceKinds'];
}): StoredAttempt {
  const attemptKind = options.attemptKind ?? 'independent';
  const assistanceKinds = options.assistanceKinds ?? [];
  return {
    sessionId: options.sessionId ?? `session.${options.questionId}`,
    questionId: options.questionId,
    submittedAt: options.submittedAt,
    durationMs: 1000,
    correct: options.correct,
    score: options.correct ? 1 : 0,
    maxScore: 1,
    knowledgeRefs: [`kr.animals.${options.questionId}`],
    conceptIds: [options.conceptId],
    attemptNumber: options.attemptNumber ?? (attemptKind === 'retry' ? 2 : 1),
    attemptKind,
    assistanceKinds,
    countsTowardAccuracy: attemptKind === 'independent',
    masteryWeight: attemptKind === 'independent' ? 1 : options.correct ? (assistanceKinds.length ? 0.25 : 0.5) : 0
  };
}

function progress(attempts: StoredAttempt[], updatedAt: string | null = attempts.at(-1)?.submittedAt ?? null): ProgressSnapshot {
  return { version: 1, attempts, knowledge: {}, concepts: {}, updatedAt };
}

function route(
  snapshot: ProgressSnapshot,
  questionBank: Question[],
  now: string,
  topics: string[] = ['animals'],
  worldHasProgress = true
) {
  return decideAdaptiveExperience({
    progress: snapshot,
    questionBank,
    currentWorldId: 'forest',
    currentWorldTopics: topics,
    worldHasProgress,
    now
  });
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('adaptive experience routing', () => {
  it('uses a versioned deterministic policy and schedules assisted success earlier than independent mastery', () => {
    const conceptId = 'animals.domestic.dog';
    const question = choiceQuestion('q.dog.choice', conceptId);
    const independent = progress([
      storedAttempt({ questionId: question.id, conceptId, submittedAt: T0, correct: true })
    ]);
    const assisted = progress([
      storedAttempt({ sessionId: 'session.assisted', questionId: question.id, conceptId, submittedAt: T0, correct: false }),
      storedAttempt({
        sessionId: 'session.assisted',
        questionId: question.id,
        conceptId,
        submittedAt: at(60_000),
        correct: true,
        attemptKind: 'retry',
        assistanceKinds: ['visual_scaffold']
      })
    ]);

    const independentState = buildConceptReviewStates(independent, [question], at(2 * HOUR))[0];
    const assistedState = buildConceptReviewStates(assisted, [question], at(2 * HOUR))[0];

    expect(ADAPTIVE_ROUTING_POLICY_VERSION).toBe(1);
    expect(independentState.policyVersion).toBe(ADAPTIVE_ROUTING_POLICY_VERSION);
    expect(ADAPTIVE_REVIEW_INTERVALS_MS.independent[0]).toBe(DAY);
    expect(ADAPTIVE_REVIEW_INTERVALS_MS.assisted[0]).toBe(4 * HOUR);
    expect(Date.parse(assistedState.dueAt)).toBeLessThan(Date.parse(independentState.dueAt));
    expect(independentState.evidenceKind).toBe('independent');
    expect(assistedState.evidenceKind).toBe('assisted');
  });

  it('routes an unresolved first-attempt miss into recovery after the bounded recovery delay', () => {
    const conceptId = 'animals.domestic.dog';
    const choice = choiceQuestion('q.dog.choice', conceptId);
    const drag = dragQuestion('q.dog.drag', conceptId);
    const decision = route(
      progress([storedAttempt({ questionId: choice.id, conceptId, submittedAt: T0, correct: false })]),
      [choice, drag],
      at(20 * 60 * 1000)
    );

    expect(decision.kind).toBe('recovery');
    expect(decision.conceptId).toBe(conceptId);
    expect(decision.questionIds).toEqual([drag.id]);
  });

  it('routes clean independent evidence into review_due only when its spaced interval is due', () => {
    const conceptId = 'animals.domestic.dog';
    const choice = choiceQuestion('q.dog.choice', conceptId);
    const drag = dragQuestion('q.dog.drag', conceptId);
    const snapshot = progress([storedAttempt({ questionId: choice.id, conceptId, submittedAt: T0, correct: true })]);

    expect(route(snapshot, [choice, drag], at(23 * HOUR)).kind).not.toBe('review_due');
    const due = route(snapshot, [choice, drag], at(25 * HOUR));
    expect(due.kind).toBe('review_due');
    expect(due.questionIds).toEqual([drag.id]);
  });

  it('returns recovered or assisted concepts through confidence before independent concepts are due', () => {
    const conceptId = 'animals.domestic.dog';
    const choice = choiceQuestion('q.dog.choice', conceptId);
    const drag = dragQuestion('q.dog.drag', conceptId);
    const snapshot = progress([
      storedAttempt({ sessionId: 'session.retry', questionId: choice.id, conceptId, submittedAt: T0, correct: false }),
      storedAttempt({
        sessionId: 'session.retry',
        questionId: choice.id,
        conceptId,
        submittedAt: at(60_000),
        correct: true,
        attemptKind: 'retry',
        assistanceKinds: ['explanation']
      })
    ]);

    const decision = route(snapshot, [choice, drag], at(5 * HOUR));
    expect(decision.kind).toBe('confidence');
    expect(decision.questionIds).toEqual([drag.id]);
  });

  it('revisits the same concept through a different existing recipe instead of repeating its MCQ when an alternative exists', () => {
    const conceptId = 'animals.domestic.dog';
    const choice = choiceQuestion('q.dog.choice', conceptId);
    const drag = dragQuestion('q.dog.drag', conceptId);
    const snapshot = progress([storedAttempt({ questionId: choice.id, conceptId, submittedAt: T0, correct: true })]);

    const decision = route(snapshot, [choice, drag], at(25 * HOUR));
    expect(decision.kind).toBe('review_due');
    expect(decision.questionIds).toEqual([drag.id]);
  });

  it('defers an overdue review that does not fit the current world instead of teleporting the child across topics', () => {
    const conceptId = 'animals.domestic.dog';
    const animalChoice = choiceQuestion('q.dog.choice', conceptId, 'animals');
    const animalDrag = dragQuestion('q.dog.drag', conceptId, 'animals');
    const plantChoice = choiceQuestion('q.plant.choice', 'plants.growth.seed', 'plants');
    const snapshot = progress([storedAttempt({ questionId: animalChoice.id, conceptId, submittedAt: T0, correct: true })]);

    const decision = route(snapshot, [animalChoice, animalDrag, plantChoice], at(25 * HOUR), ['plants']);
    expect(decision.kind).toBe('new_frontier');
    expect(decision.questionIds).toEqual([]);
    expect(decision.deferredReviewConceptIds).toEqual([conceptId]);
  });

  it('fails closed on draft content and caller-supplied profile/canonical/demand eligibility', () => {
    const conceptId = 'animals.domestic.dog';
    const choice = choiceQuestion('q.dog.choice', conceptId);
    const drag = dragQuestion('q.dog.drag', conceptId);
    const draftDrag = { ...drag, authoring: { ...drag.authoring, status: 'draft' as const } };
    const snapshot = progress([storedAttempt({ questionId: choice.id, conceptId, submittedAt: T0, correct: true })]);

    const draftDecision = decideAdaptiveExperience({
      progress: snapshot,
      questionBank: [choice, draftDrag],
      currentWorldId: 'forest',
      currentWorldTopics: ['animals'],
      worldHasProgress: true,
      now: at(25 * HOUR)
    });
    expect(draftDecision.questionIds).toEqual([choice.id]);

    const guardedDecision = decideAdaptiveExperience({
      progress: snapshot,
      questionBank: [choice, drag],
      currentWorldId: 'forest',
      currentWorldTopics: ['animals'],
      worldHasProgress: true,
      eligibility: {
        allowedQuestionIds: [choice.id, drag.id],
        allowedConceptIds: [conceptId],
        allowedKnowledgeRefs: [choice.knowledgeRefs![0], drag.knowledgeRefs![0]],
        allowedInteractionTypes: ['single_choice']
      },
      now: at(25 * HOUR)
    });
    expect(guardedDecision.questionIds).toEqual([choice.id]);
    expect(guardedDecision.questionIds).not.toContain(drag.id);
  });

  it('does not let passive timestamps refresh mastery or move a deterministic review clock', () => {
    const conceptId = 'animals.domestic.dog';
    const choice = choiceQuestion('q.dog.choice', conceptId);
    const drag = dragQuestion('q.dog.drag', conceptId);
    const masteryOnly = progress(
      [storedAttempt({ questionId: choice.id, conceptId, submittedAt: T0, correct: true })],
      T0
    );
    const sameEvidenceAfterPassiveStoryOrTopicOpen = {
      ...masteryOnly,
      updatedAt: at(20 * HOUR)
    };

    const first = route(masteryOnly, [choice, drag], at(25 * HOUR));
    const second = route(sameEvidenceAfterPassiveStoryOrTopicOpen, [choice, drag], at(25 * HOUR));
    expect(second.kind).toBe('review_due');
    expect(second.dueAt).toBe(first.dueAt);
    expect(second.questionIds).toEqual(first.questionIds);
  });

  it('rebuilds current-policy review state from legacy offline attempt evidence after a process-kill/relaunch', () => {
    const conceptId = 'animals.domestic.dog';
    const choice = choiceQuestion('q.dog.choice', conceptId);
    const drag = dragQuestion('q.dog.drag', conceptId);
    const snapshot = progress([storedAttempt({ questionId: choice.id, conceptId, submittedAt: T0, correct: true })]);
    window.localStorage.setItem('kidsplay.progress.v1', JSON.stringify(snapshot));

    const reloaded = loadProgress();
    const decision = route(reloaded, [choice, drag], at(25 * HOUR));
    expect(reloaded.attempts).toHaveLength(1);
    expect(decision).toMatchObject({
      policyVersion: ADAPTIVE_ROUTING_POLICY_VERSION,
      kind: 'review_due',
      conceptId,
      questionIds: [drag.id]
    });
  });

  it('is deterministic across a bounded 12-concept review history', () => {
    const questions: Question[] = [];
    const attempts: StoredAttempt[] = [];
    for (let index = 0; index < 12; index += 1) {
      const conceptId = `animals.proof.concept-${index.toString().padStart(2, '0')}`;
      const choice = choiceQuestion(`q.proof.${index}.choice`, conceptId);
      const drag = dragQuestion(`q.proof.${index}.drag`, conceptId);
      questions.push(choice, drag);
      attempts.push(storedAttempt({
        sessionId: `proof.${index}`,
        questionId: choice.id,
        conceptId,
        submittedAt: at(index * 60_000),
        correct: true
      }));
    }
    const snapshot = progress(attempts);
    const first = route(snapshot, questions, at(26 * HOUR));
    const second = route(snapshot, [...questions].reverse(), at(26 * HOUR));

    expect(buildConceptReviewStates(snapshot, questions, at(26 * HOUR))).toHaveLength(12);
    expect(second).toEqual(first);
    expect(first.kind).toBe('review_due');
    expect(first.questionIds).toEqual(['q.proof.0.drag']);
  });

  it('uses variety when recent play has repeated one recipe and an existing alternate recipe fits the world', () => {
    const conceptId = 'animals.domestic.dog';
    const q1 = choiceQuestion('q.dog.choice.1', conceptId);
    const q2 = choiceQuestion('q.dog.choice.2', conceptId);
    const q3 = choiceQuestion('q.dog.choice.3', conceptId);
    const drag = dragQuestion('q.dog.drag', conceptId);
    const snapshot = progress([
      storedAttempt({ sessionId: 's1', questionId: q1.id, conceptId, submittedAt: at(0), correct: true }),
      storedAttempt({ sessionId: 's2', questionId: q2.id, conceptId, submittedAt: at(5 * 60 * 1000), correct: true }),
      storedAttempt({ sessionId: 's3', questionId: q3.id, conceptId, submittedAt: at(10 * 60 * 1000), correct: true })
    ]);

    const decision = route(snapshot, [q1, q2, q3, drag], at(20 * 60 * 1000));
    expect(decision.kind).toBe('variety');
    expect(decision.questionIds).toEqual([drag.id]);
  });

  it('uses only explicit voluntary interest signals and never infers interest from successful assessment evidence', () => {
    const conceptId = 'animals.domestic.dog';
    const choice = choiceQuestion('q.dog.choice', conceptId);
    const drag = dragQuestion('q.dog.drag', conceptId);
    const snapshot = progress([
      storedAttempt({ questionId: choice.id, conceptId, submittedAt: T0, correct: true })
    ]);

    expect(route(snapshot, [choice, drag], at(HOUR)).kind).toBe('continue_world');
    const before = JSON.stringify(snapshot);
    const decision = decideAdaptiveExperience({
      progress: snapshot,
      questionBank: [choice, drag],
      currentWorldId: 'forest',
      currentWorldTopics: ['animals'],
      worldHasProgress: true,
      interestSignals: [{ kind: 'voluntary_replay', observedAt: at(HOUR), conceptIds: [conceptId] }],
      now: at(HOUR)
    });
    expect(decision.kind).toBe('interest');
    expect(decision.questionIds).toEqual([drag.id]);
    expect(JSON.stringify(snapshot)).toBe(before);
  });

  it('uses new_frontier before any current-world learning and otherwise falls back to continue_world', () => {
    const conceptId = 'animals.domestic.dog';
    const choice = choiceQuestion('q.dog.choice', conceptId);

    const frontier = route(progress([]), [choice], at(0), ['animals'], false);
    expect(frontier.kind).toBe('new_frontier');
    expect(frontier.questionIds).toEqual([]);

    const continuing = route(
      progress([storedAttempt({ questionId: choice.id, conceptId, submittedAt: at(0), correct: true })]),
      [choice],
      at(10 * 60 * 1000),
      ['animals'],
      true
    );
    expect(continuing.kind).toBe('continue_world');
    expect(continuing.questionIds).toEqual([]);
  });
});
