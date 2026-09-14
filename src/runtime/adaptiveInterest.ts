import type { AdaptiveInterestSignal } from './adaptiveRouting';

const STORAGE_KEY = 'kidsplay.adaptive-interest.v1';
const MAX_SIGNALS = 24;
const VALID_KINDS = new Set<AdaptiveInterestSignal['kind']>(['voluntary_replay', 'favourite', 'topic_choice']);

interface StoredInterestSnapshot {
  version: 1;
  signals: AdaptiveInterestSignal[];
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.length > 0);
}

function isSignal(value: unknown): value is AdaptiveInterestSignal {
  if (!value || typeof value !== 'object') return false;
  const signal = value as Partial<AdaptiveInterestSignal>;
  return Boolean(
    signal.kind
      && VALID_KINDS.has(signal.kind)
      && typeof signal.observedAt === 'string'
      && Number.isFinite(Date.parse(signal.observedAt))
      && (signal.conceptIds === undefined || isStringArray(signal.conceptIds))
      && (signal.topicIds === undefined || isStringArray(signal.topicIds))
  );
}

export function loadAdaptiveInterestSignals(): AdaptiveInterestSignal[] {
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

function saveSignals(signals: AdaptiveInterestSignal[]): AdaptiveInterestSignal[] {
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
): AdaptiveInterestSignal[] {
  const conceptIds = [...new Set(rootConceptRefs.filter(Boolean))];
  const topicIds = [...new Set(conceptIds.map((conceptId) => conceptId.split('.')[0]).filter(Boolean))];
  if (!conceptIds.length && !topicIds.length) return loadAdaptiveInterestSignals();

  const signal: AdaptiveInterestSignal = {
    kind: 'topic_choice',
    observedAt: observedAt instanceof Date ? observedAt.toISOString() : new Date(observedAt).toISOString(),
    conceptIds,
    topicIds
  };
  return saveSignals([...loadAdaptiveInterestSignals(), signal]);
}
