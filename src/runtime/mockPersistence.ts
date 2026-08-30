import type { QuestionResponseEnvelope } from '../contracts/runtime';
import type { SectionScoreSummary, SessionCheckpointState } from './session';

export interface StoredMockCheckpoint {
  version: 1;
  entryId: string;
  title: string;
  questionIds: string[];
  state: SessionCheckpointState;
  savedAt: string;
}

export interface MockHistoryRecord {
  version: 1;
  sessionId: string;
  entryId: string;
  title: string;
  completedAt: string;
  questionCount: number;
  correct: number;
  earnedMarks: number;
  maxMarks: number;
  sections: SectionScoreSummary[];
}

export interface MockTrendSummary {
  entryId: string;
  title: string;
  attempts: number;
  latestPercent: number;
  bestPercent: number;
  previousPercent: number | null;
  deltaPoints: number | null;
  latestCompletedAt: string;
  latestEarnedMarks: number;
  latestMaxMarks: number;
  latestSections: SectionScoreSummary[];
}

const ACTIVE_MOCK_KEY = 'kidsplay.activeMock.v1';
const MOCK_HISTORY_KEY = 'kidsplay.mockHistory.v1';
const MAX_QUESTION_IDS = 100;
const MAX_HISTORY = 20;

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
    // Restricted/private browser contexts can make storage unavailable.
  }
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && Number.isFinite(Date.parse(value));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isQuestionResponse(value: unknown): value is QuestionResponseEnvelope {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<QuestionResponseEnvelope> & { response?: unknown };
  return isNonEmptyString(item.sessionId)
    && isNonEmptyString(item.questionId)
    && Number.isInteger(item.questionRevision)
    && Number(item.questionRevision) > 0
    && isNonEmptyString(item.interactionType)
    && Number.isInteger(item.interactionVersion)
    && Number(item.interactionVersion) > 0
    && Object.prototype.hasOwnProperty.call(item, 'response')
    && isTimestamp(item.startedAt)
    && isTimestamp(item.submittedAt)
    && Number.isFinite(item.durationMs)
    && Number(item.durationMs) >= 0
    && Number.isInteger(item.attempts)
    && Number(item.attempts) >= 1
    && Array.isArray(item.hintsUsed)
    && item.hintsUsed.every((hint) => typeof hint === 'string');
}

function isCheckpointState(value: unknown, questionCount: number): value is SessionCheckpointState {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<SessionCheckpointState>;
  if (!isNonEmptyString(item.sessionId)
    || !Number.isInteger(item.index)
    || Number(item.index) < 0
    || Number(item.index) > questionCount
    || typeof item.submitted !== 'boolean'
    || !Array.isArray(item.responses)
    || !item.responses.every(isQuestionResponse)) {
    return false;
  }

  const expectedResponses = Number(item.index) + (item.submitted ? 1 : 0);
  return item.responses.length === expectedResponses
    && item.responses.every((response) => response.sessionId === item.sessionId);
}

function isStoredMockCheckpoint(value: unknown): value is StoredMockCheckpoint {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<StoredMockCheckpoint>;
  if (item.version !== 1
    || !isNonEmptyString(item.entryId)
    || !isNonEmptyString(item.title)
    || !isTimestamp(item.savedAt)
    || !Array.isArray(item.questionIds)
    || item.questionIds.length < 1
    || item.questionIds.length > MAX_QUESTION_IDS
    || !item.questionIds.every(isNonEmptyString)
    || new Set(item.questionIds).size !== item.questionIds.length) {
    return false;
  }
  return isCheckpointState(item.state, item.questionIds.length);
}

function isSectionSummary(value: unknown): value is SectionScoreSummary {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<SectionScoreSummary>;
  return isNonEmptyString(item.id)
    && isNonEmptyString(item.title)
    && Number.isInteger(item.correct)
    && Number(item.correct) >= 0
    && Number.isInteger(item.answered)
    && Number(item.answered) >= 0
    && Number.isInteger(item.total)
    && Number(item.total) >= 0
    && Number(item.correct) <= Number(item.answered)
    && Number(item.answered) <= Number(item.total)
    && (item.accuracy === null || (Number.isFinite(item.accuracy) && Number(item.accuracy) >= 0 && Number(item.accuracy) <= 1))
    && Number.isFinite(item.earnedMarks)
    && Number(item.earnedMarks) >= 0
    && Number.isFinite(item.maxMarks)
    && Number(item.maxMarks) >= 0
    && Number(item.earnedMarks) <= Number(item.maxMarks);
}

