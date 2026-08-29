# Kidsplay — canonical work targets

This is the durable project-work checkpoint for branch `kidsplay`. For the smallest architecture resume context, read `docs/ARCHITECTURE_STATUS.md` first.

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
→ versioned delivery contract
→ interactive/output engine
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

## Architecture hardening passes — complete

Detailed rationale: `docs/DATA_CONNECTOR_ENGINE_REVIEW.md`.

- [x] Stable global row-ID migration; no `(dataRef,rowRef)` profile identity and no `$root` hack.
- [x] Remove curricular grade from reusable knowledge proof data; legacy/manual question `gradeBands` is optional descriptive metadata only.
- [x] Shared datatype normalizer layer used by index and formatter flows.
- [x] Central engine manifest + cross-registry consistency validation.
- [x] Actual profile/session planner proof: profile + skill → rows → datatype-compatible engines → formatter contracts.
- [x] Controlled learning taxonomy for levels/fits/skills.
- [x] Precise prototype profile fields separate curriculum from assessment and mark mappings `prototype_unverified`.
- [x] Interactive vs output-engine separation proven by `print_cards@1`.
- [x] Same association data feeds printable cards without edits to knowledge rows.
- [x] Planner/delivery/evaluation row-level traceability through `knowledgeRefs` / `knowledgeEvidence`.
- [x] Full Android CI proof through debug APK build/upload on code head `8fd561ea2c0f1f721897bf82724fbac78f1610e1` (run `33247501063`).

## Current profile/index capability

- [x] Central profile registry.
- [x] Separate many-to-many profile membership collections using stable row IDs.
- [x] Membership `fit`: review/core/stretch/challenge.
- [x] Cross-datatype generated learning index.
- [x] Query by profile/country/grade/curriculum/assessment/skill/level/datatype/topic/concept.
- [x] Profile planner with delivery category (`interactive` vs `output`) and engine variety.
- [ ] Add profile/membership provenance, reviewed syllabus/assessment version and effective dates before official-alignment claims.

## Next datatype/content targets

Add only when real content needs the semantic shape:

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
- [ ] Find permissively licensed modular character/animal source.
- [ ] Build reusable poses/parts and cheap expression/action variants.

## GitHub project memory

- Canonical branch: `kidsplay`.
- Compact current architecture: `docs/ARCHITECTURE_STATUS.md`.
- Canonical tracker: issue #1.
- Detailed architecture review: `docs/DATA_CONNECTOR_ENGINE_REVIEW.md`.
- Formatter rationale: `docs/KNOWLEDGE_FORMATTERS.md`.
- Profile/index rationale: `docs/CURRICULUM_METADATA.md`.
- Keep static GitHub checkpoints current so future sessions do not depend on chat history.
