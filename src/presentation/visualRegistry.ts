import { resolveAssetRefForVisualRef } from './assetRegistry';
import { resolveVisualRecipeRefs } from './visualRecipeRegistry';
import type { VisualRecipeSurface } from './visualRecipeTypes';

export type VisualRenderer = 'scene-icon' | 'entity-icon' | 'utility-icon' | 'nature-space-icon' | 'everyday-icon' | 'process-icon' | 'animal-expansion-icon' | 'concept-icon' | 'curriculum-icon' | 'learning-icon' | 'property-icon' | 'class2-concept-icon' | 'class2-final-icon';
export type VisualMotion =
  | 'idle'
  | 'wag'
  | 'swim'
  | 'flap'
  | 'hop'
  | 'float'
  | 'sway'
  | 'pulse'
  | 'blink'
  | 'chomp'
  | 'breathe'
  | 'flex'
  | 'drift'
  | 'spin'
  | 'flicker'
  | 'wiggle';

export type VisualContext = 'option' | 'word-bank' | 'drag-item' | 'drag-target' | 'feedback' | 'dashboard';

export interface VisualDefinition {
  id: string;
  renderer: VisualRenderer;
  glyph: string;
  label: string;
  motion: VisualMotion;
  aliases: string[];
  assetRef?: string;
  /** Presentation-only identity guard for semantic animation subject variants. */
  animationIdentityRef?: string;
}

export interface PresentableVisualItem {
  label: string;
  semanticRef?: string;
  visualRefs?: string[];
}

/**
 * Visual packs are content, not engine code. Any JSON array dropped into
 * content/visuals is discovered automatically, so extending a topic does not
 * require modifying this registry or an interaction engine.
 */
const visualModules = import.meta.glob('../../content/visuals/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, unknown>;

const definitions = Object.values(visualModules)
  .flatMap((value) => (Array.isArray(value) ? (value as VisualDefinition[]) : []))
  .map((definition) => {
    const assetRef = definition.assetRef ?? resolveAssetRefForVisualRef(definition.id);
    return assetRef ? { ...definition, assetRef } : definition;
  });
const visualById = new Map(definitions.map((definition) => [definition.id, definition]));
const visualRefByAlias = new Map<string, string>();
const visualRefBySemanticKey = new Map<string, string>();

function normalizeLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[-_]+/g, ' ')
    .replace(/[.,!?;:()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function registerSemanticKey(key: string, visualRef: string): void {
  const normalized = normalizeLabel(key);
  if (!normalized || visualRefBySemanticKey.has(normalized)) return;
  visualRefBySemanticKey.set(normalized, visualRef);
}

for (const definition of definitions) {
  for (const alias of definition.aliases) {
    visualRefByAlias.set(normalizeLabel(alias), definition.id);
    registerSemanticKey(alias, definition.id);
  }
  const idParts = definition.id.split('.');
  registerSemanticKey(idParts[idParts.length - 1] ?? '', definition.id);
}

export function resolveVisualDefinition(visualRef: string): VisualDefinition | null {
  return visualById.get(visualRef) ?? null;
}

/** Resolve a canonical content entity id without relying on display wording. */
export function resolveSemanticVisualRefs(semanticRef?: string): string[] {
  if (!semanticRef) return [];
  const visualRef = visualRefBySemanticKey.get(normalizeLabel(semanticRef));
  return visualRef ? [visualRef] : [];
}

/**
 * Conservative presentation fallback for legacy/generated content.
 * It only accepts an exact registered alias, or 2-3 exact aliases joined by
 * "and", "+" or "&". There is deliberately no fuzzy keyword matching, so a
 * visual cannot be attached to an unrelated answer merely because a word was
 * mentioned somewhere in a longer sentence.
 */
export function resolveLabelVisualRefs(label: string): string[] {
  const normalized = normalizeLabel(label);
  const direct = visualRefByAlias.get(normalized);
  if (direct) return [direct];

  if (!normalized || normalized.length > 48) return [];
  const parts = label
    .split(/\s*(?:\+|&|\band\b)\s*/i)
    .map(normalizeLabel)
    .filter(Boolean);

  if (parts.length < 2 || parts.length > 3) return [];
  const refs = parts.map((part) => visualRefByAlias.get(part));
  if (refs.some((ref) => !ref)) return [];
  return [...new Set(refs as string[])];
}

/**
 * Explicit authored refs win; direct semantic primitives beat semantic
 * recipes; recipes beat exact display-label fallback. Recipe resolution is
 * surface-aware so identity-only answer surfaces never inherit relation slots.
 */
export function resolveItemVisualRefs(
  item: PresentableVisualItem,
  allowLabelInference = true,
  recipeSurface: VisualRecipeSurface = 'option'
): string[] {
  if (item.visualRefs?.length) return [...item.visualRefs];
  const semanticRefs = resolveSemanticVisualRefs(item.semanticRef);
  if (semanticRefs.length) return semanticRefs;
  const recipeRefs = resolveVisualRecipeRefs(item.semanticRef, recipeSurface);
  if (recipeRefs.length) return recipeRefs;
  return allowLabelInference ? resolveLabelVisualRefs(item.label) : [];
}

export function getRegisteredVisualRefs(): string[] {
  return definitions.map((definition) => definition.id).sort();
}

export function getVisualDefinitions(): VisualDefinition[] {
  return definitions.map((definition) => ({ ...definition, aliases: [...definition.aliases] }));
}
