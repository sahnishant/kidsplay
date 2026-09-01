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

Do not put SVG filenames, upstream asset URLs, pixel motion, imported dictionary glosses, child definitions, or board/exam placement inside strategy review data.

A bare lemma is never enough when a word is polysemous. Use explicit sense keys. If the intended sense is not resolved, record `sense_unresolved` rather than guessing.

## Files

- `content/vocabulary-visuals/registry.json` — strategy, maturity, scene-template, motion and safety vocabulary.
- `content/vocabulary-visuals/batches/*.json` — committed historical batches plus generated reviewed/terminal projections.
- `content/vocabulary-visuals/review-batches/ledger.json` — deterministic order for manifest-driven reviewed batches.
- `content/vocabulary-visuals/review-batches/authority-model.json` — capability model separating reference, resolution, disposition, maturity and runtime authority.
- `content/vocabulary-visuals/review-batches/artifact-inventory.json` — semantic/control-plane/runtime artifact classification and transaction policy.
- `content/vocabulary-visuals/review-batches/candidate-relevance-review-001.json` — versioned Phase C relevance blockers and reasons.
- `content/vocabulary-visuals/review-batches/priority-batch-002.json` / `priority-batch-003.json` — frozen historical reviewed/policy manifests.
- `content/vocabulary-visuals/review-batches/priority-sense-resolution-001.items.json` — immutable historical 30-row #99/#100 review source.
- `content/vocabulary-visuals/review-batches/priority-sense-resolution-001.json` — corrected Sol Max authority/evidence manifest for that source.
- `content/vocabulary-visuals/__generated-priority-sense-resolution-queue.json` — remaining priority sense/relevance blockers.
- `content/vocabulary-visuals/__generated-corpus-sense-resolution-queue.json` — residual corpus blockers.
- `scripts/vocabulary-visuals/compile-reviewed-batches.mjs` — **sole supported production entrypoint**; serializes reviewed-batch generation and Phase C terminal accounting as one transaction.
- `scripts/vocabulary-visuals/compile-reviewed-batches-impl.mjs` — internal authority/inventory/source-kind implementation.
- `scripts/vocabulary-visuals/compile-reviewed-batches-core.mjs` — internal fingerprint-locked historical priority-gap core.
- `scripts/vocabulary-visuals/build-priority-gap-queue.mjs` — candidate-only priority queue reconstruction.
- `scripts/vocabulary-visuals/build-corpus-terminal-dispositions.mjs` — internal Phase C terminal-accounting implementation; called only by the public transactional compiler in production.
- `scripts/report-vocabulary-visual-coverage.mjs` — terminal/resolved/blocked/child-facing reporting with exact-review supersession.

## Review authority is not maturity

Five independent dimensions are deliberately separate:

1. **reference state** — candidate, frozen historical, exact human-reviewed, or exact Sol-Max-reviewed reference;
2. **resolution state** — unresolved/blocked, terminal exact-by-policy, historical resolved, human resolved, or Sol Max resolved;
3. **disposition state** — candidate-only, terminal textual, terminal unresolved, or reviewed strategy;
4. **teaching maturity** — V0 through V6 capability;
5. **runtime authority** — none, mapping configuration, or external runtime proof.

### Hard authority invariants

- V1 alone does **not** mean resolved.
- One lexical candidate does **not** mean intended-sense approval.
- `sense_unresolved` never counts as actively resolved.
- Semantic review cannot grant V5/V6 runtime authority.
- Terminal policy cannot impersonate exact review.
- Runtime proof cannot create semantic-review authority.
- Exact #51 human-reviewed senses must match #51 curation evidence.
- Sol High selection + Sol Max row-level acceptance is **not human editorial review** and must be recorded under a separate authority kind.

Authority kinds include:

- `candidate_reference` — reference only;
- `historical_reviewed_strategy` — migration-only, fingerprint protected;
- `historical_unresolved_watchlist` — historical unresolved state;
- `approved_terminal_policy` — conservative V1 `textual_only` / `sense_unresolved` policy only;
- `human_reviewed_exact_sense` — exact #51 human curation authority;
- `sol_max_reviewed_exact_sense` — pinned candidate trace + immutable Sol Max external review evidence; may preserve V1/V2 only and cannot claim human review;
- `runtime_mapping_config` / `external_runtime_proof` — outside semantic-review authority.

## #99/#100 exact-review tranche

PR #100 accepted 30 exact candidate selections after row-level Sol Max review. The historical source file used the label `human_reviewed_exact_sense`; #94 preserves those source bytes for auditability but corrects the generated authority projection.

The manifest records:

- reviewed semantic head `8f80e81a60aaf1a7574b327a0e953c2f0472e816`;
- merged main checkpoint `5040cdceb61fc83cf7161a5a97300e8a4c8fd7f4`;
- Sol Max review node `PRR_kwDOUHzR8c8AAAABLmzeeQ`;
- 30 accepted rows;
- `claimsHumanEditorialReview:false`.

The generated projection therefore uses `sol_max_reviewed_exact_sense` / `sol_max_selected_exact_candidate` while preserving each row's selected sense, candidate set, visual strategy, maturity and answer-safety decision.

A later exact review **supersedes the active blocker state for that lemma without deleting historical unresolved records**. This distinction is central to honest terminal accounting.

## Artifact inventory and deterministic order

`artifact-inventory.json` classifies all semantic/control-plane/runtime authority rather than relying on directory enumeration.

Frozen historical semantic sources include:

- `priority-batch-001.json` — blob `04b1d03d0b245196b42648db6b1fdf4523c04afd`;
- `polysemy-watchlist-001.json` — blob `10594268eb2333ebd3d959c8a893975b6f57fdf9`;
- `runtime-vocabulary-batch-002.json` — blob `223d25971475e517e063503beeb3bc2bfc77a511`.

