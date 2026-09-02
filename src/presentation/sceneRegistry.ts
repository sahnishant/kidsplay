import type { SceneDefinition } from './sceneTypes';

const sceneModules = import.meta.glob('../../content/scenes/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, unknown>;

// Keep registry order deterministic across bundlers while preserving authored
// scene order inside each content file.
const scenes = Object.freeze(
  Object.entries(sceneModules)
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
    .flatMap(([, value]) => (Array.isArray(value) ? (value as SceneDefinition[]) : []))
);
const byId = new Map(scenes.map((scene) => [scene.id, scene]));

export function getSceneDefinitions(): readonly SceneDefinition[] {
  return scenes;
}

export function resolveSceneDefinition(sceneId: string): SceneDefinition | null {
  return byId.get(sceneId) ?? null;
}
