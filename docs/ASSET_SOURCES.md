# Kidsplay asset-source policy and research

The asset registry at `content/assets/registry.json` is the authoritative admission ledger for external art. **A public GitHub repository is not automatically an approved art source.** Third-party artwork remains optional presentation data; question logic, knowledge rows, evaluators, and interaction engines do not depend on an external artwork pack.

The runtime path is:

`semantic/visual ref -> visualRegistry -> optional assetRef -> VisualEntity -> bundled asset or existing Kidsplay SVG fallback`

## Rules

1. No external SVG, sprite, sound or illustration is bundled until its exact source and license are recorded.
2. Code license and artwork license may differ. Record the artwork license.
3. Prefer MIT / Apache-2.0 / BSD / CC0 for reusable primitives and utility art.
4. CC-BY can be used when attribution is operationally acceptable and is automatically included in product notices.
5. Share-alike, GPL-family, unclear or per-asset licensing is reference-only unless deliberately reviewed for that exact use.
6. Never bulk-copy example assets merely because the engine/library code is permissively licensed.
7. Keep the base APK small: import only assets actually referenced by published content; richer packs can later be downloadable.
8. Builds and tests must not fetch artwork from the network. Asset synchronization is an explicit authoring action.

## Sources reviewed so far

| Source | License signal | Status | Useful for / use in this branch |
| --- | --- | --- | --- |
| `microsoft/fluentui-emoji` | MIT; exact license retained with bundled files | Approved | 34 small static SVG semantic assets pinned to commit `1ffb34c752ecf5d402f04cfb4b392c77f57c54bc`, each with exact upstream path and Git-blob SHA provenance |
| Kenney assets | Official support policy states asset-page game assets are CC0 and attribution is not required | Approved source policy | Optional game/object artwork; no Kenney file is bundled by this branch and any future item still needs exact pack/item provenance |
| `tabler/tabler-icons` | MIT; repository explicitly describes SVG icons as MIT-licensed | Approved | UI controls, arrows, generic objects and interaction symbols; no new Tabler file is bundled by this branch |
| `jdecked/twemoji` | Graphics have a separate `LICENSE-GRAPHICS` under CC-BY-4.0 | Candidate | Consistent animal/object SVGs; attribution required |
| `googlefonts/noto-emoji` | GitHub repository metadata reports OFL-1.1 | Candidate | Emoji-style animal/object reference; no asset-level license is asserted until an exact selected path/license is verified |
| `game-icons/icons` | Repository metadata reports `NOASSERTION`; licensing is not safe to assume globally | Reference only | Shape/symbol inspiration; exact asset review required |
| Platform Unicode emoji | No artwork file bundled by Kidsplay | Prototype fallback | Zero-production-cost placeholders, but inconsistent across devices |

## Bundled semantic set

The initial 10-file Fluent proof set covered dog, whale, cow, camel, rabbit, bird, fish, tree, sun, and bone. Issue #62 adds 24 exact, byte-identical Fluent SVGs for cat, frog, duck, tiger, butterfly, honeybee, milk, honey, butter, cooked rice, eyes, ear, nose, tongue, tooth, lungs, anatomical heart, lotus, water wave, cloud, balloon, candle, kite, and sailboat. The water-wave file intentionally owns both `entity.habitat.water` and `entity.habitat.ocean`; one upstream file is reused rather than duplicated. All files live under `public/assets/open/fluent/`, and the source revision/path/blob SHA for every file is recorded in `content/assets/registry.json`. No upstream pack is copied wholesale.

The current validator permits only byte-identical, `unmodified` third-party proof assets. Modified upstream artwork is deliberately blocked until a separate reviewed content-hash policy is introduced.

## Deterministic authoring workflow

1. Review a source and pin an immutable revision/path for the exact file.
2. Add the asset to `content/assets/registry.json`, including semantic `visualRefs`, local path, license metadata, modification status, and upstream Git blob SHA.
3. Run `node scripts/sync-open-assets.mjs <asset-id>` explicitly when authoring. The sync command verifies downloaded bytes before writing them and is intentionally not part of `npm run check`.
4. Run `node scripts/validate-assets.mjs`. Validation is offline and fails on missing/unregistered files, non-approved sources, path escapes, duplicate semantic ownership, missing license/attribution requirements, or provenance-hash drift.
5. Normal `npm run check` remains offline; the asset behavior test invokes the same validator against the checked-in files.

## Character-system direction

The long-term goal is **not** to accumulate thousands of finished animations. It is a modular scene/character system:

```text
character identity
  + base body / silhouette
  + orientation (front / side)
  + pose (stand / walk / swim / sit)
  + expression (happy / afraid / curious)
  + prop (bone / ball / food / book)
  + relation cue (heart / arrow / cross / question)
  + cheap motion (bounce / wiggle / float / translate)
```

A dog-playing scene should therefore be assembled from reusable dog + happy pose + ball + small motion, not stored as a bespoke animation. A dog-in-water teaching scene can reuse the same dog identity with an afraid expression and water background.

## Next asset research

- Find a genuinely permissive **modular character/animal source** where poses or body parts can be adapted without share-alike complications.
- If no good source exists, create a very small original Kidsplay SVG kit using consistent geometric primitives and use external permissive icon/emoji sources only for props/background objects.
- Keep generated third-party notices and exact provenance validation mandatory before adding any attribution-requiring artwork.

## Breadth pass 2 selection evidence

Issue #62 starts from the current outputs of `node scripts/report-visual-opportunities.mjs` and `node scripts/report-visual-coverage.mjs`, then intersects those gaps with stable semantic refs already present in the Class 2/Class 3 visual registries. The admitted priority order is: repeated animal concepts; foundational food/body/sense concepts; then reusable scene primitives (water, cloud, balloon, candle, kite, sailboat) and lotus. This keeps the pass source-agnostic and independent of question wording or IDs.

| Candidate | Decision | Reason |
| --- | --- | --- |
| Fluent Red apple -> `entity.food.apple` | Deferred | An exact upstream asset and canonical visual ref both exist, but the current report-driven pass ranked other repeated gaps higher. Keep the existing local fallback and defer this extra byte rather than widening the 24-file admission batch without a stronger coverage need. |
| Fluent Banana, Carrot, Tomato | Deferred | Exact upstream art exists, but no matching canonical visual ref was confirmed in the current visual registry during this pass. Do not create asset-only orphan semantics. |
| Fluent Sheaf of rice -> `entity.food.wheat` | Rejected | Semantic mismatch: rice grain is not wheat. |
| Fluent Tangerine -> `entity.food.orange` | Rejected | Near-match rather than exact source semantics; retain the current local fallback. |
| Fluent Leaf fluttering in wind -> `entity.plant.leaves` | Rejected | Singular moving leaf is not a stable representation of the plural leaves concept. |
| Twemoji / Noto candidates | Deferred | Their source records remain `candidate`; this pass uses only the already-approved Fluent source. |

The authoring sync fetches only explicitly registered files at the immutable Fluent revision. Normal builds and tests stay offline.
