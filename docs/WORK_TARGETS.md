# Kidsplay — canonical work targets

This file is the durable project-memory checkpoint for work on the `kidsplay` branch. Read this before relying on chat history.

## Core architecture

1. Reusable data is stored by versioned datatype (`kind` + `version`).
2. The datatype registry centrally declares which engines each datatype can feed; individual data records do not repeat engine lists.
3. Generic datatype→engine requirements decide whether a record is rich enough.
4. Formatters convert `(data, engine, recipe)` into versioned delivery contracts.
5. Recipes choose which compatible output to materialize.
6. Delivery engines contain no curriculum facts or access policy.
7. Generated questions can be compiled artifacts, not primary authoring data.
8. Reuse mechanics/formatters before adding new ones.

## Curriculum / selection architecture

1. Knowledge rows own only intrinsic learning metadata such as `knowledgeLevel` and `skills`.
2. Country/board/class/exam targeting lives in named learning profiles such as `SOF_INDIA_CLASS2`.
3. Profile membership collections link `(dataRef, rowRef)` to a `profileRef`; profile IDs are not repeated on the knowledge rows.
4. Membership is many-to-many: one row can belong to many profiles and one profile can combine rows from every datatype/database.
5. Membership carries contextual `fit`: review/core/stretch/challenge.
6. Build-time indexing joins all datatypes + all profile memberships so queries can span the entire knowledge bank.
7. `knowledgeLevel` is intrinsic familiarity; recipe/question `difficulty` is assessment challenge. Never conflate them.

## Implemented datatypes

- `choice_item@1` → `single_choice@1`.
- `association_set@1` → single choice, fill, drag/match, memory, word search, crossword.

## Implemented engines

- `single_choice@1`
- `word_bank_fill@1`
- `drag_to_target@1`
- `word_search@1`
- `memory_pairs@1`
- `sequence_order@1`
- `hotspot@1`
- `crossword@1`
- `maze_path@1`

## Cross-datatype profile/index proof

- [x] Central profile registry.
- [x] Separate profile membership collections.
- [x] Intrinsic knowledge levels: foundation/basic/intermediate/advanced/specialist.
- [x] Common skills tags such as vocabulary/classification/recall/reasoning.
- [x] Cross-datatype generated learning index.
- [x] Query tool for `country`, `grade`, `profile`, `skill`, `level`, datatype and topic.
- [ ] Add profile/membership provenance, syllabus version and effective dates before official-alignment claims.

## Next datatype targets

- [ ] `passage@1` with reviewed claims/spans/entities.
- [ ] `entity_table@1` for attributes/classification/compare.
- [ ] `ordered_process@1`.
- [ ] `labeled_diagram@1`.
- [ ] Better generic distractor policies.
- [ ] Stable asset/media references.
- [ ] Source revision/provenance tracking.

## Future engine expansion

Adding `print_cards@1` should require: implement engine/contract; add it once to compatible datatypes; extend generic formatters once; then existing data becomes eligible when generic requirements are met. No mass edits of knowledge records.

## Product constraints

- Android shipping target; ordinary development remains Node/npm + browser only.
- Broad foundational learning free where practical.
- Monetize structured goals, diagnostics, adaptation, mocks and advanced preparation.
- Expensive generation happens during compilation where practical.
- External assets require registry/license review.

## GitHub memory

- Canonical branch: `kidsplay`.
- Canonical tracker: issue #1.
- Formatter design: `docs/KNOWLEDGE_FORMATTERS.md`.
- Profile/index design: `docs/CURRICULUM_METADATA.md`.
