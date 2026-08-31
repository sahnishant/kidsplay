# Semantic vocabulary visuals

Issue #76 is the durable programme tracker for sense-safe vocabulary visuals and intelligent animation at scale.

## Boundary

Vocabulary visual data is presentation planning, not a dictionary and not curriculum provenance.

```text
corpus lemma + explicit teaching sense
        -> visual strategy
        -> reusable semantic scene plan
        -> existing visual/animation renderer
```

Do not put SVG filenames, upstream asset URLs, pixel motion, imported dictionary glosses, child definitions, or board/exam placement inside the strategy batches.

A bare lemma is never enough when a word is polysemous. Use explicit keys such as:

- `light#not-heavy`
- `full#container-at-capacity`
- `library#place-with-books-for-reading`
- `pull#move-toward-by-force`

If the intended sense is not resolved, record a `sense_unresolved` item rather than guessing. The polysemy watchlist exists specifically to keep ambiguous words visible and fail closed.

## Files

- `content/vocabulary-visuals/registry.json` — strategy, maturity, scene-template, motion and safety vocabulary.
- `content/vocabulary-visuals/batches/*.json` — explicit sense-level visual teaching decisions.
- `scripts/vocabulary-visuals/strategy-contract.mjs` — pure validation and semantic scene planning contract.
- `scripts/report-vocabulary-visual-coverage.mjs` — full-corpus coverage/gap reporting.
- `tests/vocabulary-visual-strategy.behavior.test.ts` — sense safety, settlement grammar, reduced motion and answer-leak regression coverage.

## Maturity

- `V0` — unaudited.
- `V1` — sense-safe strategy assigned.
- `V2` — direct visual/diagram primitive available.
- `V3` — valid reusable semantic scene plan can be composed.
- `V4` — meaningful optional motion implemented.
- `V5` — child-facing delivery consumes it.
- `V6` — explanation/contrast/process/deeper-knowledge integration.

Never advance maturity because an asset merely exists. Each level describes shipped capability for that sense.

## Reuse before new art

For each new sense:

1. reuse an existing registered Kidsplay semantic visual;
2. reuse an already-admitted OSS asset;
3. compose a scene from existing primitives/templates;
4. admit a new commercially compatible OSS asset with exact immutable provenance when needed;
5. create a simple original Kidsplay SVG when composition is cheaper or pedagogically clearer.

Do not import non-commercial or unclear-license art into the product.

## Scene planning

`planVocabularyScene()` returns presentation-neutral semantic plans. It does not choose asset-source URLs or create question-specific animation code.

Explanatory strategies are suppressed during `assessment_pre_answer` unless explicitly marked `neutral_safe`. Every ready plan carries a static equivalent so reduced-motion mode preserves meaning.

Reusable templates currently include settlement/place, actor-action, attribute contrast, spatial relation, quantity comparison, sequence, state transition, cause/effect, comparison, expression, part focus and simple diagram contracts.

## First control-plane batch

Batch 001 intentionally spans multiple grammars instead of overfitting to nouns:

- settlements/places;
- locomotion and manipulation actions;
- physical attributes and opposites;
- spatial relations;
- time/sequence;
- quantity/comparison;
- emotion/expression.

The separate polysemy watchlist records ambiguous lemmas that must not be automatically illustrated.

## Commands

```bash
npm run report:vocabulary-visuals
npm run validate:vocabulary-visuals
npm run test:vocabulary-visuals
npm run check
```

The reporter reads the committed 10,000-row primary corpus and produces a ranked unaudited gap queue. Later #76 cycles should consume that queue rather than rely only on example words written in the issue.

## Expansion protocol

Every #76 cycle repeats five disciplines:

1. corpus audit + sense classification;
2. visual primitive/asset review;
3. scene grammar + meaningful animation;
4. knowledge/delivery integration;
5. validation + honest coverage accounting.

Record exact branch, PR, SHA, checks, coverage change and remaining cycle work on issue #76. Do not use chat memory as the programme tracker.
