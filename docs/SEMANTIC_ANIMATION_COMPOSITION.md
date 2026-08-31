# Semantic animation composition

Kidsplay animation is presentation data layered on top of canonical learning semantics. Questions and interaction engines do not select SVG files, OSS sources, body parts or bespoke movie clips.

## Runtime boundary

```text
question / story / canonical concept
        -> existing scene or semantic state
        -> animation composition id
        -> semantic identity + pose + expression + props + relation/context cues
        -> visual refs / presentation variants
        -> bundled OSS art OR Kidsplay SVG renderer
        -> lightweight CSS/SVG motion
```

A presentation variant is not a new knowledge entity. For example, `animation.variant.dog.happy` and `animation.variant.dog.worried` are visual states of the same semantic identity `dog`.

## Composition contract

Each composition in `content/animations/*.json` declares:

- `semanticRef`: stable entity identity;
- `theme`: lightweight context/background family;
- one `subject` with orientation, pose, expression and a presentation-only variant ref;
- reusable `parts` with semantic `visualRef` values or a small literal relation cue;
- positions/scales as presentation data.

The initial proof intentionally reuses one dog identity across:

- happy + stand + bone + heart;
- worried + stand + water + question;
- curious + sit + bone + question.

`resolveAnimationForState()` accepts semantic state and falls back only within the same semantic identity when a requested pose/expression is unavailable.

## Integration rule

Existing scene ids can point at an `animationRef`. This preserves every current question/story caller while replacing bespoke scene primitives with reusable composition content. Assessment logic remains unchanged, so the existing rule that inferred reinforcement scenes are suppressed in structured mocks still applies.

## Asset and licensing rule

Composition data never stores upstream artwork URLs. Visual refs resolve through the existing visual/asset registries, so Fluent/other admitted OSS assets keep exact provenance and Kidsplay SVG variants remain independent presentation code. Do not edit vendored third-party proof SVGs merely to create a pose.

## Motion rule

Use current CSS/SVG primitives first. Semantic-part motion is available when an inline Kidsplay renderer exposes named parts; imported static assets can still participate as props/context with whole-object motion. Add a heavyweight runtime only when a concrete interaction state machine cannot be expressed cleanly with these primitives.

All motion remains optional under `prefers-reduced-motion`; learning meaning must remain understandable when animations are disabled.

## Validation

- `scripts/validate-animations.mjs` fails closed on unknown visual refs, invalid pose/expression vocabulary, invalid coordinates, duplicate ids or ambiguous visual/text parts.
- `scripts/validate-scenes.mjs` requires each scene to use either a registered semantic composition or the legacy primitive list, never an unvalidated mixture.
- `tests/semantic-animation.behavior.test.ts` proves same-identity multi-state reuse, state resolution/fallback and existing-scene integration.

## Scaling direction

Add new identities and states as content/visual presentation data. Do not add per-question animation code. Next useful proofs after the dog family are whale swim states and bird flap/perch states, followed by reusable character orientation/pose work where it produces real learning value.