import type {
  ResponseAssistanceKind,
  ResponseAttemptKind,
  SessionAttempt
} from '../contracts/runtime';

export type AvatarId = 'fox' | 'owl' | 'panda' | 'tiger';

export interface ChildSettings {
  name: string;
  avatar: AvatarId;
}

export interface MasteryCounter {
  /** Independent first responses only. */
  attempts: number;
  /** Correct independent first responses only. */
  correct: number;
  /** Weighted evidence may include reduced recovery credit from retries. */
  totalWeight: number;
  correctWeight: number;
  lastResult: 'correct' | 'incorrect';
  lastSeenAt: string;
}

export interface StoredAttempt {
  sessionId: string;
  questionId: string;
  submittedAt: string;
  durationMs: number;
  correct: boolean;
  score: number;
  maxScore: number;
  knowledgeRefs: string[];
  conceptIds: string[];
  attemptNumber: number;
  attemptKind: ResponseAttemptKind;
  assistanceKinds: ResponseAssistanceKind[];
  countsTowardAccuracy: boolean;
  masteryWeight: number;
}

export interface ProgressSnapshot {
  version: 1;
  attempts: StoredAttempt[];
  knowledge: Record<string, MasteryCounter>;
  concepts: Record<string, MasteryCounter>;
  updatedAt: string | null;
}

export type TopicProgressStatus = 'not_started' | 'needs_practice' | 'growing' | 'strong';

const TOPIC_DEFINITIONS = [
  { id: 'animals', label: 'Animals' },
  { id: 'plants', label: 'Plants' },
  { id: 'human', label: 'Human Body' },
  { id: 'food', label: 'Food' },
  { id: 'housing', label: 'Housing' },
  { id: 'clothing', label: 'Clothing' },
  { id: 'habits', label: 'Good Habits' },
  { id: 'safety', label: 'Safety' },
  { id: 'transport', label: 'Transport' },
  { id: 'communication', label: 'Communication' },
  { id: 'air', label: 'Air' },
  { id: 'water', label: 'Water' },
  { id: 'rocks', label: 'Rocks' },
  { id: 'universe', label: 'Earth & Universe' },
  { id: 'family', label: 'Family' },
  { id: 'festivals', label: 'Festivals' },
  { id: 'reasoning', label: 'Logical Reasoning' }
] as const;

export type TopicId = (typeof TOPIC_DEFINITIONS)[number]['id'];

export interface TopicProgressSummary {
  id: TopicId;
  label: string;
  practicedKnowledge: number;
  strongKnowledge: number;
  accuracy: number | null;
  status: TopicProgressStatus;
}

export interface ProgressSummary {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number | null;
  practicedKnowledge: number;
  masteredKnowledge: number;
  topics: TopicProgressSummary[];
  recommendedTopics: TopicProgressSummary[];
}

const CHILD_KEY = 'kidsplay.child.v1';
const PROGRESS_KEY = 'kidsplay.progress.v1';
const MAX_STORED_ATTEMPTS = 250;

const DEFAULT_CHILD: ChildSettings = { name: '', avatar: 'fox' };
const TOPIC_LABELS = Object.fromEntries(
  TOPIC_DEFINITIONS.map((topic) => [topic.id, topic.label])
) as Record<TopicId, string>;
const TOPIC_IDS = TOPIC_DEFINITIONS.map((topic) => topic.id);

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readJson(key: string): unknown {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local storage can be unavailable in private/restricted browser contexts.
  }
}

function isAvatarId(value: unknown): value is AvatarId {
  return value === 'fox' || value === 'owl' || value === 'panda' || value === 'tiger';
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && Number.isFinite(Date.parse(value));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.length > 0);
}

function isAssistanceKind(value: unknown): value is ResponseAssistanceKind {
  return value === 'hint'
    || value === 'visual_scaffold'
    || value === 'answer_elimination'
    || value === 'demonstration'
    || value === 'explanation';
}

function normalizeAssistanceKinds(value: unknown): ResponseAssistanceKind[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(isAssistanceKind))];
}

