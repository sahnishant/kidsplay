# SOF Class 2 exact-evidence status

Checkpoint: 2026-08-30

This file is a compact status checkpoint. The contract/rationale remains in `docs/SOF_ROW_REVIEW.md`; the machine-readable truth remains in `content/alignment-reviews/SOF_INDIA_CLASS2.json` and `content/alignment-sources/registry.json`.

## Current numbers

- Profile: `SOF_INDIA_CLASS2`
- Profile provenance: `prototype_unverified`
- Academic year being prepared for: `2026-27`
- Current profile membership: **182 canonical rows**
- Current learnables: **185**
- Exact reproducible row/skill evidence: **27 / 182**
- Current-year direct evidence: **13**
- Historical official Class 2 direct evidence with per-row current-year scope binding: **14**
- Rows still pending exact row/skill evidence: **155**
- Current recorded fit basis for direct evidence: `editorial_retained`

The evidence count only advances when a reproducible official fact/skill anchor exists. Broad topic presence alone does not count as exact row evidence.

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

Current reviewed named-year historical source set:

- `sof.nso.class2.sample-paper.2025-26`
- `sof.nso.class2.sample-paper.2024-25`
- `sof.nso.class2.sample-paper.2023-24`
- `sof.nso.class2.sample-paper.2022-23`
- `sof.nso.class2.sample-paper.2019-20`
- `sof.nso.class2.sample-paper.2016-17`
- `sof.nso.class2.sample-paper.2015-16`
- `sof.nso.class2.sample-paper.2014-15`

`sof.nso.class2.level2.sample.undated` is also registered as reviewed official archive material, but it has no named academic year and therefore cannot be used as `historical_class2` row evidence.

### Public sample-source saturation

The official 2023-24 Class 2 paper was reviewed and registered even though it adds **zero new exact rows**. Its science/achievers items repeat themes already directly evidenced from other official years: skin/touch, cousin relationships, woollen clothes in winter, leaf makes food, animal-pulled tonga and family-tree reasoning.

The legacy official SOF-hosted **2016-17** Class 2 sample has also been reviewed and registered with **zero new exact rows**. Its useful questions overlap already-evidenced ranking, skin/touch, cousin, flower/seed, cotton/fibre, planet-order and family-tree themes. Other items either do not match a currently pending canonical row exactly or would require broadening a row beyond what the source actually states.

Issue #19 added reproducible archive review of the official **2015-16** and **2014-15** Class 2 samples and the undated official Level-II Class 2 sample. These archive sources add **zero new exact rows** by themselves. The 2015-16 three-state repeating-figure question is not promoted to the narrower two-symbol alternating-pattern row; its generic air-property statement is not promoted to the balloon-specific row. The 2014-15 monsoon-season image is not promoted to rainwear rows, and its cycle-without-engine question does not prove the canonical bicycle-pedal fact. The undated Level-II sample cannot satisfy the named-year historical contract.

A separate re-review of the already registered 2019-20 paper did produce one genuinely missed exact claim: question 13 explicitly asks for the order of **planets** and includes Earth in the correct Mercury–Venus–Earth–Mars sequence. That directly anchors `kr.universe.earth.type.planet`; the same question was already used for Mercury-nearest and Earth-third facts, so this is a distinct explicit fact from one source, not a duplicate-year count.

Third-party mirrors, answer-key-only material, inaccessible paid test banks/workbooks and cross-olympiad hits are not admitted as row evidence. Recording reviewed-but-redundant sources prevents future work from rediscovering them and incorrectly treating repeated sample questions as new evidence. **Reviewed sources and evidenced rows are different metrics.** Public SOF Class 2 samples are small and substantially repetitive.

The 155-row backlog must not be closed by counting syllabus headings, duplicate yearly questions, inaccessible paid material, non-official mirrors, cross-olympiad material or uninspectable visual assumptions as exact row evidence.

## Current-year direct anchors — 13

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

## Historical direct anchors — 14

- `kr.reasoning.ranking.height.shortest`
- `kr.human.skin.sense.touch`
- `kr.family.cousin.relationship.aunt-uncle-child`
- `kr.clothing.wool.weather.winter`
- `kr.transport.tonga.power.animal-pulled`
- `kr.air.kite.moved-by.wind`
- `kr.air.sailboat.moved-by.wind`
- `kr.plants.cotton.use.fibre`
- `kr.universe.mercury.position.closest-sun`
- `kr.universe.earth.position.third`
- `kr.universe.earth.type.planet`
- `kr.family.family-tree.purpose.relationships`
- `kr.plants.leaves.function.make-food`
- `kr.plants.flower.function.make-seeds`

## Evidence-driven canonical expansion

Evidence-backed facts are stored as ordinary reusable canonical knowledge rather than one-off mock questions or new engines. Existing anchors include:

- plants provide food/shelter to animals;
- indigo gives dye;
- plants help keep air cool/fresh;
- cardamom is a flavouring spice;
- sea water is salty;
- emerald is a gemstone;
- plateau is also called tableland;
- orbit is the fixed path of a planet around the Sun;
- tonga is animal-pulled transport;
- rhinoceros is threatened by people killing it for its horns;
- moving air helps a kite fly;
- wind pushes a sailboat's sail;
- a steep-descent road sign warns of a steep downhill road ahead.

This pass adds exact evidence to the already-canonical `kr.universe.earth.type.planet` row. No knowledge row, profile membership or editorial fit was changed, so the profile denominator remains 182.

All reuse the existing canonical data → formatter → engine pipeline.

## Validation

Normal `npm run validate:alignment` rejects, among other things:

- malformed/non-consecutive academic-year labels;
- unknown or duplicate evidence rows;
- membership rows that are not canonical knowledge;
- duplicate alignment/provenance source references;
- profile/membership academic-year mismatches;
- non-reviewed/non-official evidence sources;
- current-year evidence from the wrong academic year;
- historical evidence without a distinct historical assessment year;
- historical evidence without a per-row current-year scope source and locator;
- invalid fit bases;
- keep decisions whose fit no longer matches the profile membership;
- a falsely completed review that does not retain/refit evidence for every current membership row.

`node scripts/report-sof-row-review.mjs` / `--json` is the operational queue. Work should continue **core-first** and should prefer current-year exact evidence over historical precedent where both are reproducible.

## Next evidence target

**155 rows remain pending.** Continue source review without relaxing the distinction between topic scope, exact row inclusion and Kidsplay editorial fit. The profile must remain `prototype_unverified` until the intended verified scope has a reproducible row-level trail.
