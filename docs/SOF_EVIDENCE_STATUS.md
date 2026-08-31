# SOF Class 2 evidence status

Checkpoint: 2026-08-31

## Current truth

- Profile: `SOF_INDIA_CLASS2`
- Profile provenance: `prototype_unverified`
- Academic year being prepared for: `2026-27`
- Current direct membership: **182 canonical rows**
- Exact reproducible official row/skill anchors: **27 / 182**
- Current-year direct anchors: **13**
- Historical named-year Class 2 anchors with current-scope binding: **14**
- Terminally reviewed rows with no exact public official anchor found: **155 / 182**
- Rows with a terminal evidence disposition: **182 / 182**
- Rows still pending terminal evidence review: **0**

The exact-anchor count did **not** increase to manufacture closure. `reviewed_no_exact_public_anchor` is a terminal research/audit disposition, not official provenance and not a claim that the fact never appeared in SOF.

## Machine-readable truth

Three artifacts intentionally model different claims:

1. `content/alignment-reviews/SOF_INDIA_CLASS2.json` — the **27 exact official anchors**. This remains the only row-level artifact that can say an exact official fact/skill anchor exists.
2. `content/alignment-recovery/SOF_INDIA_CLASS2.json` — blocked, rejected or saturated official-source recovery leads. These remain `evidenceEligible: false`.
3. `content/alignment-terminal-reviews/SOF_INDIA_CLASS2.json` — the **182/182 terminal review contract**. Exact-evidence rows resolve to `exact_official_anchor`; every other frozen membership row resolves to `reviewed_no_exact_public_anchor` under the audited accessible public official corpus.

`node scripts/report-sof-row-review.mjs --json` expands the terminal policy to every current membership row and reports exact, no-exact and pending counts separately.

## Exact-evidence contract

An exact official anchor requires a reproducible reviewed SOF assessment source, a narrow locator and `direct_fact` or `direct_skill` evidence. Current-year evidence must bind to `2026-27`. Historical Class 2 evidence requires a named historical year plus a per-row current-year scope source and locator.

The following do not qualify as exact row evidence:

- syllabus/topic presence alone;
- keyword or semantic near-matches;
- repeated copies of an already-counted fact across years;
- visual inference when the needed fact cannot be reproduced directly;
- paid or access-restricted papers/test banks;
- wrong-olympiad material;
- third-party mirrors or answer-key-only references.

Kidsplay `core`, `review`, `stretch` and `challenge` values remain editorial planning metadata unless a separate source explicitly supports such a classification. Existing exact anchors use `fitBasis: editorial_retained`.

## Terminal review contract

`content/alignment-terminal-reviews/SOF_INDIA_CLASS2.json` freezes the membership, exact-review and recovery inputs by Git blob SHA. CI recomputes those hashes. If membership, exact evidence or recovery results change without an explicit terminal-audit refresh, validation fails closed.

The terminal disposition `reviewed_no_exact_public_anchor` means only:

> No reproducible exact public official row/skill anchor was found for this canonical row in the accessible official corpus audited through 2026-08-31.

It does **not** mean the concept was never assessed, that the row is officially rejected, or that its current profile placement has become officially verified.

## Source-recovery closure

The recovery registry currently contains four terminal non-evidence leads:

- 2021-22 adjacent SOF file lead: `blocked_uninspectable`;
- 2020-21 Class 2 search hit: `rejected_wrong_olympiad`;
- 2017-18 official-domain search: `saturated_no_official_artifact`;
- legacy `Class-2_7.pdf`: `blocked_year_unbound`.

A future pass should reopen terminal review only when materially new inspectable official public evidence appears. A newly recovered exact source may increase the 27-anchor count; it must not silently convert old near-matches or inaccessible material into evidence.

## Validation

`npm run validate:alignment` now includes the terminal-review gate. It rejects stale audit snapshots, non-terminal recovery records, missing recovery bindings, unsupported exact source types/domains, duplicate/non-member exact rows, weakened evidence exclusions and any Class 2 membership row without a terminal disposition.

The operational invariant is therefore:

**182 membership rows = 27 exact official anchors + 155 terminal no-exact-public-anchor dispositions + 0 pending.**
