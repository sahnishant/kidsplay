# Kidsplay — canonical work targets

This is the durable project-work checkpoint for branch `kidsplay`. For the smallest resume context, read `docs/ARCHITECTURE_STATUS.md` first; GitHub issue #1 is the canonical live execution tracker.

## Product constraints

- Android is the shipping target; ordinary development stays Node/npm + browser only.
- Broad foundational learning stays free as much as practical.
- Monetize structured goal paths, diagnostics, adaptation, mocks and advanced preparation.
- Keep development/content-production cost low through reusable systems rather than handcrafted games/questions.

## Architecture mandate — complete

Canonical flow:

```text
stored data
→ datatype normalizer
→ canonical knowledge units
→ profile/index selector + planner
→ formatter(data, engine, recipe)
→ optional compiler
→ generated/cache delivery questions with knowledgeRefs
→ runtime catalog/profile selector
→ interactive/output delivery
→ evaluator/persisted progress
```

Core invariants remain complete: stable `rowId`, shared normalizers, profile-owned curriculum placement, independent knowledge/profile/activity difficulty axes, build/cache questions, reusable engines, and row-level traceability.

## First product vertical slice — complete

- [x] Svelte home/catalog replaces hard-coded pack bootstrap.
- [x] Player name/avatar stored locally.
- [x] Free Explore and Goal Learning are distinct entry points.
- [x] SOF Class 2 goal is profile-driven through `SOF_INDIA_CLASS2`.
- [x] Runtime admits only generated questions whose complete `knowledgeRefs` set belongs to the profile.
- [x] Goal selection uses profile fit, unseen/weaker mastery and engine variety.
- [x] Attempts, row evidence and concept mastery persist offline.
- [x] Progress summary is visible on home.
- [x] Free-vs-purchase policy is visible without premature payment/account infrastructure.
- [x] Product/catalog CI validates real profile/membership links and runnable knowledge-backed goal content.

## Behavioral protection — complete for current slice

Behavior tests now run inside `npm run check` using Vitest + Svelte Testing Library + jsdom.

- [x] Free-vs-goal catalog behavior.
- [x] Profile isolation via complete `knowledgeRefs` membership.
- [x] Mastery feedback into later profile selection.
- [x] Session single-submit, advance and replay state.
- [x] Runtime engine registry coverage across all nine shipped interactive engine types.
- [x] Local player/attempt/mastery persistence and mastery summary.
- [x] Svelte home → goal session → home behavior.
- [x] Engine submission → feedback → completion behavior.

Verified behavioral-test head: `184c5d0e9a075df10eb1c71afdba607c3f1051dd`; Android run `33254579606` passed through APK artifact upload.

## Alignment provenance — infrastructure complete

- [x] Central alignment-source registry.
- [x] Every profile has explicit source refs/version applicability metadata.
- [x] Every membership collection has provenance and placement-basis metadata.
- [x] `reviewed` profile status requires a reviewed official source + version + review date + applicability.
- [x] `reviewed` membership status independently requires equivalent evidence.
- [x] SOF Class 2 profile scope reviewed against official current ISO syllabus plus official 2026-27 reference.
- [x] Keep existing SOF row placements `prototype_unverified`; reviewed syllabus scope does not automatically validate individual row fits.

Detailed contract: `docs/CURRICULUM_METADATA.md`.

## Current profile/index capability

- [x] Central profile registry.
- [x] Many-to-many row-ID membership collections.
- [x] Membership fit: review/core/stretch/challenge.
- [x] Cross-datatype learning index/query.
- [x] Profile planner with engine variety.
- [x] Runtime profile sessions driven by generated knowledge references + mastery.
- [x] Profile and membership provenance model.
- [x] Reviewed-alignment evidence gate.
- [ ] Review real row-level SOF memberships/fits against sources before marking membership provenance reviewed.

## Next P0 — build real reviewed SOF Class 2 content

The current knowledge bank is still a proof set. The next pass should be content-first rather than architecture-first.

- [ ] Expand reusable Class 2 science/EVS knowledge across the reviewed SOF 2026-27 scope, starting with current datatypes.
- [ ] Start with high-reuse areas such as Animals and Plants, then Human Body, Food, Housing/Clothing, Safety, Transport/Communication, Air/Water/Rocks, Earth/Universe.
- [ ] Attach source/provenance evidence to row placement decisions.
- [ ] Review `fit` (`review/core/stretch/challenge`) rather than inferring it from the broad syllabus heading.
- [ ] Reuse the same knowledge rows in free exploration and SOF goal preparation.
- [ ] Add representative logical-reasoning/HOTS recipes only after the underlying knowledge slice is broad enough.
- [ ] Observe real schema pressure before adding new datatypes.

## P1 — semantic datatypes only when real content needs them

- [ ] `passage@1` for comprehension/claim reuse.
- [ ] `entity_table@1` for attributes/classification/compare.
- [ ] `ordered_process@1` for lifecycle/procedure/timeline.
- [ ] `labeled_diagram@1` for hotspot/label/matching.
- [ ] Better distractor policies using category/type/misconception metadata.
- [ ] Stable media/asset refs on canonical knowledge units.
- [ ] Source revision/provenance policy for generated item families.

## Presentation assets — separate workstream

- [x] Asset/license admission registry.
- [x] Build-time third-party notices.
- [ ] Admit a permissively licensed modular character/animal source with exact per-asset provenance.
- [ ] Build reusable poses/parts and cheap expression/action variants.
- [ ] Replace platform emoji scenes incrementally without coupling art to question types.

## Branch/release hygiene

- Canonical branch: `kidsplay`.
- `kidsplay-work` is temporary/divergent; do not merge wholesale; delete when convenient (issue #2).
- `main` remains the repository-initialization baseline.
- Do not promote to `main` merely because architecture/tests are green; first land a meaningful reviewed content slice so the promoted baseline represents a useful product rather than a proof bank.

## GitHub project memory

- Compact current state: `docs/ARCHITECTURE_STATUS.md`.
- Canonical live tracker: issue #1.
- Profile/alignment contract: `docs/CURRICULUM_METADATA.md`.
- Detailed architecture review: `docs/DATA_CONNECTOR_ENGINE_REVIEW.md`.
- Formatter rationale: `docs/KNOWLEDGE_FORMATTERS.md`.
- Keep static GitHub checkpoints current so future sessions do not depend on chat history.
