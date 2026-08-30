# Kidsplay — canonical work targets

This is the durable project-work checkpoint for branch `kidsplay`. GitHub issue #1 is the canonical live execution tracker.

## Product constraints

- Android is the shipping target; ordinary development stays Node/npm + browser first.
- Broad foundational learning stays free as much as practical.
- Monetize structured goal paths, diagnostics, adaptation, mocks and advanced preparation rather than duplicating ordinary facts behind a paywall.
- Keep development and content-production cost low through canonical knowledge rows, reusable formatters/engines, data-driven assessment blueprints and lightweight presentation primitives.

## Stable release baseline

- `main` is at `a2b058616113cda0f02348813cfc35df479249c0` (`test: use forked Vitest worker on Windows`).
- The user validated that baseline locally on Windows with the full `npm run check`: all then-current validators passed, Svelte reported 0 errors / 0 warnings, the Vite production build passed, and 15/15 behavior tests passed.
- Active product development continues on `kidsplay`.
- `kidsplay` is based directly on current `main` and remains 0 commits behind it.

## Architecture mandate — complete

Canonical learning flow:

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

Assessment format is now a separate data layer rather than engine logic:

```text
canonical knowledge
→ learning profile / membership
→ assessment blueprint (year, sections, counts, marks, selectors, provenance)
→ reusable question bank + engines
→ structured mock + section diagnostics
```

Current contract: `docs/ASSESSMENT_BLUEPRINTS.md`.

## Current Class 2 learning bank

Current authored inventory remains:

- **41** canonical knowledge source objects.
- **169** stable canonical knowledge rows.
- **172** learnables.
- **108** generated knowledge-backed activities.
- **32** manually-authored traced reasoning/HOTS/passage/visual questions.
- **154** runnable questions total, including earlier engine demonstrations.
- **10** registered engines: 9 interactive runtime engines + 1 output engine.

The new coverage audit (`npm run report:coverage`) proves the more important runtime facts:

- **169/169** SOF prototype profile rows are exercised by at least one runnable question.
- **169/169** current SOF prototype profile rows are also represented in Free Explore.
- **0** current profile rows are accidentally paid-only.
- **140** profile-safe runnable questions are available to the goal selector.
- The free pack contains **142** questions while continuing to reuse the same canonical rows.

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
- [x] Free Explore sessions of normal length also reserve a deeper multi-row reasoning item when available.
- [x] 20-question mixed mocks reserve several multi-row reasoning items.

Semantic datatypes such as `entity_table@1`, `passage@1`, `ordered_process@1` and `labeled_diagram@1` remain optional future abstractions. Add them only when repeated authored content demonstrates that the current contracts are insufficient.

## Free Explore — broad knowledge remains genuinely free

Current entry: **Science Explorer: Class 2 Science & EVS**.

- [x] 8-question adaptive sessions rather than whole-bank dumps.
- [x] Broad science/EVS/logical-reasoning pool.
- [x] Selection prioritizes the weakest referenced row of a multi-row question rather than averaging a weak fact away.
- [x] Representative engine and activity-family diversity.
- [x] Normal sessions retain at least one deeper reasoning question when available.
- [x] Foundational science, EVS, logical-reasoning, passage and visual-reasoning items remain free.
- [x] Every current `SOF_INDIA_CLASS2` profile row is represented in free content.
- [x] The Class 2 goal explicitly declares `knowledgeAccessPolicy: reuse_free_knowledge`.
- [x] `validate:product` now fails if a `reuse_free_knowledge` goal silently introduces a paid-only profile fact.

Paid value therefore remains in structure, goal sequencing, diagnostics, adaptation, mocks and preparation workflow rather than a duplicate paid fact bank.

## Goal Learning — materially stronger SOF Class 2 prototype

Current practice entry: **Class 2 Science Olympiad: Core Science & EVS**.

- [x] Profile-driven through `SOF_INDIA_CLASS2`.
- [x] Profile membership covers the current Class 2 science/EVS + logical-reasoning canonical bank across reviewed official syllabus-level topic scope.
- [x] Complete `knowledgeRefs` isolation prevents profile leakage.
- [x] Adaptive selection prioritizes weaker/unseen evidence while preserving fit and diversity.
- [x] Multi-row questions are prioritized according to their weakest referenced fact.
- [x] NEXT FOCUS prioritizes weak/growing topics and then expands into unpractised breadth rather than showing only already-practised topics.
- [x] Practice readiness now combines row coverage, topic-group breadth, repeated evidence and weighted accuracy.
- [x] A concentrated set of mastered facts cannot produce `mock_ready` without broad topic evidence.
- [x] Quick **20-question mixed mock** remains available.
- [x] New **35-question 2026–27 pattern mock** is driven by assessment-blueprint data rather than hard-coded delivery logic.
- [x] Current reviewed pattern: 5 Logical Reasoning × 1 mark, 25 Science × 1 mark, 5 Achievers × 2 marks = **35 questions / 40 marks**.
- [x] Structured mock shows the active section and mark weight while playing.
- [x] Completion diagnostics report correct answers, accuracy and marks separately for Logical Reasoning, Science and Achievers.
- [x] UI copy explicitly says Kidsplay-authored mocks/readiness are practice tools, not official SOF papers, scores or certification.
- [ ] Exact row memberships/fits remain `prototype_unverified` until reproducible row-level official evidence review exists.

Assessment blueprint: `content/assessment-blueprints/SOF_INDIA_CLASS2_2026-27.json`.
Assessment contract: `docs/ASSESSMENT_BLUEPRINTS.md`.

## Alignment / provenance status

Broad current Class 2 SOF scope and assessment format are backed by reviewed official sources.

Exact row-level evidence is intentionally a stricter claim:

