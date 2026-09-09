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

interface BrowserState {
  kp?: AppHistoryState;
}

const layers: AppBackLayer[] = [];
let listenersInstalled = false;
let layerSequence = 0;
const navigationSession = Math.random();
let currentHistory: AppHistoryState = { s: navigationSession, i: 0, p: [] };

export const NATIVE_APP_BACK_EVENT = 'kidsplay:system-back';

function canUseHistory(): boolean {
  return typeof window !== 'undefined';
}

function readHistoryState(state: unknown): AppHistoryState | null {
  const nav = (state as BrowserState | null)?.kp;
  return nav?.s === navigationSession ? nav : null;
}

function historyState(index: number): AppHistoryState {
  return { s: navigationSession, i: index, p: layers.map((layer) => layer.key) };
}

function replaceHistoryState(): void {
  currentHistory = historyState(readHistoryState(window.history.state)?.i ?? 0);
  window.history.replaceState({ kp: currentHistory }, '');
}

function pushHistoryState(): void {
  currentHistory = historyState(currentHistory.i + 1);
  window.history.pushState({ kp: currentHistory }, '');
}

function consumeTopLayer(): void {
  layers.pop()?.onBack();
}

function handlePopState(event: PopStateEvent): void {
  const previous = currentHistory;
  const next = readHistoryState(event.state);
  currentHistory = next ?? { s: navigationSession, i: 0, p: [] };

  // Forward can revisit an already-closed entry; the live UI remains authoritative.
  if (next && next.i >= previous.i) return;

  let consumed = false;
  for (let pathIndex = previous.p.length - 1; pathIndex >= 0; pathIndex -= 1) {
    const key = previous.p[pathIndex];
    if (currentHistory.p.includes(key)) continue;
    const layerIndex = layers.findIndex((layer) => layer.key === key);
    if (layerIndex < 0) continue;
    layers.splice(layerIndex, 1)[0].onBack();
    consumed = true;
  }

  if (consumed || !layers.length) return;

  // Skip stale released/replaced entries so one Back gesture removes one live node.
  if (next && next.i > 0) window.history.back();
  else consumeTopLayer();
}

/** One shared browser/native Back bridge, installed once by the app shell. */
export function installAppBackNavigation(): () => void {
  if (!canUseHistory() || listenersInstalled) return () => {};
  listenersInstalled = true;
  replaceHistoryState();

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || event.defaultPrevented || !layers.length) return;
    event.preventDefault();
    requestAppBack();
  };
  const handleNativeBack = (event: Event): void => {
    if (!layers.length) return;
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

  const duplicate = layers.findIndex((layer) => layer.id === id);
  if (duplicate >= 0) layers.splice(duplicate, 1);

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
  if (canUseHistory() && layers.length) {
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
