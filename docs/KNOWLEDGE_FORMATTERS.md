# Knowledge → Formatter → Engine

The scalable authoring model is:

```text
Knowledge / question data
        ↓
formatter compatibility
        ↓
explicit canGenerate approval
        ↓
activity recipe / selection policy
        ↓
Formatter(data, engine, recipe)
        ↓
engine-ready delivery contract
        ↓
delivery engine
        ↓
visible test / game / output
```

The question bank remains important, but generated questions are increasingly a **compiled artifact**, not always the primary authoring source.

## The important two-level capability rule

`canGenerate` stays explicit in the data.

It means **approved for this dataset**, not “these are the only engines this information could ever support forever.”

The formatter registry separately knows which engines are technically compatible with each data shape:

```text
Formatter compatibility = technically possible
canGenerate             = explicitly approved for this dataset
```

This distinction is important when Kidsplay grows.

Example today:

```json
"canGenerate": [
  "single_choice@1",
  "word_bank_fill@1",
  "drag_to_target@1",
  "memory_pairs@1",
  "word_search@1",
  "crossword@1"
]
```

Later we may add `print_cards@1`. We can teach the `association_set@1` formatter how to produce a print-card contract. Existing association data then becomes **technically compatible** without rewriting its facts. `getCandidateEngines(data)` can report `print_cards@1` as a new candidate. After editorial/product approval, we append it to that record's `canGenerate` list.

This gives us forward compatibility without silently changing the activities a dataset is allowed to create.

## Why this layer exists

A rich source such as:

```text
Dog      ↔ domestic animal
Seahorse ↔ water animal
Emu      ↔ bird
Camel    ↔ ship of the desert
Mammoth  ↔ extinct animal
```

can support many outputs:

- semantic memory pairs;
- match-the-following;
- word search;
- crossword;
- fill in the blank;
- MCQ;
- later visual forms if approved assets exist;
- later printable memory/revision cards.

A much smaller source such as one prompt, four choices and a correct answer may only be rich enough for `single_choice@1`. Data richness determines formatter compatibility; `canGenerate` determines approval.

## Four separate things

### 1. Knowledge/data source

Stores reusable meaning or already-authored assessment data. Shapes can range from a minimal choice item to rich associations, tables, passages, diagrams and processes.

Data may explicitly list `canGenerate`. This is capability approval metadata, not rendering code.

### 2. Formatter capability registry

The registry knows what each **data shape** can technically become. It exposes:

- `getCompatibleEngines(data)` — technically derivable;
- `getApprovedEngines(data)` — compatible and listed in `canGenerate`;
- `getCandidateEngines(data)` — newly compatible engines not yet approved.

Adding a new engine should therefore not require rewriting old knowledge. We extend a generic formatter once, scan existing data for candidates, then approve appropriate datasets.

### 3. Activity recipe

`content/recipes/*.json`

Chooses which approved output we actually want generated and supplies lightweight policy: selected entries, seed, difficulty, prompt wording, distractor count, cloze template, etc.

Recipes prevent automatically generating every allowed format from every dataset.

### 4. Formatter

`formatDataForEngine(data, engine, recipe)`

A formatter is reusable by **data shape + target engine**, never by individual question. We do not create `camelMcqFormatter` or `dogMemoryFormatter`.

Current `association_set@1` targets:

```text
association_set@1
    ├── single_choice@1
    ├── word_bank_fill@1
    ├── drag_to_target@1
    ├── memory_pairs@1
    ├── word_search@1
    └── crossword@1
```

Crossword remains compiler-backed: the formatter outputs crossword authoring data and the existing crossword compiler performs layout.

## Printable and non-interactive engines

Delivery engines do not all need to be interactive answer collectors.

A future branch can be:

```text
same data
   ↓
Formatter(data, print_cards@1)
   ↓
print-card contract
   ↓
print/export engine
   ↓
front: prompt / image
back: answer / explanation
```

So the wider architecture is:

```text
Data → Formatter → Delivery Contract
                    ├─ interactive engine → MCQ / memory / crossword / match
                    └─ output engine      → cards / worksheet / printable PDF
```

The same approved knowledge remains reusable across both.

## What belongs in data

Semantic roles, facts and approved capabilities—not UI implementation:

```json
{
  "subject": { "id": "camel", "label": "Camel" },
  "relation": "known_as",
  "object": { "id": "ship-of-desert", "label": "ship of the desert" },
  "conceptIds": ["animals.camel.ship-desert-name"]
}
```

Optional media should be stable references such as `assetId`, never component names or pixel coordinates.

## Passages and blobs

Raw text/blob storage is allowed, but raw prose should not automatically become trusted assessment facts. Recommended progression:

```text
raw passage/blob
      ↓
semantic annotation / reviewed extraction
      ↓
claims + entities + relations + spans + sequences
      ↓
canGenerate approvals
      ↓
recipes and formatters
```

LLMs may later assist extraction or suggest candidate activities, but learner-facing answers should come from reviewed claims/spans or explicitly approved authored data.

## Future reusable source shapes

Build only as real content requires them:

- `choice_item@1` — prompt + choices + correct answer; intentionally narrow;
- `association_set@1` — implemented;
- `entity_table@1` — entities with attributes;
- `passage@1` — text plus claims/spans/entities;
- `ordered_process@1` — lifecycle/procedure/history steps;
- `labeled_diagram@1` — regions/labels/relationships;
- `rule_examples@1` — rule + positive/negative examples;
- `scenario@1` — state + choices + consequences;
- `raw_blob@1` — provenance/storage until annotated.

## Admission rules

### New engine

Add only when learner interaction/output is genuinely new. After adding it, extend compatible generic formatters and scan old data for candidate approvals.

### New formatter

Add only when transformation semantics or the source data shape are genuinely new. Never create one per lesson/fact.

### New `canGenerate` entry

Add when a formatter is technically compatible **and** that specific dataset has been approved for that output type.
