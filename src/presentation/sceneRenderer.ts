import sceneJson from '../../content/scenes/animals.json';

type Motion = 'bounce' | 'float' | 'pulse' | 'wiggle';

interface SceneEntity {
  id: string;
  kind: 'emoji' | 'text';
  value: string;
  label: string;
  x: number;
  y: number;
  motion?: Motion;
}

interface SceneDefinition {
  id: string;
  theme: 'grass' | 'ocean';
  ariaLabel: string;
  entities: SceneEntity[];
}

const scenes = sceneJson as unknown as SceneDefinition[];
const byId = new Map(scenes.map((scene) => [scene.id, scene]));

export function renderScene(sceneId: string): HTMLElement {
  const scene = byId.get(sceneId);
  if (!scene) throw new Error(`Unknown scene: ${sceneId}`);

  const host = document.createElement('div');
  host.className = `scene scene--${scene.theme}`;
  host.setAttribute('role', 'img');
  host.setAttribute('aria-label', scene.ariaLabel);

  for (const entity of scene.entities) {
    const element = document.createElement('span');
    element.className = `scene__entity scene__entity--${entity.kind}`;
    if (entity.motion) element.classList.add(`motion--${entity.motion}`);
    element.textContent = entity.value;
    element.style.left = `${entity.x}%`;
    element.style.top = `${entity.y}%`;
    element.setAttribute('aria-hidden', 'true');
    host.append(element);
  }

  return host;
}
