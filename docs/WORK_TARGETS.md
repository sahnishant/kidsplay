# Kidsplay — canonical work targets

This file is the durable project-memory checkpoint for work on the `kidsplay` branch. Read this before relying on chat history.

## Product constraints

- Android is the shipping target; ordinary development stays Node/npm + browser only.
- Broad foundational learning stays free as much as practical.
- Monetize structured goal paths, diagnostics, adaptation, mocks and advanced preparation.
- Keep development/content-production cost low through reusable systems rather than handcrafted games/questions.

## Architecture invariants

1. Reusable data is stored by versioned **datatype** (`kind` + `version`).
2. The datatype registry centrally declares which delivery engines each datatype can feed; individual records do not repeat engine lists.
3. Every addressable knowledge unit has a globally stable `rowId`; storage files/containers are organization only.
4. A datatype normalizer is the single interpreter of each stored schema and emits canonical knowledge units.
5. Learning profiles own country/curriculum/grade/exam membership through row-ID collections; reusable knowledge does not own curricular placement.
6. `knowledgeLevel`, profile `fit`, and generated activity `difficulty` are separate axes.
7. A selector/planner chooses rows + engines; a formatter converts normalized data to a target delivery contract; an engine only presents/collects interaction.
8. Recipes choose which compatible output to create now; compatibility does not force materializing every possible activity.
9. Generated question JSON is a build/cache artifact, not the primary source of truth.
10. Evaluation is separate from rendering; packs/products own access/commercial policy.
11. Reuse mechanics, datatype adapters and formatter paths before adding engines or new datatypes.
12. Expensive generation such as crossword/maze/layout belongs in compilation when possible.
13. External assets require registry/license review.

## Implemented datatypes

- `choice_item@1` → currently `single_choice@1`
- `association_set@1` → single choice, word-bank fill, drag/match, memory, word search, crossword

## Implemented delivery engines

- `single_choice@1`
- `word_bank_fill@1`
- `drag_to_target@1`
- `word_search@1`
- `memory_pairs@1`
- `sequence_order@1`
- `hotspot@1`
- `crossword@1`
- `maze_path@1`

## Learning profile model

Knowledge rows store intrinsic metadata such as `knowledgeLevel` and `skills`. Profiles such as `CBSE_INDIA_CLASS1` or `SOF_INDIA_CLASS2` own row membership separately and can classify each membership as `review`, `core`, `stretch`, or `challenge`.

Long-term database shape:

```text
knowledge_row(id, datatype, payload, knowledge_level, ...)
learning_profile(id, country, curriculum/assessment, grade, ...)
profile_membership(profile_id, row_id, fit, provenance, effective_version, ...)
```

## Architecture hardening — active mandate

Detailed review: `docs/DATA_CONNECTOR_ENGINE_REVIEW.md`.

### P0

- [x] Migrate addressable knowledge to globally stable `rowId`; profile collections reference `rowId` directly and no longer use `(dataRef,rowRef)` or `$root`.
- [x] Remove source-level curricular `gradeBands` from reusable knowledge proof data; generated formatter output no longer inherits grade placement. Legacy/manual question `gradeBands` is optional descriptive metadata only.
- [x] Add one datatype normalizer per implemented datatype; formatters and cross-datatype indexing share normalized canonical units instead of independently reinterpreting stored schemas.
- [ ] Add central engine manifest + cross-registry consistency validation.

### P1 after P0

- [ ] Split interactive engines from future output engines such as `print_cards@1` / worksheet/PDF export.
- [ ] Replace overloaded profile metadata (`boardOrGoal`) with explicit curriculum/assessment fields when real profile data is added.
- [ ] Centralize controlled taxonomies such as `skills`.
- [ ] Add profile/membership provenance, official syllabus/exam version and effective dates before official-alignment claims.
- [ ] Avoid pre-generating row × profile × engine × difficulty matrices; generate/cache contracts from reusable data and session/pack plans.

## Next datatype targets — only after P0 is fully green

- [ ] `passage@1` with reviewed claims/spans/entities.
- [ ] `entity_table@1` for attributes/classification/compare.
- [ ] `ordered_process@1`.
- [ ] `labeled_diagram@1`.
- [ ] Better generic distractor policies.
- [ ] Stable asset/media refs.
- [ ] Source revision/provenance tracking.

## Future engine expansion rule

When adding a new engine such as `print_cards@1`:

1. implement its versioned delivery/output contract;
2. add it once to every compatible datatype;
3. extend those generic formatter paths once;
4. existing rows become eligible automatically when datatype requirements are met;
5. profiles/plans decide which rows should be used for a particular goal.

Do not edit every knowledge record just to add a new engine capability.

## Presentation assets

- [x] Asset/license admission registry.
- [x] Build-time third-party notice generation.
- [ ] Find permissively licensed modular character/animal source.
- [ ] Build reusable poses/parts and cheap expression/action variants.

## Compiler/runtime policy

`npm run compile:content` runs before desktop dev/build. Stored knowledge is normalized first, then formatted into delivery contracts. Crossword-capable output flows through the existing crossword layout compiler; mazes compile seeds to wall bitmasks; asset notices compile from the asset registry. Generated artifacts are ignored by git.

## GitHub project memory

- Canonical branch: `kidsplay`.
- Canonical tracker: issue #1.
- Architecture review: `docs/DATA_CONNECTOR_ENGINE_REVIEW.md`.
- Formatter design: `docs/KNOWLEDGE_FORMATTERS.md`.
- Profile/index design: `docs/CURRICULUM_METADATA.md`.
- Keep this file and issue #1 synchronized after material architecture changes.
