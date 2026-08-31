# Child viewport contract

This document is the durable product/UI rule for child-facing Kidsplay screens.

## Core invariant

**One child-facing state = one viewport.**

A primary child state must not depend on document-level vertical scrolling. Content that is not part of the current decision/action is revealed by an explicit child action as a new state, overlay, or bounded secondary surface.

```text
child action
  -> change state
  -> show the next relevant surface

not

child action / page load
  -> append more content below the current surface
  -> require the child to hunt below the fold
```

## Primary states

Examples:

- Home / Story World map
- Question answer state
- Post-answer reaction state
- Story mission beat
- Completion state

Primary states should fit the available safe-area-aware application viewport. At representative small-phone size (360x640), the document itself must not scroll. Representative question/reaction states should also fit their primary surface without internal scrolling.

## Secondary/detail states

Examples:

- Player settings
- Detailed progress
- Goal readiness and mock history
- Practice catalogue
- Long administrative/detail information

These surfaces are opened intentionally. If their content genuinely cannot fit, scrolling is contained inside the opened surface. Document/body scrolling remains disabled.

## Story rule

Selecting a map location changes the visible state; it must not append a mission below the map.

Mission dialogue is progressive disclosure: show one story beat, then reveal the next beat through an explicit action. The investigation CTA appears only after the final story beat.

## Question rule

Answering a question transitions the child from the **answer state** to the **reaction state**. Do not stack prompt + interaction + feedback + story reaction + reinforcement animation into one growing document.

The reaction state is where feedback and relevant semantic animation receive visual space.

## Motion rule

Animation is contextual learning presentation, not a separate feature/demo section. Reusable semantic visuals and lightweight SVG/CSS motion should appear where they help the current concept, option, feedback, story beat, or reward.

Respect `prefers-reduced-motion`.

## Platform/layout rules

- Root app owns the safe-area-aware `100dvh` viewport.
- `html`, `body`, and the root app do not become navigation scroll surfaces.
- Focused text inputs must remain visible when the visual viewport changes (for example, a mobile soft keyboard).
- Runtime errors appear inside/over the viewport, never below a full-height child state.
- Tap targets for core child controls should be at least 44x44 CSS pixels.
- Landscape rotation must not create document-level overflow.

## Regression gates

Browser child journeys should cover at least:

1. 360x640 Home/Story World with no document vertical overflow.
2. Click-to-reveal Player / Progress / Practice / Goals surfaces.
3. Story mission overlay and one-beat-at-a-time dialogue.
4. Representative question answer state with no document overflow.
5. Representative post-answer reaction state with no document overflow.
6. Minimum core tap-target sizes.
7. Reduced-motion behavior.
8. Landscape rotation pressure.
9. Soft-keyboard-like viewport-height pressure around player name entry.

This contract is a product invariant. New child-facing screens should comply by design rather than depending on later CSS patches.