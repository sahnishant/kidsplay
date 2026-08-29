# Kidsplay — canonical work targets

This is the durable project-work checkpoint for branch `kidsplay`. GitHub issue #1 is the canonical live execution tracker.

## Product constraints

- Android is the shipping target; ordinary development stays Node/npm + browser first.
- Broad foundational learning stays free as much as practical.
- Monetize structured goal paths, diagnostics, adaptation, mocks and advanced preparation rather than duplicating facts behind a paywall.
- Keep development and content-production cost low through canonical knowledge rows, reusable formatters/engines and lightweight presentation primitives.

## Architecture mandate — complete

Canonical flow:

```text
stored data
→ datatype normalizer
→ canonical knowledge units
→ profile/index selector + planner
→ formatter(data, engine, recipe)
→ optional compiler
→ generated/cache delivery questions with knowledgeRefs
→ runtime catalog/profile selector
→ interactive/output delivery
→ evaluator/persisted progress
```

Stable `rowId`, shared normalizers, profile-owned curriculum placement, independent knowledge/profile/activity difficulty axes, generated build/cache questions, reusable engines, row-level traceability and full-reference profile isolation are all in place. Do not reopen architecture without a real failing content/use case.

## Current Class 2 learning bank

The original living-world slice has been broadened into a useful Class 2 science/EVS + logical-reasoning prototype.

Current authored inventory target after the 2026-08-29 breadth passes:

- **41** canonical knowledge source objects.
- **169** stable canonical knowledge rows.
- **172** learnables.
- **108** generated knowledge-backed activities.
- **32** manually-authored traced reasoning/HOTS/passage/visual questions.
- **154** runnable questions total, including earlier engine demonstrations.
- **10** registered engines: 9 interactive runtime engines + 1 output engine.

### Science / EVS breadth — complete at useful prototype depth

- [x] Animals: classification, homes, young ones, coverings/features.
- [x] Plants: parts/functions, types, uses/products.
- [x] Human Body: senses, organs/functions, actions/support.
- [x] Food: sources, groups, hygiene/healthy habits.
- [x] Housing and Clothing.
- [x] Good Habits and Safety Rules.
- [x] Transport and Communication.
- [x] Air, Water and Rocks.
- [x] Earth and Universe.
- [x] Family and Festivals.

### Logical reasoning breadth — complete at useful prototype depth

- [x] Patterns: symbol and number sequences.
- [x] Odd one out / classification.
- [x] Analogies.
- [x] Ranking and ordering.
- [x] Coding-decoding: letters and symbol values.
- [x] Measuring-unit choices and shape properties.
- [x] Embedded visual-pattern search.

### HOTS / deeper reasoning — complete for the current beta mandate

- [x] Multi-row scenario reasoning.
- [x] Statement-pair evaluation.
- [x] Table-style inference.
- [x] Ordered-process reasoning through the existing sequence engine.
- [x] Passage/claim reasoning using the existing question contract; no premature `passage@1` datatype was required.
- [x] Traced visual interpretation backed by reusable vector scenes.
- [x] Normal goal sessions reserve reasoning when available.
- [x] 20-question mixed mock reserves several multi-row reasoning items.

Semantic datatypes such as `entity_table@1`, `passage@1`, `ordered_process@1` and `labeled_diagram@1` remain optional future abstractions. Add them only when repeated authored content demonstrates that the current contracts are insufficient.

## Free Explore — meaningful and broad

Current entry: **Science Explorer: Class 2 Science & EVS**.

- [x] 8-question adaptive sessions rather than whole-bank dumps.
- [x] Broad science/EVS/logical-reasoning pool.
- [x] Unseen/weaker knowledge first.
- [x] Representative engine and activity-family diversity.
- [x] Foundational science, EVS, logical-reasoning, passage and visual-reasoning items remain free.
- [x] Same canonical rows are reused by the structured SOF goal; no paid-only duplicate fact bank.

## Goal Learning — useful SOF Class 2 prototype

Current practice entry: **Class 2 Science Olympiad: Core Science & EVS**.

