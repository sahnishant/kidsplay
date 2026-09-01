# Semantic vocabulary visuals

Issue #76 is the durable programme tracker for sense-safe vocabulary visuals and intelligent animation at scale.

## Boundary

Vocabulary visual data is presentation planning, not a dictionary and not curriculum provenance.

```text
corpus lemma + explicit teaching sense
        -> reviewed visual disposition
        -> visual strategy
        -> reusable semantic scene plan
        -> existing visual/animation renderer
```

Do not put SVG filenames, upstream asset URLs, pixel motion, imported dictionary glosses, child definitions, or board/exam placement inside the strategy review data.

A bare lemma is never enough when a word is polysemous. Use explicit sense keys. If the intended sense is not resolved, record `sense_unresolved` rather than guessing. The polysemy watchlist and terminal review batches exist specifically to keep ambiguous words visible and fail closed.

## Files

- `content/vocabulary-visuals/registry.json` — strategy, maturity, scene-template, motion and safety vocabulary.
- `content/vocabulary-visuals/batches/*.json` — committed baseline strategy batches plus generated reviewed-batch/corpus-terminal projections.
- `content/vocabulary-visuals/review-batches/ledger.json` — deterministic order for manifest-driven reviewed batches.
- `content/vocabulary-visuals/review-batches/*.json` — durable reviewed decisions, source fingerprints and output fingerprints.
- `content/vocabulary-visuals/__generated-priority-sense-resolution-queue.json` — priority ambiguity/candidate-relevance blockers requiring human review.
- `content/vocabulary-visuals/__generated-corpus-sense-resolution-queue.json` — remaining non-priority corpus blockers requiring sense candidates/review.
- `scripts/vocabulary-visuals/strategy-contract.mjs` — pure validation and semantic scene planning contract.
- `scripts/vocabulary-visuals/build-priority-gap-queue.mjs` — candidate-only priority queue builder; never grants V1.
- `scripts/vocabulary-visuals/compile-reviewed-batches.mjs` — one generic manifest/ledger compiler for all numbered reviewed batches.
- `scripts/vocabulary-visuals/build-corpus-terminal-dispositions.mjs` — Phase C full-corpus blocker accounting and human-resolution queue builder.
- `scripts/report-vocabulary-visual-coverage.mjs` — full-corpus terminal/resolved/child-facing coverage reporting.
- `tests/vocabulary-visual-batch-factory.behavior.test.ts` — stale-source, duplicate-ledger, historical-equivalence and idempotence gates.
- `tests/vocabulary-visual-corpus-terminal.behavior.test.ts` — Phase C terminal-vs-resolved boundary gate.
- `tests/vocabulary-visual-strategy.behavior.test.ts` — sense safety, settlement grammar, reduced motion and answer-leak regression coverage.

## Reviewed-batch architecture

Reviewed batches are **data, not scripts**.

The production path is:

```text
priority corpus + candidate sense lane
        -> candidate-only queue
        -> frozen semantic source fingerprint
        -> reviewed batch manifest
        -> ledger sequence
        -> generic compiler
        -> generated batch projection
        -> final live priority gap
        -> Phase C residual corpus terminal accounting
        -> normal visual reports/runtime compiler
```

The ledger is the only ordering authority. Directory enumeration order is not semantic order.

Each manifest records or derives:

- stable batch id, sequence and issue reference;
- exact source queue item count;
- immutable semantic source fingerprint;
- output item fingerprint;
- explicit reviewed lemma groups/items or an explicit terminal disposition policy;
- exact sense identifiers where a sense is selected;
- strategy, maturity, motion and answer-safety policy;
- provenance for human-reviewed #51 senses when used;
- generated output and frozen-source paths.

### Fail-closed rules

The generic compiler must reject:

- stale source fingerprints;
- duplicate batch ids, sequence numbers, issue refs or output paths;
- duplicate exact sense keys;
- duplicate lemmas unless an additional exact `human_reviewed_primary_meaning` sense is being added;
- bare-lemma or cross-lemma sense keys;
- implicit single-candidate approval unless the frozen source has exactly one pinned low-risk candidate;
- multi-candidate terminal rows that select a candidate instead of remaining `lemma#unresolved`;
- manifest attempts to create V2+ maturity, V5/V6 runtime proof, definitions, source glosses/examples or profile/curriculum placement.

