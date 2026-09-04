import {
  validateStoryReadingState,
  type StoryManifest,
  type StoryReadingState
} from './storiesContract';

export interface StoryReadingStore {
  version: 1;
  currentStoryId: string | null;
  states: Record<string, StoryReadingState>;
}

export const STORY_READING_STORAGE_KEY = 'kidsplay.stories.reading.v1';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function emptyStore(): StoryReadingStore {
  return { version: 1, currentStoryId: null, states: {} };
}

function readRawStore(): unknown {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORY_READING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStore(store: StoryReadingStore): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORY_READING_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Story resume must fail soft in restricted/private storage contexts.
  }
}

export function createInitialStoryReadingState(manifest: StoryManifest): StoryReadingState {
  const firstBeat = manifest.beats[0];
  if (!firstBeat) throw new Error(`${manifest.storyId}: cannot create reading state without a first beat`);
  return {
    schemaVersion: 1,
    storyId: manifest.storyId,
    currentBeatId: firstBeat.beatId,
    completed: false,
    favourite: false
  };
}

export function loadStoryReadingStore(catalog: readonly StoryManifest[]): StoryReadingStore {
  const raw = readRawStore();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return emptyStore();
  const candidate = raw as { version?: unknown; currentStoryId?: unknown; states?: unknown };
  if (candidate.version !== 1 || !candidate.states || typeof candidate.states !== 'object' || Array.isArray(candidate.states)) {
    return emptyStore();
  }

  const manifests = new Map(catalog.map((manifest) => [manifest.storyId, manifest]));
  const states: Record<string, StoryReadingState> = {};
  for (const [storyId, state] of Object.entries(candidate.states as Record<string, unknown>)) {
    const manifest = manifests.get(storyId);
    if (!manifest) continue;
    try {
      states[storyId] = validateStoryReadingState(state, manifest);
    } catch {
      // Stale/corrupt story positions fail closed instead of resuming to an invalid beat.
    }
  }

  const currentStoryId = typeof candidate.currentStoryId === 'string' && states[candidate.currentStoryId]
    ? candidate.currentStoryId
    : null;
  return { version: 1, currentStoryId, states };
}

export function saveStoryReadingState(
  catalog: readonly StoryManifest[],
  manifest: StoryManifest,
  state: StoryReadingState
): StoryReadingStore {
  if (!catalog.some((candidate) => candidate.storyId === manifest.storyId)) {
    throw new Error(`${manifest.storyId}: cannot persist reading state for a story outside the active catalog`);
  }
  const validated = validateStoryReadingState(state, manifest);
  const store = loadStoryReadingStore(catalog);
  store.states[manifest.storyId] = validated;
  store.currentStoryId = manifest.storyId;
  writeStore(store);
  return store;
}

export function loadStoryResumeState(catalog: readonly StoryManifest[]): StoryReadingState | null {
  const store = loadStoryReadingStore(catalog);
  return store.currentStoryId ? store.states[store.currentStoryId] ?? null : null;
}

export function clearAllStoryReadingState(): StoryReadingStore {
  const storage = getStorage();
  if (!storage) return emptyStore();
  try {
    storage.removeItem(STORY_READING_STORAGE_KEY);
  } catch {
    // Ignore unavailable storage.
  }
  return emptyStore();
}

export function clearStoryReadingState(
  catalog: readonly StoryManifest[],
  storyId: string
): StoryReadingStore {
  const store = loadStoryReadingStore(catalog);
  delete store.states[storyId];
  if (store.currentStoryId === storyId) store.currentStoryId = null;
  writeStore(store);
  return store;
}
