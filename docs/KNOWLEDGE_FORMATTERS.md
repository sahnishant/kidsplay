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
    └── crossword@1
```

This mapping lives in `content/data-types/registry.json`.

When a new engine such as `print_cards@1` is built, we add it once to each compatible datatype and implement the generic formatter path once. Existing records of that datatype become eligible automatically; their factual data does not change.

## Datatype compatibility vs record richness

A datatype says what is semantically possible **in general**. A particular record can still be too small for a useful format.

For example, `association_set@1` is crossword-compatible, but one association is not enough for a useful crossword. Generic datatype engine requirements handle this (`minEntries`, `minChoices`, etc.).

The formatter registry therefore exposes:

- `getCompatibleEngines(data)` — all engines allowed by the datatype;
- `getUsableEngines(data)` — datatype-compatible engines whose generic minimum requirements the record currently meets;
- `formatDataForEngine(data, engine, recipe)` — compile one selected output.

No per-record engine list is needed.

## Two concrete datatypes

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

A richer reusable set:

```text
Dog      ↔ domestic animal
Seahorse ↔ water animal
Emu      ↔ bird
Camel    ↔ ship of the desert
Mammoth  ↔ extinct animal
```

The same source can generate semantic memory, matching, fill, MCQ, word search and crossword without changing any delivery engine.

## Recipes choose what we actually generate

Datatype compatibility does not mean we should automatically generate every possible activity.

`content/recipes/*.json` chooses a target engine and supplies lightweight formatting policy such as selected entries, seed, difficulty, distractor count, prompt wording or cloze template.

So:

```text
Datatype = what formats are possible
Record   = the actual knowledge/content
Recipe   = what we want to create now
Formatter= reusable conversion function
Engine   = how the learner experiences it
```

## Future printable cards

A new output engine can plug into exactly the same model:

```text
association_set@1
      ↓
Formatter(data, print_cards@1)
      ↓
print-card contract
      ↓
print/export engine
      ↓
front: prompt/image
back: answer/explanation
```

Adding the engine means updating `association_set@1` once in the datatype registry, not modifying thousands of association records.

Delivery engines therefore may be interactive (`memory_pairs@1`) or output-oriented (`print_cards@1`, worksheet/PDF later).

## Raw text and blobs

A datatype can also represent raw text/blob data, but raw prose should not silently become trusted assessment facts. A future `passage@1` or annotated-blob datatype should retain the text plus reviewed claims/entities/spans. Its datatype registry entry then determines which engines its formatter can safely target.

## Rules

1. Build a new engine only for genuinely new learner interaction/output semantics.
2. Add engine compatibility once per datatype.
3. Reuse an existing formatter path before creating a new formatter.
4. Create a new datatype only when the semantic shape of the source data is genuinely different.
5. Put generic minimum requirements on datatype→engine mappings, not on every data record.
6. Recipes decide which compatible activities to materialize.
7. Expensive generation (crossword/maze/layout/PDF composition) can remain a downstream compiler while reusing the same formatter pipeline.
