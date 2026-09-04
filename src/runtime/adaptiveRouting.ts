import type { Question } from '../contracts/question';
import type { ProgressSnapshot, StoredAttempt } from './localProgress';

export const ADAPTIVE_ROUTING_POLICY_VERSION = 1 as const;

export type AdaptiveRouteKind =
  | 'continue_world'
  | 'new_frontier'
  | 'review_due'
  | 'recovery'
  | 'confidence'
  | 'interest'
  | 'variety';

export type ReviewEvidenceKind = 'independent' | 'recovered' | 'assisted' | 'failed';
export type AdaptiveInterestKind = 'voluntary_replay' | 'favourite' | 'topic_choice';

export interface AdaptiveInterestSignal {
  kind: AdaptiveInterestKind;
  observedAt: string;
  conceptIds?: readonly string[];
  topicIds?: readonly string[];
}

export interface AdaptiveEligibility {
  /** Profile/content projection. Omit only when the supplied bank is already scoped. */
  allowedQuestionIds?: readonly string[];
  /** Canonical/prerequisite projection. A supplied allowlist is fail-closed. */
  allowedConceptIds?: readonly string[];
  /** Canonical sense/knowledge authority projection. A supplied allowlist is fail-closed. */
  allowedKnowledgeRefs?: readonly string[];
  /** Presentation-demand compatibility, e.g. a #206-compatible interaction subset. */
  allowedInteractionTypes?: readonly Question['interaction']['type'][];
}

export interface ConceptReviewState {
  policyVersion: typeof ADAPTIVE_ROUTING_POLICY_VERSION;
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
  questionBank: readonly Question[];
  currentWorldId: string | null;
  currentWorldTopics: readonly string[];
  /** Whether the child has already changed/completed anything in the story world. */
  worldHasProgress: boolean;
  eligibility?: AdaptiveEligibility;
  /** Explicit voluntary signals only; correctness/reading exposure is never inferred as interest. */
  interestSignals?: readonly AdaptiveInterestSignal[];
  now?: string | Date;
}

