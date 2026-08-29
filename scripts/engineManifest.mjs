import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('../content/engines/manifest.json', import.meta.url), 'utf8'));
const engineByKey = new Map((manifest.engines ?? []).map((engine) => [engine.key, engine]));

export function getEngineDefinition(engineKey) {
  return engineByKey.get(engineKey) ?? null;
}

export function getEngineKeysByCategory(category) {
  return (manifest.engines ?? []).filter((engine) => engine.category === category).map((engine) => engine.key);
}

export function getEngineManifest() {
  return manifest;
}