function normalizedChildName(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 24) : '';
}

export function loadChildSettings(): ChildSettings {
  const value = readJson(CHILD_KEY);
  if (!value || typeof value !== 'object') return { ...DEFAULT_CHILD };
  const candidate = value as Partial<ChildSettings>;
  return {
    name: normalizedChildName(candidate.name),
    avatar: isAvatarId(candidate.avatar) ? candidate.avatar : DEFAULT_CHILD.avatar
  };
}

export function saveChildSettings(settings: ChildSettings): ChildSettings {
  const normalized: ChildSettings = {
    name: normalizedChildName(settings.name),
    avatar: isAvatarId(settings.avatar) ? settings.avatar : DEFAULT_CHILD.avatar
  };
  writeJson(CHILD_KEY, normalized);
  return normalized;
}

function emptyProgress(): ProgressSnapshot {
  return {
    version: 1,
    attempts: [],
    knowledge: {},
    concepts: {},
    updatedAt: null
  };
}

function isMasteryCounter(value: unknown): value is MasteryCounter {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<MasteryCounter>;
  return Number.isInteger(item.attempts)
    && Number(item.attempts) >= 0
    && Number.isInteger(item.correct)
    && Number(item.correct) >= 0
    && Number(item.correct) <= Number(item.attempts)
    && Number.isFinite(item.totalWeight)
    && Number(item.totalWeight) >= 0
    && Number.isFinite(item.correctWeight)
    && Number(item.correctWeight) >= 0
    && Number(item.correctWeight) <= Number(item.totalWeight)
    && (item.lastResult === 'correct' || item.lastResult === 'incorrect')
    && isTimestamp(item.lastSeenAt);
}

function normalizeStoredAttempt(value: unknown): StoredAttempt | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<StoredAttempt>;
  if (typeof item.sessionId !== 'string'
    || item.sessionId.length === 0
    || typeof item.questionId !== 'string'
    || item.questionId.length === 0
    || !isTimestamp(item.submittedAt)
    || !Number.isFinite(item.durationMs)
    || Number(item.durationMs) < 0
    || typeof item.correct !== 'boolean'
    || !Number.isFinite(item.score)
    || Number(item.score) < 0
    || !Number.isFinite(item.maxScore)
    || Number(item.maxScore) < 0
    || Number(item.score) > Number(item.maxScore)
    || !isStringArray(item.knowledgeRefs)
    || !isStringArray(item.conceptIds)) {
    return null;
  }

  const attemptKind: ResponseAttemptKind = item.attemptKind === 'retry' ? 'retry' : 'independent';
  const assistanceKinds = normalizeAssistanceKinds(item.assistanceKinds);
  const attemptNumber = Number.isInteger(item.attemptNumber) && Number(item.attemptNumber) >= 1
    ? Number(item.attemptNumber)
    : attemptKind === 'retry' ? 2 : 1;
  const countsTowardAccuracy = typeof item.countsTowardAccuracy === 'boolean'
    ? item.countsTowardAccuracy
    : attemptKind === 'independent';
  const fallbackMasteryWeight = attemptKind === 'independent'
    ? 1
    : item.correct ? (assistanceKinds.length ? 0.25 : 0.5) : 0;
  const masteryWeight = Number.isFinite(item.masteryWeight)
    && Number(item.masteryWeight) >= 0
    && Number(item.masteryWeight) <= 1
    ? Number(item.masteryWeight)
    : fallbackMasteryWeight;

  return {
    sessionId: item.sessionId,
    questionId: item.questionId,
    submittedAt: item.submittedAt,
    durationMs: Number(item.durationMs),
    correct: item.correct,
    score: Number(item.score),
    maxScore: Number(item.maxScore),
    knowledgeRefs: [...item.knowledgeRefs],
    conceptIds: [...item.conceptIds],
    attemptNumber,
    attemptKind,
    assistanceKinds,
    countsTowardAccuracy,
    masteryWeight
  };
}

