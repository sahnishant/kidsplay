# Kidsplay architecture status — compact resume checkpoint

Use this file first when resuming work. GitHub issue #1 is the canonical execution tracker; `docs/WORK_TARGETS.md` is the broader backlog.

## Current state

The reusable **data → connector/planner → formatter → engine** architecture is implemented, the first product vertical slice uses it, and that product loop now has behavioral tests plus alignment-provenance guardrails.

Canonical branch: `kidsplay`.

Key verified checkpoints:
- `184c5d0e9a075df10eb1c71afdba607c3f1051dd` — behavioral product tests; Android workflow `33254579606` passed through APK artifact upload.
- alignment/provenance code is included after that checkpoint; `npm run check` (including Vitest behavior tests + alignment validation), web build and Capacitor generation passed on the alignment head before this documentation update.

`kidsplay-work` remains temporary/divergent. Do not merge it wholesale. `main` remains the initialization baseline until we deliberately promote a content-credible product baseline.

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

Output engines such as `print_cards@1` remain separate from the interactive runtime.

## Product vertical slice

The app has:

- child name + lightweight avatar stored locally;
- Free Explore and Goal Learning entries;
- profile-driven `SOF_INDIA_CLASS2` goal sessions;
- runtime profile isolation using complete `knowledgeRefs` membership checks;
- selection by profile fit, unseen/weaker mastery and engine variety;
- bounded local attempt history plus row/concept mastery;
- home progress summary;
- visible free-vs-purchase policy without premature payment/account infrastructure.

Generated questions remain build/cache artifacts. Node-only normalizer/planner/formatter/compiler logic is not moved into the Android runtime.

## Behavioral protection

Vitest + Svelte Testing Library + jsdom are now part of `npm run check`.

Current behavior suite covers:

1. free vs goal catalog separation;
2. goal `profileRef` binding;
3. full `knowledgeRefs` profile isolation;
4. engine variety in profile sessions;
5. mastery-driven deprioritization of already-strong knowledge;
6. one-submit-per-question/session advance/replay behavior;
7. registry coverage for all nine shipped interactive engine types;
8. local player settings + attempt/mastery persistence;
9. real Svelte home → goal session → home and engine submission → completion flows.

Android CI therefore now gates both build correctness and core product behavior.

## Alignment provenance

`content/alignment-sources/registry.json` now separates:

- internal prototype/editorial sources;
- official syllabus sources;
- official assessment sources;
- official supporting references.

`scripts/validate-alignment.mjs` blocks `reviewed` alignment unless evidence includes:

- a reviewed official source;
- version label;
- review date; and
- academic-year or explicit effective-date applicability.

Profile scope and row placement are independently reviewable.

### SOF Class 2

`SOF_INDIA_CLASS2` profile scope is now recorded as **reviewed** for `SOF ISO 2026-27`, backed by the official current Class 2 ISO syllabus and official 2026-27 workbook reference recorded in the alignment-source registry.

The profile membership collection is still deliberately:

```text
provenance.status = prototype_unverified
placementBasis = editorial_within_reviewed_scope
```

because a broad official syllabus heading such as `Animals` does not prove that every individual fact belongs at a particular `review/core/stretch/challenge` fit.

This distinction must be preserved.

## Three independent learning axes

Never merge these:

1. `knowledgeLevel` — intrinsic familiarity/complexity of a row;
2. profile membership `fit` — review/core/stretch/challenge in one profile;
3. generated activity `difficulty` — challenge introduced by the game/question.

Curricular grade is profile metadata, not knowledge truth.

## Implemented semantic data

- `choice_item@1` → `single_choice@1`
- `association_set@1` → `single_choice@1`, `word_bank_fill@1`, `drag_to_target@1`, `memory_pairs@1`, `word_search@1`, `crossword@1`, `print_cards@1`

Interactive engines: `single_choice@1`, `word_bank_fill@1`, `drag_to_target@1`, `word_search@1`, `memory_pairs@1`, `sequence_order@1`, `hotspot@1`, `crossword@1`, `maze_path@1`.

Output engine: `print_cards@1`.

## What is actually missing now

### P0 — real content + row-level credibility

1. Build a meaningful Class 2 SOF ISO/EVS knowledge slice using the current datatypes first.
2. Review exact row memberships and `fit` assignments against sources; only then mark membership provenance `reviewed`.
3. Reuse those same rows in broad free exploration and structured goal preparation rather than duplicating facts.
4. Add source revision/provenance to generated item families when real content starts changing across syllabus versions.

### P1 — semantic expansion only when content forces it

Add `passage@1`, `entity_table@1`, `ordered_process@1`, or `labeled_diagram@1` only when real authored content requires those shapes.

### P1 — presentation/engagement

- admit exact permissively licensed assets with per-asset provenance;
- replace platform-emoji-only scenes incrementally;
- use modular animal/character parts, poses, expressions and CSS/SVG motion;
- keep presentation independent of question type.

## Guardrails

- Do not reopen the completed data/connector/formatter/engine architecture without a real failing use case.
- Do not move Node-only planner/formatter code into Android runtime merely to avoid generated build artifacts.
- Do not mass-edit rows when adding an engine.
- Do not create datatypes for subjects/chapters.
- Do not put curriculum/profile logic in formatters or engines.
- Do not convert a reviewed profile scope into reviewed row placements automatically.
- Do not pre-generate the full row × profile × engine × difficulty matrix.
- Do not add graph DB, rule engine, profile inheritance, backend, router or heavier game framework without demonstrated need.
- Android remains the shipping target; routine development stays Node/npm + browser first.
- Broad foundation content stays free where practical; monetization is structured goals, diagnostics, adaptation, mocks and advanced preparation.

## Useful commands

```powershell
npm run check
npm test
npm run validate:alignment
npm run query:content -- --profile=SOF_INDIA_CLASS2 --skill=vocabulary
npm run plan:profile -- --profile=SOF_INDIA_CLASS2 --skill=vocabulary --count=6
npm run render:profile-output -- --profile=SOF_INDIA_CLASS2 --skill=vocabulary
```