- **3/169** current rows/skills now have reproducible exact evidence anchors.
- **166/169** remain pending row/skill evidence.
- Newly recorded exact evidence includes `kr.air.windmill.turned-by.wind`, alongside the earlier Earth-rotation/day-night and ranking-position anchors.
- `node scripts/report-sof-row-review.mjs` now produces a core-first review queue, topic evidence coverage and the full remaining queue.
- `node scripts/report-sof-row-review.mjs --json` provides the same queue for machine-assisted batch review.
- `npm run validate:alignment` rejects invalid/unknown evidence and a false completed review.

Do not claim official row-level SOF alignment until the intended verified scope has reproducible evidence.

Row-review protocol: `docs/SOF_ROW_REVIEW.md`.

## Learning map / offline progress

- [x] Player name and avatar persist locally.
- [x] Attempts, row evidence and concept mastery persist offline.
- [x] Corrupt/impossible local mastery counters and malformed stored attempts are discarded at the persistence boundary instead of distorting adaptation/readiness.
- [x] 17 topic groups are recognized: Animals, Plants, Human Body, Food, Housing, Clothing, Good Habits, Safety, Transport, Communication, Air, Water, Rocks, Earth & Universe, Family, Festivals and Logical Reasoning.
- [x] Topic summaries show practised rows, strong rows and weighted accuracy.
- [x] Statuses: Not started / Practise next / Growing / Strong so far.
- [x] NEXT FOCUS is weak-first, then recommends new topic breadth.
- [x] Goal readiness is deliberately described as a local practice signal rather than syllabus mastery/certification.

## Evaluator / engine integrity

- [x] All **9 shipped interactive solution families** are exercised end-to-end against real shipped questions in behavior tests.
- [x] Valid responses receive full credit across exact option, blank answer, target assignment, found terms, pair matches, ordering, selected regions, crossword and maze solutions.
- [x] Extra/injected invalid answers no longer receive accidental full credit in set/record/list-style evaluators.
- [x] Maze evaluation validates the start cell, target and every legal wall-respecting step; jumping straight to the goal is rejected.
- [x] One-response-per-question session behavior remains protected.
- [x] Structured mock section boundaries and mark-weighted scoring have pure runtime tests.

## Presentation / engagement — current mandate met without asset bloat

- [x] Asset/license admission registry + build-time notices.
- [x] Four original modular SVG child avatars: fox, owl, panda, tiger.
- [x] Shared reusable face/body/ear/mark parts and happy/thinking/celebrate states.
- [x] Lightweight CSS motion with reduced-motion support.
- [x] Original reusable vector scene primitives for dog, bone, heart, wave, whale, balloon, candle and pumice.
- [x] Scene JSON controls positions/motion independently of question engines.
- [x] Core home/session avatar and traced visual-scene paths no longer depend on platform emoji rendering.
- [ ] External permissively licensed asset packs remain optional. Prefer original/reusable primitives unless an external pack materially lowers production cost and can be admitted with exact provenance.

## Behavioral / build protection

Normal `npm run check` now covers:

- content compilation;
- engine registry;
- taxonomies/profiles;
- alignment and exact-evidence contracts;
- assessment-blueprint provenance/count/mark validation;
- planner and output engines;
- knowledge traceability;
- product/free-knowledge policy;
- runnable/free row coverage report;
- content validation;
- Svelte typecheck;
- Vite production build;
- behavior tests for catalog/content, progress, evaluator, sessions, assessment blueprints and UI.

The GitHub Android workflow has also moved off older action majors to current supported checkout/setup-node/setup-java/upload-artifact actions while retaining Node 22, Java 21, locked npm install and native-binding repair.

## Release state after this batch

- [x] Stable `main` remains the user-validated Windows checkpoint at `a2b0586`.
- [x] Current `kidsplay` code has passed the full Linux `npm run check` stage and Capacitor generation on the latest 2026-08-30 batch; final Android packaging is the release gate for the exact documented head.
- [ ] Pull the final `kidsplay` head locally on Windows and rerun `npm run check` before the next deliberate `main` promotion.
- [ ] Advance `main` only after that deliberate latest-head validation decision.

## Next high-value work

1. **Exact SOF row-level evidence review — 166 rows pending.** This is the largest substantive alignment task and should proceed core-first using the generated queue.
2. **Resumable long mocks.** The new 35-question format makes persisted in-progress session/resume behavior worthwhile; implement this without changing the question/engine contracts.
3. **Mock history / trend diagnostics.** After resumable mocks, retain compact attempt summaries so structured goal value can include progress over multiple mocks without introducing a backend prematurely.
4. **Latest-head Windows certification and deliberate `main` promotion.**
5. **Optional asset expansion only on demonstrated need.**

## Branch/release hygiene

- Canonical development branch: `kidsplay`.
- `kidsplay-work` is temporary/divergent; do not merge wholesale; delete when convenient (issue #2).
- `main` is the stable baseline and should move only deliberately after final checks.
- Reproducible npm lockfile / locked CI path is in place, including scoped Linux native-binding repair.

## GitHub project memory

- Canonical live tracker: issue #1.
- This durable work checkpoint: `docs/WORK_TARGETS.md`.
- Assessment format contract: `docs/ASSESSMENT_BLUEPRINTS.md`.
- Exact row-review protocol: `docs/SOF_ROW_REVIEW.md`.
- Profile/alignment contract: `docs/CURRICULUM_METADATA.md`.
- Detailed architecture review: `docs/DATA_CONNECTOR_ENGINE_REVIEW.md`.
- Formatter rationale: `docs/KNOWLEDGE_FORMATTERS.md`.
- Keep these static GitHub checkpoints current so future sessions do not depend on chat history.
