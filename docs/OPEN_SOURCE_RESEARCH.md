# Kidsplay open-source leverage

Open-source projects are used to reduce production cost where they fit the existing architecture. They are not a reason to replace working Kidsplay runtime systems.

## Adopted artwork path

### Microsoft Fluent Emoji

Primary external semantic-art source for common animals/objects.

- License: MIT.
- Imported only through the exact-provenance asset registry.
- Upstream revision is pinned.
- Only actually used files are vendored under `public/assets/open/`.
- Existing Kidsplay SVGs remain fallback.

The current proof set includes dog, whale, cow, camel, rabbit, bird, fish, tree, sun and bone.

### Kenney

Approved secondary source for scene/animal/object gaps where an exact pack/item has clear CC0 provenance. Do not bulk-import a pack merely to increase visual coverage.

### Other artwork sources

Twemoji, Noto Emoji, Game Icons and similar collections remain candidates/reference material according to `content/assets/registry.json`. An external repository is never implicitly approved; artwork licensing and exact file provenance must be checked separately from code licensing.

## Runtime principle

```text
question / canonical entity
→ semanticRef
→ visual registry
→ admitted local asset when useful
   OR Kidsplay SVG fallback
→ existing lightweight motion
```

Question files do not store upstream URLs and engines do not know which art source produced a visual.

Normal builds are offline/deterministic. `scripts/sync-open-assets.mjs` is an explicit authoring operation, not a build-time network dependency. `scripts/validate-assets.mjs` and generated third-party notices fail closed around provenance/licensing mistakes.

## Interaction/reference projects

### H5P

Use as reference material for mature interaction edge cases, accessibility, retry/show-solution behavior and authoring patterns. Do not embed H5P or replace Kidsplay's engines merely for feature parity.

### QuML / Sunbird inQuiry

Useful reference for question-bank metadata concepts such as provenance, concepts/competencies, versioning, curriculum tags, author/reviewer state and reusable question sets. Kidsplay already has a lighter canonical-row/profile/blueprint model; borrow a concept only when a concrete interoperability/metadata gap appears.

### NROER / NCERT OER

Useful for curriculum corroboration, Indian-school context and broadly free learning material. OER evidence is not SOF exam evidence and must never upgrade `SOF_INDIA_CLASS2` row provenance.

## Test tooling

### Playwright

Adopted for browser child journeys and Android-like layout/touch proxies. Current browser smoke includes persistence, Story World, long-mock resume, reduced motion, 360px layout pressure, minimum core target sizes and rotation stress.

### Android packaged testing

The debug APK is built by GitHub Actions. Physical-device/child acceptance remains observational because browser emulation cannot certify packaged offline behavior, OS safe areas, a real soft keyboard, process killing or actual young-child comprehension.

A heavier mobile automation framework should only be added when it can exercise a real available device/emulator in CI and closes a demonstrated gap that the current Android build + Playwright + manual beta loop cannot cover.

## Deferred animation runtimes

Rive/Lottie-style runtimes remain deliberately deferred. Existing static SVG/OSS art plus CSS/SVG motion already covers the product's lightweight-animation mandate. Add a new runtime only for a concrete interaction/state-machine requirement that cannot be implemented cleanly with current primitives.

## Selection rules

Prefer, in order:

1. existing reusable Kidsplay visual if it is clear and consistent;
2. admitted Fluent asset for a common semantic entity;
3. exact-provenance Kenney/other permissive asset for a real gap;
4. small original Kidsplay SVG/composition for concepts external libraries do not represent well.

Do not chase a visual percentage by illustrating numeric answers, codes, person names or ambiguous predicates. The goal is recognition and learning value, not decorative coverage.
