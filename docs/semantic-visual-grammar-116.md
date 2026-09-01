# Semantic visual grammar — #116

Parent: #76  
Depends on: #112 / PR #113

## Why this layer exists

The #113 certified head has 290 semantic visual primitives and 25 semantic animation compositions, but visual coverage cannot scale by adding one renderer branch per concept. The production unit for the next phase is therefore a **semantic visual recipe**: a small data record that combines trusted primitives through reusable template families.

Baseline from #113:

- visual-friendly items: 609/1459 (41.7%);
- all supported card/region items including matching: 626/3172 (19.7%);
- sequence-order visuals: 20/143 (14.0%).

The unresolved denominator contains repeated semantic identities, so a single recipe can resolve many generated item instances.

## Resolution pipeline

```text
explicit authored visualRefs
        ↓
direct semantic primitive
        ↓
semantic visual recipe
        ↓
exact-label fallback
        ↓
text
```

There is deliberately no fuzzy substring inference.

## Recipe grammar

Recipes are auto-discovered from `content/visual-recipes/*.json` and reference existing visual primitives by stable `visualRef`.

The first grammar admits these reusable template families:

- `entity.single`
- `contrast.pair`
- `state.before-after`
- `process.sequence`
- `process.transform`
- `container.fill`
- `orbit`
- `rotation`
- `relation.source-target`
- `comparison`
- `classification`
- `measurement`

Adding a recipe pack does not require editing an interaction engine or a central recipe registry.

## Answer-safety contract

Every slot is classified as one of:

- `identity` — safe identity information;
- `context` — contextual information that may reveal a relation;
- `relation` — relation/state information.

Every surface explicitly selects one exposure mode:

- `hidden`
- `identity_only`
- `full_relation`

Example: the Earth-revolution recipe contains both Sun and Earth. On an answer option it exposes only Earth. On a feedback/scene surface it may expose Earth + Sun + the relation annotation. The validator rejects `identity_only` mappings that contain no identity slot.

## First multiplicative proof pack

`class3-high-roi-foundation.json` adds five recipes without adding a single SVG primitive:

1. living things — animal + plant classification examples;
2. Earth revolution — Earth/Sun orbit recipe;
3. planet orbit — planet/Sun orbit recipe;
4. liquid container shape — liquid plus two container contexts;
5. light source — Sun + candle classification examples.

These recipes are chosen because the Class 3 opportunity queue repeats the same semantic identities across generated questions. Coverage is measured by the canonical visual-coverage report, which records recipe-based resolution separately from authored/direct-semantic/exact-label resolution.

## ROI production queue

`npm run report:visual-roi` ranks remaining unresolved semantics using:

```text
occurrence count × engine breadth × profile breadth ÷ cost weight
```

The score is prioritization evidence, not semantic authority. Suggested template families are advisory only; a recipe still requires explicit authored semantic data and validation before runtime admission.

## Scaling path

The intended next production loop is:

```text
coverage report
  → unique semantic clustering
  → ROI queue
  → reuse existing primitives
  → add missing primitive only when necessary
  → author one recipe
  → validate surface policy
  → generated questions reuse recipe automatically
```

Near-term target: move visual-friendly coverage toward 55–60% primarily through recipe reuse. Mature target: 75–80% of genuinely visual-friendly items, while retaining text for concepts where a picture would be ambiguous or decorative rather than instructional.

## Non-goals

- no new interaction engine;
- no per-question art bank;
- no fuzzy semantic guessing;
- no forced visual for predicates better kept textual;
- no CSS-budget increase as a scaling shortcut;
- no replacement of existing authored visual primitives or semantic animation compositions.
