# Kidsplay interaction-engine research

Research date: 2026-08-29.

The goal is not to adopt a large quiz/game framework. The goal is to study proven open-source interaction types and algorithms, then keep Kidsplay's runtime small by composing our own mechanics from reusable primitives.

## Design rule

> A Kidsplay interaction engine is a thin adapter over reusable mechanics. Content stays data. Evaluation stays outside the visual engine.

New ideas should normally require a new interaction contract and/or a small composition of existing primitives, not a new application architecture.

## Open-source references

| Project | License signal | Useful idea | Kidsplay decision |
| --- | --- | --- | --- |
| H5P content-type repositories | Many individual content types are MIT; verify the exact repo | A large catalogue of independent interactions: choice, blanks, drag text, hotspots, memory, mark words, branching, flashcards, media choice, etc. | Strong contract/plugin inspiration. Do not ship the H5P runtime. |
| `bunkat/wordfind` | MIT | Tiny dependency-free word-search generation: direction functions, fit checks, overlap, grid growth, filler letters | Reimplement the small algorithmic ideas in our grid kernel. |
| `MichaelWehar/Crossword-Layout-Generator` | MIT | Crossword placement scored by intersections, conflicts, centrality and orientation balance | Run our own equivalent in the authoring/compiler layer, not every time a child opens a puzzle. |
| `dwmkerr/crosswords-js` | MIT | Framework-free crossword control and keyboard/navigation behaviour | UI/interaction inspiration for a future crossword engine. |
| `otacke/h5p-crossword` | MIT | Crossword as a separable content type with clues and a reusable grid | Contract and learner-UX inspiration. |
| `otacke/h5p-jigsaw-puzzle` | MIT | Jigsaw as an independent interaction type | Study snapping, piece state and completion; reimplement only what we need. |
| `taye/interact.js` | MIT | Mature pointer/touch drag, drop and snapping concepts | Learn gesture semantics; do not make it a core dependency unless our tiny pointer layer proves insufficient. |
| `SortableJS/Sortable` | MIT | Reordering and swap semantics on touch devices | Reimplement the small sequence/sort subset we need. |
| `straker/kontra` | MIT | Micro-game architecture designed for very small browser games | Inspiration for an optional canvas mini-game kernel. |
| `KilledByAPixel/LittleJS` | MIT | Very small game loop with input, objects, collision, particles and sound | Inspiration for arcade-like activities; not needed for ordinary learning interactions. |
| `liabru/matter-js` | MIT | Full 2D rigid-body physics | Optional specialist dependency only when a learning activity genuinely needs physics. |
| `steveruizok/perfect-freehand` | MIT | Renderer-independent pointer samples to stroke outlines | Candidate reference for tracing/drawing activities. |

## What we should build instead of one large engine

### Tier 0 — Mechanics kernel

Tiny reusable code that most interactions can share and that should have no curriculum knowledge:

- seeded random and shuffle;
- grid coordinates and straight-line paths;
- pointer/tap/swipe normalization;
- selection paths through grids;
- draggable item and drop-zone state;
- snap-to-target rules;
- list reorder/swap;
- card flip and pair state;
- timers;
- hit regions (rectangle/circle/polygon);
- focus/keyboard navigation;
- simple animation helpers using CSS/Web Animations.

### Tier 1 — DOM/SVG interaction engines

Loaded/used only when the current question declares them:

- single choice / multiple select;
- word-bank fill;
- drag to target;
- sort sequence;
- sort groups;
- match pairs;
- memory pairs;
- mark words;
- hotspot;
- word search;
- crossword;
- word scramble / missing letters;
- maze / path builder;
- jigsaw;
- sliding tiles;
- connect-the-path;
- timeline;
- branching story;
- tracing;
- assemble-a-scene;
- bingo;
- logic grid;
- interactive diagram.

### Tier 2 — Optional canvas mini-game kernel

Only for activities that need an update/render loop:

- sprite/object transform;
- input state;
- collision boxes/circles;
- simple velocity/gravity;
- camera/viewport if ever needed;
- particles/sound cues.

Normal MCQ, crossword, word search, matching, sorting and scene interactions should never pay this cost.

### Tier 3 — Specialist modules

Physics, advanced drawing or other heavier functionality is lazy-loaded only if a specific activity justifies it.

## Important compiler/runtime split

Some interaction types have expensive *generation* but cheap *play*.

### Word search

For small packs we can deterministically generate the grid locally from words + seed. The runtime remains tiny.

### Crossword

Prefer authoring-time compilation:

```text
clues + answers
      ↓
question compiler
      ↓
precomputed grid mask + clue numbers + entry starts/orientations
      ↓
very small learner crossword renderer
```

The child should not pay for layout search every time the crossword opens.

### Maze

Likewise, generated mazes can be compiled into a cell/wall graph when the content pack is built. The learner engine only renders the graph and records the chosen path.

## Dependency policy

1. Prefer browser APIs and our own small primitives first.
2. Prefer MIT/Apache/BSD/zlib references for inspiration.
3. Never copy code or assets merely because a repository is public.
4. If substantive third-party code is imported, preserve its license/notice and inventory it explicitly.
5. GPL/AGPL projects can be studied for product ideas, but code should not be copied into Kidsplay unless we intentionally accept the corresponding obligations.
6. Example assets have their own licensing risk; code license does not automatically make every image/audio asset reusable.
7. Measure generated bundle size before adding a dependency.

## First proof

`word_search@1` is the first engine built on the mechanics kernel. It uses only:

- deterministic random;
- grid/line helpers;
- a small word-placement generator;
- DOM buttons + Pointer Events;
- the existing external evaluation contract.

This proves that the architecture can grow into game-like interactions without importing a game framework.