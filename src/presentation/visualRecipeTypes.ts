import type { VisualContext } from './visualRegistry';

export type VisualRecipeTemplate =
  | 'entity.single'
  | 'contrast.pair'
  | 'state.before-after'
  | 'process.sequence'
  | 'process.transform'
  | 'container.fill'
  | 'orbit'
  | 'rotation'
  | 'relation.source-target'
  | 'comparison'
  | 'classification'
  | 'measurement';

export type VisualRecipeSurface =
  | VisualContext
  | 'memory-card'
  | 'sequence-item'
  | 'scene';

export type VisualRecipeExposure = 'hidden' | 'identity_only' | 'full_relation';
export type VisualRecipeSlotExposure = 'identity' | 'context' | 'relation';
export type VisualRecipeCostClass = 'low' | 'medium' | 'high';

export interface VisualRecipeSlot {
  role: string;
  visualRef: string;
  exposure: VisualRecipeSlotExposure;
  label?: string;
}

export interface VisualRecipe {
  id: string;
  semanticRef: string;
  template: VisualRecipeTemplate;
  ariaLabel: string;
  slots: VisualRecipeSlot[];
  surfaces: Partial<Record<VisualRecipeSurface, VisualRecipeExposure>>;
  annotation?: string;
  aliases?: string[];
  costClass?: VisualRecipeCostClass;
}

export interface ResolvedVisualRecipe extends Omit<VisualRecipe, 'slots'> {
  exposure: Exclude<VisualRecipeExposure, 'hidden'>;
  slots: VisualRecipeSlot[];
}
