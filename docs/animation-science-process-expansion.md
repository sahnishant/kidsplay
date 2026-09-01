# Semantic animation science + process expansion

Issue: #112  
Parent: #76

## Why this pass exists

Kidsplay already had a reusable semantic animation renderer and identity-safe state resolver, but most non-animal science scenes still used the older scene-local `entities` representation. That meant the child saw motion, but the motion was not reusable as a semantic composition across questions, topics, or future content.

This pass moves those existing science scenes onto the same composition architecture already used by the animal kit. The public scene IDs stay unchanged, so existing question and dashboard mappings do not need to know how the animation is rendered.

## Migrated child-facing scenes

| Scene | Semantic identity | Reusable differentiator |
| --- | --- | --- |
| `scene.air.balloon-candle` | `air` | balloon + candle observation |
| `scene.air.windmill` | `wind` | windmill prop |
| `scene.air.kite-wind` | `wind` | kite prop |
| `scene.air.sailboat-wind` | `wind` | sailboat prop + water context |
| `scene.plants.air-fresh` | `plant` | sun + wind context |
| `scene.human.lungs-breathing` | `lungs` | in/out air relation |
| `scene.universe.earth-rotation` | `earth` | Sun + rotation relation |
| `scene.water.sea-salty` | `sea` | salt relation |
| `scene.rocks.pumice-water` | `pumice` | water context + holes relation |

The three wind compositions deliberately share one semantic identity. `resolveAnimationForState` can select the authored scene by required semantic parts instead of question-specific animation IDs.

## First reviewed process composition

`animation.germination.seed-to-young-plant` is grounded in the reviewed process row:

`kr.science.process.germination.seed-to-young-plant`

The canonical order is preserved visually and in accessible text:

`seed → sprout → young plant`

Motion only reinforces the stages. When reduced motion is enabled, the seed, arrows, sprout and young plant remain in the same readable order.

## Small-surface behavior

Semantic composition art now sizes against its own animation container when container-query units are supported. This prevents a small embedded answer/reinforcement surface from inheriting oversized `vw`-based art from the overall browser viewport. The previous viewport-based sizing remains as a compatibility fallback.

## Safety boundaries

- No new interaction engine or animation runtime.
- No canonical question/evaluator changes.
- No per-question animation code.
- Existing scene IDs are preserved.
- Explicit authored scene stimuli remain authoritative.
- Inferred reinforcement remains disabled for structured assessments.
- Inferred reinforcement remains post-submit only in free practice.
- Semantic state fallback remains inside one identity.
- Reduced-motion rendering retains static semantic meaning.