function isMockHistoryRecord(value: unknown): value is MockHistoryRecord {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<MockHistoryRecord>;
  return item.version === 1
    && isNonEmptyString(item.sessionId)
    && isNonEmptyString(item.entryId)
    && isNonEmptyString(item.title)
    && isTimestamp(item.completedAt)
    && Number.isInteger(item.questionCount)
    && Number(item.questionCount) > 0
    && Number(item.questionCount) <= MAX_QUESTION_IDS
    && Number.isInteger(item.correct)
    && Number(item.correct) >= 0
    && Number(item.correct) <= Number(item.questionCount)
    && Number.isFinite(item.earnedMarks)
    && Number(item.earnedMarks) >= 0
    && Number.isFinite(item.maxMarks)
    && Number(item.maxMarks) > 0
    && Number(item.earnedMarks) <= Number(item.maxMarks)
    && Array.isArray(item.sections)
    && item.sections.every(isSectionSummary);
}

function cloneCheckpoint(checkpoint: StoredMockCheckpoint): StoredMockCheckpoint {
  return {
    ...checkpoint,
    questionIds: [...checkpoint.questionIds],
    state: {
      ...checkpoint.state,
      responses: checkpoint.state.responses.map((response) => ({
        ...response,
        hintsUsed: [...response.hintsUsed]
      }))
    }
  };
}

function cloneHistoryRecord(record: MockHistoryRecord): MockHistoryRecord {
  return {
    ...record,
    sections: record.sections.map((section) => ({ ...section }))
  };
}

export function saveMockCheckpoint(input: Omit<StoredMockCheckpoint, 'version' | 'savedAt'>): StoredMockCheckpoint {
  const checkpoint: StoredMockCheckpoint = {
    version: 1,
    entryId: input.entryId,
    title: input.title,
    questionIds: [...input.questionIds],
    state: {
      ...input.state,
      responses: input.state.responses.map((response) => ({
        ...response,
        hintsUsed: [...response.hintsUsed]
      }))
    },
    savedAt: new Date().toISOString()
  };
  if (!isStoredMockCheckpoint(checkpoint)) throw new Error('Refusing to persist an invalid mock checkpoint');
  writeJson(ACTIVE_MOCK_KEY, checkpoint);
  return cloneCheckpoint(checkpoint);
}

export function loadMockCheckpoint(): StoredMockCheckpoint | null {
  const value = readJson(ACTIVE_MOCK_KEY);
  return isStoredMockCheckpoint(value) ? cloneCheckpoint(value) : null;
}

export function clearMockCheckpoint(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(ACTIVE_MOCK_KEY);
  } catch {
    // Storage can be unavailable; there is nothing else to clear locally.
  }
}

export function recordMockCompletion(input: Omit<MockHistoryRecord, 'version' | 'completedAt'>): MockHistoryRecord[] {
  const record: MockHistoryRecord = {
    version: 1,
    ...input,
    sections: input.sections.map((section) => ({ ...section })),
    completedAt: new Date().toISOString()
  };
  if (!isMockHistoryRecord(record)) throw new Error('Refusing to persist an invalid mock result');

  const history = loadMockHistory();
  history.push(record);
  const bounded = history
    .sort((left, right) => Date.parse(left.completedAt) - Date.parse(right.completedAt))
    .slice(-MAX_HISTORY);
  writeJson(MOCK_HISTORY_KEY, bounded);
  return bounded.map(cloneHistoryRecord);
}

export function loadMockHistory(): MockHistoryRecord[] {
  const value = readJson(MOCK_HISTORY_KEY);
  if (!Array.isArray(value)) return [];
  return value
    .filter(isMockHistoryRecord)
    .sort((left, right) => Date.parse(left.completedAt) - Date.parse(right.completedAt))
    .slice(-MAX_HISTORY)
    .map(cloneHistoryRecord);
}

export function summarizeMockHistory(history: MockHistoryRecord[]): MockTrendSummary[] {
  const grouped = new Map<string, MockHistoryRecord[]>();
  for (const record of history) {
    grouped.set(record.entryId, [...(grouped.get(record.entryId) ?? []), record]);
  }

  return [...grouped.entries()]
    .map(([entryId, records]) => {
      const ordered = [...records].sort((left, right) => Date.parse(left.completedAt) - Date.parse(right.completedAt));
      const latest = ordered.at(-1)!;
      const previous = ordered.length > 1 ? ordered.at(-2)! : null;
      const percent = (record: MockHistoryRecord): number => record.maxMarks > 0 ? record.earnedMarks / record.maxMarks : 0;
      const latestPercent = percent(latest);
      const previousPercent = previous ? percent(previous) : null;
      const bestPercent = Math.max(...ordered.map(percent));

      return {
        entryId,
        title: latest.title,
        attempts: ordered.length,
        latestPercent,
        bestPercent,
        previousPercent,
        deltaPoints: previousPercent === null ? null : Math.round((latestPercent - previousPercent) * 100),
        latestCompletedAt: latest.completedAt,
        latestEarnedMarks: latest.earnedMarks,
        latestMaxMarks: latest.maxMarks,
        latestSections: latest.sections.map((section) => ({ ...section }))
      };
    })
    .sort((left, right) => Date.parse(right.latestCompletedAt) - Date.parse(left.latestCompletedAt));
}
