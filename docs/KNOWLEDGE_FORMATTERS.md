# Knowledge → Formatter → Engine

The scalable authoring model is:

```text
Knowledge source / passage / blob
            ↓
        Formatter
     (data, engine)
            ↓
   engine-ready contract
            ↓
      delivery engine
            ↓
    visible test / game
```

The question bank remains important, but generated questions are increasingly a **compiled artifact**, not always the primary authoring source.

## Why this layer exists

A fact such as:

```text
Dog      ↔ domestic animal
Seahorse ↔ water animal
Emu      ↔ bird
Camel    ↔ ship of the desert
Mammoth  ↔ extinct animal
```

contains more reusable educational value than one prewritten MCQ. The same source can become:

- semantic memory pairs;
- match-the-following;
- word search;
- crossword (animal as answer, descriptor as clue);
- fill in the blank;
- MCQ such as “Which of the following is called the ship of the desert?”;
- later, visual variants when an entity has an approved asset reference.

Kidsplay now proves this with `association_set@1`.

## Three separate things

### 1. Knowledge source

`content/knowledge/*.json`

Stores reusable meaning. It may be structured facts, an annotated passage, an ordered process, a diagram description, or eventually a raw text/blob with reviewed annotations.

A source declares `canGenerate` so it knows which engine contracts are semantically safe to derive. This is capability metadata, not rendering code.

### 2. Activity recipe

`content/recipes/*.json`

Chooses which outputs we actually want. A recipe references a knowledge source and an engine and may supply lightweight formatting policy such as seed, difficulty, selected entries, prompt, distractor count or a cloze sentence template.

Recipes prevent the bad extreme of automatically generating every possible format from every source.

### 3. Formatter

`formatDataForEngine(data, engine, recipe)`

A formatter is reusable by **data shape + target engine**, never by individual question. We should not create `camelMcqFormatter`, `dogMemoryFormatter`, etc.

Current registry:

```text
association_set@1
    ├── single_choice@1
    ├── word_bank_fill@1
    ├── drag_to_target@1
    ├── memory_pairs@1
    ├── word_search@1
    └── crossword@1
```

Crossword is compiler-backed: the formatter produces generic crossword authoring data, then the existing crossword compiler performs layout. This preserves reuse instead of duplicating crossword logic inside the association formatter.

## What belongs in data

Good reusable data contains semantic roles, not UI instructions:

```json
{
  "subject": { "id": "camel", "label": "Camel" },
  "relation": "known_as",
  "object": { "id": "ship-of-desert", "label": "ship of the desert" },
  "conceptIds": ["animals.camel.ship-desert-name"]
}
```

Optional media should be stable references such as `assetId`, never pixel coordinates or component names.

## What belongs in a recipe

Formatting choices that vary by assessment intent:

```json
{
  "sourceRef": "knowledge.animals.associations.001",
  "engine": "single_choice@1",
  "entryIds": ["camel-ship-desert"],
  "distractorCount": 3,
  "difficulty": 1
}
```

## What belongs in the formatter

General transformation logic:

- convert semantic pairs to memory card IDs and valid pairs;
- convert pairs to draggable items and targets;
- derive same-domain MCQ distractors;
- translate relation types (`is_a`, `known_as`) into basic language templates;
- create cloze segments from a recipe template;
- expose words/clues to word-search/crossword compilers.

No curriculum fact is hard-coded in formatter code.

## Passages and blobs

Raw text can be stored, but raw text alone should **not** automatically be considered safe assessment data.

Recommended future pipeline:

```text
raw passage/blob
      ↓
semantic annotation / extraction
      ↓
reviewed claims, entities, relations, sequence steps, spans
      ↓
canGenerate capability declaration
      ↓
formatter recipes
```

An LLM may later help create the annotations, but learner-facing questions should be generated from reviewed structured claims or explicitly approved passage spans. This keeps hallucination risk out of the delivery runtime.

## Future reusable source shapes

Build these only as real content requires them:

- `association_set@1` — implemented;
- `entity_table@1` — entities with attributes, good for classification/compare/odd-one-out;
- `passage@1` — text plus claims/spans/entities, good for comprehension and evidence selection;
- `ordered_process@1` — lifecycle/procedure/history steps;
- `labeled_diagram@1` — regions/labels/relationships;
- `rule_examples@1` — rule + positive/negative examples, good for reasoning;
- `scenario@1` — state + choices + consequences, good for branching stories;
- `raw_blob@1` — storage/provenance only until annotated.

## Engine-first rule

1. Stabilize a small set of delivery engines and mechanics.
2. Define reusable semantic source shapes around what those engines can consume.
3. Add generic formatters between source shapes and engine contracts.
4. Reuse an existing formatter before creating another.
5. Add a formatter only when the **data shape or transformation semantics** are genuinely new.
6. Add an engine only when the **learner interaction** is genuinely new.

This gives two independent scaling axes:

```text
more knowledge ───────────────► more generated activities
       │
       │ same formatter layer
       ▼
more engines ─────────────────► more ways to experience existing knowledge
```
