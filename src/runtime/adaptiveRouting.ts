import type { Question } from '../contracts/question';
import type { ProgressSnapshot, StoredAttempt } from './localProgress';

export type AdaptiveRouteKind =
  | 'continue_world'
  | 'new_frontier'
  | 'review_due'
  | 'recovery'
  | 'confidence'
  | 'interest'
  | 'variety';

export type ReviewEvidenceKind = 'independent' | 'recovered' | 'assisted' | 'failed';

export interface ConceptReviewState {
  conceptId: string;
  evidenceKind: ReviewEvidenceKind;
  successfulRounds: number;
  lastSeenAt: string;
  dueAt: string;
  due: boolean;
  lastQuestionId: string;
  lastRecipe: Question['interaction']['type'] | null;
}

export interface AdaptiveRoutingContext {
  progress: ProgressSnapshot;
  questionBank: Question[];
  currentWorldId: string | null;
  currentWorldTopics: readonly string[];
  /** Whether the child has already changed/completed anything in the story world. */
  worldHasProgress: boolean;
  now?: string | Date;
}

export interface AdaptiveRouteDecision {
  kind: AdaptiveRouteKind;
  worldId: string | null;
  conceptId: string | null;
  questionIds: string[];
  dueAt: string | null;
  /** Internal proof only. This is never child-facing copy. */
  deferredReviewConceptIds: string[];
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Explicit, deterministic review policy.
 *
 * A clean independent response earns the longest spacing. A recovered response
 * returns sooner. An assisted response returns sooner still. A failed response
 * is a short recovery hand-off rather than a mastery refresh.
 */
export const ADAPTIVE_REVIEW_INTERVALS_MS = {
  independent: [DAY, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY],
  recovered: [12 * HOUR, DAY, 3 * DAY, 7 * DAY, 14 * DAY],
  assisted: [4 * HOUR, 12 * HOUR, DAY, 3 * DAY, 7 * DAY],
  failed: [15 * MINUTE]
} as const;

export const ADAPTIVE_INTEREST_MIN_DELAY_MS = 30 * MINUTE;
export const ADAPTIVE_INTEREST_WINDOW_MS = 6 * HOUR;
const VARIETY_LOOKBACK = 3;

interface LearningRound {
  conceptIds: string[];
  questionId: string;
  seenAt: string;
  evidenceKind: ReviewEvidenceKind;
}

function timestamp(value: string | Date | undefined): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') return Date.parse(value);
  return Date.now();
}

function roundKey(attempt: StoredAttempt): string {
  return `${attempt.sessionId}\u0000${attempt.questionId}`;
}

function classifyRound(attempts: StoredAttempt[]): LearningRound | null {
  const ordered = [...attempts].sort((left, right) => {
    const attemptDelta = left.attemptNumber - right.attemptNumber;
    return attemptDelta || Date.parse(left.submittedAt) - Date.parse(right.submittedAt);
  });
  const independent = ordered.find((attempt) => attempt.attemptKind === 'independent');
  if (!independent) return null;
  const retry = [...ordered].reverse().find((attempt) => attempt.attemptKind === 'retry');
  const latest = retry ?? independent;
  const conceptIds = [...new Set(ordered.flatMap((attempt) => attempt.conceptIds))];
  if (!conceptIds.length) return null;

  let evidenceKind: ReviewEvidenceKind = 'failed';
  if (independent.correct) {
    evidenceKind = independent.assistanceKinds.length ? 'assisted' : 'independent';
  } else if (retry?.correct) {
    evidenceKind = retry.assistanceKinds.length ? 'assisted' : 'recovered';
  }

  return {
    conceptIds,
    questionId: independent.questionId,
    seenAt: latest.submittedAt,
    evidenceKind
  };
}

function collectLearningRounds(progress: ProgressSnapshot): LearningRound[] {
  const grouped = new Map<string, StoredAttempt[]>();
  for (const attempt of progress.attempts) {
    const key = roundKey(attempt);
    grouped.set(key, [...(grouped.get(key) ?? []), attempt]);
  }
  return [...grouped.values()]
    .map(classifyRound)
    .filter((round): round is LearningRound => round !== null)
    .sort((left, right) => Date.parse(left.seenAt) - Date.parse(right.seenAt));
}

function intervalFor(kind: ReviewEvidenceKind, successfulRounds: number): number {
  const intervals = ADAPTIVE_REVIEW_INTERVALS_MS[kind];
  if (kind === 'failed') return intervals[0];
  const index = Math.min(Math.max(0, successfulRounds - 1), intervals.length - 1);
  return intervals[index];
}