- [x] Profile-driven through `SOF_INDIA_CLASS2`.
- [x] Profile membership now covers the current Class 2 science/EVS + logical-reasoning canonical bank across official syllabus-level topic scope.
- [x] Complete `knowledgeRefs` isolation prevents profile leakage.
- [x] Adaptive selection prioritizes weaker/unseen evidence while preserving fit and diversity.
- [x] Weak-topic recommendations are derived from local weighted evidence.
- [x] Practice-readiness signal uses practiced-row coverage + weighted accuracy.
- [x] 20-question mixed mock assembled from the same profile-selected bank.
- [x] UI explicitly states that readiness and the mixed mock are practice tools, not official SOF scores/papers.
- [ ] Exact row memberships/fits remain `prototype_unverified` until reproducible row-level official evidence review exists.

Row-review protocol: `docs/SOF_ROW_REVIEW.md`.
Generate the current queue with:

```powershell
node scripts/report-sof-row-review.mjs
```

## Learning map / local progress — complete for current beta

- [x] Player name and avatar persist locally.
- [x] Attempts, row evidence and concept mastery persist offline.
- [x] 17 topic groups are recognized: Animals, Plants, Human Body, Food, Housing, Clothing, Good Habits, Safety, Transport, Communication, Air, Water, Rocks, Earth & Universe, Family, Festivals and Logical Reasoning.
- [x] Topic summaries show practised rows, strong rows and weighted accuracy.
- [x] Statuses: Not started / Practise next / Growing / Strong so far.
- [x] Up to three weak practised topics are surfaced as NEXT FOCUS.
- [x] Goal readiness is deliberately described as a local practice signal rather than syllabus mastery/certification.

## Presentation / engagement — current mandate met without asset bloat

- [x] Asset/license admission registry + build-time notices.
- [x] Four original modular SVG child avatars: fox, owl, panda, tiger.
- [x] Shared reusable face/body/ear/mark parts and happy/thinking/celebrate states.
- [x] Lightweight CSS motion with reduced-motion support.
- [x] Original reusable vector scene primitives for dog, bone, heart, wave, whale, balloon, candle and pumice.
- [x] Scene JSON controls positions/motion independently of question engines.
- [x] Core home/session avatar and traced visual-scene paths no longer depend on platform emoji rendering.
- [ ] External permissively licensed asset packs remain optional. Prefer original/reusable primitives unless an external pack materially lowers production cost and can be admitted with exact provenance.

## Behavioral / release protection

- [x] Catalog/free-vs-goal behavior.
- [x] Free session breadth/diversity.
- [x] Profile isolation.
- [x] Reasoning quota.
- [x] 20-question mixed mock behavior.
- [x] Practice-readiness behavior.
- [x] Mastery feedback and weak-topic recommendations.
- [x] Runtime engine registry coverage.
- [x] Local persistence.
- [x] Home → goal → home flow.
- [x] Engine submit → feedback → completion flow.
- [x] Windows local validation supplied by the user on `a4f0319`: 12/12 tests, all validators, Svelte 0/0 and Vite build green.
- [ ] Re-run local Windows `npm run check` on the latest broadened head before deliberate `main` promotion.
- [ ] Latest Linux/Android CI must be green after the final breadth/presentation commits.

## Remaining external/release work — not a product-architecture blocker

1. **Exact SOF row-level evidence review.** This is the main substantive unfinished alignment task. Broad official syllabus scope does not validate every individual fact or fit.
2. **Final latest-head Windows check.** The user already proved the repaired toolchain on `a4f0319`; rerun after pulling the latest content/UI head before promotion.
3. **Deliberate `main` promotion decision.** `main` remains the stable baseline until explicitly advanced.
4. **Optional asset expansion.** Only if a proven content need justifies external licensed art.

## Branch/release hygiene

- Canonical development branch: `kidsplay`.
- `kidsplay-work` is temporary/divergent; do not merge wholesale; delete when convenient (issue #2).
- `main` is the stable baseline and should move only deliberately after final checks.
- Reproducible npm lockfile / locked CI path is already in place, including scoped Linux native-binding repair.

## GitHub project memory

- Canonical live tracker: issue #1.
- This durable work checkpoint: `docs/WORK_TARGETS.md`.
- Exact row-review protocol: `docs/SOF_ROW_REVIEW.md`.
- Profile/alignment contract: `docs/CURRICULUM_METADATA.md`.
- Detailed architecture review: `docs/DATA_CONNECTOR_ENGINE_REVIEW.md`.
- Formatter rationale: `docs/KNOWLEDGE_FORMATTERS.md`.
- Keep these static GitHub checkpoints current so future sessions do not depend on chat history.
