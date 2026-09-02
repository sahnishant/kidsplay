export type SceneTheme = 'grass' | 'ocean' | 'paper';

/**
 * Canonical child-facing scene contract.
 *
 * A scene owns exactly one semantic animation composition. Legacy scene-local
 * entity arrays are intentionally not part of this type: reusable visual
 * primitives belong to the semantic animation/visual registries instead.
 */
export type SceneDefinition = {
  id: string;
  theme: SceneTheme;
  ariaLabel: string;
  animationRef: string;
};

export type SceneIconId =
  | 'dog-happy'
  | 'dog-worried'
  | 'bone'
  | 'heart'
  | 'lungs'
  | 'earth'
  | 'wave'
  | 'whale'
  | 'balloon'
  | 'candle'
  | 'pumice'
  | 'wind'
  | 'windmill'
  | 'kite'
  | 'sailboat'
  | 'plant'
  | 'sun';
