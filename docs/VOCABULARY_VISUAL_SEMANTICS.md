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
- `content/vocabulary-visuals/review-batches/authority-model.json` — capability model separating reference, resolution, disposition, maturity and runtime authority.
- `content/vocabulary-visuals/review-batches/artifact-inventory.json` — complete semantic/control-plane/runtime artifact classification and historical immutability anchors.
- `content/vocabulary-visuals/review-batches/candidate-relevance-review-001.json` — versioned Phase C candidate-relevance blockers and per-row reasons.
- `content/vocabulary-visuals/review-batches/priority-batch-*.json` — durable reviewed decisions, source fingerprints and output fingerprints.
- `content/vocabulary-visuals/__generated-priority-sense-resolution-queue.json` — priority ambiguity/candidate-relevance blockers requiring human review.
- `content/vocabulary-visuals/__generated-corpus-sense-resolution-queue.json` — remaining non-priority corpus blockers requiring sense candidates/review.
- `scripts/vocabulary-visuals/strategy-contract.mjs` — pure validation and semantic scene planning contract.
- `scripts/vocabulary-visuals/build-priority-gap-queue.mjs` — candidate-only priority queue builder; never grants V1.
- `scripts/vocabulary-visuals/compile-reviewed-batches.mjs` — **public production compiler**; validates authority/inventory before compilation.
- `scripts/vocabulary-visuals/compile-reviewed-batches-core.mjs` — internal fingerprint-locked projection core; never a production entrypoint.
- `scripts/vocabulary-visuals/build-corpus-terminal-dispositions.mjs` — Phase C full-corpus blocker accounting and human-resolution queue builder.
- `scripts/report-vocabulary-visual-coverage.mjs` — full-corpus terminal/resolved/child-facing coverage reporting.
- `tests/vocabulary-visual-batch-factory.behavior.test.ts` — stale-source, capability-escalation, historical-equivalence, concurrency and idempotence gates.
- `tests/vocabulary-visual-control-plane-authority.behavior.test.ts` — authority/inventory, Phase C exact-count and runtime-boundary gate.
- `tests/vocabulary-visual-corpus-terminal.behavior.test.ts` — Phase C terminal-vs-resolved boundary gate.
- `tests/vocabulary-visual-strategy.behavior.test.ts` — sense safety, settlement grammar, reduced motion and answer-leak regression coverage.

## Review authority is not maturity

Five independent dimensions are deliberately kept separate:

1. **reference state** — whether data is merely a candidate reference, a frozen historical reference, or an exact human-reviewed reference;
2. **resolution state** — whether the intended sense remains blocked, is terminally exact only because there is one pinned candidate, is historically resolved, or is human-resolved;
3. **disposition state** — candidate-only, terminal textual, terminal unresolved, or reviewed strategy;
4. **teaching maturity** — V0 through V6 capability;
5. **runtime authority** — none, mapping configuration, or external runtime proof.

The canonical capability definitions live in `authority-model.json`.

### Hard authority invariants

- V1 **alone does not mean resolved**.
- One returned candidate **does not mean human intended-sense approval**.
- `sense_unresolved` **never counts as resolved**.
- A semantic manifest **cannot grant V5/V6 runtime authority**.
- A terminal policy **cannot impersonate human exact-sense review**.
- Runtime proof/configuration **cannot create semantic review authority**.
- Exact #51 human-reviewed senses must match the reviewed curation candidate ID and retain `sourceGlossCopied:false`.

Authority kinds are capability-based:

- `candidate_reference` — reference only; cannot create dispositions or resolve a sense;
- `historical_reviewed_strategy` — migration-only authority protected by immutable source/output fingerprints;
- `historical_unresolved_watchlist` — historical fail-closed unresolved dispositions;
- `approved_terminal_policy` — may create only conservative V1 `textual_only` / `sense_unresolved` terminal dispositions and cannot select among multiple candidates;
- `human_reviewed_exact_sense` — requires matching #51 curation evidence and may select the exact reviewed sense;
- `runtime_mapping_config` and `external_runtime_proof` — explicitly outside semantic-review authority.

