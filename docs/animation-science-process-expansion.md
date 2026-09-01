# Semantic animation science + process expansion

Issue: #112  
Parent: #76

This branch extends the existing semantic animation composition system. It does not add another renderer/runtime, question-specific animation bank, external dependency, or third-party asset source.

## Child-facing science migration

The existing science reinforcement scenes for air, wind, plants, lungs, Earth rotation, sea water and pumice preserve their scene IDs but now resolve through reusable semantic compositions.

## Reviewed process expansion

The same system now covers all five reviewed canonical process rows in `content/knowledge/vocabulary-processes.json`:

- germination: seed → sprout → young plant;
- melting: ice → liquid water;
- freezing: liquid water → ice;
- opening: closed → open;
- filling: empty → partly full → full.

The water transformations share semantic identity `water-state-change`; melt/freeze direction is selected by reusable endpoint visual parts rather than duplicated question code.

Seven state primitives are implemented through the existing `process-icon` renderer: ice, liquid water, closed/open container, and empty/partly-full/full container. Motion enhances these diagrams but static rendering contains the complete process meaning.

## Presentation safety

Explicit authored scene stimuli remain authoritative. Inferred process scenes remain presentation-only reinforcement: they are suppressed when `allowInferredScene` is false and structured-assessment inference stays disabled by the existing session policy. No answer or evaluator contract changes.

## Small-surface behavior

Semantic composition art sizes against its embedding container when container-query units are supported, with viewport sizing retained as compatibility fallback.

## Validation target

Final head must retain zero semantic-animation safety/reference failures and pass the repository's exact-head Windows, Browser/Playwright and Android/offline gates before merge.
