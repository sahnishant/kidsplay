import type { PresentableVisualItem, VisualContext } from './visualRegistry';
import { resolveItemVisualRefs } from './visualRegistry';
import type { VisualRecipeSurface } from './visualRecipeTypes';

export interface EntityVisualPresentation {
  kind: 'entities';
  visualRefs: string[];
  context: VisualContext;
  decorative: boolean;
  label: string;
  hasVisuals: boolean;
  compound: boolean;
}

export interface RecipeVisualPresentation {
  kind: 'recipe';
  recipeId: string;
  surface: VisualRecipeSurface;
}

export interface AnimationVisualPresentation {
  kind: 'animation';
  animationId: string;
  embedded: boolean;
  decorative: boolean;
}

export interface VocabularyVisualPresentation {
  kind: 'vocabulary';
  senseKey: string;
  compact: boolean;
}

export type SemanticVisualPresentation =
  | EntityVisualPresentation
  | RecipeVisualPresentation
  | AnimationVisualPresentation
  | VocabularyVisualPresentation;

export interface ItemVisualPresentationOptions {
  allowLabelInference?: boolean;
  recipeSurface?: VisualRecipeSurface;
  context?: VisualContext;
  decorative?: boolean;
}

function recipeSurfaceForContext(context: VisualContext): VisualRecipeSurface {
  if (context === 'word-bank' || context === 'drag-item' || context === 'drag-target') return context;
  if (context === 'feedback' || context === 'dashboard') return context;
  return 'option';
}

/**
 * Canonical item-to-presentation resolver for every interactive engine.
 * Semantic/recipe authority stays in the existing registries; this normalizes
 * the result into the same typed presenter contract used by the other visual
 * capabilities. Engine-specific recipe surfaces are preserved: a word-bank,
 * drag item or drag target must never silently inherit option-surface policy.
 */
export function resolveItemVisualPresentation(
  item: PresentableVisualItem,
  {
    allowLabelInference = true,
    recipeSurface,
    context = 'option',
    decorative = true
  }: ItemVisualPresentationOptions = {}
): EntityVisualPresentation {
  const effectiveRecipeSurface = recipeSurface ?? recipeSurfaceForContext(context);
  const visualRefs = resolveItemVisualRefs(item, allowLabelInference, effectiveRecipeSurface);
  return {
    kind: 'entities',
    visualRefs,
    context,
    decorative,
    label: item.label,
    hasVisuals: visualRefs.length > 0,
    compound: visualRefs.length > 1
  };
}

export function recipeVisualPresentation(
  recipeId: string,
  surface: VisualRecipeSurface = 'feedback'
): RecipeVisualPresentation {
  return { kind: 'recipe', recipeId, surface };
}

export function animationVisualPresentation(
  animationId: string,
  { embedded = false, decorative = false }: { embedded?: boolean; decorative?: boolean } = {}
): AnimationVisualPresentation {
  return { kind: 'animation', animationId, embedded, decorative };
}

export function vocabularyVisualPresentation(
  senseKey: string,
  compact = false
): VocabularyVisualPresentation {
  return { kind: 'vocabulary', senseKey, compact };
}
