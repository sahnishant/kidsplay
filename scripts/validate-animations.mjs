import { readdirSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const errors = [];
const allowedThemes = new Set(['grass', 'ocean', 'paper']);
const allowedOrientations = new Set(['front', 'side']);
const allowedPoses = new Set(['stand', 'sit', 'play', 'swim', 'rest']);
const allowedExpressions = new Set(['neutral', 'happy', 'worried', 'curious', 'excited']);
const allowedRoles = new Set(['prop', 'relation', 'context']);
const allowedSlots = new Set(['front', 'above', 'behind', 'ground']);
const allowedMotions = new Set([
  'idle', 'wag', 'swim', 'flap', 'hop', 'float', 'sway', 'pulse',
  'blink', 'chomp', 'breathe', 'flex', 'drift', 'spin', 'flicker', 'wiggle'
]);

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const inPercentRange = (value) => Number.isFinite(value) && value >= 0 && value <= 100;
const validScale = (value) => value === undefined || (Number.isFinite(value) && value > 0 && value <= 2);

const visualIds = new Set();
for (const fileName of readdirSync(new URL('content/visuals/', root)).filter((name) => name.endsWith('.json')).sort()) {
  const definitions = JSON.parse(readFileSync(new URL(`content/visuals/${fileName}`, root), 'utf8'));
  if (!Array.isArray(definitions)) continue;
  for (const definition of definitions) {
    if (hasText(definition?.id)) visualIds.add(definition.id);
  }
}

const files = readdirSync(new URL('content/animations/', root)).filter((name) => name.endsWith('.json')).sort();
const animationIds = new Set();
const semanticCounts = new Map();
let partCount = 0;

for (const fileName of files) {
  const compositions = JSON.parse(readFileSync(new URL(`content/animations/${fileName}`, root), 'utf8'));
  if (!Array.isArray(compositions)) {
    errors.push(`${fileName}: expected a JSON array`);
    continue;
  }

  for (const [index, composition] of compositions.entries()) {
    const prefix = `${fileName}/animation[${index}]`;
    if (!hasText(composition?.id)) errors.push(`${prefix}: id is required`);
    else if (animationIds.has(composition.id)) errors.push(`${prefix}: duplicate animation id ${composition.id}`);
    else animationIds.add(composition.id);

    if (!hasText(composition?.semanticRef)) errors.push(`${prefix}: semanticRef is required`);
    else semanticCounts.set(composition.semanticRef, (semanticCounts.get(composition.semanticRef) ?? 0) + 1);
    if (!allowedThemes.has(composition?.theme)) errors.push(`${prefix}: unsupported theme ${composition?.theme}`);
    if (!hasText(composition?.ariaLabel)) errors.push(`${prefix}: ariaLabel is required`);

    const subject = composition?.subject;
    if (!subject || typeof subject !== 'object') {
      errors.push(`${prefix}: subject is required`);
    } else {
      if (!hasText(subject.variantRef)) errors.push(`${prefix}/subject: variantRef is required`);
      else if (!visualIds.has(subject.variantRef)) errors.push(`${prefix}/subject: unknown visual variant ${subject.variantRef}`);
      if (!allowedOrientations.has(subject.orientation)) errors.push(`${prefix}/subject: unsupported orientation ${subject.orientation}`);
      if (!allowedPoses.has(subject.pose)) errors.push(`${prefix}/subject: unsupported pose ${subject.pose}`);
      if (!allowedExpressions.has(subject.expression)) errors.push(`${prefix}/subject: unsupported expression ${subject.expression}`);
      if (!inPercentRange(subject.x)) errors.push(`${prefix}/subject: x must be 0..100`);
      if (!inPercentRange(subject.y)) errors.push(`${prefix}/subject: y must be 0..100`);
      if (!validScale(subject.scale)) errors.push(`${prefix}/subject: scale must be > 0 and <= 2`);
    }

    if (!Array.isArray(composition?.parts)) {
      errors.push(`${prefix}: parts must be an array`);
      continue;
    }

    const partIds = new Set();
    for (const [partIndex, part] of composition.parts.entries()) {
      partCount += 1;
      const partPrefix = `${prefix}/part[${partIndex}]`;
      if (!hasText(part?.id)) errors.push(`${partPrefix}: id is required`);
      else if (partIds.has(part.id)) errors.push(`${partPrefix}: duplicate part id ${part.id}`);
      else partIds.add(part.id);
      if (!allowedRoles.has(part?.role)) errors.push(`${partPrefix}: unsupported role ${part?.role}`);
      if (!allowedSlots.has(part?.slot)) errors.push(`${partPrefix}: unsupported slot ${part?.slot}`);
      if (!inPercentRange(part?.x)) errors.push(`${partPrefix}: x must be 0..100`);
      if (!inPercentRange(part?.y)) errors.push(`${partPrefix}: y must be 0..100`);
      if (!validScale(part?.scale)) errors.push(`${partPrefix}: scale must be > 0 and <= 2`);
      if (part?.motion !== undefined && !allowedMotions.has(part.motion)) errors.push(`${partPrefix}: unsupported motion ${part.motion}`);

      const hasVisual = hasText(part?.visualRef);
      const hasLiteral = hasText(part?.text);
      if (hasVisual === hasLiteral) errors.push(`${partPrefix}: provide exactly one of visualRef or text`);
      if (hasVisual && !visualIds.has(part.visualRef)) errors.push(`${partPrefix}: unknown visualRef ${part.visualRef}`);
    }
  }
}

if (errors.length) {
  console.error(`Animation validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Animations OK: ${animationIds.size} composition(s), ${semanticCounts.size} semantic identity/identities, ${partCount} reusable part(s).`);
}