The production wrapper enforces these capabilities before the fingerprint-locked core can run. `package.json` and CI point only to the wrapper. The core is inventoried as internal and is not an alternate production path.

## Complete artifact inventory

`artifact-inventory.json` classifies the whole semantic/control-plane history instead of allowing directory enumeration to imply authority.

Frozen committed semantic sources include:

- `priority-batch-001.json` — blob `04b1d03d0b245196b42648db6b1fdf4523c04afd`;
- `polysemy-watchlist-001.json` — blob `10594268eb2333ebd3d959c8a893975b6f57fdf9`;
- `runtime-vocabulary-batch-002.json` — blob `223d25971475e517e063503beeb3bc2bfc77a511`.

The inventory also classifies manifest-driven batches 002/003, the Phase C relevance-review data, the Phase C terminal-accounting policy, the production wrapper/internal core, and the runtime reinforcement/template/maturity-proof boundary. Every committed non-generated semantic batch must be inventoried; unknown batches fail the production compiler.

## Reviewed-batch architecture

Reviewed batches are **data, not scripts**.

The production path is:

```text
priority corpus + candidate sense lane
        -> candidate-only queue
        -> frozen semantic source fingerprint
        -> reviewed batch manifest + authority declaration
        -> ledger sequence
        -> authority/inventory production gate
        -> fingerprint-locked generic compiler core
        -> generated batch projection
        -> final live priority gap
        -> Phase C residual corpus terminal accounting
        -> normal visual reports/runtime compiler
```

The ledger is the only ordering authority. Directory enumeration order is not semantic order.

Each manifest records or derives:

- stable batch id, sequence and issue reference;
- explicit authority kind/state;
- exact source queue item count;
- immutable semantic source fingerprint;
- output item fingerprint;
- explicit reviewed lemma groups/items or an explicit terminal disposition policy;
- exact sense identifiers where a sense is selected;
- strategy, maturity, motion and answer-safety policy;
- provenance for human-reviewed #51 senses when used;
- generated output and frozen-source paths.

### Fail-closed rules

The production compiler must reject:

- stale source fingerprints;
- duplicate batch ids, sequence numbers, issue refs or output paths;
- duplicate exact sense keys;
- duplicate lemmas unless an additional exact `human_reviewed_primary_meaning` sense is being added;
- bare-lemma or cross-lemma sense keys;
- candidate/reference authority attempting to create a disposition;
- terminal-policy attempts to create scenes, V2+, runtime authority, human-review claims or arbitrary manifest status;
- missing/invalid reference, resolution or disposition states;
- implicit single-candidate approval unless the frozen source has exactly one pinned low-risk candidate;
- multi-candidate terminal rows that select a candidate instead of remaining `lemma#unresolved`;
- false human-review claims that do not match #51 curation;
- definitions, source glosses/examples or profile/curriculum placement in review manifests;
- unclassified historical semantic batch files or drifted frozen historical blobs.

Exact #51 human-reviewed additional senses may share a lemma with an older strategy item, but they still require a different exact sense key and matching reviewed curation evidence. This is multi-sense history, not silent supersession.

### Candidate-relevance decisions are reviewed data

The twelve Phase C single-candidate relevance traps are stored in `candidate-relevance-review-001.json`, not in production JavaScript:

`add`, `converse`, `customs`, `gay`, `guts`, `least`, `ness`, `pants`, `principal`, `rolling`, `slight`, `so`.

Each row includes a reason code and review reason. The Phase C builder consumes that data and is forbidden from selecting a sense or claiming human exact-sense review. These terms remain human-review blockers until a later exact review supersedes the blocker.

### Generated-file lifecycle

Reviewed manifests/authority/inventory data are committed source of truth. Phase C corpus/candidate state is derived from committed corpus + reviewed state. Generated queues/projections are intentionally rebuilt/ignored:

- `content/vocabulary-visuals/__generated-*.json`
- `content/vocabulary-visuals/batches/__generated-*.json`

`content/vocabulary-visuals/__generated-runtime-plans.json` is the one separately inventoried committed shipped runtime projection.

