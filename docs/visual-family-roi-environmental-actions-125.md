# #125 family-level ROI + environmental actions

Parent: #116 / PR #117
Depends on: #120 / PR #123

## Scheduler change

Per-semantic ROI is retained, but production planning now also aggregates already-authorized candidates by reusable `familyKey`. Review-only candidates never receive a family key and therefore cannot be promoted by aggregation.

The family queue reports aggregate ROI, unresolved occurrence count, semantic refs, engine breadth and profile breadth.

Examples of conservative family keys include `measurement`, `material-contrast`, `environmental-actions`, `orbit`, `soil-family`, and specific contrast families. Unmatched subjects remain `review_required` with no family key.

## Environmental-actions tranche

The post-material queue identifies `reduce`, `reuse`, and `recycle` as a 30-instance reusable family.

One generic `environmental-action-icon` renderer owns three distinct visual primitives:

- Reduce: three disposable/use items become one, communicating less use/waste.
- Reuse: the same bottle is surrounded by a return loop, communicating use again.
- Recycle: material sits inside a three-arrow processing loop.

The primitive aliases are sample-specific. The semantic words `reduce`, `reuse`, and `recycle` resolve through recipes and surface policy.

## Coverage gate

Certified #120 baseline: **714/1459 (48.9%)**.

The focused test pins the expected post-tranche target at:

- 299 visual primitives;
- 14 semantic recipes;
- **744/1459 (51.0%)** visual-friendly items;
- 135 recipe-resolved item instances.

If the canonical report differs, CI must fail rather than accepting a guessed claim.

## Safety

- family aggregation accepts only `automaticEligible=true` candidates;
- review-only vocabulary/predicate/unmatched semantics cannot enter the production family queue;
- no fuzzy matching;
- no per-question visual bank or engine mapping;
- no new evaluator/interaction runtime;
- reduced-motion remains meaningful because all action semantics are statically visible;
- SVG paint/strokes stay in markup and the 100 KiB CSS gate is unchanged.

## Exact-head gate

The final candidate is certified only after the pinned coverage assertion, Windows full check, Browser/Playwright, Android packaged offline/rotation smoke, and priority visual breadth all pass on the same SHA.
