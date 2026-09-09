export type AppBackHandler = () => void;

interface AppBackLayer {
  id: string;
  key: number;
  onBack: AppBackHandler;
}

interface AppHistoryState {
  s: number;
  i: number;
  p: number[];
}

const layers: AppBackLayer[] = [];
let listenersInstalled = false;
let layerSequence = 0;
const navigationSession = Math.random();
const HISTORY_KEY = 'kidsplayNav';
let currentHistory: AppHistoryState = { s: navigationSession, i: 0, p: [] };

export const NATIVE_APP_BACK_EVENT = 'kidsplay:system-back';

function canUseHistory(): boolean {
  return typeof window !== 'undefined' && Boolean(window.history);
}

function readHistoryState(state: unknown): AppHistoryState | null {
  const nav = state && typeof state === 'object'
    ? (state as Record<string, unknown>)[HISTORY_KEY] as AppHistoryState | undefined
    : undefined;
  return nav?.s === navigationSession && typeof nav.i === 'number' && Array.isArray(nav.p) ? nav : null;
}

function historyState(index: number): AppHistoryState {
  return { s: navigationSession, i: index, p: layers.map((layer) => layer.key) };
}

function replaceHistoryState(): void {
  if (!canUseHistory()) return;
  currentHistory = historyState(readHistoryState(window.history.state)?.i ?? 0);
  window.history.replaceState({ ...(window.history.state ?? {}), [HISTORY_KEY]: currentHistory }, '');
}

function pushHistoryState(): void {
  currentHistory = historyState(currentHistory.i + 1);
  window.history.pushState({ ...(window.history.state ?? {}), [HISTORY_KEY]: currentHistory }, '');
}

function consumeTopLayer(): boolean {
  const layer = layers.pop();
  if (!layer) return false;
  layer.onBack();
  return true;
}

function handlePopState(event: PopStateEvent): void {
  const previous = currentHistory;
  const next = readHistoryState(event.state);
  currentHistory = next ?? { s: navigationSession, i: 0, p: [] };

  // Forward navigation may revisit an already-closed app entry. Keep the live
  // UI authoritative instead of popping its current parent.
  if (next && next.i >= previous.i) return;

  let consumed = false;
  for (let pathIndex = previous.p.length - 1; pathIndex >= 0; pathIndex -= 1) {
    const key = previous.p[pathIndex];
    if (currentHistory.p.includes(key)) continue;
    const layerIndex = layers.findIndex((layer) => layer.key === key);
    if (layerIndex < 0) continue;
    const [layer] = layers.splice(layerIndex, 1);
    layer.onBack();
    consumed = true;
  }

  if (consumed || layers.length === 0) return;

  // Released/replaced nodes can leave stale browser entries. Skip them so a
  // single Back gesture still removes exactly one live app node.
  if (next && next.i > 0) window.history.back();
  else consumeTopLayer();
}

/** One shared browser/native Back bridge, installed once by the app shell. */
export function installAppBackNavigation(): () => void {
  if (!canUseHistory() || listenersInstalled) return () => {};
  listenersInstalled = true;
  replaceHistoryState();

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || event.defaultPrevented || layers.length === 0) return;
    event.preventDefault();
    requestAppBack();
  };
  const handleNativeBack = (event: Event): void => {
    if (layers.length === 0) return;
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
    currentHistory = { s: navigationSession, i: 0, p: [] };
  };
}

/** Add one child node without destroying its parent. */
export function pushAppBackLayer(id: string, onBack: AppBackHandler): () => void {
  if (!canUseHistory()) return () => {};
  if (!readHistoryState(window.history.state)) replaceHistoryState();

  for (let index = layers.length - 1; index >= 0; index -= 1) {
    if (layers[index].id !== id) continue;
    layers.splice(index, 1);
    break;
  }

  const key = ++layerSequence;
  layers.push({ id, key, onBack });
  pushHistoryState();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    const index = layers.findIndex((layer) => layer.key === key);
    if (index >= 0) layers.splice(index, 1);
  };
}

/** Full-screen learning surfaces are children of whatever launched them. */
export function enterAppSessionLayer(id: string, onBack: AppBackHandler): () => void {
  return pushAppBackLayer(id, onBack);
}

/** Visible Back controls do not own a separate navigation path. */
export function requestAppBack(fallback?: AppBackHandler): boolean {
  if (canUseHistory() && layers.length > 0) {
    const current = readHistoryState(window.history.state);
    const top = layers.at(-1);
    if (current && top && current.p.includes(top.key) && current.i > 0) window.history.back();
    else consumeTopLayer();
    return true;
  }
  fallback?.();
  return false;
}

export function hasAppBackLayer(): boolean {
  return layers.length > 0;
}
