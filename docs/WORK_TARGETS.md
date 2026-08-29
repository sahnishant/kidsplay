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
2. Questions are data; no renderer/component/game implementation belongs in them.
3. Interaction engines implement mechanics only; no curriculum answers, topic knowledge or access policy.
4. Evaluation is separate from rendering.
5. Packs/paths own access and sequencing.
6. Reuse mechanics before adding engines; `drag_to_target@1` already covers placement, sorting and visible semantic matching.
7. Prefer browser-native DOM/SVG/CSS/Pointer Events; add canvas/physics only when justified.
8. Expensive generation such as crossword/maze layout belongs in authoring/build compilation when possible.
9. Maintain versioned contracts and validate the full bank.
10. Desktop development remains Node/npm only; GitHub Actions is the default Android proof path.

## Implemented interaction/runtime capability

- `single_choice@1`
- `word_bank_fill@1`
- `drag_to_target@1` — placement, category sorting, visible semantic matching
- `word_search@1` — seeded generation, grid primitives, drag/tap selection
- `memory_pairs@1` — semantic relations such as DOG ↔ PET ANIMAL
- `sequence_order@1` — shared reorder/swap/move primitive
- `hotspot@1` — normalized hit regions, single/multiple selection
- `crossword@1` — precompiled layout, tiny learner grid/clue renderer
- reusable seeded random/shuffle, card-deck, grid/line, reorder and normalized-region mechanics
- scene renderer with lightweight CSS motion
- centralized external evaluator
- automatic question JSON discovery and content validation
- Capacitor Android packaging with GitHub Actions APK verification

## Immediate work targets

### P1 — mechanics multiplication

- [x] Reorder/swap primitive.
- [x] `sequence_order@1`; butterfly lifecycle proof.
- [x] Hit-region primitive.
- [x] `hotspot@1`; water-animal proof.

### P2 — compiled puzzle engines

- [x] Crossword authoring/compiler layout.
- [x] Tiny crossword learner renderer.
- [ ] Maze compiler producing a cell/wall graph.
- [ ] Tiny maze/path learner renderer.

### P3 — reusable presentation assets

- [ ] Define asset registry and license/attribution inventory.
- [ ] Find permissively licensed/free SVG/character sources for inspiration/use where licenses permit.
- [ ] Build modular character poses/parts rather than full custom animation sequences.
- [ ] Support cheap expression/action variants: happy, afraid, walking, swimming, playing, holding/near object, love/attention cues.

### P4 — further mechanics backlog

Build only when a learning use case exists and reuse primitives first:

- mark words
- multiple select
- missing letters / word scramble
- timeline
- branching story
- tracing / connect-the-dots
- jigsaw / assemble scene
- sliding tiles
- bingo
- logic grid
- interactive diagram labels
- optional tiny canvas loop for arcade-like activities
- optional specialist physics only for genuine physics activities

## Compiler/runtime policy

Crossword authoring stores clues + answers. `npm run compile:content` generates the connected grid layout before Vite starts/builds. The generated question file is ignored by git. The learner runtime receives only rows/columns, entry starts/directions/lengths/clue numbers and the solution needed for offline evaluation. The same model should be used for mazes.

## Engine-admission test

Before creating a new engine:

1. Can an existing engine express it with different question data?
2. Can a small shared mechanic extend an existing engine?
3. Is the interaction semantically different enough for a new versioned contract?
4. Can expensive work move to the compiler?
5. What bundle/APK footprint does it add?

If 1 or 2 is yes, prefer reuse.

## GitHub project memory

- Canonical branch: `kidsplay`.
- Canonical tracker issue: #1 — Kidsplay main work targets.
- Keep this file and issue #1 updated when priorities or architecture decisions materially change.
- Read GitHub rather than depending on chat history for current state.
