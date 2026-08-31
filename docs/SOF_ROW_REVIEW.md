# SOF Class 2 row-level review contract

## Claim separation

`SOF_INDIA_CLASS2` remains `prototype_unverified`. The repository now separates three claims that must not be conflated:

1. **Current broad scope** — reviewed official 2026-27 syllabus/reference material supports topic families.
2. **Exact official row/skill evidence** — a reproducible official assessment locator supports a specific canonical row/skill.
3. **Terminal evidence review** — research for a row has reached a recorded disposition even when no exact public official anchor was found.

Terminal review closure therefore does not promote the profile to officially verified row-by-row alignment.

## Current state

- direct canonical membership: **182**
- exact official anchors: **27**
  - current-year: **13**
  - historical named-year Class 2 with current-scope binding: **14**
- terminal `reviewed_no_exact_public_anchor`: **155**
- terminal rows: **182 / 182**
- pending terminal rows: **0**

The 27 exact anchors remain in `content/alignment-reviews/SOF_INDIA_CLASS2.json`. The 182-row terminal policy is stored separately in `content/alignment-terminal-reviews/SOF_INDIA_CLASS2.json` so exact provenance cannot be inflated merely to make a queue reach zero.

## Generate the row report

```powershell
node scripts/report-sof-row-review.mjs
node scripts/report-sof-row-review.mjs --json
```

The report exposes `exactOfficialAnchors`, `reviewedNoExactPublicAnchor`, `terminalRows`, `terminalPercent` and `pendingRows`. Every terminal row also carries its derived disposition; exact rows include their reproducible evidence object.

## Validate the contract

```powershell
npm run validate:alignment
```

Alignment validation now covers exact evidence, source recovery and terminal review. The terminal validator freezes the reviewed inputs by Git blob SHA and fails if membership, exact evidence or recovery state changes without an explicit audit refresh.

## Exact official anchor rules

An exact anchor records:

- the canonical `rowId`;
- a reviewed SOF `official_assessment` `sourceRef`;
- a reproducible locator;
- `direct_fact` or `direct_skill` evidence;
- `current_year` or valid `historical_class2` temporal basis;
- the keep/remove/refit decision and fit basis;
- for historical evidence, a current-year scope source and specific current-scope locator.

Current-year direct evidence must come from the profile academic year (`2026-27`). Historical evidence proves prior Class 2 assessment use only; it never implies recurrence. A historical paper must also have a named academic year and current-year topic retention for that exact row.

`fit` remains Kidsplay editorial metadata. `fitBasis: editorial_retained` means the source supports inclusion while Kidsplay keeps its own fit calibration; it does not make the fit an SOF difficulty label.

## Terminal no-exact rule

Rows without exact evidence resolve to `reviewed_no_exact_public_anchor` only because the source audit reached a terminal state for the accessible public official corpus through 2026-08-31.

This disposition means no reproducible exact public official row/skill anchor was found during that audit. It does not assert that the fact never appeared in SOF, and it does not create an official provenance record for that row.

The audit explicitly excludes:

- syllabus/topic-only support;
- semantic or keyword near-matches;
- visual inference without a reproducible fact;
- paid/access-restricted materials;
- wrong-olympiad hits;
- third-party mirrors.

Repeated yearly questions are not counted as new canonical row anchors unless they expose a genuinely distinct exact fact/skill supporting another row.

## Recovery state

Four remaining research leads have terminal non-evidence statuses in `content/alignment-recovery/SOF_INDIA_CLASS2.json`:

- 2021-22 candidate: `blocked_uninspectable`;
- 2020-21 search: `rejected_wrong_olympiad`;
- 2017-18 search: `saturated_no_official_artifact`;
- legacy `Class-2_7.pdf`: `blocked_year_unbound`.

All remain `evidenceEligible: false` and are referenced by the terminal source audit. New exact evidence can reopen the audit, but an inaccessible/paid/near-match source cannot.

## Product boundary

The profile may continue to power prototype practice, diagnostics, readiness and mocks, but those outputs are Kidsplay learning products—not official SOF certification. Broad foundational content remains free; paid value may organize it through goal sequencing, adaptive selection, diagnostics and mock structure without creating a separate paid-only fact bank.
