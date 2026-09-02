import { resolveAssetRefForVisualRef } from './assetRegistry';
import { resolveVisualRecipeRefs } from './visualRecipeRegistry';
import type { VisualRecipeSurface } from './visualRecipeTypes';

export type VisualRenderer = 'scene-icon' | 'entity-icon' | 'utility-icon' | 'nature-space-icon' | 'everyday-icon' | 'process-icon' | 'measurement-icon' | 'material-property-icon' | 'environmental-action-icon' | 'soil-type-icon' | 'animal-expansion-icon' | 'concept-icon' | 'curriculum-icon' | 'learning-icon' | 'property-icon' | 'class2-concept-icon' | 'class2-final-icon';
export type VisualMotion = 'idle' | 'wag' | 'swim' | 'flap' | 'hop' | 'float' | 'sway' | 'pulse' | 'blink' | 'chomp' | 'breathe' | 'flex' | 'drift' | 'spin' | 'flicker' | 'wiggle';
export type VisualContext = 'option' | 'word-bank' | 'drag-item' | 'drag-target' | 'feedback' | 'dashboard';

export interface VisualDefinition {
  id: string;
  renderer: VisualRenderer;
  glyph: string;
  label: string;
  motion: VisualMotion;
  aliases: string[];
  assetRef?: string;
  animationIdentityRef?: string;
}

export interface PresentableVisualItem {
  label: string;
  semanticRef?: string;
  visualRefs?: string[];
}

const visualModules = import.meta.glob('../../content/visuals/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;

// Make cross-file registration order explicit instead of inheriting bundler
// object enumeration. Authored order inside each visual file is preserved.
// Conflicting alias/semantic ownership is rejected by validate-visuals before
// runtime, so valid content never depends on collision precedence.
const definitions = Object.entries(visualModules)
  .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
  .flatMap(([, value]) => (Array.isArray(value) ? (value as VisualDefinition[]) : []))
  .map((definition) => {
    const assetRef = definition.assetRef ?? resolveAssetRefForVisualRef(definition.id);
    return assetRef ? { ...definition, assetRef } : definition;
  });
const visualById = new Map(definitions.map((definition) => [definition.id, definition]));
const visualRefByAlias = new Map<string, string>();
const visualRefBySemanticKey = new Map<string, string>();

function normalizeLabel(value: string): string {
  return value.toLowerCase().replace(/[’']/g, '').replace(/[-_]+/g, ' ').replace(/[.,!?;:()]/g, ' ').replace(/\s+/g, ' ').trim();
}

function registerSemanticKey(key: string, visualRef: string): void {
  const normalized = normalizeLabel(key);
  if (!normalized || visualRefBySemanticKey.has(normalized)) return;
  visualRefBySemanticKey.set(normalized, visualRef);
}

for (const definition of definitions) {
  for (const alias of definition.aliases) {
    const normalizedAlias = normalizeLabel(alias);
    visualRefByAlias.set(normalizedAlias, definition.id);
    registerSemanticKey(alias, definition.id);
  }
  const idParts = definition.id.split('.');
  registerSemanticKey(idParts[idParts.length - 1] ?? '', definition.id);
}

export function resolveVisualDefinition(visualRef: string): VisualDefinition | null {
  return visualById.get(visualRef) ?? null;
}

export function resolveSemanticVisualRefs(semanticRef?: string): string[] {
  if (!semanticRef) return [];
  const visualRef = visualRefBySemanticKey.get(normalizeLabel(semanticRef));
  return visualRef ? [visualRef] : [];
}

export function resolveLabelVisualRefs(label: string): string[] {
  const normalized = normalizeLabel(label);
  const direct = visualRefByAlias.get(normalized);
  if (direct) return [direct];
  if (!normalized || normalized.length > 48) return [];
  const parts = label.split(/\s*(?:\+|&|\band\b)\s*/i).map(normalizeLabel).filter(Boolean);
  if (parts.length < 2 || parts.length > 3) return [];
  const refs = parts.map((part) => visualRefByAlias.get(part));
  if (refs.some((ref) => !ref)) return [];
  return [...new Set(refs as string[])];
}

export function resolveItemVisualRefs(item: PresentableVisualItem, allowLabelInference = true, recipeSurface: VisualRecipeSurface = 'option'): string[] {
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