export interface AdaptiveRouteDecision {
  policyVersion: typeof ADAPTIVE_ROUTING_POLICY_VERSION;
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
 * Explicit V1 deterministic review policy. A policy-version change does not
 * migrate a second adaptive store: all review projections are rebuilt from the
 * canonical #173 attempt history under the current version.
 */
export const ADAPTIVE_REVIEW_INTERVALS_MS = {
  independent: [DAY, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY],
  recovered: [12 * HOUR, DAY, 3 * DAY, 7 * DAY, 14 * DAY],
  assisted: [4 * HOUR, 12 * HOUR, DAY, 3 * DAY, 7 * DAY],
  failed: [15 * MINUTE]
} as const;

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
        policyVersion: ADAPTIVE_ROUTING_POLICY_VERSION,
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

function questionIsEligible(question: Question, eligibility?: AdaptiveEligibility): boolean {
  if (question.authoring.status !== 'reviewed') return false;
  if (!question.conceptIds.length || !(question.knowledgeRefs?.length)) return false;
  if (!eligibility) return true;

  const allowedQuestionIds = eligibility.allowedQuestionIds ? new Set(eligibility.allowedQuestionIds) : null;
  const allowedConceptIds = eligibility.allowedConceptIds ? new Set(eligibility.allowedConceptIds) : null;
  const allowedKnowledgeRefs = eligibility.allowedKnowledgeRefs ? new Set(eligibility.allowedKnowledgeRefs) : null;
  const allowedInteractionTypes = eligibility.allowedInteractionTypes ? new Set(eligibility.allowedInteractionTypes) : null;

  if (allowedQuestionIds && !allowedQuestionIds.has(question.id)) return false;
  if (allowedConceptIds && !question.conceptIds.every((conceptId) => allowedConceptIds.has(conceptId))) return false;
  if (allowedKnowledgeRefs && !question.knowledgeRefs.every((rowId) => allowedKnowledgeRefs.has(rowId))) return false;
  if (allowedInteractionTypes && !allowedInteractionTypes.has(question.interaction.type)) return false;
  return true;
}

function attemptedQuestionIds(progress: ProgressSnapshot): Set<string> {
  return new Set(progress.attempts.map((attempt) => attempt.questionId));
}

function latestRecipeForConcept(
  conceptId: string,
  progress: ProgressSnapshot,
  questionBank: readonly Question[]
): Question['interaction']['type'] | null {
  const questionById = new Map(questionBank.map((question) => [question.id, question]));
  const attempts = [...progress.attempts]
    .filter((attempt) => attempt.conceptIds.includes(conceptId))
    .sort((left, right) => Date.parse(right.submittedAt) - Date.parse(left.submittedAt));
  return attempts.length ? questionById.get(attempts[0].questionId)?.interaction.type ?? null : null;
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
    policyVersion: ADAPTIVE_ROUTING_POLICY_VERSION,
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
  signals: readonly AdaptiveInterestSignal[],
  progress: ProgressSnapshot,
  questionBank: readonly Question[],
  topics: Set<string>,
  nowMs: number
): Question | null {
  const orderedSignals = [...signals]
    .filter((signal) => Number.isFinite(Date.parse(signal.observedAt)) && Date.parse(signal.observedAt) <= nowMs)
    .sort((left, right) => Date.parse(right.observedAt) - Date.parse(left.observedAt));
  const attempted = attemptedQuestionIds(progress);

  for (const signal of orderedSignals) {
    for (const conceptId of signal.conceptIds ?? []) {
      const alternate = selectStrictAlternateForConcept(
        conceptId,
        latestRecipeForConcept(conceptId, progress, questionBank),
        progress,
        questionBank,
        topics
      );
      if (alternate) return alternate;
    }

    const signalTopics = new Set(signal.topicIds ?? []);
    if (!signalTopics.size) continue;
    const candidates = questionBank.filter((question) =>
      questionFitsTopics(question, topics)
        && questionFitsTopics(question, signalTopics)
    );
    const unseen = candidates.filter((question) => !attempted.has(question.id));
    const pool = unseen.length ? unseen : candidates;
    const selected = [...pool].sort((left, right) =>
      left.difficulty - right.difficulty || left.id.localeCompare(right.id)
    )[0];
    if (selected) return selected;
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

function worldDecision(
  kind: 'continue_world' | 'new_frontier',
  worldId: string | null,
  deferredReviewConceptIds: string[]
): AdaptiveRouteDecision {
  return {
    policyVersion: ADAPTIVE_ROUTING_POLICY_VERSION,
    kind,
    worldId,
    conceptId: null,
    questionIds: [],
    dueAt: null,
    deferredReviewConceptIds
  };
}

/**
 * Resolve the next Continue Adventure action from canonical persisted evidence.
 * No route label is intended for child-facing UI; callers receive a practice
 * question only when adaptive practice should temporarily intercept world flow.
 */
export function decideAdaptiveExperience(context: AdaptiveRoutingContext): AdaptiveRouteDecision {
  const nowMs = timestamp(context.now);
  const topics = new Set(context.currentWorldTopics);
  const questionBank = context.questionBank.filter((question) => questionIsEligible(question, context.eligibility));
  const reviewStates = buildConceptReviewStates(context.progress, questionBank, new Date(nowMs));
  const dueStates = reviewStates
    .filter((state) => state.due)
    .sort((left, right) => {
      const priorityDelta = duePriority(left.evidenceKind) - duePriority(right.evidenceKind);
      return priorityDelta || Date.parse(left.dueAt) - Date.parse(right.dueAt) || left.conceptId.localeCompare(right.conceptId);
    });

  const deferredReviewConceptIds: string[] = [];
  for (const state of dueStates) {
    const question = selectQuestionForConcept(state, context.progress, questionBank, topics);
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

  const variety = selectVarietyQuestion(context.progress, questionBank, topics);
  if (variety) {
    return makePracticeDecision('variety', context.currentWorldId, null, variety, deferredReviewConceptIds);
  }

  const interest = selectInterestQuestion(
    context.interestSignals ?? [],
    context.progress,
    questionBank,
    topics,
    nowMs
  );
  if (interest) {
    return makePracticeDecision('interest', context.currentWorldId, null, interest, deferredReviewConceptIds);
  }

  if (
    context.currentWorldId
      && (!context.worldHasProgress || !hasCurrentWorldLearning(context.progress, questionBank, topics))
  ) {
    return worldDecision('new_frontier', context.currentWorldId, deferredReviewConceptIds);
  }

  return worldDecision('continue_world', context.currentWorldId, deferredReviewConceptIds);
}
