import type { SceneDefinition } from './sceneTypes';

const sceneModules = import.meta.glob('../../content/scenes/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, unknown>;

const scenes = Object.freeze(
  Object.values(sceneModules)
    .flatMap((value) => (Array.isArray(value) ? (value as SceneDefinition[]) : []))
);
const byId = new Map(scenes.map((scene) => [scene.id, scene]));

export function getSceneDefinitions(): readonly SceneDefinition[] {
  return scenes;
}

export function resolveSceneDefinition(sceneId: string): SceneDefinition | null {
  return byId.get(sceneId) ?? null;
}
