# Kidsplay architecture status — compact resume checkpoint

Use this file first when resuming work. GitHub issue #1 is the canonical execution tracker; `docs/WORK_TARGETS.md` is the broader architecture/content backlog.

## Current state

The reusable **data → connector/planner → formatter → engine** architecture is implemented, and the first actual product vertical slice now uses it.

Canonical branch: `kidsplay`.

Product/code checkpoint before this documentation update:
- `7498fd91337fd3ce99a8da787f0fda5f730f8a99` — require runnable profile-driven goal content in CI.
- `3618a5b35448b6525ef82c7d274c7f3f6b5b546b` — corrected first profile-driven product shell; Android APK run `33250279601` passed through artifact upload.
- Latest validation run on `7498fd9`: content/Svelte/Vite build and Capacitor generation passed when this checkpoint was written; see issue #1 for the final run status.

`kidsplay-work` is a temporary divergent branch. Do not merge it wholesale; delete it when convenient. `main` is still the initialization baseline and should not replace `kidsplay` until the product baseline is deliberately promoted.

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
Evaluator → local attempts → knowledge/concept mastery
```

Output engines such as `print_cards@1` remain separate from the interactive runtime.

## Ownership rules

- **Knowledge row**: reusable meaning + intrinsic `knowledgeLevel` + controlled `skills`.
- **Datatype**: data shape, compatible engines, generic requirements and recipe unit mode.
- **Learning profile**: country/curriculum/assessment/grade membership; collections reference stable row IDs.
- **Planner/connector**: selects rows and delivery engines for a learning goal.
- **Formatter/compiler**: creates versioned delivery questions/contracts; generated JSON remains disposable cache/build output.
- **Runtime catalog/session resolver**: selects already-generated knowledge-backed questions for a free pack or profile goal; it does not contain curriculum facts.
- **Interactive engine**: Svelte presentation/input component only.
- **Evaluator/progress**: correctness/mastery outside the engine.
- **Pack/product**: sequencing/access/commercial policy outside knowledge.

## Three independent difficulty/placement axes

Never merge these:

1. `knowledgeLevel` — intrinsic familiarity/complexity of a row.
2. profile membership `fit` — `review | core | stretch | challenge` in one learning profile.
3. activity `difficulty` — challenge introduced by the generated test/game.

Curricular grade is profile metadata, not knowledge truth.

## Implemented product vertical slice

The app no longer boots directly into one hard-coded Animals session.

### Home/catalog

- child name stored locally;
- lightweight avatar choice stored locally;
- Free Explore entry;
- Goal Learning entry;
- progress summary for attempts, practised knowledge, strong/mastered knowledge and accuracy;
- purchase-vs-free policy is visible, while the prototype goal remains tryable without payment infrastructure.

### Profile-driven goal session

`goal.class2-evs-olympiad.prototype` now points to `SOF_INDIA_CLASS2`.

At build time, existing knowledge recipes generate cache questions carrying stable `knowledgeRefs`. At runtime, the goal session:

1. loads the profile membership row IDs;
2. admits only questions whose complete `knowledgeRefs` set belongs to that profile;
3. prioritizes core content, then unseen/weaker mastery;
4. preserves engine variety;
5. falls back to explicit pack questions only if no profile-generated questions exist.

CI now validates that every goal path names a real profile and has at least one runnable generated knowledge-backed question.

### Offline progress/mastery

The browser/Android runtime stores locally:

- child settings;
- bounded recent attempt history;
- row-level knowledge counters from `knowledgeEvidence`;
- concept-level counters from `masteryEvidence`.

A row is currently shown as strong/mastered after at least two evidence events with weighted accuracy >= 75%. Goal-session selection uses stored row mastery so weaker/unseen content is selected before stronger content within the same profile-fit tier.

No backend/account system is required for this milestone.

## Implemented semantic data

### `choice_item@1`
Compatible today with `single_choice@1`.

### `association_set@1`
Compatible today with:
- `single_choice@1`
- `word_bank_fill@1`
- `drag_to_target@1`
- `memory_pairs@1`
- `word_search@1`
- `crossword@1`
- `print_cards@1`

The current proof knowledge is intentionally small. Do not mistake architectural breadth for production content depth.

## Implemented delivery engines

Interactive:
- `single_choice@1`
- `word_bank_fill@1`
- `drag_to_target@1`
- `word_search@1`
- `memory_pairs@1`
- `sequence_order@1`
- `hotspot@1`
- `crossword@1`
- `maze_path@1`

Output:
- `print_cards@1`

## What is missing now

### P0 — protect the new product shell

1. Add behavioral tests for catalog/profile selection, session progression, persistence and mastery updates.
2. Tighten local-storage migration/validation if the persisted schema starts evolving.

### P0 — content credibility and real content

Before any official-alignment claim:

1. Add profile/membership provenance.
2. Add reviewed syllabus/assessment version.
3. Add effective dates/version applicability.
4. Make validation reject `reviewed`/official status without that evidence.
5. Add a meaningful real Class 2 EVS/SOF content slice using current datatypes first.

Use real content to discover schema pressure. Only then add semantic datatypes such as `passage@1`, `entity_table@1`, `ordered_process@1`, or `labeled_diagram@1`.

## Presentation workstream

Keep it separate from question/knowledge truth:

- admit exact permissively licensed assets with per-asset provenance;
- replace platform-emoji-only scenes incrementally;
- use modular animal/character parts, poses, expressions and CSS/SVG motion;
- keep scene data reusable across MCQ, fill, drag, memory, etc.

## Guardrails

- Do not reopen the completed data/connector/formatter/engine architecture without a real failing use case.
- Do not move Node-only planner/formatter code into the Android runtime merely to avoid build artifacts.
- Do not mass-edit rows when adding an engine.
- Do not create a datatype for a subject/chapter.
- Do not put curriculum/profile logic in formatters or engines.
- Do not pre-generate the full row × profile × engine × difficulty matrix.
- Do not add a graph DB, rule engine, profile inheritance, backend, router or heavier game framework without demonstrated need.
- Android remains the shipping target; routine development stays Node/npm + browser first.
- Broad foundation content stays free where practical; monetization is structured goals, diagnostics, adaptation, mocks and advanced preparation.

## Useful validation commands

```powershell
npm run check
npm run query:content -- --profile=SOF_INDIA_CLASS2 --skill=vocabulary
npm run plan:profile -- --profile=SOF_INDIA_CLASS2 --skill=vocabulary --count=6
npm run render:profile-output -- --profile=SOF_INDIA_CLASS2 --skill=vocabulary
```
