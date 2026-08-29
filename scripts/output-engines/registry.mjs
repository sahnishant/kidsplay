import { printCardsOutputEngine } from './printCards.mjs';

const outputEngines = new Map([
  ['print_cards@1', printCardsOutputEngine]
]);

for (const [key, engine] of outputEngines) if (engine.key !== key) throw new Error(`Output engine key mismatch: registry ${key}, implementation ${engine.key}`);

export function getOutputEngine(key) {
  const engine = outputEngines.get(key);
  if (!engine) throw new Error(`Unsupported output engine ${key}`);
  return engine;
}

export function getOutputEngineKeys() {
  return [...outputEngines.keys()];
}
