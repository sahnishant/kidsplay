# SOF Class 2 row-level alignment review

## Why this exists

`SOF_INDIA_CLASS2` deliberately remains `prototype_unverified` even though its broad topic scope is supported by reviewed official SOF sources. Topic-level scope, row-level inclusion and Kidsplay's internal `fit` are three different claims.

The current profile may be used for prototype practice and product testing. It must **not** be described as an officially verified row-by-row SOF mapping until the intended verified scope has exact reproducible evidence.

## Current state

- Broad Class 2 scope is backed by the reviewed current SOF syllabus/workbook source registry.
- The profile contains the current canonical Class 2 science/EVS and logical-reasoning rows.
- `fit` values (`review`, `core`, `stretch`, `challenge`) are a Kidsplay planning axis. A source proving that a fact/skill belongs in Class 2 does **not** automatically prove its fit label.
- Goal sessions, diagnostics, readiness and mixed mocks may use these rows while the product is explicitly marked prototype.
- The readiness score is a local practice signal, not an official SOF score or certification.
- A partial evidence file exists at `content/alignment-reviews/SOF_INDIA_CLASS2.json`.
- The current review records **11 reproducible row/skill inclusion anchors** and leaves **158 rows pending**.
- Of those 11 anchors, **3 are current-year direct evidence** and **8 are historical official Class 2 assessment evidence with current-year topic scope separately retained**.
- All 11 currently use `fitBasis: editorial_retained`; none are represented as SOF-supplied difficulty/priority labels.
- This does not change the overall `prototype_unverified` profile status.

## Generate the current review queue

From the repository root:

```powershell
node scripts/report-sof-row-review.mjs
```

The report includes:

- evidenced vs pending totals;
- current-year vs historical Class 2 evidence totals;
- fit-basis totals;
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

The evidence validator rejects unknown profile rows, unknown/non-reviewed sources, duplicate row evidence, invalid evidence types or locators, mismatched `fit` on keep decisions, missing/invalid temporal basis, missing/invalid fit basis, unsafe historical evidence and a falsely `completed` review that does not cover every membership row.

Historical evidence receives extra checks: it must come from a reviewed official assessment in a different named academic year, and the same review must also contain current-year official scope evidence. This prevents an old paper from silently becoming a current-year curriculum claim.

## Evidence required to verify row inclusion

For each row, record all of the following before treating its inclusion as reviewed evidence:

1. `rowId` — the exact canonical knowledge row.
2. `profileRef` — `SOF_INDIA_CLASS2`.
3. `sourceRef` — an entry from `content/alignment-sources/registry.json`.
4. Exact evidence locator — page, section, question number, workbook chapter, or stable anchor sufficient for another reviewer to find the same evidence.
5. Evidence type — `direct_fact` or `direct_skill` for row-level evidence.
6. `temporalBasis` — `current_year` or `historical_class2`.
7. Placement result — keep, remove, or change `fit`.
8. For retained/refit rows, `fit` plus `fitBasis` — normally `editorial_retained`; use `source_supported` only when the source genuinely supports the fit claim rather than mere inclusion.
9. Reviewer/review date at the evidence-file level.
10. A short note explaining exactly what the source supports and, for historical evidence, what it does **not** prove.

Do not use a broad syllabus topic name alone as row-level evidence. For example, official coverage of “Air, Water and Rocks” supports inclusion of that topic in the prototype; it does not by itself prove every individual rock fact is an official Class 2 SOF target.

## Temporal evidence rule

### `current_year`

Use this only when the direct fact/skill source is for the same academic year as the profile. CI requires the source's `academicYear` to match the profile year.

A current-year sample-paper hit is strong evidence that the fact/skill is relevant to the current assessment year. It still does not make Kidsplay's internal `fit` an official SOF label unless `fitBasis` is separately justified.

### `historical_class2`

Historical official Class 2 SOF assessments may be used as direct inclusion precedent **only** when current-year official scope separately retains the relevant topic family.

Historical evidence means: “SOF has directly assessed this fact/skill at Class 2, and the topic family still exists in current Class 2 scope.” It does **not** mean:

- the same question or exact row will appear in 2026–27;
- the row is guaranteed to be tested every year;
- the historical paper alone proves current-year placement;
- SOF assigned Kidsplay's `core/review/stretch/challenge` fit.

If current-year scope drops a topic family, historical evidence must not be used to keep that row in a current verified profile merely because it appeared in the past.

## Fit evidence rule

`fit` is primarily a Kidsplay planning axis used by selectors and learning-product design; it is not assumed to be an SOF taxonomy.

- `fitBasis: editorial_retained` means the official source supports the row/skill inclusion, while the existing fit remains Kidsplay's editorial calibration.
- `fitBasis: source_supported` is reserved for evidence that genuinely supports the specific fit/priority claim. Do not use it simply because the row appears in a sample paper.

A checked row therefore means “direct reproducible inclusion evidence exists,” not “SOF has certified every metadata field on this row.”

## Evidence currently recorded

### Current-year direct anchors — 3

The official 2026–27 sample paper provides reproducible support for:

- `kr.universe.earth.rotation.day-night` — direct fact anchor from sample-paper question 10.
- `kr.reasoning.ranking.position.between` — direct ranking/position skill anchor from sample-paper question 2 plus the official syllabus Ranking Test category.
- `kr.air.windmill.turned-by.wind` — direct fact anchor from sample-paper question 6, where the windmill is one of the pictured objects that requires moving air.

### Historical official Class 2 anchors — 8

The official SOF National Science Olympiad Class 2 sample paper for 2019–20 provides direct historical precedent for:

- `kr.reasoning.ranking.height.shortest` — transitive height ranking.
- `kr.human.skin.sense.touch` — skin used to identify tactile properties.
- `kr.family.cousin.relationship.aunt-uncle-child` — cousin relationship.
- `kr.clothing.wool.weather.winter` — woollen clothes in winter to keep warm.
- `kr.plants.cotton.use.fibre` — cotton yields fibre.
- `kr.universe.mercury.position.closest-sun` — Mercury nearest the Sun in the tested planetary order.
- `kr.universe.earth.position.third` — Earth third in the tested Sun-distance order.
- `kr.family.family-tree.purpose.relationships` — family-tree relationship inference.

These eight are intentionally recorded as `historical_class2`, with the current 2026–27 syllabus providing the separate present-day topic-scope anchor. They are not current-year sample-paper claims.

Other sample-paper observations remain **scope/assessment-format or related-topic evidence**, not exact row verification. Do not promote them merely because a related topic appears in a paper, and do not use visually dependent evidence unless the exact visual mapping is reproducibly inspectable.

## Promotion rule

Only promote the profile provenance from `prototype_unverified` after the exact reviewed scope intended for the product has a reproducible evidence trail. Rows without sufficient evidence should either remain explicitly prototype, move to free exploration only, or be removed from the verified profile.

If `content/alignment-reviews/SOF_INDIA_CLASS2.json` is ever marked `completed`, CI requires row evidence for every member of the profile. Completion still does not convert editorial `fit` values into official SOF labels; `fitBasis` remains explicit.

## Product rule while review is pending

Keep ordinary foundational content free. Paid value may organize the same knowledge through goal sequencing, adaptive selection, weak-topic diagnostics, practice-readiness signals and mocks. Do not create a separate paid-only duplicate fact bank merely to simulate alignment.