function sanitizeCounters(value: unknown): Record<string, MasteryCounter> {
  if (!value || typeof value !== 'object') return {};
  const counters: Record<string, MasteryCounter> = {};
  for (const [id, counter] of Object.entries(value as Record<string, unknown>)) {
    if (id && isMasteryCounter(counter)) counters[id] = counter;
  }
  return counters;
}

export function loadProgress(): ProgressSnapshot {
  const value = readJson(PROGRESS_KEY);
  if (!value || typeof value !== 'object') return emptyProgress();
  const candidate = value as Partial<ProgressSnapshot>;
  const attempts = Array.isArray(candidate.attempts)
    ? candidate.attempts
        .map(normalizeStoredAttempt)
        .filter((attempt): attempt is StoredAttempt => attempt !== null)
        .slice(-MAX_STORED_ATTEMPTS)
    : [];
  return {
    version: 1,
    attempts,
    knowledge: sanitizeCounters(candidate.knowledge),
    concepts: sanitizeCounters(candidate.concepts),
    updatedAt: isTimestamp(candidate.updatedAt) ? candidate.updatedAt : null
  };
}

function applyEvidence(
  counters: Record<string, MasteryCounter>,
  id: string,
  result: 'correct' | 'incorrect',
  evidenceWeight: number,
  responseWeight: number,
  countAsIndependentAttempt: boolean,
  seenAt: string
): void {
  const safeEvidenceWeight = Number.isFinite(evidenceWeight) && evidenceWeight > 0 ? evidenceWeight : 1;
  const safeResponseWeight = Number.isFinite(responseWeight) && responseWeight >= 0 ? responseWeight : 0;
  const weightedEvidence = safeEvidenceWeight * safeResponseWeight;
  const current = counters[id] ?? {
    attempts: 0,
    correct: 0,
    totalWeight: 0,
    correctWeight: 0,
    lastResult: result,
    lastSeenAt: seenAt
  };

  if (countAsIndependentAttempt) {
    current.attempts += 1;
    if (result === 'correct') current.correct += 1;
  }
  current.totalWeight += weightedEvidence;
  if (result === 'correct') current.correctWeight += weightedEvidence;
  current.lastResult = result;
  current.lastSeenAt = seenAt;
  counters[id] = current;
}

function sameStoredAttempt(stored: StoredAttempt, attempt: SessionAttempt): boolean {
  return stored.sessionId === attempt.response.sessionId
    && stored.questionId === attempt.question.id
    && stored.submittedAt === attempt.response.submittedAt;
}

function responseMasteryWeight(attempt: SessionAttempt): number {
  if (attempt.response.attemptKind === 'independent') return 1;
  if (!attempt.result.correct) return 0;
  return attempt.response.assistanceKinds.length > 0 ? 0.25 : 0.5;
}

export function recordAttempt(attempt: SessionAttempt): ProgressSnapshot {
  const snapshot = loadProgress();
  if (snapshot.attempts.some((stored) => sameStoredAttempt(stored, attempt))) return snapshot;

  const seenAt = attempt.response.submittedAt;
  const independent = attempt.response.attemptKind === 'independent';
  const masteryWeight = responseMasteryWeight(attempt);

  snapshot.attempts.push({
    sessionId: attempt.response.sessionId,
    questionId: attempt.question.id,
    submittedAt: seenAt,
    durationMs: attempt.response.durationMs,
    correct: attempt.result.correct,
    score: attempt.result.score,
    maxScore: attempt.result.maxScore,
    knowledgeRefs: [...(attempt.question.knowledgeRefs ?? [])],
    conceptIds: [...attempt.question.conceptIds],
    attemptNumber: attempt.response.attempts,
    attemptKind: attempt.response.attemptKind,
    assistanceKinds: [...attempt.response.assistanceKinds],
    countsTowardAccuracy: independent,
    masteryWeight
  });
  snapshot.attempts = snapshot.attempts.slice(-MAX_STORED_ATTEMPTS);

  for (const evidence of attempt.result.knowledgeEvidence) {
    applyEvidence(
      snapshot.knowledge,
      evidence.rowId,
      evidence.result,
      evidence.weight,
      masteryWeight,
      independent,
      seenAt
    );
  }
  for (const evidence of attempt.result.masteryEvidence) {
    applyEvidence(
      snapshot.concepts,
      evidence.conceptId,
      evidence.result,
      evidence.weight,
      masteryWeight,
      independent,
      seenAt
    );
  }

  snapshot.updatedAt = seenAt;
  writeJson(PROGRESS_KEY, snapshot);
  return snapshot;
}

