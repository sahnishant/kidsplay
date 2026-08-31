# Semantic animation composition

Kidsplay animation is presentation data layered on top of canonical learning semantics. Questions and interaction engines do not select SVG files, OSS sources, body parts or bespoke movie clips.

## Runtime boundary

```text
question / story / canonical concept
        -> existing scene or semantic state
        -> animation composition id
        -> semantic identity + pose + orientation + expression + props + relation/context cues
        -> visual refs / presentation variants
        -> bundled OSS art OR Kidsplay SVG renderer
        -> lightweight CSS/SVG motion
```

A presentation variant is not a new knowledge entity. For example, `animation.variant.dog-happy-state` and `animation.variant.dog-worried-state` are visual states of the same semantic identity `dog`. Their aliases are deliberately namespaced as animation-state phrases so they cannot compete with ordinary semantic visual inference. Subject variants also declare `animationIdentityRef`; validation requires it to equal the composition `semanticRef`, preventing an unrelated presentation variant from being accepted as the subject of another semantic identity. `animationIdentityRef` is reserved for `animation.variant.*` presentation visuals, and their aliases may not collapse back to the bare semantic identity.

## Composition contract

Each composition in `content/animations/*.json` declares:

- `semanticRef`: stable entity identity;
- `theme`: lightweight context/background family;
- one `subject` with orientation, pose, expression and a presentation-only variant ref;
- reusable `parts` with semantic `visualRef` values or a small literal relation cue;
- positions/scales as presentation data.

The initial proof intentionally reuses one dog identity across:

- happy + stand + side + bone + heart;
- worried + stand + side + water + question;
- curious + sit + side + bone + question.

`resolveAnimationForState()` accepts semantic state and never leaves the requested semantic identity. Exact matches can include expression, pose, orientation, theme and semantic part visual refs grouped by `prop`, `context` or `relation`. If a requested part combination exists, fallback stays within that compatible subset before ranking expression, pose, orientation and theme. If the requested part is not authored at all, resolution degrades to the closest state of the same semantic identity rather than crossing to another entity. This lets callers request ideas such as dog + bone or dog + water without hard-coding asset sources or animation file ids.

## Integration rule

Existing scene ids can point at an `animationRef`. This preserves every current question/story caller while replacing bespoke scene primitives with reusable composition content. Scene packs are discovered from `content/scenes/*.json`, matching the validator and the glob-based visual/animation registries, so adding a new scene pack does not require editing `Scene.svelte`. A composed scene must use the same theme as its referenced animation because the embedded composition deliberately inherits the scene background. Assessment logic remains unchanged, so the existing rule that inferred reinforcement scenes are suppressed in structured mocks still applies.

## Asset and licensing rule

Composition data never stores upstream artwork URLs. Visual refs resolve through the existing visual/asset registries, so Fluent/other admitted OSS assets keep exact provenance and Kidsplay SVG variants remain independent presentation code. Do not edit vendored third-party proof SVGs merely to create a pose.

## Motion rule

Use current CSS/SVG primitives first. Semantic-part motion is available when an inline Kidsplay renderer exposes named parts; imported static assets can still participate as props/context with whole-object motion. Subject motion continues to use the existing full `VisualMotion` vocabulary through visual definitions. Composition-level part motion is intentionally bounded to the wrapper motions the semantic composition renderer implements: `float`, `pulse`, `drift`, `spin` and `wiggle`. Add a heavyweight runtime only when a concrete interaction state machine cannot be expressed cleanly with these primitives.

All motion remains optional under `prefers-reduced-motion`; learning meaning must remain understandable when animations are disabled.

## Validation

- `scripts/validate-animations.mjs` fails closed on unknown visual refs, subject-variant identity mismatches, invalid pose/expression vocabulary, unsupported composition-part motion, invalid coordinates, duplicate ids or ambiguous visual/text parts.
- `scripts/validate-visuals.mjs` reserves `animationIdentityRef` for namespaced animation variants and prevents a variant alias from claiming the bare canonical identity.
- `scripts/validate-scenes.mjs` requires each scene to use either a registered semantic composition or the legacy primitive list, never an unvalidated mixture, and rejects scene/composition theme mismatches.
- `tests/semantic-animation.behavior.test.ts` proves same-identity multi-state reuse, subject identity binding, semantic part-ref resolution, orientation-aware ranked state fallback and existing-scene integration.

## Scaling direction

Add new identities and states as content/visual presentation data. Do not add per-question animation code. Next useful proofs after the dog family are whale swim states and bird flap/perch states, followed by reusable character orientation/pose work where it produces real learning value.