export function buildConceptReviewStates(
  progress: ProgressSnapshot,
  questionBank: readonly Question[],
  now: string | Date = new Date()
): ConceptReviewState[] {
  const rounds = collectLearningRounds(progress);
  const questionById = new Map(questionBank.map((question) => [question.id, question]));
  const roundsByConcept = new Map<string, LearningRound[]>();

  for (const round of rounds) {
    for (const conceptId of round.conceptIds) {
      roundsByConcept.set(conceptId, [...(roundsByConcept.get(conceptId) ?? []), round]);
    }
  }

  const nowMs = timestamp(now);
  return [...roundsByConcept.entries()]
    .map(([conceptId, conceptRounds]) => {
      const latest = conceptRounds[conceptRounds.length - 1];
      const successfulRounds = conceptRounds.filter((round) => round.evidenceKind !== 'failed').length;
      const dueAtMs = Date.parse(latest.seenAt) + intervalFor(latest.evidenceKind, successfulRounds);
      return {
        conceptId,
        evidenceKind: latest.evidenceKind,
        successfulRounds,
        lastSeenAt: latest.seenAt,
        dueAt: new Date(dueAtMs).toISOString(),
        due: nowMs >= dueAtMs,
        lastQuestionId: latest.questionId,
        lastRecipe: questionById.get(latest.questionId)?.interaction.type ?? null
      } satisfies ConceptReviewState;
    })
    .sort((left, right) => Date.parse(left.dueAt) - Date.parse(right.dueAt) || left.conceptId.localeCompare(right.conceptId));
}

function rowTopic(rowId: string): string | null {
  const parts = rowId.split('.');
  const candidate = parts[1] === 'choice' ? parts[2] : parts[1];
  return candidate || null;
}

function questionFitsTopics(question: Question, topics: Set<string>): boolean {
  if (!topics.size) return true;
  const knowledgeTopics = (question.knowledgeRefs ?? [])
    .map(rowTopic)
    .filter((topic): topic is string => Boolean(topic));
  if (knowledgeTopics.some((topic) => topics.has(topic))) return true;

  return question.conceptIds.some((conceptId) =>
    conceptId.split('.').some((part) => topics.has(part))
  );
}

function attemptedQuestionIds(progress: ProgressSnapshot): Set<string> {
  return new Set(progress.attempts.map((attempt) => attempt.questionId));
}

function selectQuestionForConcept(
  state: ConceptReviewState,
  progress: ProgressSnapshot,
  questionBank: readonly Question[],
  topics: Set<string>
): Question | null {
  const candidates = questionBank.filter((question) =>
    question.conceptIds.includes(state.conceptId) && questionFitsTopics(question, topics)
  );
  if (!candidates.length) return null;

  const attempted = attemptedQuestionIds(progress);
  const alternateRecipe = state.lastRecipe
    ? candidates.filter((question) => question.interaction.type !== state.lastRecipe)
    : candidates;
  const recipePool = alternateRecipe.length ? alternateRecipe : candidates;
  const unseen = recipePool.filter((question) => !attempted.has(question.id));
  const pool = unseen.length ? unseen : recipePool;

  return [...pool].sort((left, right) => {
    if (left.difficulty !== right.difficulty) return left.difficulty - right.difficulty;
    return left.id.localeCompare(right.id);
  })[0] ?? null;
}

function selectStrictAlternateForConcept(
  conceptId: string,
  lastRecipe: Question['interaction']['type'] | null,
  progress: ProgressSnapshot,
  questionBank: readonly Question[],
  topics: Set<string>
): Question | null {
  if (!lastRecipe) return null;
  const attempted = attemptedQuestionIds(progress);
  const candidates = questionBank.filter((question) =>
    question.conceptIds.includes(conceptId)
      && question.interaction.type !== lastRecipe
      && questionFitsTopics(question, topics)
  );
  if (!candidates.length) return null;
  const unseen = candidates.filter((question) => !attempted.has(question.id));
  return [...(unseen.length ? unseen : candidates)].sort((left, right) =>
    left.difficulty - right.difficulty || left.id.localeCompare(right.id)
  )[0] ?? null;
}

function duePriority(kind: ReviewEvidenceKind): number {
  if (kind === 'failed') return 0;
  if (kind === 'assisted' || kind === 'recovered') return 1;
  return 2;
}

function routeKindForEvidence(kind: ReviewEvidenceKind): AdaptiveRouteKind {
  if (kind === 'failed') return 'recovery';
  if (kind === 'assisted' || kind === 'recovered') return 'confidence';
  return 'review_due';
}

function makePracticeDecision(
  kind: AdaptiveRouteKind,
  worldId: string | null,
  state: ConceptReviewState | null,
  question: Question,
  deferredReviewConceptIds: string[]
): AdaptiveRouteDecision {
  return {
    kind,
    worldId,
    conceptId: state?.conceptId ?? question.conceptIds[0] ?? null,
    questionIds: [question.id],
    dueAt: state?.dueAt ?? null,
    deferredReviewConceptIds
  };
}

function recentIndependentAttempts(progress: ProgressSnapshot): StoredAttempt[] {
  return progress.attempts
    .filter((attempt) => attempt.attemptKind === 'independent')
    .sort((left, right) => Date.parse(left.submittedAt) - Date.parse(right.submittedAt));
}

