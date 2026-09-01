# #112 visual review checklist

Use this checklist when manually reviewing the branch in a browser or Android build.

## Scene semantics

- Air balloon/candle: balloon and burning candle are both visible; `AIR` is legible.
- Windmill: moving-air cue and windmill are distinct; only the windmill blades should visually read as rotating machinery.
- Kite: wind and kite remain spatially separated; `moving air` is legible.
- Sailboat: wind, boat and water are simultaneously visible.
- Plant/air: plant is primary; Sun and moving air remain secondary context.
- Lungs: lungs are primary; `AIR` and `in ↔ out` reinforce breathing.
- Earth rotation: Earth is primary; Sun is secondary; `rotate` remains visible in reduced motion.
- Sea salt: water remains primary; `SALT` and `SEA` are distinct.
- Pumice: pumice stays above/at the water cue; `holes` is visible.
- Germination: left-to-right order reads unambiguously as seed → sprout → young plant.

## Small surfaces

At 360×640 and in compact reinforcement cards:

- no subject/prop is clipped solely because the overall browser viewport is wide;
- labels do not cover the primary visual;
- the germination stages remain distinguishable;
- the composition does not force horizontal scrolling.

## Motion/accessibility

With `prefers-reduced-motion: reduce`:

- all semantic meaning remains visible statically;
- arrows/order remain present for germination;
- no relation depends on a moving-only cue.

## Assessment safety

- inferred scenes remain absent before answer commit;
- structured mock reactions do not gain inferred semantic animation;
- explicitly authored scene stimuli remain authoritative.
