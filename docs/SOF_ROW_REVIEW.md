# SOF Class 2 row-level alignment review

## Why this exists

`SOF_INDIA_CLASS2` deliberately remains `prototype_unverified` even though its broad topic scope is supported by reviewed official SOF sources. Topic-level scope and row-level placement are different claims.

The current profile may be used for prototype practice and product testing. It must **not** be described as an officially verified row-by-row SOF mapping until the review below is completed with exact evidence.

## Current state

- Broad Class 2 scope is backed by the reviewed SOF syllabus/workbook source registry.
- The profile contains the current canonical Class 2 science/EVS and logical-reasoning rows.
- `fit` values (`review`, `core`, `stretch`, `challenge`) are editorial prototype placement.
- Goal sessions, diagnostics, readiness and mixed mocks may use these rows while the product is explicitly marked prototype.
- The readiness score is a local practice signal, not an official SOF score or certification.

## Generate the current review queue

From the repository root:

```powershell
node scripts/report-sof-row-review.mjs
```

The report groups every current profile row by topic and shows its prototype fit. Because profile provenance is still `prototype_unverified`, every listed row is considered pending row-level evidence review.

## Evidence required to verify a row

For each row, record all of the following before treating its placement as reviewed:

1. `rowId` — the exact canonical knowledge row.
2. `profileRef` — `SOF_INDIA_CLASS2`.
3. `sourceRef` — an entry from `content/alignment-sources/registry.json`.
4. Exact evidence locator — page, section, question number, workbook chapter, or stable anchor sufficient for another reviewer to find the same evidence.
5. Placement result — keep, remove, or change `fit`.
6. Reviewer and review date.
7. A short note when the evidence is inferential rather than explicit.

Do not use a broad syllabus topic name alone as row-level evidence. For example, official coverage of “Air, Water and Rocks” supports inclusion of that topic in the prototype; it does not by itself prove every individual rock fact is an official Class 2 SOF target.

## Promotion rule

Only promote the profile provenance from `prototype_unverified` after the exact reviewed scope intended for the product has a reproducible evidence trail. Rows without sufficient evidence should either remain explicitly prototype, move to free exploration only, or be removed from the verified profile.

## Product rule while review is pending

Keep ordinary foundational content free. Paid value may organize the same knowledge through goal sequencing, adaptive selection, weak-topic diagnostics, practice-readiness signals and mocks. Do not create a separate paid-only duplicate fact bank merely to simulate alignment.
