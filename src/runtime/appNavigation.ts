export type AppBackHandler = () => void;

interface AppBackLayer { id: string; onBack: AppBackHandler; }
const layers: AppBackLayer[] = [];
let listenersInstalled = false;
export const NATIVE_APP_BACK_EVENT = 'kidsplay:system-back';

function canUseHistory(): boolean { return typeof window !== 'undefined' && Boolean(window.history); }
function removeLayer(id: string): void {
  for (let index = layers.length - 1; index >= 0; index -= 1) {
    if (layers[index].id !== id) continue;
    layers.splice(index, 1);
    return;
  }
}
function consumeTopLayer(): boolean {
  const layer = layers.pop();
  if (!layer) return false;
  layer.onBack();
  return true;
}

/** One shared browser/native Back bridge, installed once by the app shell. */
export function installAppBackNavigation(): () => void {
  if (!canUseHistory() || listenersInstalled) return () => {};
  listenersInstalled = true;
  const handlePopState = (): void => { consumeTopLayer(); };
  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || layers.length === 0) return;
    event.preventDefault();
    window.history.back();
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
  removeLayer(id);
  layers.push({ id, onBack });
  window.history.pushState({ ...(window.history.state ?? {}), kidsplayLayer: id }, '');
  return () => removeLayer(id);
}

/** Full-screen learning surfaces are children of whatever launched them. */
export function enterAppSessionLayer(id: string, onBack: AppBackHandler): () => void {
  return pushAppBackLayer(id, onBack);
}

/** Visible Back controls do not own a separate navigation path. */
export function requestAppBack(fallback?: AppBackHandler): boolean {
  if (canUseHistory() && layers.length > 0) { window.history.back(); return true; }
  fallback?.();
  return false;
}
export function hasAppBackLayer(): boolean { return layers.length > 0; }
