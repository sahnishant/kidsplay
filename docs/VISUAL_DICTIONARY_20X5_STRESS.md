# Visual dictionary 20 × 5 scale-readiness stress

Tracker: #114, child lane of #76.

This document records a repeated architecture stress pass over the scalable Visual Meaning Presenter. It does **not** claim that the twenty #76 semantic territories are sense-reviewed, illustrated, V5-promoted, or curriculum-approved.

The purpose is narrower and important: prove that those territories can grow through the existing #76 semantic strategy system and the six derived presentation primitives **without adding a renderer or layout class per word**.

## Repeated five-discipline cycle

The repository now executes **24 cycles × 5 invariant disciplines = 120 checks** through `presentation-stress-matrix.mjs` and `vocabulary-presentation-20x5-stress.behavior.test.ts`.

Every deterministic cycle checks:

1. **sense** — every source item remains keyed by an explicit `lemma#sense`, never a bare lemma;
2. **mode** — every strategy derives into exactly one bounded mode and blocked strategies remain `text`;
3. **authority** — V1/V3/V4 cannot become child-facing V5/V6 authority; unresolved/text-only cannot render;
4. **reuse** — request ordering cannot change the plan and one exact sense keeps one stable presentation key;
5. **scale** — both requested-sense count and serialized payload remain inside the contract limits.

The stress partitions are generated from the real checked-in strategy items. They are not a second hand-authored word list.

## Hard slice boundary

`presentation-modes.json` now makes bounded projection executable policy:

```text
maxRequestedSenses = 512
maxPayloadBytes    = 524288
```

The 512-sense cap deliberately accommodates a complete 400-meaning priority grade with headroom while preventing a surface/session call from silently turning into a 10,000-row corpus import.

Repository compiler and browser resolver both enforce the same limits.

## Twenty #76 territory readiness map

The table below describes **presentation-path readiness only**. It never assigns a sense, visual maturity, board placement, or asset.

| # | #76 territory | Reusable derived modes after sense review/proof | Fail-closed condition |
| ---: | --- | --- | --- |
| 1 | Settlement / place | `asset`, `compose`, `compare` | ambiguous place sense or unproved scene → `text` |
| 2 | Home / interior | `asset`, `compose` | no exact entity/part/place authority → `text` |
| 3 | School / learning | `asset`, `transition`, `compare`, `scene` | polysemous verbs such as *match* stay sense-specific |
| 4 | People / family | `asset`, `scene`, `compose` | role/relationship ambiguity → `text` |
| 5 | Occupations | `scene`, `asset` | person-role context not proven → `text` |
| 6 | Locomotion | `transition`, `scene` | verb sense unresolved or motion would misteach → `text` |
| 7 | Manipulation / force | `transition`, `compare`, `compose` | answer-revealing pre-answer use is suppressed |
| 8 | Daily routines | `transition`, `scene` | no reviewed action/state sense → `text` |
| 9 | Emotion / social expression | `scene`, `compare` | expression not semantically adequate → `text` |
| 10 | Physical attributes | `compare`, `scene` | dimension sense unresolved, e.g. *light* → `text` |
| 11 | Spatial relations | `compose`, `compare` | relation sense unresolved → `text` |
| 12 | Time / sequence | `transition`, `compose` | sequence semantics not proven → `text` |
| 13 | Quantity / comparison | `compare`, `compose` | quantitative sense unresolved → `text` |
| 14 | Nature / landforms / weather | `asset`, `compose`, `transition`, `scene` | no exact entity/process authority → `text` |
| 15 | Animals / behaviour / adaptation | `asset`, `compose`, `transition` | animal/action sense unresolved → `text` |
| 16 | Plants / food / agriculture | `asset`, `compose`, `transition` | part/process sense unresolved → `text` |
| 17 | Body / health / clothing | `asset`, `compose`, `transition` | part/action sense unresolved → `text` |
| 18 | Transport / community / technology | `asset`, `compose`, `transition`, `scene` | device/place/action ambiguity → `text` |
| 19 | Science / process / state change | `transition`, `compare`, `compose` | renderer proof or semantic process authority missing → `text` |
| 20 | Abstract / polysemous / residual | primarily `text`, then any proven mode | unresolved sense **must** remain `text`; no lemma inheritance |

This table means that the presentation architecture is not the reason future territory batches remain incomplete. The remaining bottlenecks are deliberately elsewhere: exact sense review, reusable strategy parameters, renderer proof, child-facing runtime proof, semantic depth, or asset provenance.

## Browser boundary is transitive

The permanent validator starts from:

- `src/presentation/vocabularyPresentation.ts`
- `src/presentation/VisualMeaningPresenter.svelte`

and follows relative imports transitively. It fails if that dependency graph reaches:

- `content/lexicon/open/**`;
- `content/lexicon/reviews/**`;
- `content/vocabulary-visuals/batches/**`;
- `content/vocabulary-visuals/review-batches/**`.

The child runtime is therefore allowed to consume only the small presentation contract, the already-bounded generated runtime plan, and ordinary renderer/visual code—not the editorial/control-plane corpus.

## Surface reuse

Browser presentation can now resolve either:

```text
exact senseKey
```

or an already-admitted canonical:

```text
knowledgeRef → child-facing runtime plan → exact senseKey
```

A multi-sense caller receives deterministic canonical ordering. Duplicate/empty/over-limit requests fail before presentation.

The reusable component still receives child meaning/example text from its caller. OEWN glosses and review packets never become an implicit dictionary copy source.

## Assessment safety

The same sense may be reused across dictionary, post-answer explanation, story or later vocabulary surfaces, but the caller must declare the phase when it is pre-answer assessment.

```text
assessment_pre_answer
        ↓
neutral_safe? ── yes → proven visual may render
        └────── no  → text fallback
```

This invariant is enforced at the browser resolver and component boundary, not merely by one current screen.

## What the repeated passes do not authorize

The 24 × 5 stress matrix cannot:

- accept an OEWN candidate;
- change `sense_unresolved` to an exact sense;
- add an asset or provenance claim;
- promote V1/V2/V3/V4 to V5/V6;
- create CBSE/CISCE/SOF placement;
- turn a source gloss into child copy;
- declare any of the twenty territory word lists complete.

Those remain separate reviewed production work under #76 and its child lanes.
