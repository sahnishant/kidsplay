import { readdirSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const errors = [];
const allowedThemes = new Set(['grass', 'ocean', 'paper']);
const allowedKinds = new Set(['icon', 'text']);
const allowedMotions = new Set(['bounce', 'float', 'pulse', 'wiggle', 'spin']);
const allowedIcons = new Set([
  'dog-happy',
  'dog-worried',
  'bone',
  'heart',
  'lungs',
  'earth',
  'wave',
  'whale',
  'balloon',
  'candle',
  'pumice',
  'wind',
  'windmill',
  'kite',
  'sailboat',
  'plant',
  'sun'
]);

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const inPercentRange = (value) => Number.isFinite(value) && value >= 0 && value <= 100;

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
let entityCount = 0;
let composedSceneCount = 0;

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

    const hasAnimation = hasText(scene?.animationRef);
    const hasEntities = Array.isArray(scene?.entities) && scene.entities.length > 0;
    if (hasAnimation === hasEntities) {
      errors.push(`${prefix}: provide exactly one of animationRef or a non-empty entities array`);
      continue;
    }

    if (hasAnimation) {
      composedSceneCount += 1;
      const animation = animationsById.get(scene.animationRef);
      if (!animation) {
        errors.push(`${prefix}: unknown animationRef ${scene.animationRef}`);
      } else if (allowedThemes.has(scene?.theme) && animation.theme !== scene.theme) {
        errors.push(`${prefix}: scene theme ${scene.theme} does not match animation theme ${animation.theme}`);
      }
      continue;
    }

    const entityIds = new Set();
    for (const [entityIndex, entity] of scene.entities.entries()) {
      entityCount += 1;
      const entityPrefix = `${prefix}/entity[${entityIndex}]`;
      if (!hasText(entity?.id)) errors.push(`${entityPrefix}: id is required`);
      else if (entityIds.has(entity.id)) errors.push(`${entityPrefix}: duplicate entity id ${entity.id}`);
      else entityIds.add(entity.id);

      if (!allowedKinds.has(entity?.kind)) errors.push(`${entityPrefix}: unsupported kind ${entity?.kind}`);
      if (!hasText(entity?.label)) errors.push(`${entityPrefix}: label is required`);
      if (!hasText(entity?.value)) errors.push(`${entityPrefix}: value is required`);
      if (!inPercentRange(entity?.x)) errors.push(`${entityPrefix}: x must be a number from 0 to 100`);
      if (!inPercentRange(entity?.y)) errors.push(`${entityPrefix}: y must be a number from 0 to 100`);
      if (entity?.motion !== undefined && !allowedMotions.has(entity.motion)) {
        errors.push(`${entityPrefix}: unsupported motion ${entity.motion}`);
      }
      if (entity?.kind === 'icon' && !allowedIcons.has(entity.value)) {
        errors.push(`${entityPrefix}: unsupported icon ${entity.value}`);
      }
    }
  }
}

if (errors.length) {
  console.error(`Scene validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Scenes OK: ${sceneIds.size} scene(s), ${composedSceneCount} semantic composition scene(s), ${entityCount} legacy entity primitive(s).`);
}
