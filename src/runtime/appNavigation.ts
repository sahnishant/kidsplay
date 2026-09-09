export type AppBackHandler = () => void;

interface AppBackLayer {
  id: string;
  key: string;
  onBack: AppBackHandler;
}

interface AppHistorySnapshot {
  index: number;
  path: string[];
}

const layers: AppBackLayer[] = [];
let listenersInstalled = false;
let layerSequence = 0;
let currentHistoryIndex = 0;
let currentHistoryPath: string[] = [];

export const NATIVE_APP_BACK_EVENT = 'kidsplay:system-back';

const HISTORY_SESSION_KEY = 'kidsplayNavigationSession';
const HISTORY_INDEX_KEY = 'kidsplayNavigationIndex';
const HISTORY_PATH_KEY = 'kidsplayNavigationPath';
const navigationSessionId = `kidsplay-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

function canUseHistory(): boolean {
  return typeof window !== 'undefined' && Boolean(window.history);
}

function asHistoryRecord(state: unknown): Record<string, unknown> | null {
  return state !== null && typeof state === 'object' ? state as Record<string, unknown> : null;
}

function readHistorySnapshot(state: unknown): AppHistorySnapshot | null {
  const record = asHistoryRecord(state);
  if (!record || record[HISTORY_SESSION_KEY] !== navigationSessionId) return null;

  const index = record[HISTORY_INDEX_KEY];
  const path = record[HISTORY_PATH_KEY];
  if (typeof index !== 'number' || !Number.isInteger(index) || index < 0) return null;
  if (!Array.isArray(path) || path.some((key) => typeof key !== 'string')) return null;

  return { index, path: [...path] as string[] };
}

function activePath(): string[] {
  return layers.map((layer) => layer.key);
}

function writeHistoryState(
  method: 'push' | 'replace',
  index: number,
  path: string[],
  layerId: string | null
): void {
  if (!canUseHistory()) return;
  const state = {
    ...(window.history.state ?? {}),
    [HISTORY_SESSION_KEY]: navigationSessionId,
    [HISTORY_INDEX_KEY]: index,
    [HISTORY_PATH_KEY]: path,
    kidsplayLayer: layerId
  };
  if (method === 'push') window.history.pushState(state, '');
  else window.history.replaceState(state, '');
  currentHistoryIndex = index;
  currentHistoryPath = [...path];
}

function syncCurrentHistoryEntry(): void {
  if (!canUseHistory()) return;
  const existing = readHistorySnapshot(window.history.state);
  const index = existing?.index ?? 0;
  const path = activePath();
  writeHistoryState('replace', index, path, layers.at(-1)?.id ?? null);
}

function ensureTrackedHistoryEntry(): void {
  if (!canUseHistory()) return;
  const snapshot = readHistorySnapshot(window.history.state);
  if (snapshot) {
    currentHistoryIndex = snapshot.index;
    currentHistoryPath = snapshot.path;
    return;
  }
  syncCurrentHistoryEntry();
}

function removeLayerById(id: string): void {
  for (let index = layers.length - 1; index >= 0; index -= 1) {
    if (layers[index].id !== id) continue;
    layers.splice(index, 1);
    return;
  }
}

function removeLayerByKey(key: string): void {
  const index = layers.findIndex((layer) => layer.key === key);
  if (index >= 0) layers.splice(index, 1);
}

function consumeTopLayer(): boolean {
  const layer = layers.pop();
  if (!layer) return false;
  layer.onBack();
  return true;
}

function consumeRemovedLayers(previousPath: string[], nextPath: string[]): number {
  const nextKeys = new Set(nextPath);
  let consumed = 0;

  for (let index = previousPath.length - 1; index >= 0; index -= 1) {
    const key = previousPath[index];
    if (nextKeys.has(key)) continue;
    const layerIndex = layers.findIndex((layer) => layer.key === key);
    if (layerIndex < 0) continue;
    const [layer] = layers.splice(layerIndex, 1);
    layer.onBack();
    consumed += 1;
  }

  return consumed;
}

function handlePopState(event: PopStateEvent): void {
  const previousIndex = currentHistoryIndex;
  const previousPath = currentHistoryPath;
  const nextSnapshot = readHistorySnapshot(event.state);
  const nextIndex = nextSnapshot?.index ?? 0;
  const nextPath = nextSnapshot?.path ?? [];
  const movingBackward = nextSnapshot === null || nextIndex < previousIndex;

  currentHistoryIndex = nextIndex;
  currentHistoryPath = nextPath;

  // Forward navigation must never close a currently visible app node. We do
  // not reconstruct already-closed app surfaces when the browser moves
  // forward; the current UI remains authoritative.
  if (!movingBackward) return;

  const consumed = consumeRemovedLayers(previousPath, nextPath);
  if (consumed > 0 || layers.length === 0) return;

  // A programmatically released/replaced layer can leave an older browser
  // history entry behind. Skip such stale entries automatically so one
  // Back/Escape/system-Back gesture still removes exactly one *live* node.
  if (nextSnapshot && nextIndex > 0) {
    window.history.back();
    return;
  }

  // Defensive recovery: if a live layer somehow is no longer represented in
  // browser history, close it in-memory rather than navigating away from the
  // app while a child surface is still visible.
  consumeTopLayer();
}

/** One shared browser/native Back bridge, installed once by the app shell. */
export function installAppBackNavigation(): () => void {
  if (!canUseHistory() || listenersInstalled) return () => {};
  listenersInstalled = true;
  syncCurrentHistoryEntry();

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || event.defaultPrevented || layers.length === 0) return;
    event.preventDefault();
    requestAppBack();
  };
  const handleNativeBack = (event: Event): void => {
    if (layers.length === 0) return;
    // Native dispatchEvent returns false only for a cancelled event. At Home
    // leave it uncancelled so Android retains its normal root Back behaviour.
    event.preventDefault();
    requestAppBack();
  };

  window.addEventListener('popstate', handlePopState);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener(NATIVE_APP_BACK_EVENT, handleNativeBack);
  return () => {
    window.removeEventListener('popstate', handlePopState);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener(NATIVE_APP_BACK_EVENT, handleNativeBack);
    listenersInstalled = false;
    layers.length = 0;
    currentHistoryIndex = 0;
    currentHistoryPath = [];
  };
}

/**
 * Add one child node to the current app navigation path.
 *
 * A layer never destroys its parent. If the visible path is
 * Home -> Play -> Topic -> Activity, Back/Escape/system Back always removes
 * exactly Activity first, then Topic, then Play. Callers decide when a true
 * sibling/root switch should release an older layer explicitly.
 */
export function pushAppBackLayer(id: string, onBack: AppBackHandler): () => void {
  if (!canUseHistory()) return () => {};
  ensureTrackedHistoryEntry();

  // Preserve the public id as a semantic label, but make each concrete layer
  // unique. An old disposer must never be able to remove a newer layer that
  // happens to reuse the same semantic id.
  removeLayerById(id);
  const key = `${navigationSessionId}:${++layerSequence}:${id}`;
  layers.push({ id, key, onBack });

  const nextIndex = currentHistoryIndex + 1;
  writeHistoryState('push', nextIndex, activePath(), id);

  let released = false;
  return () => {
    if (released) return;
    released = true;
    removeLayerByKey(key);
  };
}

/** Full-screen learning surfaces are children of whatever launched them. */
export function enterAppSessionLayer(id: string, onBack: AppBackHandler): () => void {
  return pushAppBackLayer(id, onBack);
}

/** Visible Back controls do not own a separate navigation path. */
export function requestAppBack(fallback?: AppBackHandler): boolean {
  if (canUseHistory() && layers.length > 0) {
    ensureTrackedHistoryEntry();
    const top = layers.at(-1);
    const snapshot = readHistorySnapshot(window.history.state);

    if (top && snapshot?.path.includes(top.key) && snapshot.index > 0) {
      window.history.back();
    } else {
      // The browser entry is stale or foreign. Keep the visible app tree
      // correct instead of allowing Back to leave the app unexpectedly.
      consumeTopLayer();
    }
    return true;
  }

  fallback?.();
  return false;
}

export function hasAppBackLayer(): boolean {
  return layers.length > 0;
}
