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

export interface ProgressSummary {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number | null;
  practicedKnowledge: number;
  masteredKnowledge: number;
}

const CHILD_KEY = 'kidsplay.child.v1';
const PROGRESS_KEY = 'kidsplay.progress.v1';
const MAX_STORED_ATTEMPTS = 250;

const DEFAULT_CHILD: ChildSettings = { name: '', avatar: 'fox' };

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
  return Number.isFinite(item.attempts)
    && Number.isFinite(item.correct)
    && Number.isFinite(item.totalWeight)
    && Number.isFinite(item.correctWeight)
    && (item.lastResult === 'correct' || item.lastResult === 'incorrect')
    && typeof item.lastSeenAt === 'string';
}

function sanitizeCounters(value: unknown): Record<string, MasteryCounter> {
  if (!value || typeof value !== 'object') return {};
  const counters: Record<string, MasteryCounter> = {};
  for (const [id, counter] of Object.entries(value as Record<string, unknown>)) {
    if (isMasteryCounter(counter)) counters[id] = counter;
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
      ? (candidate.attempts as StoredAttempt[]).slice(-MAX_STORED_ATTEMPTS)
      : [],
    knowledge: sanitizeCounters(candidate.knowledge),
    concepts: sanitizeCounters(candidate.concepts),
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : null
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

export function summarizeProgress(snapshot: ProgressSnapshot): ProgressSummary {
  const totalAttempts = snapshot.attempts.length;
  const correctAttempts = snapshot.attempts.filter((attempt) => attempt.correct).length;
  const masteredKnowledge = Object.values(snapshot.knowledge).filter((counter) => {
    if (counter.attempts < 2 || counter.totalWeight <= 0) return false;
    return counter.correctWeight / counter.totalWeight >= 0.75;
  }).length;

  return {
    totalAttempts,
    correctAttempts,
    accuracy: totalAttempts ? correctAttempts / totalAttempts : null,
    practicedKnowledge: Object.keys(snapshot.knowledge).length,
    masteredKnowledge
  };
}
