# Kidsplay — Data + Connector + Engine architecture review

## Verdict

The direction is strong, but the model should be tightened before adding many more datatypes or engines.

The key principle remains:

```text
stored content
    ↓
datatype adapter / normalizer
    ↓
canonical knowledge units
    ↓
selector / planner (profiles + session goal)
    ↓
formatter / adapter (datatype → target delivery contract)
    ↓
delivery engine
    ↓
visible activity / printable output
```

Evaluation/progress stays outside the engine. Packs/products stay outside knowledge data.

The word **connector** is useful at product level, but internally it should not be one giant function. It has three responsibilities that should remain distinct:

1. **Selection/planning** — which knowledge rows should be used now?
2. **Normalization/formatting** — how is stored data converted to a target engine contract?
3. **Compilation** — does the target require expensive build-time work such as crossword layout or maze generation?

## What is already correct

### Datatypes own engine compatibility

`content/data-types/registry.json` is the right place to say that `association_set@1` can feed MCQ, fill, matching, memory, word search and crossword, while `choice_item@1` currently feeds only MCQ.

Individual content records should not repeat this engine list.

### Profiles own curriculum/exam membership

Country/board/grade/exam placement should stay outside knowledge rows. A row can belong to many profiles through profile-membership collections.

This is a many-to-many relation:

```text
knowledge_row ← profile_membership → learning_profile
```

The long-term database form should use globally stable row IDs:

```text
knowledge_row(id, datatype, payload, knowledge_level, ...)
learning_profile(id, country, curriculum, grade, ...)
profile_membership(profile_id, row_id, fit, provenance, effective_version, ...)
```

### Recipes are useful

Datatype compatibility answers **what can be generated**. A recipe/session plan answers **what should be generated now**. Do not automatically materialize every possible engine output from every row.

### Engines are mechanics, not curriculum

The runtime engine registry is correctly isolated from subject facts. Evaluation is also separate.

### Expensive generation belongs downstream

Crossword and maze are good precedents: a formatter can produce authoring data, then a specialized compiler performs expensive layout/generation before the tiny learner runtime sees it.

---

# Changes to make before scaling further

## P0 — Introduce stable global knowledge-row IDs

Current JSON profile membership uses `(dataRef, rowRef)` as identity. This works for a prototype but makes storage layout part of identity.

If an association set is split, renamed or moved, profile references change even though the fact did not.

Prefer a stable row ID now, for example:

```json
{
  "id": "knowledge-row.animals.camel.ship-of-desert",
  "subject": { "id": "camel", "label": "Camel" },
  "relation": "known_as",
  "object": { "id": "ship-of-desert", "label": "ship of the desert" }
}
```

Containers/files become storage organization only.

For source types that are naturally one unit (`choice_item@1`), give the root unit a real stable row ID instead of leaking `$root` into profile membership.

## P0 — Remove curricular grade from reusable knowledge truth

The current knowledge files still carry source-level `gradeBands`, and generated questions inherit it. That contradicts the profile model.

Separate:

- `knowledgeLevel` — intrinsic familiarity/complexity of the knowledge row;
- profile membership + `fit` — where that row belongs in a specific curriculum/exam/grade;
- generated activity `difficulty` — how difficult the formatter/engine makes the task.

A camel fact can be basic knowledge, core in one profile, review in another, and still be used in either an easy recall question or a harder reasoning item.

`gradeBands` should therefore stop being canonical knowledge metadata. If retained for legacy/manual questions, treat it as optional descriptive metadata, not placement truth.

## P0 — One datatype normalizer, not separate formatter + indexer interpretations

Today `association_set@1` is interpreted separately by:

- the formatter; and
- the cross-datatype indexer.

As datatypes grow, this creates duplicate knowledge about each schema.

Add one datatype adapter/normalizer:

```text
association_set@1 stored payload
        ↓
normalizeAssociationSet()
        ↓
CanonicalKnowledgeUnit[]
```

A canonical unit can contain:

```ts
{
  rowId,
  datatype,
  subject,
  relation,
  object,
  conceptIds,
  knowledgeLevel,
  skills,
  mediaRefs,
  sourceRef,
  sourceRevision
}
```

Then both the profile/index selector and formatter layer consume this normalized representation.

For passage/diagram/process datatypes the canonical representation can include typed structures (claims, spans, regions, ordered edges) rather than forcing everything into subject/object pairs.

## P0 — Add a central engine manifest + registry consistency checks

Engine identifiers currently appear in multiple places:

- datatype compatibility registry;
- formatter implementation;
- content validator supported-engine list;
- TypeScript question contracts;
- runtime engine registry.

That will drift when we have 20–40 engines.

Create one engine manifest such as:

```json
{
  "id": "memory_pairs",
  "version": 1,
  "category": "interactive",
  "runtime": true,
  "evaluation": "pair_matches"
}
```

Build validation should assert:

