# SOF Class 2 source-recovery queue

Checkpoint: 2026-08-31

This file stores source-recovery leads that are **not evidence**. Machine-readable row truth remains in `content/alignment-reviews/SOF_INDIA_CLASS2.json`; only directly inspectable official sources may advance that review.

The recovery queue is also persisted in `content/alignment-recovery/SOF_INDIA_CLASS2.json`. `scripts/validate-alignment-recovery.mjs` is part of `validate:alignment` and fails closed if a blocked/rejected lead is made evidence-eligible or if a recovered lead is not bound to a reviewed, named-year, official SOF source.

## Current evidence truth

- `SOF_INDIA_CLASS2`: `prototype_unverified`
- exact reproducible row/skill evidence: **27 / 182**
- pending rows: **155 / 182**
- recovery pass 3 adds **zero** exact anchors; no candidate below changes those counts.

## Recovery pass 3 results

### 2021-22 NSO Class 2 candidate

Candidate official location: `https://sofworld.org/download/file/fid/33351`

Verified official context:

- `fid/33350` is directly inspectable as the SOF NSO **Class 1** sample and identifies **2021-22**;
- `fid/33352` is directly inspectable as the SOF NSO **Class 3** sample and identifies **2021-22**;
- the adjacent `fid/33351` remains a strong Class 2 recovery lead.

Why it is **not admitted**:

- the Class 2 candidate itself could not be directly inspected in this pass;
- sequential file-number inference is not row evidence;
- third-party mirrors or listings of the 2021-22 Class 2 paper are not accepted under the strict official-source contract.

Promotion rule: retry the SOF-hosted file only. If it becomes directly inspectable, record its named academic year, inspect the relevant pages/questions, and add row evidence only for narrow facts/skills explicitly supported by the official artifact. Do not infer answers from inaccessible figures.

### 2020-21 search

The directly inspectable SOF Class 2 2020-21 result at `fid/32465` is **National Cyber Olympiad**, not National Science Olympiad. It is explicitly rejected for NSO row evidence. No directly inspectable official Class 2 NSO 2020-21 sample was recovered in this pass.

### 2017-18 search

Searches recovered third-party copies/references but no directly inspectable named-year SOF-hosted Class 2 NSO 2017-18 artifact. Mirrors remain research leads only and add zero evidence.

### Legacy `Class-2_7.pdf`

The official SOF-hosted legacy artifact remains useful because it contains an inspectable lungs-help-breathing match, but no reproducible official academic-year binding was recovered. The `historical_class2` contract therefore continues to block promotion of that row.

## Highest-value next recovery targets

1. direct official retrieval of **2021-22** `fid/33351`;
2. a named-year official Class 2 NSO sample for **2017-18**;
3. a named-year official Class 2 NSO sample for **2020-21**;
4. an official year binding for legacy SOF-hosted `Class-2_7.pdf`.

## Saturation rule

Stop a source pass when only duplicate questions, syllabus-level scope, paid/uninspectable material, cross-olympiad material, mirrors, near-matches or uninspectable figures remain. Record the recovery result here and in the machine-readable recovery registry; never manufacture completion by weakening provenance.