# Semantic animation science + process expansion

Issue: #112  
Parent: #76

This branch extends the existing semantic animation composition system. It does not add another renderer/runtime, question-specific animation bank, external dependency, or third-party asset source.

## Child-facing science migration

Nine existing science reinforcement scenes for air, wind, plants, lungs, Earth rotation, sea water and pumice preserve their scene IDs but now resolve through reusable semantic compositions. The old scene-local animated entity representation is no longer used by these scenes.

## Reviewed process expansion

The same system now covers all five reviewed canonical process rows in `content/knowledge/vocabulary-processes.json`:

- germination: seed → sprout → young plant;
- melting: ice → liquid water;
- freezing: liquid water → ice;
- opening: closed → open;
- filling: empty → partly full → full.

The water transformations share semantic identity `water-state-change`; melt/freeze direction is selected by reusable endpoint visual parts rather than duplicated question code.

Seven exact state primitives are implemented through the existing `process-icon` renderer: ice, liquid water, closed/open container, and empty/partly-full/full container. These primitives also improve generated sequence-order cards through the existing visual-resolution path. Motion enhances the diagrams but static rendering contains the complete process meaning.

## Reviewed concept expansion

Auto-discovered modular composition/scene packs extend the same system to reviewed Class 3 science rows for:

- Earth revolution around the Sun, including the approximately one-year relation;
- a planet moving around the Sun along an orbit;
- a liquid taking the shape of the part of its container that it fills.

No question schema, evaluator, engine, or hard-coded question animation is added. The scene mappings are presentation-only references to canonical reviewed rows and concepts.

## Presentation safety

Explicit authored scene stimuli remain authoritative. Inferred process/concept scenes remain presentation-only reinforcement: they are suppressed when `allowInferredScene` is false and structured-assessment inference stays disabled by the existing session policy. Semantic state fallback stays inside one identity.

Visual label fallback remains conservative: explicit visual refs win, semantic refs win over labels, and legacy label inference accepts only exact registered aliases rather than fuzzy substring matches.

## Reduced motion and static meaning

Every composition has a meaningful aria label, an authored subject, and static visual/text cues. Process order and orbit/revolution relations are represented in the static composition itself; animation is supplementary.

## Small-surface behavior

Semantic composition art sizes against its embedding container when container-query units are supported, with viewport sizing retained as compatibility fallback. This prevents compact reinforcement cards from sizing their artwork solely from the full browser viewport.

## Bundle discipline

The new process primitives initially exposed the existing strict CSS budget. The implementation was optimized instead of raising that budget: new process-glyph paint/stroke data lives in SVG attributes, keeping production CSS at 99.7 KiB under the existing 100 KiB gate.

## Final deterministic state

- 25 authored semantic compositions;
- 24 composition-backed child-facing scenes;
- 18 semantic identities;
- 3 multi-state identities (`dog`, `wind`, `water-state-change`);
- 25/25 static/reduced-motion meaningful compositions;
- 0 assessment/presentation policy failures;
- 0 semantic animation safety/reference failures;
- 290 registered semantic visuals;
- sequence-order visual coverage 20/143 (14.0%).

Final exact-head Windows, Browser/Playwright and Android/offline CI must be green before merge. PR #113 remains unmerged for human visual review.