function selectVarietyQuestion(
  progress: ProgressSnapshot,
  questionBank: readonly Question[],
  topics: Set<string>
): Question | null {
  const recent = recentIndependentAttempts(progress).slice(-VARIETY_LOOKBACK);
  if (recent.length < VARIETY_LOOKBACK) return null;
  const questionById = new Map(questionBank.map((question) => [question.id, question]));
  const recipes = recent.map((attempt) => questionById.get(attempt.questionId)?.interaction.type ?? null);
  const repeatedRecipe = recipes[0];
  if (!repeatedRecipe || recipes.some((recipe) => recipe !== repeatedRecipe)) return null;

  const recentConcepts = new Set(recent.flatMap((attempt) => attempt.conceptIds));
  const candidates = questionBank.filter((question) =>
    question.interaction.type !== repeatedRecipe
      && questionFitsTopics(question, topics)
      && question.conceptIds.some((conceptId) => recentConcepts.has(conceptId))
  );
  if (!candidates.length) return null;
  const attempted = attemptedQuestionIds(progress);
  const unseen = candidates.filter((question) => !attempted.has(question.id));
  return [...(unseen.length ? unseen : candidates)].sort((left, right) =>
    left.difficulty - right.difficulty || left.id.localeCompare(right.id)
  )[0] ?? null;
}

function selectInterestQuestion(
  progress: ProgressSnapshot,
  questionBank: readonly Question[],
  topics: Set<string>,
  nowMs: number
): Question | null {
  const questionById = new Map(questionBank.map((question) => [question.id, question]));
  const attempts = recentIndependentAttempts(progress).filter((attempt) => attempt.correct).reverse();
  for (const attempt of attempts) {
    const age = nowMs - Date.parse(attempt.submittedAt);
    if (age < ADAPTIVE_INTEREST_MIN_DELAY_MS) continue;
    if (age > ADAPTIVE_INTEREST_WINDOW_MS) break;
    const lastRecipe = questionById.get(attempt.questionId)?.interaction.type ?? null;
    for (const conceptId of attempt.conceptIds) {
      const alternate = selectStrictAlternateForConcept(
        conceptId,
        lastRecipe,
        progress,
        questionBank,
        topics
      );
      if (alternate) return alternate;
    }
  }
  return null;
}

function hasCurrentWorldLearning(
  progress: ProgressSnapshot,
  questionBank: readonly Question[],
  topics: Set<string>
): boolean {
  if (!progress.attempts.length) return false;
  const questionById = new Map(questionBank.map((question) => [question.id, question]));
  return progress.attempts.some((attempt) => {
    const question = questionById.get(attempt.questionId);
    return Boolean(question && questionFitsTopics(question, topics));
  });
}

/**
 * Resolve the next Continue Adventure action from canonical persisted evidence.
 * No route label is intended for child-facing UI; callers receive a practice
 * question only when adaptive practice should temporarily intercept world flow.
 */
export function decideAdaptiveExperience(context: AdaptiveRoutingContext): AdaptiveRouteDecision {
  const nowMs = timestamp(context.now);
  const topics = new Set(context.currentWorldTopics);
  const reviewStates = buildConceptReviewStates(context.progress, context.questionBank, new Date(nowMs));
  const dueStates = reviewStates
    .filter((state) => state.due)
    .sort((left, right) => {
      const priorityDelta = duePriority(left.evidenceKind) - duePriority(right.evidenceKind);
      return priorityDelta || Date.parse(left.dueAt) - Date.parse(right.dueAt) || left.conceptId.localeCompare(right.conceptId);
    });

  const deferredReviewConceptIds: string[] = [];
  for (const state of dueStates) {
    const question = selectQuestionForConcept(state, context.progress, context.questionBank, topics);
    if (!question) {
      deferredReviewConceptIds.push(state.conceptId);
      continue;
    }
    return makePracticeDecision(
      routeKindForEvidence(state.evidenceKind),
      context.currentWorldId,
      state,
      question,
      deferredReviewConceptIds
    );
  }

  const variety = selectVarietyQuestion(context.progress, context.questionBank, topics);
  if (variety) {
    return makePracticeDecision('variety', context.currentWorldId, null, variety, deferredReviewConceptIds);
  }

  const interest = selectInterestQuestion(context.progress, context.questionBank, topics, nowMs);
  if (interest) {
    return makePracticeDecision('interest', context.currentWorldId, null, interest, deferredReviewConceptIds);
  }

  if (
    context.currentWorldId
      && (!context.worldHasProgress || !hasCurrentWorldLearning(context.progress, context.questionBank, topics))
  ) {
    return {
      kind: 'new_frontier',
      worldId: context.currentWorldId,
      conceptId: null,
      questionIds: [],
      dueAt: null,
      deferredReviewConceptIds
    };
  }

  return {
    kind: 'continue_world',
    worldId: context.currentWorldId,
    conceptId: null,
    questionIds: [],
    dueAt: null,
    deferredReviewConceptIds
  };
}
