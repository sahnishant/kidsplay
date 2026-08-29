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

- **Session controller**: chooses and advances questions.
- **Stimulus/presentation renderer**: text, scenes, audio and later richer media.
- **Interaction engines**: collect responses for MCQ, fill, drag, sort, match, etc.
- **Evaluation engine**: decides correctness and scoring from question solution + response.
- **Progress/mastery engine**: later converts attempts into revision/mastery decisions.

## Boundary rules

1. Question JSON contains no JSX, CSS, coordinates for screen layout, component names, score-award code or purchase checks.
2. Engine code contains no dog/whale/science-specific answers.
3. Paid/free/Olympiad decisions live in pack/path data, never inside interaction engines.
4. Stimulus and response are independent. A scene can pair with MCQ, fill or drag without inventing three different scene engines.
5. All interaction contracts are versioned (`interaction.version`). Questions themselves have `revision` and the envelope has `schemaVersion`.
6. Engines emit a common response envelope; evaluation is separate from the visual engine.

## Current interaction registry

```text
single_choice@1
word_bank_fill@1
drag_to_target@1
```

Adding an engine should require a new contract + engine implementation + validator support. Existing questions should remain untouched.

## Android-first technical strategy

The initial runtime intentionally uses browser-native DOM/SVG/CSS and Pointer Events. Capacitor wraps it for Android. This minimizes dependencies and lets us create cheap reusable motion with CSS (`bounce`, `wiggle`, `float`, `pulse`) and later reusable SVG sprite parts.

A dedicated 2D game library should only be added for mechanics that genuinely need a scene graph, physics, tile maps or high-volume sprite rendering. This avoids paying bundle/performance/maintenance cost for ordinary learning interactions.

## Data flow

```text
Learnable
   ↓
Question data ──────→ Scene reference
   ↓
Session controller
   ↓
Engine registry → interaction engine
   ↓
standard response
   ↓
Evaluator
   ↓
feedback / attempt record
```

## Security / formal assessment note

Foundational offline questions can be evaluated locally. Formal paid mock tests can later use a server-evaluated or protected bundle without changing the interaction-engine contract.
