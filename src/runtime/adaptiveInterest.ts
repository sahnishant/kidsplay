import type { AdaptiveInterestSignal } from './adaptiveRouting';

const STORAGE_KEY = 'kidsplay.adaptive-interest.v1';
const MAX_SIGNALS = 24;
const VALID_KINDS = new Set<AdaptiveInterestSignal['kind']>(['voluntary_replay', 'favourite', 'topic_choice']);
const STABLE_ACTIVITY_REF = /^[a-z0-9]+(?:[._:#-][a-z0-9]+)*$/i;

export interface AdaptiveActivityInterestSignal extends AdaptiveInterestSignal {
  /** Optional canonical activity identity for explicit replay/favourite choices. */
  activityRef?: string;
}

interface StoredInterestSnapshot {
  version: 1;
  signals: AdaptiveActivityInterestSignal[];
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.length > 0);
}

function isSignal(value: unknown): value is AdaptiveActivityInterestSignal {
  if (!value || typeof value !== 'object') return false;
  const signal = value as Partial<AdaptiveActivityInterestSignal>;
  return Boolean(
    signal.kind
      && VALID_KINDS.has(signal.kind)
      && typeof signal.observedAt === 'string'
      && Number.isFinite(Date.parse(signal.observedAt))
      && (signal.conceptIds === undefined || isStringArray(signal.conceptIds))
      && (signal.topicIds === undefined || isStringArray(signal.topicIds))
      && (signal.activityRef === undefined
        || (typeof signal.activityRef === 'string' && STABLE_ACTIVITY_REF.test(signal.activityRef)))
  );
}

export function loadAdaptiveInterestSignals(): AdaptiveActivityInterestSignal[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<StoredInterestSnapshot>;
    if (parsed.version !== 1 || !Array.isArray(parsed.signals)) return [];
    return parsed.signals.filter(isSignal).slice(-MAX_SIGNALS);
  } catch {
    return [];
  }
}

function saveSignals(signals: AdaptiveActivityInterestSignal[]): AdaptiveActivityInterestSignal[] {
  const bounded = signals.slice(-MAX_SIGNALS);
  if (typeof window !== 'undefined') {
    const snapshot: StoredInterestSnapshot = { version: 1, signals: bounded };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }
  return bounded;
}

/**
 * Topic choice is an explicit preference input only. It never writes to
 * kidsplay.progress.v1 and therefore cannot refresh review/mastery clocks.
 */
export function recordAdaptiveTopicInterest(
  rootConceptRefs: readonly string[],
  observedAt: string | Date = new Date()
): AdaptiveActivityInterestSignal[] {
  const conceptIds = [...new Set(rootConceptRefs.filter(Boolean))];
  const topicIds = [...new Set(conceptIds.map((conceptId) => conceptId.split('.')[0]).filter(Boolean))];
  if (!conceptIds.length && !topicIds.length) return loadAdaptiveInterestSignals();

  const signal: AdaptiveActivityInterestSignal = {
    kind: 'topic_choice',
    observedAt: observedAt instanceof Date ? observedAt.toISOString() : new Date(observedAt).toISOString(),
    conceptIds,
    topicIds
  };
  return saveSignals([...loadAdaptiveInterestSignals(), signal]);
}

/**
 * Records only the child's explicit "Play again" choice against an existing
 * canonical activity. It shares the bounded preference store above and never
 * writes correctness, mastery, curriculum placement or a replay reward ledger.
 */
export function recordAdaptiveActivityReplay(
  activityRef: string,
  observedAt: string | Date = new Date()
): AdaptiveActivityInterestSignal[] {
  if (typeof activityRef !== 'string' || !STABLE_ACTIVITY_REF.test(activityRef)) {
    throw new Error('activityRef must be a stable ref');
  }
  const date = observedAt instanceof Date ? observedAt : new Date(observedAt);
  if (!Number.isFinite(date.getTime())) throw new Error('observedAt must be a valid timestamp');

  const signal: AdaptiveActivityInterestSignal = {
    kind: 'voluntary_replay',
    observedAt: date.toISOString(),
    activityRef
  };
  return saveSignals([...loadAdaptiveInterestSignals(), signal]);
}