CI proves review generation leaves tracked source clean and uploads the final priority gap, frozen reviewed-batch sources, reviewed-batch projections, Phase C terminal projection, and both human-resolution queues for auditability.

### Historical migration proof

The generic factory is required to reproduce the already-reviewed history exactly:

- batch 002 source fingerprint `6eb2305fa9101b088c56f2125a5fce7049d8712b032c423c1673130ee930f6be`;
- batch 002 reviewed-item fingerprint `4a7344b934d64f419dffadd4436b2d8d50a05967bdc6f6912a29b914d98e85ef`;
- batch 003 source fingerprint `edb6d451af8d5709874a336005384773d0bc5826e7ce23691fb77a8a0f957b96`;
- batch 003 reviewed-item fingerprint `e0881f110620cc141d5378e18ed2ae889cee053706523a7797a285548b6623f8`.

A future batch 004+ should therefore require only a ledger entry plus review manifest/data. It must not add another `build-priority-batch-00N.mjs`, another package script, or another batch-specific CI step.

## Terminal accounting is not visual coverage

The #76 Phase B/Phase C factories keep terminal, resolved, blocked and child-facing facts separate.

Current Phase C no-drift baseline:

| Surface | Terminal | Resolved | Blocked |
| --- | ---: | ---: | ---: |
| Full 10,000-word corpus | **10,000** | **587** | **9,413** |
| Priority meaning set | **2,400** | **554** | **1,846** |

Human-resolution queues:
- priority blockers: **1,846**;
- residual corpus blockers: **7,565**.

Runtime remains independently proof-bound:
- **22** proof-admitted child-facing mappings;
- **21** semantic senses;
- **0** mappings pending V5/V6 proof.

Phase B therefore gives terminal dispositions for 2,400/2,400 priority meanings; Phase C gives terminal dispositions for 10,000/10,000 corpus lemmas. Neither figure means all those words are visually solved. The control-plane test fails if these quantities collapse into one another or drift during #94.

## Maturity

- `V0` — unaudited/candidate-only.
- `V1` — a semantic disposition exists; resolution may still be blocked.
- `V2` — direct visual/diagram primitive available.
- `V3` — valid reusable semantic scene plan can be composed.
- `V4` — meaningful optional motion implemented.
- `V5` — child-facing delivery consumes it with exact runtime proof.
- `V6` — explanation/contrast/process/deeper-knowledge integration.

Never advance maturity because an asset merely exists. Each level describes shipped capability for that sense. A manifest compiler may establish at most its authority-bound maturity; V5/V6 still require separate exact runtime proof.

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

The reporter reads the committed 10,000-row primary corpus and reports terminal, resolved, blocked and child-facing states separately. Candidate queues remain candidate/reference data; only capability-authorized review paths can create semantic dispositions, while Phase C blocker dispositions remain explicit unresolved accounting.

## Required review passes

Before a reviewed-batch architecture change merges, perform and record at least these five reviews:

1. **historical fidelity** — source/item fingerprints and frozen historical blobs do not drift;
2. **authority boundary** — candidate, terminal, human, maturity and runtime capabilities cannot masquerade as each other;
3. **determinism/concurrency + artifact lifecycle** — repeated/concurrent compiles converge and generation leaves tracked source clean;
4. **architecture** — no semantic lemma catalogs or numbered batch builders return to production code; all semantic sources/control-plane/runtime artifacts are inventoried;
5. **full product regression** — exact Phase C counts, runtime counts, full tests, bundle budgets, browser journeys and packaged Android offline relaunch/rotation stay green.

## Expansion protocol

Every #76 cycle repeats five disciplines:

1. corpus audit + sense classification;
2. visual primitive/asset review;
3. scene grammar + meaningful animation;
4. knowledge/delivery integration;
5. validation + honest coverage accounting.

For batch-driven review work, add review data to the manifest/ledger architecture rather than adding batch-specific compiler code. Record exact branch, PR, SHA, checks, coverage change and remaining cycle work on issue #76. Do not use chat memory as the programme tracker.
