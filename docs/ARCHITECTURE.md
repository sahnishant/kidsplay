# Architecture: content plane vs runtime plane

## Governing rule

> Questions may declare an interaction contract, but never contain delivery implementation. Engines implement interaction contracts, but never contain curriculum content.

The design has two planes.

### Content plane

- **Learnables**: what the child should understand.
- **Question bank**: reviewed prompts, interaction declarations, solutions and feedback.
- **Scene data**: reusable presentation descriptions.
- **Learning packs / goal paths**: why a set of questions is being delivered and whether the path is free or paid.

### Runtime plane

- **Session controller/state**: chooses and advances questions.
- **Stimulus/presentation renderer**: Svelte components for text, scenes, audio and later richer media.
- **Interaction engines**: Svelte components that collect responses for MCQ, fill, drag, sort, match, etc.
- **Evaluation engine**: plain TypeScript that decides correctness and scoring from question solution + response.
- **Mechanics**: framework-independent TypeScript for shuffling, grids, maze travel, word-search generation and other reusable algorithms.
- **Progress/mastery engine**: later converts attempts into revision/mastery decisions.

## Boundary rules

1. Question JSON contains no Svelte, JSX, CSS, screen coordinates, component names, score-award code or purchase checks.
2. Engine components contain no dog/whale/science-specific answers.
3. Paid/free/Olympiad decisions live in pack/path/profile data, never inside interaction engines.
4. Stimulus and response are independent. A scene can pair with MCQ, fill or drag without inventing three different scene engines.
5. All interaction contracts are versioned (`interaction.version`). Questions themselves have `revision` and the envelope has `schemaVersion`.
6. Engines emit a common response envelope; evaluation is separate from the visual engine.
7. Svelte is a replaceable presentation boundary: contracts, JSON, evaluation, content tooling and mechanics do not import Svelte.

## Current interaction registry

```text
single_choice@1
word_bank_fill@1
drag_to_target@1
word_search@1
memory_pairs@1
sequence_order@1
hotspot@1
crossword@1
maze_path@1
```

Adding an engine requires a new contract + Svelte interaction component + registry entry + validator support. Existing questions remain untouched.

## Android-first technical strategy

The runtime uses Svelte 5 with browser-native DOM/SVG/CSS and Pointer Events, built by Vite and wrapped by Capacitor for Android. Svelte replaces manual DOM construction; it does not replace the plain-TypeScript learning/evaluation/mechanics layers.

Cheap reusable motion should remain CSS/SVG-first (`bounce`, `wiggle`, `float`, `pulse`) and later reusable sprite/vector parts. A dedicated 2D game library should only be added for mechanics that genuinely need a scene graph, physics, tile maps or high-volume sprite rendering.

No SvelteKit, router, global state library, database or backend is required for the initial offline-first runtime.

## Data flow

```text
Learnable
   ↓
Question data ──────→ Scene reference
   ↓
Session state
   ↓
Svelte engine registry → interaction component
   ↓
standard response
   ↓
Plain TS evaluator
   ↓
feedback / attempt record
```

## Security / formal assessment note

Foundational offline questions can be evaluated locally. Formal paid mock tests can later use a server-evaluated or protected bundle without changing the interaction-engine contract.
