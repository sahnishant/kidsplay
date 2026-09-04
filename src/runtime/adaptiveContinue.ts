type AdaptiveContinueHandler = () => boolean;

let activeHandler: AdaptiveContinueHandler | null = null;

/**
 * Registers the app-level adaptive launcher without coupling the story-world
 * presentation component to progress/content stores. The returned cleanup is
 * safe for Svelte component teardown and HMR.
 */
export function registerAdaptiveContinueHandler(handler: AdaptiveContinueHandler): () => void {
  activeHandler = handler;
  return () => {
    if (activeHandler === handler) activeHandler = null;
  };
}

/**
 * Returns true only when adaptive practice consumed Continue Adventure.
 * False deliberately falls through to the existing world/story continuation.
 */
export function tryAdaptiveContinue(): boolean {
  return activeHandler?.() ?? false;
}
