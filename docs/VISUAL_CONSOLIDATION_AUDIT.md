# #76 visual consolidation audit

Canonical branch: `feat/scalable-visual-dictionary`  
Canonical PR: #115  
Base: `main`

This audit exists to prevent the consolidated visual work from becoming repository-only code or losing work from the superseded branches.

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
2. Existing answer engines resolve recipe-backed item visuals through `resolveItemVisualRefs` and `VisualEntity`.
3. `VisualEntity` renders reusable measurement, material-property, environmental-action and soil primitive families.
4. Post-answer vocabulary reinforcement is rendered through `VisualMeaningPresenter`.
5. Post-answer exact authored semantic recipes may render through `VisualRecipe`; ambiguous/multiple recipe candidates fail closed.
6. `Scene` consumes `SemanticAnimation` and `VocabularySemanticScene`.
7. All authored semantic compositions must have a real child-facing scene use; the former `animation.dog.curious-bone` orphan is consumed by `scene.dog.curious-bone` on `animals.dog.habitat.fill.001` without displacing the existing happy-bone scene.
8. New recipe families remain auto-discovered from `content/visual-recipes/*.json`; no central per-family switchboard is allowed.
9. Review-only or unresolved semantics cannot acquire runtime authority through the ROI/recipe layer.

These invariants are guarded by `tests/visual-runtime-consumption.behavior.test.ts`, the family-specific recipe tests, semantic-animation reports, the presentation 24×5 gate and full build validation.

## Merge boundary

This work is **not in `main` until PR #115 merges**. The consolidation audit can prove that the branch is lossless and product-consumed, but it must not claim main contains the work beforehand.

Before final merge, the exact canonical head must pass:

- Priority Vocabulary Visual Breadth;
- Windows `npm run check`;
- Browser/Playwright child journeys;
- Android APK + packaged offline relaunch/rotation;
- unchanged bundle budgets;
- the explicit human visual-quality checklist inherited from #112/#113.
