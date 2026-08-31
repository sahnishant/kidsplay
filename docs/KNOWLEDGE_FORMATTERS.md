# Data Type → Formatter → Engine

The scalable authoring model is:

```text
Data record
   │ kind + version
   ▼
Data Type Registry
   │ compatible engine list (declared once per datatype)
   ▼
Formatter(data, engine, recipe)
   ▼
engine-ready delivery contract
   ▼
Delivery Engine
   ▼
visible test / game / printable output
```

Generated questions remain useful runtime artifacts, but reusable data is increasingly the authoring source of truth.

## Datatypes own engine compatibility

Individual records do **not** repeat an engine whitelist.

Instead:

```text
choice_item@1
    └── single_choice@1

association_set@1
    ├── single_choice@1
    ├── word_bank_fill@1
    ├── drag_to_target@1
    ├── memory_pairs@1
    ├── word_search@1
    ├── sequence_order@1
    ├── crossword@1
    └── print_cards@1

process@1
    └── sequence_order@1
```

This mapping lives in `content/data-types/registry.json`.

When a new engine such as a worksheet/export engine is built, add it once to each compatible datatype and implement the generic formatter path once. Existing records of that datatype then become eligible without changing their factual data.

## Datatype compatibility vs record richness

A datatype says what is semantically possible **in general**. A particular record can still be too small for a useful format.

For example, `association_set@1` is crossword-compatible, but one association is not enough for a useful crossword. Generic datatype→engine requirements handle this. Recipe-selected cardinality is validated too, so a recipe cannot narrow a set-mode activity to one row and leave a downstream compiler to discover the invalid shape later.

The formatter registry therefore exposes:

- `getCompatibleEngines(data)` — all engines allowed by the datatype;
- `getUsableEngines(data)` — datatype-compatible engines whose generic minimum requirements the record currently meets;
- `formatDataForEngine(data, engine, recipe)` — compile one selected output.

No per-record engine list is needed.

## Three concrete datatypes

### `choice_item@1`

A deliberately narrow record:

```json
{
  "kind": "choice_item",
  "version": 1,
  "prompt": "Which of the following is called the ship of the desert?",
  "choices": ["Camel", "Dog", "Whale", "Seahorse"],
  "correctChoiceId": "camel"
}
```

This datatype currently maps only to `single_choice@1`.

### `association_set@1`

A reusable set of subject–relation–object claims:

```text
Dog      ↔ domestic animal
Seahorse ↔ water animal
Emu      ↔ bird
Camel    ↔ ship of the desert
Mammoth  ↔ extinct animal
```

The same source can generate memory, matching, fill, MCQ, word search, sequence/spelling, crossword and printable-card outputs where the selected rows satisfy each engine contract.

`association_set@1` remains the default for ordinary vocabulary/science relationships. Adding semantic depth does **not** justify a new datatype when a stable claim such as `pull → can_move_object → toward the puller` already fits this shape.

### `process@1`

`process@1` exists only for knowledge whose semantic shape is intrinsically ordered or state-changing rather than a bag of independent associations.

Example:

```text
rowId: kr.science.process.germination.seed-to-young-plant

Seed
  ↓
Sprout
  ↓
Young plant
```

A process record owns:

- one stable canonical `rowId`;
- two or more uniquely identified ordered stages;
- optional stage `semanticRef` values;
- normal concept/authoring metadata.

Its formatter reuses the existing `sequence_order@1` engine. Stage semantic refs are preserved in the standard `PresentableItem` contract, so the same process can automatically acquire stronger visuals as the semantic visual registry grows; missing visuals continue to fall back to text. No process-specific UI engine is required.

Current proof processes include closed→open, empty→partly full→full, ice→liquid water, liquid water→ice, and seed→sprout→young plant.

## Semantic-depth indexes are links, not a fourth knowledge datatype

`content/semantic-knowledge/*.json` groups canonical row IDs into neighbourhoods and reasoning patterns for the #76 visual-language programme. These files do **not** copy facts and may not contain artwork, asset URLs, coordinates, CSS or motion instructions.

For example, a `push-pull-force` neighbourhood can reference several ordinary canonical association rows, while a `state-transitions` neighbourhood can reference `process@1` rows. The runtime compiler discovers semantic-depth packs generically and may attach a reasoning-pattern ID to a post-answer visual plan when the exact canonical knowledge row and exact audited visual sense agree.

This preserves the boundary:

```text
canonical knowledge rows
        ↓ refs only
semantic neighbourhood / reasoning pattern
        ↓ exact sense match
presentation plan
        ↓
existing semantic scene renderer
```

The semantic-depth layer does not infer curriculum/profile membership and never imports dictionary source glosses.

## Recipes choose what we actually generate

Datatype compatibility does not mean every possible activity should be generated automatically.

`content/recipes/*.json` chooses a target engine and supplies lightweight formatting policy such as selected rows, seed, difficulty, distractor count, prompt wording or cloze template.

```text
Datatype = what formats are possible
Record   = canonical knowledge/content
Recipe   = what we want to create now
Formatter= reusable conversion function
Engine   = how the learner experiences it
```

## Output engines

An output engine plugs into the same model:

```text
association_set@1
      ↓
Formatter(data, print_cards@1)
      ↓
print-card contract
      ↓
print/export engine
```

Delivery engines may therefore be interactive (`memory_pairs@1`) or output-oriented (`print_cards@1`, worksheet/PDF later).

## Raw text and blobs

A datatype can represent raw text/blob data, but raw prose must not silently become trusted assessment facts. A future `passage@1` or annotated-blob datatype should retain the text plus reviewed claims/entities/spans. Its datatype registry entry then determines which engines its formatter can safely target.

## Rules

1. Build a new engine only for genuinely new learner interaction/output semantics.
2. Add engine compatibility once per datatype.
3. Reuse an existing formatter/engine path before creating a new one.
4. Create a new datatype only when the semantic shape of the canonical source is genuinely different.
5. Put generic minimum requirements on datatype→engine mappings, and validate the recipe-selected subset too.
6. Recipes decide which compatible activities to materialize.
7. Expensive layout compilers may remain downstream while reusing the same formatter pipeline.
8. Semantic-depth indexes reference canonical rows; they do not become a second fact store.
9. Presentation semantics may consume exact canonical row refs, but knowledge never stores artwork or motion implementation details.