1. every datatype-compatible engine exists in the manifest;
2. a formatter path exists for every declared datatype→engine edge;
3. every interactive engine manifest entry exists in the runtime registry;
4. generated contracts validate against the engine contract;
5. output-only engines do not have to implement the interactive runtime interface.

The TS registry can remain explicit; it just must be checked against the manifest.

## P1 — Split interactive engines from output engines

`InteractionEngine` currently assumes DOM mounting and answer submission. That is correct for MCQ/memory/crossword but not for future outputs such as:

- `print_cards@1`;
- printable worksheet;
- PDF revision sheet;
- offline card deck export.

Do not force printable/export engines into `onSubmit()` semantics.

Use two delivery categories under one target namespace:

```text
interactive engine
  mount → response → evaluator

output engine
  render/export → artifact
```

Formatters can still target either category.

## P1 — Keep profile schema precise, not overloaded

`boardOrGoal` is acceptable for prototype data but mixes curriculum authority and competition goal.

Long term, profile metadata should be explicit where applicable:

```text
country / jurisdiction
pathway: school | competition | goal
curriculum / board
assessment / competition
subject
stage / grade
language
syllabusVersion / academicYear
effectiveFrom / effectiveTo
provenance/source
```

Profile IDs such as `SOF_INDIA_CLASS2` can remain stable human-readable keys, but code should use stored fields and never parse semantics out of the ID.

## P1 — Centralize filter taxonomies that matter across databases

Cross-datatype querying only works if terms are consistent.

At minimum centrally govern:

- `knowledgeLevel`;
- `skills` (`vocabulary`, `classification`, `recall`, `reasoning`, ...);
- eventually subject/topic IDs if cross-subject reporting depends on them.

Do not allow arbitrary variants such as `vocab`, `vocabulary-learning`, `word_knowledge` if they are intended to mean the same filter.

## P1 — Add provenance/versioning before official curriculum claims

A profile membership should eventually record why a row belongs there:

```text
source document / syllabus reference
review status
reviewer/source pipeline
effective syllabus version/date
confidence only if machine-assisted and useful internally
```

This lets a curriculum update change profile membership without changing the underlying fact.

---

# Connector / planner responsibilities

The connector should be thought of as an orchestration layer, not a monolithic formatter.

For a session request such as:

```text
profile = SOF_INDIA_CLASS2
skill = vocabulary
count = 10
variety = high
```

it should:

1. select eligible row IDs from the profile/index;
2. look up each row's datatype;
3. ask the datatype registry for usable engines;
4. apply session policy (variety, repetition, mastery, device/output constraints);
5. create recipes/plans;
6. send `(normalized data, engine, recipe)` to the formatter;
7. route compiler-backed outputs through crossword/maze/etc. compilation when needed;
8. deliver contracts to the runtime/output engine.

The planner decides **which** engine. The formatter decides **how to convert** the data to that engine. The engine decides **how to present** the contract.

---

# Avoid the combinatorial question-bank trap

Do not pre-generate every possible:

```text
row × profile × engine × difficulty × variant
```

That recreates a huge question bank and loses the benefit of reusable data.

Instead:

- store reusable data once;
- store profile membership once;
- store reusable recipe/session policies;
- generate cheap contracts on demand or during pack compilation;
- precompile only expensive/deterministic structures when beneficial;
- cache generated contracts if needed, but treat the cache as disposable.

The current generated question JSON should continue to be viewed as build artifacts/proofs, not the long-term source of truth.

---

# Recommended target model

```text
┌──────────────────────────────┐
│ Stored source data           │
│ association/passage/table... │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ Datatype adapter/normalizer  │
│ one interpreter per datatype│
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ Canonical knowledge units    │
│ stable row IDs + metadata    │
└───────┬──────────────────────┘
        │
        ├────────→ Profile/index membership
        │              ↓
        │        Selector / planner
        │              ↓
        └──────────────┤
                       ↓
┌──────────────────────────────┐
│ Formatter router             │
│ datatype/unit → engine       │
└──────────────┬───────────────┘
               ↓
       optional compiler chain
               ↓
┌──────────────────────────────┐
│ Versioned delivery contract  │
└───────┬──────────────────────┘
        ├── interactive engine → response → evaluator/progress
        └── output engine      → print/PDF/cards/etc.
```

Packs/products reference profiles/plans/contracts and own access/commercial policy. They do not redefine knowledge.

---

# What not to add yet

Do not yet add:

- a graph database;
- a general rule engine;
- inheritance/composition between profiles;
- an LLM in the learner runtime;
- a generic physics/canvas framework;
- dozens of datatypes.

The current JSON/build setup is enough to prove the architecture. The next useful work is to harden identity, normalization and registry consistency before expanding breadth.

## Recommended implementation order

1. Stable global `rowId` migration; remove `$root` membership hack.
2. Stop using source `gradeBands` as placement truth; pass profile/session context separately.
3. Introduce datatype normalizers and make indexers/formatters consume them.
4. Add central engine manifest + cross-registry validation.
5. Add `passage@1` only after 1–4 are stable.
6. Add output-engine interface when implementing `print_cards@1`.