Historical reviewed-batch equivalence remains frozen:

- batch 002 source fingerprint `6eb2305fa9101b088c56f2125a5fce7049d8712b032c423c1673130ee930f6be`;
- batch 002 item fingerprint `4a7344b934d64f419dffadd4436b2d8d50a05967bdc6f6912a29b914d98e85ef`;
- batch 003 source fingerprint `edb6d451af8d5709874a336005384773d0bc5826e7ce23691fb77a8a0f957b96`;
- batch 003 item fingerprint `e0881f110620cc141d5378e18ed2ae889cee053706523a7797a285548b6623f8`.

Future reviewed content must be registered as data/manifest entries. It must not add numbered production builders or package/workflow branches.

## Transactional compiler lifecycle

`compile-reviewed-batches.mjs` is the single production transaction. While holding:

`node_modules/.cache/kidsplay/vocabulary-review-batch.lock`

it runs, in order:

1. internal reviewed-manifest/authority compilation;
2. exact-review projection;
3. final priority-gap regeneration;
4. internal Phase C terminal accounting and both human-resolution queues.

Rules:

- concurrent default compiles serialize rather than race;
- a failed default compile restores the exact pre-run generated vocabulary JSON state;
- every custom/adversarial ledger run restores the exact pre-run generated state whether it succeeds or fails;
- only a successful default-ledger compile commits reviewed projections **and** Phase C outputs;
- custom-ledger tests cannot delete or rewrite canonical batch/gap artifacts;
- no compiler can observe another compiler's partially written generated JSON;
- `package.json` and CI invoke the public compiler once; Phase C has no separate production package command.

The lock is local build state under ignored `node_modules`. The machine-readable transaction contract lives in `artifact-inventory.json`.

The tracked shipped runtime projection `content/vocabulary-visuals/__generated-runtime-plans.json` is separately inventoried and pinned to LF by `.gitattributes`, matching generator output on Windows and Unix.

## Candidate-relevance data

The twelve Phase C single-candidate relevance traps are explicit reviewed data, not a production JavaScript lemma list:

`add`, `converse`, `customs`, `gay`, `guts`, `least`, `ness`, `pants`, `principal`, `rolling`, `slight`, `so`.

Each row has a reason code and reason. These remain active blockers until exact review supersedes them.

## Current exact accounting

The post-#100 / #94 no-drift baseline is:

| Surface | Terminal | Resolved | Active blockers |
| --- | ---: | ---: | ---: |
| Full 10,000-word corpus | **10,000** | **617** | **9,383** |
| Priority meaning set | **2,400** | **584** | **1,816** |

Additional facts:

- exact-review supersessions: **30**;
- priority active blocker queue: **1,816**;
- residual corpus queue: **7,565**;
- proof-admitted child-facing mappings: **22**;
- child-facing semantic senses: **21**;
- pending V5/V6 proof: **0**.

Historical unresolved records may remain in the record-level strategy corpus. They are not counted as active blockers once a later exact reviewed sense supersedes them.

Terminal accounting is not visual completion. `10,000/10,000 terminal` means every corpus lemma has either a reviewed strategy or an explicit fail-closed disposition; it does not mean 10,000 resolved meanings, images, animations, definitions or child-facing lessons.

## Maturity

- `V0` — candidate/unaudited.
- `V1` — semantic disposition exists; resolution may still be blocked.
- `V2` — exact direct visual/diagram primitive available.
- `V3` — reusable semantic scene plan is composition-ready.
- `V4` — meaningful optional motion implemented.
- `V5` — child-facing delivery consumes it with exact runtime proof.
- `V6` — deeper explanation/contrast/process/knowledge integration.

Never advance maturity merely because an asset exists.

## Reuse before new art

For each resolved sense:

1. reuse an existing registered Kidsplay semantic visual;
2. reuse an admitted OSS asset;
3. compose a scene from existing primitives/templates;
4. admit a commercially compatible OSS asset with immutable provenance when needed;
5. create a simple original Kidsplay SVG when composition is clearer or cheaper.

Do not import non-commercial or unclear-license art.

## Scene planning and safety

`planVocabularyScene()` returns presentation-neutral semantic plans. It does not choose source URLs or create question-specific animation code.

Explanatory strategies are suppressed during `assessment_pre_answer` unless explicitly `neutral_safe`. Every ready plan must retain static meaning under reduced motion.

Reusable templates include settlement/place, person role, actor action, attribute contrast, spatial relation, quantity comparison, sequence, state transition, cause/effect, comparison, expression, part focus and simple diagrams.

## Commands

```bash
npm run compile:vocabulary-visual-batches
npm run report:vocabulary-visuals
npm run validate:vocabulary-visuals
npm run test:vocabulary-batch-factory
npm run test:vocabulary-visuals
npm run check
```

## Required review passes

Before #94 can merge, record at least five independent reviews:

1. **historical fidelity** — immutable blobs and batch 002/003 source/item fingerprints reproduce;
2. **authority boundary** — candidate, terminal, human, Sol Max, maturity and runtime authorities cannot masquerade as one another;
3. **determinism/concurrency** — repeated/concurrent compiles converge; custom/failed runs roll back; generated state stays clean;
4. **generic architecture** — no semantic lemma catalogs or numbered builders return; future exact-review tranches are data/manifest-only;
5. **full regression** — exact 617/9,383 and 584/1,816 counts, runtime 22/21/0, bundle budgets, Browser journeys and packaged Android offline relaunch/rotation are all green on one unchanged final SHA.

Issue #76 and PR #98 are the durable orchestration/evidence surface. Chat memory is not the programme tracker.
