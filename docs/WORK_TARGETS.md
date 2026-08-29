# Kidsplay — canonical work targets

This file is the durable project-memory checkpoint for work on the `kidsplay` branch. Read this before relying on chat history.

## Product constraints

- Android is the shipping target.
- Ordinary development must remain browser-first and require only Node.js/npm locally.
- Broad foundational learning stays free as much as practical.
- Monetization should focus on structured goal paths such as Olympiad preparation, diagnostics, adaptive revision, mocks and advanced content.
- Keep development/content-production cost low through reusable systems rather than handcrafted one-off games.

## Architecture invariants

1. Learnables define what the child should understand.
2. Knowledge sources store reusable facts, relations, passages, processes or annotated content.
3. Formatters convert `(data, engine, recipe)` into versioned engine-ready question contracts; formatter code contains no curriculum facts.
4. Questions are data and may be manual or compiled; generated question JSON is a build artifact, not necessarily the authoring source of truth.
5. Interaction engines implement mechanics only; no curriculum answers, topic knowledge or access policy.
6. Evaluation is separate from rendering.
7. Packs/paths own access and sequencing.
8. Reuse mechanics before adding engines; `drag_to_target@1` already covers placement, sorting and visible semantic matching.
9. Reuse formatters before adding source-specific transforms; formatters scale by source shape + engine, not by individual fact.
10. Prefer browser-native DOM/SVG/CSS/Pointer Events; add canvas/physics only when justified.
11. Expensive generation such as crossword/maze layout belongs in authoring/build compilation when possible.
12. Maintain versioned contracts and validate the full bank.
13. Desktop development remains Node/npm only; GitHub Actions is the default Android proof path.
14. External assets require an entry in `content/assets/registry.json`; public GitHub availability alone is never sufficient licensing evidence.

## Implemented interaction/runtime capability

- `single_choice@1`
- `word_bank_fill@1`
- `drag_to_target@1` — placement, category sorting, visible semantic matching
- `word_search@1` — seeded generation, grid primitives, drag/tap selection
- `memory_pairs@1` — semantic relations such as DOG ↔ PET ANIMAL
- `sequence_order@1` — shared reorder/swap/move primitive
- `hotspot@1` — normalized hit regions, single/multiple selection
- `crossword@1` — precompiled connected layout + tiny learner grid/clue renderer
- `maze_path@1` — precompiled seeded wall graph + tiny tap-to-path renderer
- reusable seeded random/shuffle, card-deck, grid/line, reorder, normalized-region and maze traversal mechanics
- scene renderer with lightweight CSS motion
- centralized external evaluator
- automatic question JSON discovery and content validation
- Capacitor Android packaging with GitHub Actions APK verification

## P1 — mechanics multiplication

- [x] Reorder/swap primitive and `sequence_order@1`.
- [x] Normalized hit-region primitive and `hotspot@1`.

## P2 — compiled puzzle engines

- [x] Crossword authoring/compiler + tiny learner renderer.
- [x] Maze compiler + tiny learner path renderer.

## P3 — reusable presentation assets

- [x] Define asset registry and license/attribution inventory.
- [x] Add build-time third-party artwork notice generation from the registry.
- [ ] Find a permissively licensed modular character/animal source.
- [ ] Build modular character poses/parts rather than full custom animation sequences.
- [ ] Support cheap expression/action variants: happy, afraid, walking, swimming, playing, holding/near object, love/attention cues.

## P4 — knowledge → formatter → engine

- [x] Add reusable `association_set@1` knowledge source shape.
- [x] Add source-level `canGenerate` capability declarations.
- [x] Separate activity recipes from the source facts.
- [x] Add generic `formatDataForEngine(data, engine, recipe)` registry.
- [x] One five-animal dataset generates semantic memory, visible matching, word search, crossword, MCQ and fill-in-the-blank.
- [x] Reuse the existing crossword compiler rather than duplicating layout logic in the formatter.
- [ ] Add `passage@1` with reviewed claim/span annotations.
- [ ] Add `entity_table@1` for attributes, classification and compare/contrast.
- [ ] Add better distractor policies using type/category/misconception metadata.
- [ ] Add asset/media references to generic option/card/item payloads.
- [ ] Add provenance/review metadata for generated item families and source revisions.

## Further mechanics backlog

Build only when a learning use case exists and reuse primitives first: mark words, multiple select, missing letters / word scramble, timeline, branching story, tracing / connect-the-dots, jigsaw / assemble scene, sliding tiles, bingo, logic grid, interactive diagram labels, optional tiny canvas loop, optional specialist physics.

## Compiler/runtime policy

`npm run compile:content` runs before desktop dev/build. Knowledge sources are formatted into generated engine contracts first. Crossword-capable formatter output flows into the existing crossword layout compiler. Mazes compile seeds/dimensions into wall bitmasks. Asset notices compile from the asset admission registry. Generated question JSON, generated crossword authoring JSON and generated notice text are ignored by git.

## Engine-admission test

Before creating a new engine:

1. Can an existing engine express it with different question data?
2. Can a small shared mechanic extend an existing engine?
3. Is the learner interaction genuinely different enough for a new versioned contract?
4. Can expensive work move to the compiler?
5. What bundle/APK footprint does it add?

If 1 or 2 is yes, prefer reuse.

## Formatter-admission test

Before creating a new formatter:

1. Can the existing source shape express the knowledge?
2. Can an existing formatter + recipe express the target engine contract?
3. Is the transformation generic across many datasets, or only convenient for one lesson?
4. Can formatting remain a pure function over reviewed data?
5. Can a specialist compiler (crossword/maze/etc.) be reused downstream instead of duplicated?

If the formatter would contain a specific animal, chapter answer or passage fact, it is designed incorrectly.

## GitHub project memory

- Canonical branch: `kidsplay`.
- Canonical tracker issue: #1 — Kidsplay main work targets.
- Architecture detail: `docs/KNOWLEDGE_FORMATTERS.md`.
- Keep this file and issue #1 updated when priorities or architecture decisions materially change.
- Read GitHub rather than depending on chat history for current state.