Exact #51 human-reviewed additional senses may share a lemma with an older strategy item, but they still require a different exact sense key and matching reviewed curation evidence. This is multi-sense history, not silent supersession.

### Generated-file lifecycle

Reviewed manifests and the ledger are committed source of truth. Phase C corpus/candidate state is derived from committed corpus + reviewed state. Generated queues/projections are intentionally rebuilt/ignored:

- `content/vocabulary-visuals/__generated-*.json`
- `content/vocabulary-visuals/batches/__generated-*.json`

CI proves generation leaves tracked source clean and uploads the final priority gap, frozen reviewed-batch sources, reviewed-batch projections, Phase C terminal projection, and both human-resolution queues for auditability.

### Historical migration proof

The generic factory is required to reproduce the already-reviewed history exactly:

- batch 002 source fingerprint `6eb2305fa9101b088c56f2125a5fce7049d8712b032c423c1673130ee930f6be`;
- batch 002 reviewed-item fingerprint `4a7344b934d64f419dffadd4436b2d8d50a05967bdc6f6912a29b914d98e85ef`;
- batch 003 source fingerprint `edb6d451af8d5709874a336005384773d0bc5826e7ce23691fb77a8a0f957b96`;
- batch 003 reviewed-item fingerprint `e0881f110620cc141d5378e18ed2ae889cee053706523a7797a285548b6623f8`.

A future batch 004+ should therefore require only a ledger entry plus review manifest/data. It must not add another `build-priority-batch-00N.mjs`, another package script, or another batch-specific CI step.

## Terminal accounting is not visual coverage

The #76 Phase B/Phase C factories keep three different facts separate:

- **terminal disposition** — a lemma has a sense-specific strategy or an explicit fail-closed blocker;
- **resolved strategy** — it is not waiting in a sense/relevance review queue;
- **child-facing maturity** — separate runtime proof establishes V5/V6 delivery.

Phase B provides terminal dispositions for 2,400/2,400 priority meanings. Phase C extends terminal accounting to 10,000/10,000 corpus lemmas by generating 7,565 explicit residual blockers. Neither operation claims that those blockers have visuals, definitions, profile placement or runtime delivery.

The priority human-resolution queue also preserves twelve single-candidate relevance traps such as `add`, `pants`, `principal` and `so`. Their Phase B strategy stays safely textual-only, but the lone candidate is not treated as final intended-sense authority. Reports must keep terminal, resolved, blocked and child-facing counts separate.

## Maturity

- `V0` — unaudited.
- `V1` — sense-safe strategy/disposition assigned.
- `V2` — direct visual/diagram primitive available.
- `V3` — valid reusable semantic scene plan can be composed.
- `V4` — meaningful optional motion implemented.
- `V5` — child-facing delivery consumes it.
- `V6` — explanation/contrast/process/deeper-knowledge integration.

Never advance maturity because an asset merely exists. Each level describes shipped capability for that sense. A manifest compiler may establish V1 only; V5/V6 still require separate exact runtime proof.

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

## Commands

```bash
npm run compile:vocabulary-visual-batches
npm run compile:vocabulary-visual-corpus-terminal
npm run report:vocabulary-visuals
npm run validate:vocabulary-visuals
npm run test:vocabulary-batch-factory
npm run test:vocabulary-visuals
npm run check
```

The reporter reads the committed 10,000-row primary corpus and reports terminal, resolved, blocked and child-facing states separately. Candidate queues remain candidate-only; only reviewed manifests can establish reviewed V1 strategy decisions, while Phase C blocker dispositions remain explicit unresolved accounting.

## Expansion protocol

Every #76 cycle repeats five disciplines:

1. corpus audit + sense classification;
2. visual primitive/asset review;
3. scene grammar + meaningful animation;
4. knowledge/delivery integration;
5. validation + honest coverage accounting.

For batch-driven review work, add review data to the manifest/ledger architecture rather than adding batch-specific compiler code. Record exact branch, PR, SHA, checks, coverage change and remaining cycle work on issue #76. Do not use chat memory as the programme tracker.
