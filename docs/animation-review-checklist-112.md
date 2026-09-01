# #112 visual review checklist

Use this checklist when manually reviewing PR #113 in a browser or Android build.

## Migrated science scenes

- Air balloon/candle: balloon and burning candle are both visible; `AIR` is legible.
- Windmill: moving-air cue and windmill are distinct; the windmill reads as the object acted on by wind.
- Kite: wind and kite remain spatially separated; `moving air` is legible.
- Sailboat: wind, boat and water are simultaneously visible.
- Plant/air: plant is primary; Sun and moving air remain secondary context.
- Lungs: lungs are primary; `AIR` and `in ↔ out` reinforce breathing.
- Earth rotation: Earth is primary; Sun is secondary; `rotate` remains visible in reduced motion.
- Sea salt: water remains primary; `SALT` and `SEA` are distinct.
- Pumice: pumice stays above/at the water cue; `holes` is visible.

## Reviewed process scenes

- Germination reads left-to-right as seed → sprout → young plant.
- Melting reads as ice → liquid water; it must not resemble freezing.
- Freezing reads as liquid water → ice; it must not resemble melting.
- Opening reads as closed container → open container.
- Filling preserves all three stages: empty → partly full → full.
- Process arrows and endpoint states remain visible when motion is disabled.

## Reviewed Class 3 concept scenes

- Earth revolution: Earth and Sun are visually distinct; the orbit/revolution cue and `~1 year` remain legible. It must not be confused with the separate Earth-rotation scene.
- Planet orbit: planet and Sun remain distinct; `around Sun` and the orbit cue are understandable statically.
- Liquid container shape: the child can see that the same liquid is represented with a differently shaped container; `same liquid` and `container shape` remain readable. The scene should communicate container-shape dependence, not a change in amount.

## Small surfaces

At 360×640 and in compact reinforcement cards:

- no subject/prop is clipped solely because the overall browser viewport is wide;
- labels do not cover the primary visual;
- germination and filling stages remain distinguishable;
- melt/freeze endpoints remain visually distinct;
- Earth/planet orbit labels stay inside the scene;
- the composition does not force horizontal scrolling.

## Motion/accessibility

With `prefers-reduced-motion: reduce`:

- all semantic meaning remains visible statically;
- arrows/order remain present for multi-stage processes;
- orbit/revolution remains understandable from the static relation cue;
- no relation depends on a moving-only cue.

## Assessment safety

- inferred scenes remain absent before answer commit;
- structured mock reactions do not gain inferred semantic animation;
- explicitly authored scene stimuli remain authoritative;
- a display label only receives a fallback visual on an exact registered alias; there is no fuzzy substring inference.

## Bundle discipline

- CSS must remain below the existing 100 KiB production gate.
- New process paint/stroke details are kept in SVG attributes rather than expanding global/component CSS solely for decorative styling.
