# Open semantic asset sources

Kidsplay treats third-party artwork as optional presentation data. Question logic, knowledge rows, evaluators, and interaction engines never depend on an external artwork pack.

The runtime path is:

`semantic/visual ref -> visualRegistry -> optional assetRef -> VisualEntity -> bundled asset or existing Kidsplay SVG fallback`

## Reviewed sources

| Source | Review status | License | Use in this branch |
| --- | --- | --- | --- |
| Microsoft Fluent Emoji | Approved | MIT | 10 small static SVG proof assets, pinned to commit `1ffb34c752ecf5d402f04cfb4b392c77f57c54bc` with exact source-path and Git-blob SHA provenance. The MIT notice is retained beside the bundled files. |
| Kenney assets | Approved source policy | CC0-1.0 | No Kenney file is bundled yet. Kenney's official support policy states game assets on its asset pages are CC0 and attribution is not required; an eventual import must still record the exact pack/item provenance. |
| Tabler Icons | Approved | MIT | Existing registry source for utility/object icon use. No new Tabler file is bundled by this branch. |
| jdecked Twemoji | Candidate | CC-BY-4.0 graphics | Not bundled by this branch. Attribution is required if adopted. |
| Google Noto Emoji | Candidate | Repository metadata reports OFL-1.1 | Not bundled by this branch. No asset-level license is asserted until an exact path is separately reviewed. |
| Game Icons | Reference only | Per-asset | Do not bulk import; exact author/license review is required for every selected item. |

The authoritative machine-readable record is `content/assets/registry.json`.

## Deterministic authoring workflow

Bundled third-party files live only under `public/assets/open/`. Builds and tests never fetch artwork from the network.

1. Review a source and pin an immutable revision/path for the exact file.
2. Add the asset to `content/assets/registry.json`, including its semantic `visualRefs`, local path, license metadata, modification status, and upstream Git blob SHA.
3. Run `node scripts/sync-open-assets.mjs <asset-id>` explicitly when authoring. The sync command verifies the downloaded bytes before writing them and is intentionally not part of `npm run check`.
4. Run `node scripts/validate-assets.mjs`. Validation is offline and fails on missing/unregistered files, non-approved sources, path escapes, duplicate semantic ownership, missing license/attribution requirements, or provenance-hash drift.
5. Normal `npm run check` remains offline; the asset behavior test invokes the same validator against the checked-in files.

Modified upstream artwork is intentionally blocked by the current validator. Add an explicit reviewed content-hash policy before allowing modified third-party files rather than silently weakening provenance checks.
