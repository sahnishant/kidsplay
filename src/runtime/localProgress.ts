import type { SessionAttempt } from '../contracts/runtime';

export type AvatarId = 'fox' | 'owl' | 'panda' | 'tiger';

export interface ChildSettings {
  name: string;
  avatar: AvatarId;
}

export interface MasteryCounter {
  attempts: number;
  correct: number;
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

export function loadChildSettings(): ChildSettings {
  const value = readJson(CHILD_KEY);
  if (!value || typeof value !== 'object') return { ...DEFAULT_CHILD };
  const candidate = value as Partial<ChildSettings>;
  return {
    name: typeof candidate.name === 'string' ? candidate.name.slice(0, 24) : '',
    avatar: isAvatarId(candidate.avatar) ? candidate.avatar : DEFAULT_CHILD.avatar
  };
}

export function saveChildSettings(settings: ChildSettings): ChildSettings {
  const normalized: ChildSettings = {
    name: settings.name.slice(0, 24),
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

function isStoredAttempt(value: unknown): value is StoredAttempt {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<StoredAttempt>;
  return typeof item.sessionId === 'string'
    && item.sessionId.length > 0
    && typeof item.questionId === 'string'
    && item.questionId.length > 0
    && isTimestamp(item.submittedAt)
    && Number.isFinite(item.durationMs)
    && Number(item.durationMs) >= 0
    && typeof item.correct === 'boolean'
    && Number.isFinite(item.score)
    && Number(item.score) >= 0
    && Number.isFinite(item.maxScore)
    && Number(item.maxScore) >= 0
    && Number(item.score) <= Number(item.maxScore)
    && isStringArray(item.knowledgeRefs)
    && isStringArray(item.conceptIds);
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
  return {
    version: 1,
    attempts: Array.isArray(candidate.attempts)
      ? candidate.attempts.filter(isStoredAttempt).slice(-MAX_STORED_ATTEMPTS)
      : [],
    knowledge: sanitizeCounters(candidate.knowledge),
    concepts: sanitizeCounters(candidate.concepts),
    updatedAt: isTimestamp(candidate.updatedAt) ? candidate.updatedAt : null
  };
}

function applyEvidence(
  counters: Record<string, MasteryCounter>,
  id: string,
  result: 'correct' | 'incorrect',
  weight: number,
  seenAt: string
): void {
  const safeWeight = Number.isFinite(weight) && weight > 0 ? weight : 1;
  const current = counters[id] ?? {
    attempts: 0,
    correct: 0,
    totalWeight: 0,
    correctWeight: 0,
    lastResult: result,
    lastSeenAt: seenAt
  };
  current.attempts += 1;
  current.totalWeight += safeWeight;
  if (result === 'correct') {
    current.correct += 1;
    current.correctWeight += safeWeight;
  }
  current.lastResult = result;
  current.lastSeenAt = seenAt;
  counters[id] = current;
}

export function recordAttempt(attempt: SessionAttempt): ProgressSnapshot {
  const snapshot = loadProgress();
  const seenAt = attempt.response.submittedAt;

  snapshot.attempts.push({
    sessionId: attempt.response.sessionId,
    questionId: attempt.question.id,
    submittedAt: seenAt,
    durationMs: attempt.response.durationMs,
    correct: attempt.result.correct,
    score: attempt.result.score,
    maxScore: attempt.result.maxScore,
    knowledgeRefs: [...(attempt.question.knowledgeRefs ?? [])],
    conceptIds: [...attempt.question.conceptIds]
  });
  snapshot.attempts = snapshot.attempts.slice(-MAX_STORED_ATTEMPTS);

  for (const evidence of attempt.result.knowledgeEvidence) {
    applyEvidence(snapshot.knowledge, evidence.rowId, evidence.result, evidence.weight, seenAt);
  }
  for (const evidence of attempt.result.masteryEvidence) {
    applyEvidence(snapshot.concepts, evidence.conceptId, evidence.result, evidence.weight, seenAt);
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
    const totalWeight = counters.reduce((sum, counter) => sum + counter.totalWeight, 0);
    const correctWeight = counters.reduce((sum, counter) => sum + counter.correctWeight, 0);
    const accuracy = totalWeight > 0 ? correctWeight / totalWeight : null;
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
  const totalAttempts = snapshot.attempts.length;
  const correctAttempts = snapshot.attempts.filter((attempt) => attempt.correct).length;
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
