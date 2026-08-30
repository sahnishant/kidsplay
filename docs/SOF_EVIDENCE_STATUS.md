# SOF Class 2 exact-evidence status

Checkpoint: 2026-08-30

This file is a compact status checkpoint. The contract/rationale remains in `docs/SOF_ROW_REVIEW.md`; the machine-readable truth remains in `content/alignment-reviews/SOF_INDIA_CLASS2.json` and `content/alignment-sources/registry.json`.

## Current numbers

- Profile: `SOF_INDIA_CLASS2`
- Profile provenance: `prototype_unverified`
- Academic year being prepared for: `2026-27`
- Current profile membership: **182 canonical rows**
- Current learnables: **185**
- Exact reproducible row/skill evidence: **24 / 182**
- Current-year direct evidence: **11**
- Historical official Class 2 direct evidence with per-row current-year scope binding: **13**
- Rows still pending exact row/skill evidence: **158**
- Current recorded fit basis for direct evidence: `editorial_retained`

The evidence backlog intentionally stayed at 158 while the bank expanded: new SOF profile rows were admitted only when direct evidence already existed.

## What an evidence row means

A checked row means there is a reproducible official source establishing the fact/skill at Class 2 and the row remains in the current prototype profile.

It does **not** mean:

- the whole profile is officially verified;
- the exact question will recur;
- SOF assigned Kidsplay's `core`, `review`, `stretch` or `challenge` fit;
- a historical paper alone proves current-year placement.

`fitBasis: editorial_retained` explicitly preserves this distinction.

## Temporal rules

### Current year

`temporalBasis: current_year` requires the direct evidence source's `academicYear` to equal the profile academic year (`2026-27`).

### Historical Class 2

`temporalBasis: historical_class2` requires all of the following:

1. A reviewed official Class 2 assessment from a different named academic year.
2. `currentScopeSourceRef` pointing to current-year `official_scope` evidence in the same review.
3. `currentScopeLocator` naming the specific retained 2026-27 topic/category that keeps the row eligible.
4. The direct fact/skill itself must be reproducible from the historical source; visual-only assumptions are not admitted when the relevant figure cannot be inspected.

Current historical source set prefers recent official papers where they provide the same exact evidence:

- `sof.nso.class2.sample-paper.2025-26`
- `sof.nso.class2.sample-paper.2024-25`
- `sof.nso.class2.sample-paper.2019-20` for remaining exact anchors not replaced by a newer reviewed paper

## Current-year direct anchors — 11

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

## Historical direct anchors — 13

- `kr.reasoning.ranking.height.shortest`
- `kr.human.skin.sense.touch`
- `kr.family.cousin.relationship.aunt-uncle-child`
- `kr.clothing.wool.weather.winter`
- `kr.transport.tonga.power.animal-pulled`
- `kr.animals.rhinoceros.threat.killed-for-horns`
- `kr.air.kite.moved-by.wind`
- `kr.air.sailboat.moved-by.wind`
- `kr.safety.road-sign.steep-descent`
- `kr.plants.cotton.use.fibre`
- `kr.universe.mercury.position.closest-sun`
- `kr.universe.earth.position.third`
- `kr.family.family-tree.purpose.relationships`

## Evidence-driven canonical expansion in this batch

The following facts were added as ordinary reusable canonical knowledge rather than one-off mock questions or a new engine:

- Plants provide food/shelter to animals.
- Indigo gives dye.
- Plants help keep air cool/fresh.
- Cardamom is a flavouring spice.
- Sea water is salty.
- Emerald is a gemstone.
- Plateau is also called tableland.
- Orbit is the fixed path of a planet around the Sun.
- Tonga is animal-pulled transport.
- Rhinoceros is threatened by people killing it for its horns.
- Moving air helps a kite fly.
- Wind pushes a sailboat's sail.
- A steep-descent road sign warns of a steep downhill road ahead.

All reuse existing `association_set@1` knowledge normalization and the existing formatter/engine system.

## Validation

Normal `npm run validate:alignment` now rejects, among other things:

- malformed/non-consecutive academic-year labels;
- unknown or duplicate evidence rows;
- non-reviewed/non-official evidence sources;
- current-year evidence from the wrong academic year;
- historical evidence without a distinct historical assessment year;
- historical evidence without a per-row current-year scope source and locator;
- invalid fit bases;
- keep decisions whose fit no longer matches the profile membership;
- a falsely completed review that does not cover every current membership row.

`node scripts/report-sof-row-review.mjs` / `--json` is the operational queue. Work should continue **core-first** and should prefer current-year exact evidence over historical precedent where both are available.

## Next evidence target

**158 rows remain pending.** Continue source review without relaxing the distinction between topic scope, exact row inclusion and Kidsplay editorial fit. The profile must remain `prototype_unverified` until the intended verified scope has a reproducible row-level trail.
