# Kidsplay — canonical work targets

This file is the durable project-memory checkpoint for work on the `kidsplay` branch. Read this before relying on chat history.

## Product constraints

- Android is the shipping target.
- Ordinary development must remain browser-first and require only Node.js/npm locally.
- Broad foundational learning stays free as much as practical.
- Monetization should focus on structured goal paths such as Olympiad preparation, diagnostics, adaptive revision, mocks and advanced content.
- Keep development/content-production cost low through reusable systems rather than handcrafted one-off games.

## Architecture invariants

1. **Learnables define what the child should understand.**
2. **Questions are data.** They may declare an interaction contract but contain no renderer/component/game implementation.
3. **Interaction engines implement mechanics only.** They contain no curriculum answers, subject-specific knowledge or free/paid policy.
4. **Evaluation is separate from rendering.** Engines emit responses; evaluators decide correctness/partial score.
5. **Packs/paths own access and sequencing.** Free/paid/Olympiad logic must not leak into engines or individual questions.
6. Prefer reusing a mechanic over adding a new engine. Example: `drag_to_target@1` already covers drag-to-habitat, category sorting and visible semantic matching.
7. Prefer tiny browser-native DOM/SVG/CSS/Pointer Event primitives. Add canvas/physics/specialist dependencies only when an activity genuinely requires them.
8. Expensive generation such as crossword/maze layout should run in authoring/build compilation where possible; learner runtime should mostly render prepared data.
9. Maintain versioned interaction contracts and validate the full question bank before shipping.
10. Keep desktop development independent of Android Studio/SDK/JDK. GitHub Actions is the default Android APK proof path.

## Implemented interaction/runtime capability

- `single_choice@1`
- `word_bank_fill@1`
- `drag_to_target@1`
  - direct placement
  - category sorting
  - visible semantic matching
- `word_search@1`
  - seeded deterministic generation
  - shared grid primitives
  - drag selection and tap-first/tap-last fallback
- `memory_pairs@1`
  - semantic relations, not equality-only pairs
  - examples: DOG ↔ PET ANIMAL, TIGER ↔ WILD ANIMAL, BUTTERFLY ↔ INSECT
- reusable seeded random/shuffle
- reusable card-deck shuffle primitive
- reusable grid/line primitives
- scene renderer with lightweight CSS motion
- centralized external evaluator
- question-bank validation and automatic JSON discovery
- Capacitor Android packaging with GitHub Actions APK verification

## Immediate work targets

### P1 — mechanics multiplication

- [ ] Reorder/swap primitive.
- [ ] `sequence_order@1` using reorder/swap; first proof: lifecycle ordering.
- [ ] Hit-region primitive using normalized coordinates.
- [ ] `hotspot@1` / interactive-diagram selection; first proof: identify the correct animal/object in a scene-like board.

### P2 — compiled puzzle engines

- [ ] Crossword authoring/compiler layout.
- [ ] Tiny crossword learner renderer.
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

## Engine-admission test

Before creating a new engine, answer in order:

1. Can an existing engine express the activity with different question data?
2. Can a small shared mechanic primitive extend an existing engine?
3. Is the learner interaction semantically different enough to deserve a new versioned contract?
4. Can expensive work be moved to the compiler instead of learner runtime?
5. What APK/web-bundle footprint does the new capability add?

If questions 1 or 2 are yes, prefer reuse.

## GitHub project memory

- Canonical branch: `kidsplay`.
- Canonical tracker issue: #1 — **Kidsplay main work targets**.
- Keep this file and issue #1 updated when priorities or architecture decisions materially change.
- Do not depend on chat history for current project state when GitHub can be read instead.
