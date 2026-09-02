import { readdirSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const errors = [];
const allowedThemes = new Set(['grass', 'ocean', 'paper']);
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

const animationsById = new Map();
for (const fileName of readdirSync(new URL('content/animations/', root)).filter((name) => name.endsWith('.json')).sort()) {
  const compositions = JSON.parse(readFileSync(new URL(`content/animations/${fileName}`, root), 'utf8'));
  if (!Array.isArray(compositions)) continue;
  for (const composition of compositions) {
    if (hasText(composition?.id)) animationsById.set(composition.id, composition);
  }
}

const files = readdirSync(new URL('content/scenes/', root)).filter((name) => name.endsWith('.json')).sort();
const sceneIds = new Set();
let composedSceneCount = 0;
let legacyOwnershipFields = 0;

for (const fileName of files) {
  const scenes = JSON.parse(readFileSync(new URL(`content/scenes/${fileName}`, root), 'utf8'));
  if (!Array.isArray(scenes)) {
    errors.push(`${fileName}: expected a JSON array`);
    continue;
  }

  for (const [sceneIndex, scene] of scenes.entries()) {
    const prefix = `${fileName}/scene[${sceneIndex}]`;
    if (!hasText(scene?.id)) errors.push(`${prefix}: id is required`);
    else if (sceneIds.has(scene.id)) errors.push(`${prefix}: duplicate scene id ${scene.id}`);
    else sceneIds.add(scene.id);

    if (!allowedThemes.has(scene?.theme)) errors.push(`${prefix}: unsupported theme ${scene?.theme}`);
    if (!hasText(scene?.ariaLabel)) errors.push(`${prefix}: ariaLabel is required`);

    if (Object.prototype.hasOwnProperty.call(scene ?? {}, 'entities')) {
      legacyOwnershipFields += 1;
      errors.push(`${prefix}: legacy entities ownership is not allowed; use animationRef and reusable semantic visual primitives`);
    }

    if (!hasText(scene?.animationRef)) {
      errors.push(`${prefix}: animationRef is required`);
      continue;
    }

    composedSceneCount += 1;
    const animation = animationsById.get(scene.animationRef);
    if (!animation) {
      errors.push(`${prefix}: unknown animationRef ${scene.animationRef}`);
    } else if (allowedThemes.has(scene?.theme) && animation.theme !== scene.theme) {
      errors.push(`${prefix}: scene theme ${scene.theme} does not match animation theme ${animation.theme}`);
    }
  }
}

if (errors.length) {
  console.error(`Scene validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Scenes OK: ${sceneIds.size} scene(s), ${composedSceneCount} semantic composition scene(s), ${legacyOwnershipFields} legacy ownership field(s).`);
}
