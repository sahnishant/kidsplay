# Kidsplay — canonical work targets

This is the durable project-work checkpoint for branch `kidsplay`. For the smallest resume context, read `docs/ARCHITECTURE_STATUS.md` first; GitHub issue #1 is the canonical live execution tracker.

## Product constraints

- Android is the shipping target; ordinary development stays Node/npm + browser only.
- Broad foundational learning stays free as much as practical.
- Monetize structured goal paths, diagnostics, adaptation, mocks and advanced preparation.
- Keep development/content-production cost low through reusable systems rather than handcrafted games/questions.

## Architecture mandate — complete

Canonical build/runtime flow:

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
→ evaluator/progress
```

### Core invariants

- [x] Versioned datatypes centrally own compatible engine lists; records do not repeat them.
- [x] Every addressable knowledge unit has globally stable `rowId`.
- [x] Datatype normalizers are the single interpreters of stored schemas.
- [x] Learning profiles own country/curriculum/assessment/grade membership through row-ID collections.
- [x] `knowledgeLevel`, profile `fit`, and generated activity `difficulty` are independent axes.
- [x] Planner/connector selects rows + engines; formatter only transforms; engine only delivers.
- [x] Generated question JSON is a disposable build/cache artifact, not knowledge truth.
- [x] Evaluation is separate from rendering; access/commercial policy is separate from knowledge.
- [x] Stable `knowledgeRefs` survive formatter/compiler boundaries and evaluation emits row-level `knowledgeEvidence`.

## First product vertical slice — complete

Verified product code head: `7498fd91337fd3ce99a8da787f0fda5f730f8a99`.
Android debug APK workflow run `33250347492`: passed through artifact upload.

- [x] Svelte home/catalog replaces direct hard-coded Animals-pack bootstrap.
- [x] Child name and lightweight avatar choice are persisted locally.
- [x] Free Explore and Goal Learning are distinct product entry points.
- [x] Class 2 EVS Olympiad prototype is linked to `SOF_INDIA_CLASS2` through `profileRef`.
- [x] Runtime goal selection uses generated knowledge-backed questions and stable `knowledgeRefs` rather than duplicating curriculum facts in UI/engines.
- [x] A goal question is admitted only when all of its `knowledgeRefs` belong to the profile membership.
- [x] Goal selection prioritizes profile fit, unseen/weaker row mastery and engine variety.
- [x] Attempts, row-level knowledge evidence and concept mastery are stored offline in local storage.
- [x] Progress summary is visible on home.
- [x] Free-vs-purchase access policy is visible; prototype goal remains tryable while payment/account infrastructure is deliberately deferred.
- [x] CI validates that every goal path points to a real profile/membership and has runnable generated knowledge-backed content.
- [ ] Add behavioral tests for catalog/profile selection, session progression, persistence and mastery updates.

## Implemented datatypes

- `choice_item@1` → `single_choice@1`
- `association_set@1` → `single_choice@1`, `word_bank_fill@1`, `drag_to_target@1`, `memory_pairs@1`, `word_search@1`, `crossword@1`, `print_cards@1`

## Implemented delivery engines

### Interactive
- `single_choice@1`
- `word_bank_fill@1`
- `drag_to_target@1`
- `word_search@1`
- `memory_pairs@1`
- `sequence_order@1`
- `hotspot@1`
- `crossword@1`
- `maze_path@1`

### Output
- `print_cards@1`

## Current profile/index capability

- [x] Central profile registry.
- [x] Separate many-to-many profile membership collections using stable row IDs.
- [x] Membership `fit`: review/core/stretch/challenge.
- [x] Cross-datatype generated learning index.
- [x] Query by profile/country/grade/curriculum/assessment/skill/level/datatype/topic/concept.
- [x] Profile planner with delivery category (`interactive` vs `output`) and engine variety.
- [x] Runtime goal session can select generated cache activities by profile row membership and mastery.
- [ ] Add profile/membership provenance, reviewed syllabus/assessment version and effective dates before official-alignment claims.
- [ ] Reject `reviewed`/official alignment unless provenance/version/effective-date evidence is present.

## Next product/content targets

### P0 — protect and feed the product

- [ ] Add behavioral tests around the new home/catalog/profile/progress vertical slice.
- [ ] Add a meaningful reviewed Class 2 EVS/SOF content slice using the current datatypes first.
- [ ] Add source/provenance metadata and syllabus/assessment versions before official alignment language.
- [ ] Exercise the same reusable knowledge in both free exploration and structured goal sessions without copying facts.

### P1 — add semantic datatypes only when real content needs them

- [ ] `passage@1` with reviewed claims/spans/entities.
- [ ] `entity_table@1` for attributes/classification/compare.
- [ ] `ordered_process@1` for lifecycle/procedure/timeline reuse.
- [ ] `labeled_diagram@1` for hotspot/label/matching reuse.
- [ ] Better generic distractor policies using category/type/misconception metadata.
- [ ] Stable media/asset refs on canonical units.
- [ ] Source revision/provenance policy for generated item families.

## Future engine expansion rule

When adding an engine:

1. add its versioned manifest entry and delivery/output implementation;
2. add it once to every compatible datatype;
3. extend generic formatter edges once;
4. manifest validation must stay green;
5. existing rows automatically become eligible when datatype requirements are met;
6. profile/session planning decides where the output is actually used.

Do not mass-edit knowledge rows to add an engine.

## Presentation assets — separate workstream

- [x] Asset/license admission registry.
- [x] Build-time third-party notice generation.
- [ ] Find/admit a permissively licensed modular character/animal source with exact per-asset provenance.
- [ ] Build reusable poses/parts and cheap expression/action variants.
- [ ] Replace platform emoji scenes incrementally without coupling art to question types.

## Branch/release hygiene

- Canonical branch: `kidsplay`.
- `kidsplay-work` is temporary/divergent; do not merge wholesale; delete when convenient (issue #2).
- `main` remains the repository-initialization baseline.
- [ ] Add behavioral tests, then decide whether this first end-to-end product baseline is ready to promote to `main`.

## GitHub project memory

- Compact current state: `docs/ARCHITECTURE_STATUS.md`.
- Canonical live tracker: issue #1.
- Detailed architecture review: `docs/DATA_CONNECTOR_ENGINE_REVIEW.md`.
- Formatter rationale: `docs/KNOWLEDGE_FORMATTERS.md`.
- Profile/index rationale: `docs/CURRICULUM_METADATA.md`.
- Keep static GitHub checkpoints current so future sessions do not depend on chat history.
