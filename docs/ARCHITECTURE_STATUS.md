# Kidsplay architecture status — compact resume checkpoint

Use this file first when resuming work. GitHub issue #1 is the canonical execution tracker; `docs/WORK_TARGETS.md` is the broader architecture/content backlog.

## Current state

The reusable **data → connector/planner → formatter → engine** mandate is implemented. The interactive runtime has now been migrated to **Svelte 5 + TypeScript + Vite**, while contracts, evaluation, generators, learning logic and mechanics remain framework-independent.

Last runtime/code head before this checkpoint:
- `02cbf2e4556a6a8b088248a6583ceb08c12fc859` — pin dev server to port 5180
- previous functional commit `475d01aa8901c783e37e6575f24ef600bd500151` — migrate interactive runtime to Svelte
- Android debug APK run `33249118323`: passed on `02cbf2e`

Canonical branch: `kidsplay`.

`kidsplay-work` is a temporary divergent branch. Do not merge it wholesale; delete it when convenient. `main` is still only the repository-initialization baseline and should not replace `kidsplay` as the working branch yet.

## Canonical pipeline

```text
Stored data
  ↓
Datatype normalizer
  ↓
Canonical knowledge units (stable rowId)
  ↓
Profile/index selector + session planner
  ↓
Formatter(data, engine, recipe)
  ↓
optional compiler
  ↓
Versioned delivery contract
  ├─ interactive engine → evaluator/progress
  └─ output engine → printable/export artifact
```

## Ownership rules

- **Knowledge row**: reusable meaning + intrinsic `knowledgeLevel` + controlled `skills`.
- **Datatype**: data shape, compatible engines, generic requirements and recipe unit mode.
- **Learning profile**: country/curriculum/assessment/grade membership; profile collections reference stable row IDs.
- **Planner/connector**: selects rows and delivery engines for a profile/session goal.
- **Formatter**: converts normalized data to the chosen engine contract; no curriculum facts.
- **Compiler**: expensive deterministic preparation such as crossword/maze layout.
- **Interactive engine**: Svelte presentation/input component only.
- **Output engine**: print/export mechanics only.
- **Evaluator/progress**: correctness/mastery outside the engine.
- **Pack/product**: sequencing/access/commercial policy outside knowledge.

## Three independent difficulty/placement axes

Never merge these:

1. `knowledgeLevel` — intrinsic familiarity/complexity of a row.
2. profile membership `fit` — `review | core | stretch | challenge` in one learning profile.
3. activity `difficulty` — challenge introduced by the generated test/game.

Curricular grade is profile metadata, not knowledge truth.

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

The current proof knowledge is still intentionally small: mainly animal associations plus a choice-item proof row. Do not mistake architectural breadth for production content depth.

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

`content/engines/manifest.json` is the canonical engine catalogue. Validation checks manifest/formatter/datatype/runtime/contract drift.

## What is actually missing now

The architecture is ahead of the user-facing product.

`src/App.svelte` still opens one hard-coded free Animals pack. The profile/session planner is proven in build tooling, but profile-driven planning is not yet the normal Android/browser app entry path. The current `SessionState` is in-memory only. Goal-path/access metadata exists in JSON, but there is no product catalog/home flow using it. Profile mappings are prototype/unverified and lack reviewed provenance/version/effective-date evidence. Visual scenes are still emoji/text prototypes; the asset registry has no admitted bundled character/animal assets.

## P0 — next implementation slice

Build one end-to-end product vertical slice before adding more architectural abstraction:

1. **Catalog/home shell** — child name + lightweight avatar choice, Free Explore, Goal Learning.
2. **Profile-driven session entry** — select a learning profile/goal and produce a session through the existing planner/formatter model rather than hard-coded pack bootstrap.
3. **Runtime materialization** — resolve planned recipes into versioned delivery contracts/questions usable by Svelte engine components.
4. **Offline local state** — persist child settings, attempts and progress without requiring a backend.
5. **Mastery loop** — aggregate `knowledgeEvidence` into simple row/concept mastery and feed it back into revision/session selection.
6. **Access-policy surface** — make free vs structured goal content visible; defer real payments/accounts until the goal path itself works end to end.
7. **Behavioral tests** — cover catalog/profile selection, session progression, engine host boundaries, persistence and mastery; keep existing build/content validators.

## P0 — content credibility

Before any official-alignment claim:

1. Add profile/membership provenance.
2. Add reviewed syllabus/assessment version.
3. Add effective dates/version applicability.
4. Make validation reject `reviewed`/official status without that evidence.
5. Add a meaningful real Class 2 EVS/SOF content slice using the current datatypes first.

Use real content to discover schema pressure. Only then add semantic datatypes such as `passage@1`, `entity_table@1`, `ordered_process@1`, or `labeled_diagram@1`.

## Presentation workstream

Keep it separate from question/knowledge truth:

- admit exact permissively licensed assets with per-asset provenance;
- replace platform-emoji-only scenes incrementally;
- use modular animal/character parts, poses, expressions and CSS/SVG motion;
- keep scene data reusable across MCQ, fill, drag, memory, etc.

## Guardrails

- Do not reopen the completed data/connector/formatter/engine architecture without a real failing use case.
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
