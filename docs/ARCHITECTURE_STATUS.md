# Kidsplay architecture status — compact resume checkpoint

Use this file first when resuming work. GitHub issue #1 is the canonical execution tracker; `docs/WORK_TARGETS.md` is the broader backlog.

## Current state

Kidsplay now has a stable reusable learning architecture **and a first materially useful learning slice**, not just a runtime proof.

Canonical branch: `kidsplay`.

Current product-content code checkpoint: `3e4967a1782531daf5ff30aef2f4b384b7c7f45f`.

The immediately preceding production-selector head `1813f89223f62ab3001badc6e11944ed485f6bdc` passed the complete Android workflow (`33259022424`) including content validation, Svelte/typecheck, behavior tests, Capacitor, Gradle APK and artifact upload. The later commits only tighten behavior tests and do not weaken the product gate.

`main` remains the initialization baseline until promotion is deliberately chosen. `kidsplay-work` is temporary/divergent and should not be merged wholesale.

## Canonical pipeline

```text
Stored data
  ↓
Datatype normalizer
  ↓
Canonical knowledge units (stable rowId)
  ↓
Profile/index selector + planner
  ↓
Formatter(data, engine, recipe)
  ↓
optional compiler
  ↓
Generated/cache delivery questions with knowledgeRefs
  ↓
Runtime catalog/profile selector
  ↓
Svelte interactive engine
  ↓
Evaluator → persisted attempts → row/concept mastery
```

Generated questions are build/cache artifacts. Node-only normalizer/planner/formatter/compiler logic stays out of the Android runtime.

## First useful learning slice — Animals + Plants

The reusable bank now contains **42 stable knowledge rows** across 8 knowledge sources. The canonical learnable catalog contains **48 learnables**.

New Class 2 living-world families include:

### Animals
- animal homes: kennel, stable, cowshed, coop, burrow, den;
- young ones: puppy, kitten, calf, foal, lamb, tadpole;
- body coverings/features: scales, feathers, wool, shell, thick fur, webbed feet;
- existing habitat/classification/adaptation knowledge remains reusable.

### Plants
- part functions: roots, stem, leaves, flower, fruit, seed;
- plant types: tree, shrub, herb, climber, creeper, aquatic plant;
- useful plants/products: cotton, sugarcane, rubber tree, tea, neem, bamboo.

The build currently produces **31 knowledge-generated questions** plus existing hand-authored activities; content validation sees **45 runnable questions** in total.

Real content exposed two useful architecture rules:

1. Do not force every compatible engine onto every dataset. Some word sets do not naturally form a connected crossword, so those crossword recipes were removed instead of distorting the knowledge.
2. Output-engine validation must assert output/traceability invariants, not hard-code one old example such as camel/ship-of-the-desert.

## Product session behavior

### Free Explore

The free entry is now **Living World: Animals & Plants**.

A play session:
- is 8 questions rather than dumping the whole pack;
- mixes Animals and Plants;
- prioritizes unseen/weaker row mastery;
- prefers engine variety;
- prefers different activity/knowledge families before repeating one family heavily.

Broad foundation knowledge remains free.

### Goal Learning

The goal is transparently titled **Class 2 Science Olympiad: Animals & Plants** and remains a prototype purchase-path surface while payment/account infrastructure is intentionally deferred.

SOF goal selection:
- uses `SOF_INDIA_CLASS2` membership only;
- rejects any activity whose complete `knowledgeRefs` set is not in that profile;
- ranks a multi-row activity by its **hardest included profile fit**, so stretch/challenge knowledge cannot hide inside a core set;
- then prioritizes weaker/unseen mastery, topic diversity and engine variety.

The same knowledge rows power free exploration and structured SOF practice; facts are not duplicated into a paid-only question bank.

## Behavioral protection

Vitest + Svelte Testing Library + jsdom run inside `npm run check`.

