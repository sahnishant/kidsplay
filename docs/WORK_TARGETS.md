# Kidsplay — canonical work targets

This file is the durable project-memory checkpoint for work on the `kidsplay` branch. Read this before relying on chat history.

## Product constraints

- Android is the shipping target; ordinary development stays Node/npm + browser only.
- Broad foundational learning stays free as much as practical.
- Monetize structured goal paths, diagnostics, adaptation, mocks and advanced preparation.
- Keep development/content-production cost low through reusable systems rather than handcrafted games/questions.

## Architecture invariants

1. Learnables define what the child should understand.
2. Reusable data is stored by versioned **datatype** (`kind` + `version`).
3. The datatype registry centrally declares which engines each datatype can feed; individual data records do not repeat engine lists.
4. Generic datatype→engine requirements decide whether a particular record is rich enough (`minEntries`, `minChoices`, etc.).
5. Formatters convert `(data, engine, recipe)` into versioned delivery contracts; formatter code contains no curriculum facts.
6. Recipes select which compatible output to create now; compatibility does not force automatic generation of every possible activity.
7. Generated questions can be compiled artifacts rather than primary authoring data.
8. Interaction/output engines implement delivery mechanics only; no curriculum facts or access policy.
9. Evaluation is separate from rendering.
10. Packs/paths own access and sequencing.
11. Reuse mechanics and formatter paths before adding engines/formatters.
12. Expensive generation such as crossword/maze/layout belongs in compilation when possible.
13. External assets require registry/license review.

## Implemented delivery engines

- `single_choice@1`
- `word_bank_fill@1`
- `drag_to_target@1` — placement, sorting, visible matching
- `word_search@1`
- `memory_pairs@1` — semantic relation matching
- `sequence_order@1`
- `hotspot@1`
- `crossword@1`
- `maze_path@1`

## Datatype / formatter layer

### Implemented datatypes

- `choice_item@1` → currently `single_choice@1`
- `association_set@1` → single choice, word-bank fill, drag/match, memory, word search, crossword

### Implemented proof

One association dataset:

```text
Dog → domestic animal
Seahorse → water animal
Emu → bird
Camel → ship of the desert
Mammoth → extinct animal
```

generates six different activity forms through recipes + one generic formatter, without changing delivery engines.

A narrow choice-item dataset proves the other side: a simple prompt/options/correct-answer datatype maps only to MCQ today.

### Next datatype targets

- [ ] `passage@1` with reviewed claims/spans/entities.
- [ ] `entity_table@1` for attributes, classification and compare/contrast.
- [ ] `ordered_process@1` for lifecycle/procedure/timeline reuse.
- [ ] `labeled_diagram@1` for hotspot/label/matching reuse.
- [ ] Better generic distractor policies using category/type/misconception metadata.
- [ ] Stable asset/media references in generic data entities.
- [ ] Source revision/provenance tracking across generated item families.

## Future engine expansion rule

When a new engine such as `print_cards@1` is added:

1. implement the delivery engine/contract;
2. add it once to every compatible datatype in `content/data-types/registry.json`;
3. extend those datatype formatters once;
4. existing records automatically become eligible when they meet generic requirements;
5. add recipes only where we actually want that output.

Do **not** edit every knowledge record just to add a new engine capability.

## Presentation assets

- [x] Asset/license admission registry.
- [x] Build-time third-party notice generation.
- [ ] Find permissively licensed modular character/animal source.
- [ ] Build reusable poses/parts and cheap expression/action variants.

## Further mechanics backlog

Add only for real learning use cases: mark words, multiple select, missing letters/word scramble, timeline, branching story, tracing/connect-the-dots, jigsaw/assemble scene, sliding tiles, bingo, logic grid, interactive diagram labels, printable cards/worksheets, optional tiny canvas loop, specialist physics only when justified.

## Compiler/runtime policy

`npm run compile:content` runs before desktop dev/build. Knowledge data is formatted into engine contracts first; crossword-capable output flows through the existing crossword layout compiler; mazes compile seeds to wall bitmasks; asset notices compile from the asset registry. Generated artifacts are ignored by git.

## GitHub project memory

- Canonical branch: `kidsplay`.
- Canonical tracker: issue #1.
- Datatype/formatter design: `docs/KNOWLEDGE_FORMATTERS.md`.
- Keep this file and issue #1 synchronized after material architecture changes.
