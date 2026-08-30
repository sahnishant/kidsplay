# SOF Class 2 row-level alignment review

## Why this exists

`SOF_INDIA_CLASS2` deliberately remains `prototype_unverified` even though its broad topic scope is supported by reviewed official SOF sources. Topic-level scope, row-level inclusion and Kidsplay's internal `fit` are three different claims.

The current profile may be used for prototype practice and product testing. It must **not** be described as an officially verified row-by-row SOF mapping until the intended verified scope has exact reproducible evidence.

## Current state

- Broad Class 2 scope is backed by the reviewed current SOF syllabus/workbook source registry.
- Profile membership currently contains **182 canonical rows**.
- The partial evidence file at `content/alignment-reviews/SOF_INDIA_CLASS2.json` records **26 reproducible row/skill anchors**.
- **13** anchors use current-year direct evidence.
- **13** anchors use historical official Class 2 assessment evidence with an explicit per-row current-year scope source and locator.
- **156** profile rows remain pending exact row/skill evidence.
- All currently retained evidence uses `fitBasis: editorial_retained`; none of Kidsplay's `core`, `review`, `stretch` or `challenge` labels are represented as SOF-supplied difficulty labels.
- Goal sessions, diagnostics, readiness and mixed mocks may use the profile only while the product remains explicitly prototype.
- The readiness score is a local practice signal, not an official SOF score or certification.

## Generate the current review queue

From the repository root:

```powershell
node scripts/report-sof-row-review.mjs
```

The report includes evidenced vs pending totals, current-year vs historical totals, fit-basis totals, topic coverage, a core-first priority queue and the full remaining queue. For machine-readable tooling:

```powershell
node scripts/report-sof-row-review.mjs --json
```

## Validate the evidence contract

The normal alignment gate runs both profile/scope validation and evidence-file validation:

```powershell
npm run validate:alignment
```

The validators reject non-canonical membership/evidence rows, unknown/non-reviewed sources, duplicate evidence/source references, invalid evidence types/locators, mismatched `fit`, profile/membership year drift, missing temporal basis, invalid fit basis, unsafe historical evidence and a falsely `completed` review.

Historical evidence has a stricter per-row contract: every historical row must carry both `currentScopeSourceRef` and `currentScopeLocator`, and the source ref must point to current-year `official_scope` evidence already recorded in the same review. This prevents a historical paper from silently becoming a current-year curriculum claim.

## Evidence required to verify row inclusion

For each row, record:

1. `rowId` — exact canonical knowledge row.
2. `sourceRef` — reviewed source from `content/alignment-sources/registry.json`.
3. Exact locator — page/section/question/anchor sufficient for another reviewer to reproduce the evidence.
4. `evidenceType` — `direct_fact` or `direct_skill`.
5. `temporalBasis` — `current_year` or `historical_class2`.
6. Placement decision — keep, remove or refit.
7. For retained/refit rows, `fit` plus `fitBasis`; normally `editorial_retained`.
8. For `historical_class2`, `currentScopeSourceRef` plus a specific `currentScopeLocator` naming the retained current-year topic/category.
9. A short note saying exactly what the source supports and what it does not prove.

Do not use a broad syllabus topic name alone as direct row evidence. Broad scope proves the topic family exists; it does not prove every canonical fact inside that family.

## Temporal evidence rule

### `current_year`

Use only when the direct fact/skill source academic year equals the profile year (`2026-27`). A current-year sample-paper hit is strong inclusion evidence, but it still does not make Kidsplay's internal fit label official unless that fit is separately source-supported.

### `historical_class2`

Historical official Class 2 SOF assessments may be used as direct inclusion precedent only when current-year official scope separately retains the relevant topic family **for that exact evidence row**.

Historical evidence means: “SOF has directly assessed this fact/skill at Class 2, and the current topic family still exists.” It does **not** mean the same question will recur, the row is guaranteed every year, the historical paper alone proves current-year placement, or SOF assigned Kidsplay's fit.

If current-year scope drops a topic family, historical evidence must not be used to keep that row in a verified current profile merely because it appeared in the past.

## Fit evidence rule

`fit` is a Kidsplay planning axis used by selectors and learning-product design; it is not assumed to be an SOF taxonomy.

- `fitBasis: editorial_retained` means the official source supports row/skill inclusion while Kidsplay retains its existing fit calibration.
- `fitBasis: source_supported` is reserved for evidence that genuinely supports the specific fit/priority claim.

A checked row therefore means “direct reproducible inclusion evidence exists,” not “SOF has certified every metadata field on this row.”

## Evidence currently recorded

### Current-year direct anchors — 13

- `kr.universe.earth.rotation.day-night`
- `kr.reasoning.ranking.position.between`
- `kr.air.windmill.turned-by.wind`
- `kr.plants.general.provide-food-shelter`
- `kr.plants.indigo.use.dye`
- `kr.plants.general.air.cool-fresh`
- `kr.plants.cardamom.use.spice`
- `kr.rocks.emerald.type.gemstone`
- `kr.water.sea.feature.salty`
- `kr.earth.plateau.alias.tableland`
- `kr.universe.orbit.definition.planet-path`
- `kr.animals.rhinoceros.threat.killed-for-horns`
- `kr.safety.road-sign.steep-descent`

### Historical official Class 2 anchors — 13

- `kr.reasoning.ranking.height.shortest`
- `kr.human.skin.sense.touch`
- `kr.family.cousin.relationship.aunt-uncle-child`
- `kr.clothing.wool.weather.winter`
- `kr.transport.tonga.power.animal-pulled`
- `kr.plants.cotton.use.fibre`
- `kr.universe.mercury.position.closest-sun`
- `kr.universe.earth.position.third`
- `kr.family.family-tree.purpose.relationships`
- `kr.air.kite.moved-by.wind`
- `kr.air.sailboat.moved-by.wind`
- `kr.plants.leaves.function.make-food`
- `kr.plants.flower.function.make-seeds`

The historical source set currently uses reviewed official Class 2 samples from 2025–26, 2024–25, 2022–23 and 2019–20. Two rows previously using the 2025–26 paper (rhinoceros/horns and steep-descent sign) now use direct 2026–27 sample-paper anchors instead.

## Promotion rule

Only promote profile provenance from `prototype_unverified` after the exact reviewed scope intended for the product has a reproducible evidence trail. Rows without sufficient evidence should remain explicitly prototype, move to free exploration only, or be removed from the verified profile.

If `content/alignment-reviews/SOF_INDIA_CLASS2.json` is ever marked `completed`, CI requires retained/refit evidence for every current member. Historical `remove` records may remain in the review as audit history. Completion still does not convert editorial fit values into official SOF labels.

## Product rule while review is pending

Keep ordinary foundational content free. Paid value may organize the same knowledge through goal sequencing, adaptive selection, weak-topic diagnostics, practice-readiness signals and mocks. Do not create a separate paid-only duplicate fact bank merely to simulate alignment.