Current behavior protection covers:
- free vs goal catalog separation;
- 8-question mixed free sessions;
- Animals + Plants presence;
- at least four interaction types in representative sessions;
- at least six activity families before heavy repetition;
- complete profile isolation by `knowledgeRefs`;
- mastery-driven selection changes;
- session submit/advance/replay behavior;
- all nine interactive runtime engine registrations;
- local player/attempt/mastery persistence;
- real Svelte home → goal → home and submit → feedback → completion flows.

Svelte health remains **0 errors / 0 warnings**.

## Alignment provenance

Profile scope and row placement remain independently reviewable.

`SOF_INDIA_CLASS2` profile scope is recorded as reviewed for **SOF ISO 2026-27**, using official SOF sources recorded in `content/alignment-sources/registry.json`.

The row membership collection deliberately remains:

```text
provenance.status = prototype_unverified
placementBasis = editorial_within_reviewed_scope
```

The official syllabus proves that Animals and Plants are in scope; it does **not** by itself prove each exact fact or its `review/core/stretch/challenge` placement. Do not upgrade row-level alignment status without row-level review evidence.

## Three independent learning axes

Never merge these:

1. `knowledgeLevel` — intrinsic familiarity/complexity of a row;
2. profile membership `fit` — review/core/stretch/challenge in one profile;
3. generated activity `difficulty` — challenge introduced by the activity.

For activities containing multiple rows, session fit uses the hardest included row.

## Implemented semantic data and engines

- `choice_item@1` → `single_choice@1`
- `association_set@1` → `single_choice@1`, `word_bank_fill@1`, `drag_to_target@1`, `memory_pairs@1`, `word_search@1`, `crossword@1`, `print_cards@1`

Interactive engines: `single_choice@1`, `word_bank_fill@1`, `drag_to_target@1`, `word_search@1`, `memory_pairs@1`, `sequence_order@1`, `hotspot@1`, `crossword@1`, `maze_path@1`.

Output engine: `print_cards@1`.

## What is missing now

### P0 — deepen the learning product

1. Add the next high-value Class 2 areas: Human Body and Food first, then Safety, Housing/Clothing, Transport/Communication, Air/Water/Rocks, Earth/Universe.
2. Add genuine reasoning/HOTS activities that combine learned facts rather than only recall/association transformations.
3. Review exact SOF row memberships and `fit` assignments before claiming official row-level alignment.
4. Improve parent/child visibility into topic mastery as the topic bank grows.

### P1 — semantic expansion only when real content forces it

Add `passage@1`, `entity_table@1`, `ordered_process@1`, or `labeled_diagram@1` only when authored content genuinely needs those shapes.

### P1 — presentation/engagement

- admit exact permissively licensed assets with per-asset provenance;
- replace platform-emoji-only scenes incrementally;
- build reusable poses/parts/expressions and cheap CSS/SVG motion;
- keep presentation independent of question type.

## Guardrails

- Do not reopen the completed data/connector/formatter/engine architecture without a real failing use case.
- Do not force a game type onto data merely because the datatype technically supports that engine.
- Do not move Node-only planner/formatter code into Android runtime merely to avoid generated build artifacts.
- Do not duplicate free facts into paid goal content.
- Do not convert reviewed profile scope into reviewed row placement automatically.
- Do not add backend, graph DB, router, rule engine or heavier game framework without demonstrated need.
- Android remains the shipping target; routine development stays Node/npm + browser first.
- Broad foundation content stays free; paid value comes from structured goals, diagnostics, adaptation, mocks and advanced preparation.

## Useful commands

```powershell
npm run check
npm run validate:alignment
npm run query:content -- --profile=SOF_INDIA_CLASS2 --skill=vocabulary
npm run plan:profile -- --profile=SOF_INDIA_CLASS2 --skill=vocabulary --count=6
npm run render:profile-output -- --profile=SOF_INDIA_CLASS2 --skill=vocabulary
```
