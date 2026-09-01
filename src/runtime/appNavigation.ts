export type AppBackHandler = () => void;

interface AppBackLayer {
  id: string;
  onBack: AppBackHandler;
}

const layers: AppBackLayer[] = [];
let listenersInstalled = false;

function canUseHistory(): boolean {
  return typeof window !== 'undefined' && Boolean(window.history);
}

function removeLayer(id: string): void {
  const index = layers.findLastIndex((layer) => layer.id === id);
  if (index >= 0) layers.splice(index, 1);
}

function consumeTopLayer(): boolean {
  const layer = layers.pop();
  if (!layer) return false;
  layer.onBack();
  return true;
}

/** Install the single Escape/popstate bridge for the application. */
export function installAppBackNavigation(): () => void {
  if (!canUseHistory() || listenersInstalled) return () => {};
  listenersInstalled = true;

  const handlePopState = (): void => {
    consumeTopLayer();
  };
  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || layers.length === 0) return;
    event.preventDefault();
    window.history.back();
  };

  window.addEventListener('popstate', handlePopState);
  window.addEventListener('keydown', handleKeyDown);

  return () => {
    window.removeEventListener('popstate', handlePopState);
    window.removeEventListener('keydown', handleKeyDown);
    listenersInstalled = false;
    layers.length = 0;
  };
}

/**
 * Add one app-owned history depth. Browser Back, Android WebView/system Back and
 * Escape all consume the same top layer through the global bridge.
 */
export function pushAppBackLayer(id: string, onBack: AppBackHandler): () => void {
  if (!canUseHistory()) return () => {};
  removeLayer(id);
  layers.push({ id, onBack });
  window.history.pushState({ ...(window.history.state ?? {}), kidsplayLayer: id }, '');
  return () => removeLayer(id);
}

/**
 * Enter a full-screen child state such as a learning session. If a panel or
 * story overlay already owns the current history entry, replace that entry so
 * Back always returns to the dashboard rather than reopening an intermediate UI.
 */
export function enterAppSessionLayer(id: string, onBack: AppBackHandler): () => void {
  if (!canUseHistory()) return () => {};
  const hadLayer = layers.length > 0;
  layers.length = 0;
  layers.push({ id, onBack });
  const state = { ...(window.history.state ?? {}), kidsplayLayer: id };
  if (hadLayer) window.history.replaceState(state, '');
  else window.history.pushState(state, '');
  return () => removeLayer(id);
}

/** Visible Back controls call this instead of owning a separate navigation path. */
export function requestAppBack(fallback?: AppBackHandler): boolean {
  if (canUseHistory() && layers.length > 0) {
    window.history.back();
    return true;
  }
  fallback?.();
  return false;
}

export function hasAppBackLayer(): boolean {
  return layers.length > 0;
}
