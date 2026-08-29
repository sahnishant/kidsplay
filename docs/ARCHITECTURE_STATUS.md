# Kidsplay architecture status — compact resume checkpoint

Use this file first when resuming architecture work. Read `docs/WORK_TARGETS.md` for the broader backlog and `docs/DATA_CONNECTOR_ENGINE_REVIEW.md` only when historical rationale is needed.

## Status

The reusable **data → connector/planner → formatter → engine** mandate is implemented and Android-proven.

Last fully verified code head before this checkpoint:
- commit `8fd561ea2c0f1f721897bf82724fbac78f1610e1`
- GitHub Actions run `33247501063`
- content/engine/taxonomy/planner/output/traceability validation: passed
- TypeScript/Vite build: passed
- Capacitor Android generation: passed
- Gradle debug APK build + artifact upload: passed

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
- **Interactive engine**: presentation/input mechanics only.
- **Output engine**: print/export mechanics only; no `mount/onSubmit` requirement.
- **Evaluator/progress**: correctness/mastery outside the engine.
- **Pack/product**: sequencing/access/commercial policy outside knowledge.

## Three independent difficulty/placement axes

Never merge these:

1. `knowledgeLevel` — intrinsic familiarity/complexity of a row.
2. profile membership `fit` — `review | core | stretch | challenge` in one learning profile.
3. activity `difficulty` — challenge introduced by the generated test/game.

Curricular grade is profile metadata, not knowledge truth.

## Implemented datatypes

### `choice_item@1`
Compatible today with:
- `single_choice@1`

### `association_set@1`
Compatible today with:
- `single_choice@1`
- `word_bank_fill@1`
- `drag_to_target@1`
- `memory_pairs@1`
- `word_search@1`
- `crossword@1`
- `print_cards@1`

The proof data is one animal association source (Dog/domestic animal, Seahorse/water animal, Emu/bird, Camel/ship of the desert, Mammoth/extinct animal).

## Implemented engine categories

### Interactive
- `single_choice@1`
- `word_bank_fill@1`
- `drag_to_target@1`
- `word_search@1`
- `memory_pairs@1`
- `sequence_order@1`
- `hotspot@1`
- `crossword@1`
- `maze_path@1`

### Output
- `print_cards@1` — association data → front/back printable A4 HTML cards

`content/engines/manifest.json` is the canonical engine catalogue. CI checks manifest/formatter/datatype/runtime/contract drift.

## Stable identity + traceability

- Every addressable reusable knowledge unit has globally stable `rowId`.
- Profiles reference only `rowId`; storage path/container is not identity.
- Generated knowledge-backed questions carry `knowledgeRefs`.
- Evaluation returns row-level `knowledgeEvidence` as well as concept-level mastery evidence.
- Planner validation proves planned `rowIds` survive into delivery contracts.

## Profiles and taxonomy

Profiles currently include prototype/unverified mappings for:
- `CBSE_INDIA_CLASS1`
- `CBSE_INDIA_CLASS2`
- `SOF_INDIA_CLASS2`
- `CLASS_III_CHINA`

Do not claim official alignment until provenance/version/effective-date metadata is added and reviewed.

Controlled taxonomy lives in `content/taxonomies/learning.json`:
- levels: foundation/basic/intermediate/advanced/specialist
- fits: review/core/stretch/challenge
- skills currently: vocabulary/classification/recall/reasoning

## Planner proof

Developer command:

```powershell
npm run plan:profile -- --profile=SOF_INDIA_CLASS2 --skill=vocabulary --count=6
```

The validation proof selects profile rows, filters vocabulary, consults datatype compatibility and produces six engine-ready recipes across six engines without hardcoded question IDs.

Printable proof:

```powershell
npm run render:profile-output -- --profile=SOF_INDIA_CLASS2 --skill=vocabulary
```

The same association rows produce `print_cards@1` output without editing the knowledge data.

## Validation commands

```powershell
npm run check
npm run query:content -- --profile=SOF_INDIA_CLASS2 --skill=vocabulary
npm run plan:profile -- --profile=SOF_INDIA_CLASS2 --skill=vocabulary --count=6
npm run render:profile-output -- --profile=SOF_INDIA_CLASS2 --skill=vocabulary
```

## Next work — do not reopen completed architecture unless a real use case breaks it

1. Add provenance/syllabus version/effective dates before official profile-alignment claims.
2. Add real content using the current two datatypes and observe where the schema strains.
3. Then add new semantic datatypes as needed, likely `passage@1`, `entity_table@1`, `ordered_process@1`, `labeled_diagram@1`.
4. Improve distractor policies and media/asset refs when real content requires them.
5. Continue presentation-asset work separately (modular characters/animals and cheap poses/expressions).

Do **not** add a graph database, general rule engine, profile inheritance system or more runtime frameworks without a demonstrated need.
