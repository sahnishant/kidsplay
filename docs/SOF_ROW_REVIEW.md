# SOF Class 2 row-level alignment review

## Why this exists

`SOF_INDIA_CLASS2` deliberately remains `prototype_unverified` even though its broad topic scope is supported by reviewed official SOF sources. Topic-level scope and row-level placement are different claims.

The current profile may be used for prototype practice and product testing. It must **not** be described as an officially verified row-by-row SOF mapping until the review below is completed with exact evidence.

## Current state

- Broad Class 2 scope is backed by the reviewed SOF syllabus/workbook source registry.
- The profile contains the current canonical Class 2 science/EVS and logical-reasoning rows.
- `fit` values (`review`, `core`, `stretch`, `challenge`) are editorial prototype placement unless supported by recorded row evidence.
- Goal sessions, diagnostics, readiness and mixed mocks may use these rows while the product is explicitly marked prototype.
- The readiness score is a local practice signal, not an official SOF score or certification.
- A partial evidence file exists at `content/alignment-reviews/SOF_INDIA_CLASS2.json`.
- The current official-source review records **3 reproducible row/skill anchors** and leaves **166 rows pending**. This does not change the overall `prototype_unverified` profile status.

## Generate the current review queue

From the repository root:

```powershell
node scripts/report-sof-row-review.mjs
```

The report now includes:

- evidenced vs pending totals;
- evidence coverage by topic;
- a **core-first priority queue** so high-value profile claims are reviewed before enrichment rows;
- the complete remaining queue grouped by topic.

For machine-readable review tooling or batch work:

```powershell
node scripts/report-sof-row-review.mjs --json
```

## Validate the evidence contract

The normal alignment gate runs both profile/scope validation and evidence-file validation:

```powershell
npm run validate:alignment
```

The evidence validator rejects unknown profile rows, unknown/non-reviewed sources, duplicate row evidence, invalid evidence types or locators, mismatched `fit` on keep decisions, and a falsely `completed` review that does not cover every membership row.

## Evidence required to verify a row

For each row, record all of the following before treating its placement as reviewed:

1. `rowId` — the exact canonical knowledge row.
2. `profileRef` — `SOF_INDIA_CLASS2`.
3. `sourceRef` — an entry from `content/alignment-sources/registry.json`.
4. Exact evidence locator — page, section, question number, workbook chapter, or stable anchor sufficient for another reviewer to find the same evidence.
5. Evidence type — `direct_fact` or `direct_skill` for row-level evidence.
6. Placement result — keep, remove, or change `fit`.
7. Reviewer/review date at the evidence-file level.
8. A short note explaining what the source actually supports.

Do not use a broad syllabus topic name alone as row-level evidence. For example, official coverage of “Air, Water and Rocks” supports inclusion of that topic in the prototype; it does not by itself prove every individual rock fact is an official Class 2 SOF target.

## Evidence currently recorded

The official 2026–27 sample paper currently provides reproducible support for:

- `kr.universe.earth.rotation.day-night` — direct fact anchor from sample-paper question 10.
- `kr.reasoning.ranking.position.between` — direct ranking/position skill anchor from sample-paper question 2 plus the official syllabus Ranking Test category.
- `kr.air.windmill.turned-by.wind` — direct fact anchor from sample-paper question 6, where the windmill is one of the pictured objects that requires moving air.

Other sample-paper observations currently remain **scope/assessment-format evidence**, not exact row verification. Do not promote them merely because a related topic appears in the paper.

## Promotion rule

Only promote the profile provenance from `prototype_unverified` after the exact reviewed scope intended for the product has a reproducible evidence trail. Rows without sufficient evidence should either remain explicitly prototype, move to free exploration only, or be removed from the verified profile.

If `content/alignment-reviews/SOF_INDIA_CLASS2.json` is ever marked `completed`, CI requires row evidence for every member of the profile.

## Product rule while review is pending

Keep ordinary foundational content free. Paid value may organize the same knowledge through goal sequencing, adaptive selection, weak-topic diagnostics, practice-readiness signals and mocks. Do not create a separate paid-only duplicate fact bank merely to simulate alignment.
