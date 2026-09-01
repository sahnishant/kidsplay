# #112 semantic animation coverage delta

The repository coverage report is deterministic from `content/animations/**`, `content/scenes/**` and the presentation registries.

## Before #112

- Authored semantic compositions: **8**
- Compositions referenced by child-facing scenes: **7**
- Composed child-facing scenes: **7**
- Registered semantic visuals: **276**
- Semantic identities: **4** (`dog`, `whale`, `bird`, `cow`)
- Multi-state semantic identities: **1** (`dog`)
- Legacy science scenes migrated by this issue: **0/9**
- Visual-friendly question items: **601/1459 (41.2%)**
- Sequence-order visual items: **13/143 (9.1%)**

## Final #112 implementation

- Authored semantic compositions: **25**
- Compositions referenced by child-facing scenes: **24**
- Composed child-facing scenes: **24**
- Registered semantic visuals: **290**
- Child-facing used visual refs: **53**
- Semantic identities: **18**
- Multi-state semantic identities: **3** (`dog`, `wind`, `water-state-change`)
- Static/reduced-motion meaningful compositions: **25/25**
- Assessment/presentation policy failures: **0**
- Semantic animation safety/reference failures: **0**
- Legacy science scenes migrated: **9/9**
- Visual-friendly question items: **609/1459 (41.7%)**
- Sequence-order visual items: **20/143 (14.0%)**
- Production CSS bundle after optimization: **99.7 KiB**, under the existing 100 KiB gate

## Reviewed process coverage

All five reviewed canonical process rows in `content/knowledge/vocabulary-processes.json` now have static-complete semantic reinforcement scenes:

1. germination — seed → sprout → young plant;
2. melting — ice → liquid water;
3. freezing — liquid water → ice;
4. opening — closed → open;
5. filling — empty → partly full → full.

Melting and freezing reuse one `water-state-change` semantic identity and select direction from the authored endpoint visual state.

## Additional reviewed science concepts

The same generic composition system also reinforces reviewed Class 3 rows for:

- Earth revolution around the Sun / about one year;
- planets moving around the Sun along an orbit;
- liquid taking the shape of the part of its container that it fills.

These mappings remain presentation-only and are suppressed wherever inferred scenes are disabled.

The one intentionally authored-but-not-scene-integrated composition remains `animation.dog.curious-bone`; #112 does not alter that pre-existing state.

Final exact-head CI output is authoritative for merge readiness.
