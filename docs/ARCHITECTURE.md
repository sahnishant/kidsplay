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
- **Interaction engines**: Svelte components that collect responses.
- **Evaluation engine**: plain TypeScript that decides correctness and scoring from question solution + response.
- **Mechanics**: framework-independent TypeScript for reusable algorithms.
- **Progress/mastery engine**: later converts attempts into revision/mastery decisions.

## Boundary rules

1. Question JSON contains no Svelte, JSX, CSS, screen coordinates, component names, score-award code or purchase checks.
2. Engine components contain no curriculum-specific answers.
3. Paid/free/Olympiad decisions live in pack/path data, never inside interaction engines.
4. Stimulus and response are independent.
5. Interaction contracts are versioned (`interaction.version`); questions retain `revision` and `schemaVersion`.
6. Engines emit a common response; evaluation stays separate from visual rendering.
7. Svelte is a replaceable presentation boundary: contracts, JSON, evaluation and mechanics do not import Svelte.

## Current interaction registry

```text
single_choice@1
word_bank_fill@1
drag_to_target@1
word_search@1
memory_pairs@1
```

Adding an engine requires a new contract + Svelte interaction component + registry/validator support. Existing questions remain untouched.

## Android-first technical strategy

The runtime uses Svelte 5 with browser-native DOM/SVG/CSS and Pointer Events, built by Vite and wrapped by Capacitor for Android. Svelte replaces manual DOM construction; it does not replace the plain-TypeScript learning/evaluation/mechanics layers.

Cheap reusable motion remains CSS/SVG-first (`bounce`, `wiggle`, `float`, `pulse`) and later reusable sprite/vector parts. Add a dedicated 2D game library only for mechanics that genuinely need a scene graph, physics, tile maps or high-volume sprite rendering.

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
