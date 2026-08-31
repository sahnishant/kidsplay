# SOF Class 2 source-recovery state

Checkpoint: 2026-08-31

Source-recovery records are research leads, not row evidence. Exact row evidence remains in `content/alignment-reviews/SOF_INDIA_CLASS2.json`; the recovery registry is `content/alignment-recovery/SOF_INDIA_CLASS2.json`.

## Closure state

- exact official row/skill anchors: **27 / 182**
- terminally reviewed with no exact public official anchor found: **155 / 182**
- terminal review coverage: **182 / 182**
- pending terminal rows: **0**
- open non-terminal recovery leads: **0**

The recovery queue is closed **without** promoting any of these leads to evidence. All four machine-readable records remain `evidenceEligible: false` and are bound into the terminal audit.

## Terminal recovery records

### 2021-22 Class 2 adjacent file lead

- record: `nso-class2-2021-22-fid-33351`
- candidate: official SOF `fid/33351`
- state: `blocked_uninspectable`
- reason: neighboring official file IDs support the recovery hypothesis but adjacency is not evidence, and the candidate itself was not directly inspectable.

### 2020-21 Class 2 search

- record: `nso-class2-2020-21-search`
- state: `rejected_wrong_olympiad`
- reason: the directly inspectable SOF Class 2 result at the recovered file ID is National Cyber Olympiad rather than the science olympiad.

### 2017-18 Class 2 search

- record: `nso-class2-2017-18-search`
- state: `saturated_no_official_artifact`
- reason: third-party copies/references were found but no directly inspectable named-year SOF-hosted Class 2 science paper was recovered.

### Legacy `Class-2_7.pdf`

- record: `nso-class2-legacy-class2-7-year-binding`
- state: `blocked_year_unbound`
- reason: the official artifact contains an inspectable lungs/breathing match, but no reproducible official academic-year binding was found. The named-year historical evidence contract therefore blocks promotion.

## Reopen rule

Reopen source recovery only when materially new **official, public and directly inspectable** evidence becomes available—for example, successful retrieval of the 2021-22 candidate or a reproducible official year binding for the legacy file.

Do not reopen or promote evidence merely because of:

- duplicate sample questions;
- syllabus-level topic coverage;
- paid/access-restricted material;
- cross-olympiad hits;
- mirrors or answer-key-only references;
- semantic near-matches;
- uninspectable visual assumptions.

A reopened source that yields an exact row/skill fact must be added through the exact evidence contract first. The terminal audit snapshot must then be refreshed explicitly; CI is designed to fail until that refresh happens.
