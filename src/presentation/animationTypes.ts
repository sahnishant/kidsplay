import type { VisualMotion } from './visualRegistry';

export type AnimationTheme = 'grass' | 'ocean' | 'paper';
export type AnimationOrientation = 'front' | 'side';
export type AnimationPose = 'stand' | 'sit' | 'play' | 'swim' | 'rest';
export type AnimationExpression = 'neutral' | 'happy' | 'worried' | 'curious' | 'excited';
export type AnimationPartRole = 'prop' | 'relation' | 'context';
export type AnimationSlot = 'front' | 'above' | 'behind' | 'ground';
export type AnimationPartMotion = Extract<VisualMotion, 'float' | 'pulse' | 'drift' | 'spin' | 'wiggle'>;
export type AnimationPartVisualQuery = Partial<Record<AnimationPartRole, string[]>>;

export interface AnimationSubject {
  variantRef: string;
  orientation: AnimationOrientation;
  pose: AnimationPose;
  expression: AnimationExpression;
  x: number;
  y: number;
  scale?: number;
}

export interface AnimationPart {
  id: string;
  role: AnimationPartRole;
  slot: AnimationSlot;
  visualRef?: string;
  text?: string;
  x: number;
  y: number;
  scale?: number;
  motion?: AnimationPartMotion;
}

export interface AnimationComposition {
  id: string;
  semanticRef: string;
  theme: AnimationTheme;
  ariaLabel: string;
  subject: AnimationSubject;
  parts: AnimationPart[];
}

export interface AnimationStateQuery {
  semanticRef: string;
  expression?: AnimationExpression;
  pose?: AnimationPose;
  orientation?: AnimationOrientation;
  theme?: AnimationTheme;
  /** Semantic presentation refs required in a role when an authored match exists. */
  partVisualRefs?: AnimationPartVisualQuery;
}
