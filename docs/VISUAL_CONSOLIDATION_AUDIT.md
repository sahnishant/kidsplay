# #76 visual consolidation audit

Canonical branch: `feat/scalable-visual-dictionary`  
Canonical PR: #115  
Base: `main`

This audit exists to prevent the consolidated visual work from becoming repository-only code or losing work from the superseded branches. All new production passes are now performed on this one canonical branch; no further stacked visual branches should be created for this mandate.

## Losslessness invariants

The exact superseded PR heads must remain ancestors of the canonical branch with zero commits behind:

- #113 semantic animation/science-process expansion — `253e4c2a7ff4051445e6728be6f114470ac0c5da`
- #117 VisualRecipe grammar/ROI — `60db78b5d6ea7c5eebd3cf2472634b2aa00844ab`
- #119 measurement family — `83a9f551ccbffd25d4de92ca63da76192ff1fb6d`
- #123 material contrast family — `991be1d0c48b2b4dd160c5c9bba31a994f55a849`
- #127 family ROI/environmental actions — `6bb02e82d0de5d6ffa08a509ca5b3a336da1cfd6`

The direct `main...canonical` comparison must contain no deleted files from the visual programme. Later consolidation commits may refactor shared files, but permanent validators/tests must prove the intended capability remains present.

## Runtime-consumption invariants

The product path must consume the consolidated layers rather than merely ship their source files:

1. `App.svelte` mounts `SessionViewport.svelte` for live play.
2. All six visual-capable answer engines normalize items through `resolveItemVisualPresentation` and render them through `SemanticVisualPresenter`; engines do not own independent registry-resolution or `VisualEntity` loops.
3. `VisualMeaningPresenter`, `Scene` and post-answer recipe feedback also dispatch their exact-sense vocabulary, animation and recipe plans through `SemanticVisualPresenter`.
4. `VisualEntity`, `VisualRecipe`, `SemanticAnimation` and `VocabularySemanticScene` remain small capability adapters below that shared presenter rather than competing semantic authorities.
5. `VisualEntity` renders reusable measurement, material-property, environmental-action and soil primitive families plus existing process visuals.
6. Ambiguous/multiple post-answer recipe candidates still fail closed before the shared presenter receives a plan.
7. All authored semantic compositions must have a real child-facing scene use; the former `animation.dog.curious-bone` orphan is consumed by `scene.dog.curious-bone` on `animals.dog.habitat.fill.001` without displacing the existing happy-bone scene.
8. New recipe families remain auto-discovered from `content/visual-recipes/*.json`; no central per-family switchboard is allowed.
9. Review-only or unresolved semantics cannot acquire runtime authority through the ROI/recipe layer.
10. Earlier family tests assert cumulative regression floors rather than exact whole-library snapshots, so later safe families do not break already-certified tranches.

These invariants are guarded by `tests/visual-runtime-consumption.behavior.test.ts`, the family-specific recipe tests, semantic-animation reports, the presentation 24×5 gate and full build validation.

## Same-branch production passes after consolidation

The consolidation review fixed systemic issues before adding more breadth:

- stale stacked-tranche tests were converted to composable invariants;
- duplicate presenter styling was removed rather than raising the 100 KiB CSS budget;
- the family ROI scheduler was narrowed so unrelated relations cannot be grouped merely because they use the same template;
- unit identities, generic `source` semantics, and action/effect semantics now fail closed unless an exact reusable visual family is justified.

Then the live ROI queue was consumed in descending defensible leverage on this same branch:

- soil family — sandy soil, clay soil, loamy soil, humus: four reusable texture primitives / four recipes, +32 visual-friendly instances;
- shadow formation: one new state in the existing material renderer / one surface-safe recipe, +10;
- water process family — condensation + water cycle: two states in the existing process renderer / two recipes, +5;
- gas spreading: one state in the existing process renderer / one recipe, +5.

The resulting canonical target is **796/1459 ≈ 54.6%** visual-friendly coverage, **307 primitives**, **22 recipes**, and **187 recipe-resolved instances**. The canonical CI reporter is authoritative; family tests fail closed if these floors are not met.

All new soil/shadow/process SVG states use existing renderer infrastructure and add no new CSS rules. The hard CSS budget remains unchanged at 100 KiB.

## Automatic-production queue closure

After the high-confidence families above land, the production scheduler must report **zero automatic candidates**. The final seven previously automatic instances are deliberately moved to semantic review/deferred status:

- `exercise-body` ×4 — the reviewed row says regular exercise helps keep muscles and heart working well. Heart and muscles are effects/context, not the answer-card identity “regular exercise”; no reusable activity family currently exists.
- `si-length` ×2 — the reviewed Class 6 fact is specifically `Metre` = the SI base unit of length. A generic ruler/length visual would conflate a unit identity with the measured quantity.
- `pollution-source` ×1 — generic `source` is not a safe visual family because light sources, pollution sources, water sources and information sources require different semantics.

`tests/visual-production-queue-closure.behavior.test.ts` requires `productionCandidates === 0`, an empty semantic production queue, and an empty family production queue while retaining the human semantic-review queue. This is a stronger completion condition than drawing weak pictures simply to increase the percentage.

## Merge boundary

This work is **not in `main` until PR #115 merges**. The consolidation audit can prove that the branch is lossless and product-consumed, but it must not claim main contains the work beforehand.

Before final merge, the exact canonical head must pass:

- Priority Vocabulary Visual Breadth;
- Windows `npm run check`;
- Browser/Playwright child journeys;
- Android APK + packaged offline relaunch/rotation;
- unchanged bundle budgets;
- the explicit human visual-quality checklist inherited from #112/#113.