function isStrongCounter(counter: MasteryCounter): boolean {
  return counter.attempts >= 2
    && counter.totalWeight > 0
    && counter.correctWeight / counter.totalWeight >= 0.75;
}

function topicIdForRow(rowId: string): TopicId | null {
  const parts = rowId.split('.');
  const candidate = parts[1] === 'choice' ? parts[2] : parts[1];
  return TOPIC_IDS.includes(candidate as TopicId) ? candidate as TopicId : null;
}

export function summarizeTopicProgress(snapshot: ProgressSnapshot): TopicProgressSummary[] {
  return TOPIC_IDS.map((id) => {
    const counters = Object.entries(snapshot.knowledge)
      .filter(([rowId]) => topicIdForRow(rowId) === id)
      .map(([, counter]) => counter);
    const totalAttempts = counters.reduce((sum, counter) => sum + counter.attempts, 0);
    const correctAttempts = counters.reduce((sum, counter) => sum + counter.correct, 0);
    const accuracy = totalAttempts > 0 ? correctAttempts / totalAttempts : null;
    const strongKnowledge = counters.filter(isStrongCounter).length;

    let status: TopicProgressStatus = 'not_started';
    if (counters.length) {
      if (counters.length >= 3 && accuracy !== null && accuracy >= 0.8 && strongKnowledge / counters.length >= 0.6) {
        status = 'strong';
      } else if (accuracy !== null && accuracy >= 0.6) {
        status = 'growing';
      } else {
        status = 'needs_practice';
      }
    }

    return {
      id,
      label: TOPIC_LABELS[id],
      practicedKnowledge: counters.length,
      strongKnowledge,
      accuracy,
      status
    };
  });
}

function recommendTopics(topics: TopicProgressSummary[]): TopicProgressSummary[] {
  if (!topics.some((topic) => topic.practicedKnowledge > 0)) return [];

  const priority: Record<TopicProgressStatus, number> = {
    needs_practice: 0,
    growing: 1,
    not_started: 2,
    strong: 3
  };

  return topics
    .filter((topic) => topic.status !== 'strong')
    .sort((left, right) => {
      const statusDelta = priority[left.status] - priority[right.status];
      if (statusDelta) return statusDelta;
      const leftAccuracy = left.accuracy ?? 1;
      const rightAccuracy = right.accuracy ?? 1;
      if (leftAccuracy !== rightAccuracy) return leftAccuracy - rightAccuracy;
      if (left.practicedKnowledge !== right.practicedKnowledge) {
        return right.practicedKnowledge - left.practicedKnowledge;
      }
      return TOPIC_IDS.indexOf(left.id) - TOPIC_IDS.indexOf(right.id);
    })
    .slice(0, 3);
}

export function summarizeProgress(snapshot: ProgressSnapshot): ProgressSummary {
  const accuracyAttempts = snapshot.attempts.filter((attempt) => attempt.countsTowardAccuracy);
  const totalAttempts = accuracyAttempts.length;
  const correctAttempts = accuracyAttempts.filter((attempt) => attempt.correct).length;
  const masteredKnowledge = Object.values(snapshot.knowledge).filter(isStrongCounter).length;
  const topics = summarizeTopicProgress(snapshot);

  return {
    totalAttempts,
    correctAttempts,
    accuracy: totalAttempts ? correctAttempts / totalAttempts : null,
    practicedKnowledge: Object.keys(snapshot.knowledge).length,
    masteredKnowledge,
    topics,
    recommendedTopics: recommendTopics(topics)
  };
}
