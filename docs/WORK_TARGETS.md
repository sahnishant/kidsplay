# Kidsplay — canonical work targets

This is the durable project-work checkpoint for branch `kidsplay`. GitHub issue #1 is the canonical live execution tracker.

## Product constraints

- Android is the shipping target; ordinary development stays Node/npm + browser first.
- Broad foundational learning stays free as much as practical.
- Monetize structured goal paths, diagnostics, adaptation, mocks and advanced preparation rather than duplicating ordinary facts behind a paywall.
- Keep development and content-production cost low through canonical knowledge rows, reusable formatters/engines, data-driven assessment blueprints and lightweight presentation primitives.
- Animation should be lightweight, reusable and pedagogically meaningful. Do not introduce a heavy animation stack for effects that SVG/CSS/data-driven scenes can handle.

## Stable release baseline

- `main` remains the user-validated Windows checkpoint at `a2b058616113cda0f02348813cfc35df479249c0` (`test: use forked Vitest worker on Windows`).
- The user validated that baseline locally on Windows with the then-current full `npm run check`.
- Active product development continues on `kidsplay`.
- `main` should move only after a deliberate latest-head Windows recheck.

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

Assessment format remains a separate data layer rather than engine logic:

```text
canonical knowledge
→ learning profile / membership
→ assessment blueprint (year, sections, counts, marks, selectors, provenance)
→ reusable question bank + engines
→ structured mock + section diagnostics
```

Current contract: `docs/ASSESSMENT_BLUEPRINTS.md`.

Presentation is also deliberately separate from knowledge/evaluation:

```text
canonical row / authored question
→ optional exact presentation mapping
→ reusable scene definition
→ reusable SVG primitive + CSS motion
```

A visual can therefore be added or changed without changing the answer contract, evaluator or canonical fact.

## Current Class 2 learning bank — validated 2026-08-30

Latest successful full CI on code/content head `5a69fd9a6c5da3b798de0e43b48738e2b869910f` reported:

- **41** canonical knowledge source objects.
- **182** stable canonical knowledge rows in the profile index.
- **185** learnables.
- **108** generated knowledge-backed questions in traceability validation.
- **32** manually-authored traced questions.
- **12** traced HOTS questions within the authored/generated bank.
- **154** runnable questions total.
- **10** registered engines: 9 interactive runtime engines + 1 output engine.
- **10** reusable scenes with **30** validated scene entities/primitives.

Coverage audit:

- **182/182** `SOF_INDIA_CLASS2` rows are exercised by at least one runnable question.
- **182/182** current SOF prototype profile rows are represented in Free Explore.
- **0** current profile rows are accidentally paid-only.
- **140** profile-safe runnable questions are available to the goal selector.
- Free Explore contains **142** questions while reusing the same canonical rows.
- Current profile engine mix: crossword 1, drag-to-target 26, memory-pairs 26, sequence-order 1, single-choice 72, word-bank-fill 2, word-search 12.

### Science / EVS breadth — complete at useful prototype depth

- [x] Animals: classification, homes, young ones, coverings/features, conservation examples.
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

### HOTS / deeper reasoning — complete for current beta mandate

- [x] Multi-row scenario reasoning.
- [x] Statement-pair evaluation.
- [x] Table-style inference.
- [x] Ordered-process reasoning through the existing sequence engine.
- [x] Passage/claim reasoning using the existing question contract.
- [x] Traced visual interpretation backed by reusable vector scenes.
- [x] Normal goal sessions reserve reasoning when available.
- [x] Free Explore sessions of normal length reserve deeper reasoning when available.
- [x] 20-question mixed mocks reserve several multi-row reasoning items.

Semantic datatypes such as `entity_table@1`, `passage@1`, `ordered_process@1` and `labeled_diagram@1` remain optional future abstractions. Add them only when repeated authored content demonstrates that current contracts are insufficient.

## Free Explore — broad knowledge remains genuinely free

Current entry: **Science Explorer: Class 2 Science & EVS**.

- [x] 8-question adaptive sessions rather than whole-bank dumps.
- [x] Broad science/EVS/logical-reasoning pool.
- [x] Selection prioritizes the weakest referenced row of a multi-row question rather than averaging a weak fact away.
- [x] Representative engine and activity-family diversity.
- [x] Normal sessions retain deeper reasoning when available.
- [x] Foundational science, EVS, logical-reasoning, passage and visual-reasoning items remain free.
- [x] Every current `SOF_INDIA_CLASS2` profile row is represented in free content.
- [x] The Class 2 goal explicitly declares `knowledgeAccessPolicy: reuse_free_knowledge`.
- [x] `validate:product` fails if a `reuse_free_knowledge` goal silently introduces a paid-only profile fact.

Paid value therefore remains in structure, goal sequencing, diagnostics, adaptation, mocks and preparation workflow rather than a duplicate paid fact bank.

## Goal Learning — strong SOF Class 2 prototype

Current practice entry: **Class 2 Science Olympiad: Core Science & EVS**.

- [x] Profile-driven through `SOF_INDIA_CLASS2`.
- [x] Profile membership covers the current Class 2 science/EVS + logical-reasoning canonical bank across reviewed official syllabus-level topic scope.
- [x] Complete `knowledgeRefs` isolation prevents profile leakage.
- [x] Adaptive selection prioritizes weaker/unseen evidence while preserving fit and diversity.
- [x] Multi-row questions are prioritized according to their weakest referenced fact.
- [x] NEXT FOCUS prioritizes weak/growing topics and then unpractised breadth.
- [x] Practice readiness combines row coverage, topic-group breadth, repeated evidence and weighted accuracy.
- [x] A concentrated set of mastered facts cannot produce `mock_ready` without broad topic evidence.
- [x] Quick **20-question mixed mock** remains available.
- [x] **35-question 2026–27 pattern mock** is driven by assessment-blueprint data rather than hard-coded delivery logic.
- [x] Reviewed pattern: 5 Logical Reasoning × 1 mark, 25 Science × 1 mark, 5 Achievers × 2 marks = **35 questions / 40 marks**.
- [x] Structured mock shows active section and mark weight.
- [x] Completion diagnostics report correct answers, accuracy and marks separately for Logical Reasoning, Science and Achievers.
- [x] Long mock is resumable offline with exact selected question order, response position and already-submitted feedback preserved.
- [x] Saved mocks are contract-bound and fail closed when blueprint/profile/question contracts change.
- [x] Replay uses a fresh session identity.
- [x] Compact mock history reports latest, best, movement and section marks locally.
- [x] Duplicate completion callbacks do not double-count history.
- [x] UI copy says Kidsplay-authored mocks/readiness are practice tools, not official SOF papers, scores or certification.
- [ ] Exact row membership remains `prototype_unverified` until the intended row-level official evidence review is complete.

Assessment blueprint: `content/assessment-blueprints/SOF_INDIA_CLASS2_2026-27.json`.
Assessment contract: `docs/ASSESSMENT_BLUEPRINTS.md`.

## Alignment / provenance — primary remaining product-truth mandate

Broad current Class 2 SOF scope and assessment format are backed by reviewed official sources. Exact row-level evidence is intentionally a stricter claim.

Current machine-readable state:

- **26/182** profile rows/skills have reproducible exact evidence anchors.
- **11** are current-year direct anchors.
- **15** are historical official Class 2 direct anchors with an explicit per-row current-year scope binding.
- **156/182** remain pending exact row/skill evidence.
- All current evidence keeps `fitBasis: editorial_retained`; Kidsplay does not pretend SOF supplied the internal `core/review/stretch/challenge` fit.
- `node scripts/report-sof-row-review.mjs` produces a core-first review queue and topic evidence coverage.
- `node scripts/report-sof-row-review.mjs --json` provides the same queue for machine-assisted batch review.
- `npm run validate:alignment` rejects invalid/unknown evidence, unsafe historical evidence and a false completed review.

Recent evidence work also repaired stale source-chain drift: historical rows must now name both a current-year scope source and a specific current-year locator.

Do not claim official row-level SOF alignment until the intended verified scope has reproducible evidence.

Row-review protocol: `docs/SOF_ROW_REVIEW.md`.
Compact checkpoint: `docs/SOF_EVIDENCE_STATUS.md`.

## Learning map / offline progress

- [x] Player name and avatar persist locally.
- [x] Attempts, row evidence and concept mastery persist offline.
- [x] Corrupt/impossible local mastery counters and malformed stored attempts are discarded at the persistence boundary.
- [x] 17 topic groups are recognized.
- [x] Topic summaries show practised rows, strong rows and weighted accuracy.
- [x] Statuses: Not started / Practise next / Growing / Strong so far.
- [x] NEXT FOCUS is weak-first, then recommends new topic breadth.
- [x] Goal readiness is explicitly a local practice signal rather than syllabus mastery/certification.
- [x] One active long-mock checkpoint is stored locally with bounded, validated data.
- [x] Mock history is bounded to compact completion summaries and trend signals.

## Evaluator / engine integrity

- [x] All 9 shipped interactive solution families are exercised end-to-end against real shipped questions.
- [x] Valid responses receive full credit across exact option, blank answer, target assignment, found terms, pair matches, ordering, selected regions, crossword and maze solutions.
- [x] Extra/injected invalid answers no longer receive accidental full credit in set/record/list-style evaluators.
- [x] Maze evaluation validates start, target and every legal wall-respecting step.
- [x] One-response-per-question behavior remains protected.
- [x] Structured mock boundaries and mark-weighted scoring have pure runtime tests.
- [x] Resume re-evaluates raw responses against the current question contract rather than trusting persisted scores.
- [x] Post-submit/pre-Next reload restores feedback while keeping the answer engine locked.
- [x] Corrupt/impossible/stale mock checkpoints fail closed.

## Presentation / engagement — lightweight motion now materially implemented

- [x] Asset/license admission registry + build-time notices.
- [x] Four original modular SVG child avatars: fox, owl, panda, tiger.
- [x] Shared reusable face/body/ear/mark parts and happy/thinking/celebrate states.
- [x] Answer-reactive session avatar: celebrate/bounce on correct; think state on incorrect/challenge moments.
- [x] Dashboard hero avatar motion remains visible on Android phone widths instead of being hidden below 650px.
- [x] Dashboard **Motion Moment** reuses a semantically matched animated science scene.
- [x] Original reusable vector scene primitives now include dog, bone, heart, wave, whale, balloon, candle, pumice, wind, windmill, kite, sailboat, plant and sun.
- [x] Scene JSON controls positions/motion independently of question engines.
- [x] Exact canonical rows/concepts can map to presentation scenes without coupling canonical knowledge or evaluators to artwork.
- [x] Inferred motion is used as **post-answer reinforcement** in normal practice rather than a pre-answer hint.
- [x] Inferred motion is suppressed in structured mocks so it cannot leak an answer.
- [x] Explicit authored visual stimuli remain visible from the start, including assessment questions intentionally defined around a scene.
- [x] Reinforcement scenes render below feedback to avoid moving the question prompt after submission on small screens.
- [x] `prefers-reduced-motion` disables global animations/transitions; windmill blade spin also fails safe to static.
- [x] `validate:scenes` validates scene IDs, themes, accessibility labels, entity IDs, icons, coordinates and motion names in CI.
- [x] UI behavior tests cover dashboard motion, post-answer reinforcement and mock-safe suppression.
- [ ] External permissively licensed asset packs remain optional. Prefer original/reusable primitives unless an external pack materially lowers production cost and can be admitted with exact provenance.

## Behavioral / build protection

Normal `npm run check` covers:

- content compilation;
- engine registry;
- scene/motion data validation;
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
- behavior tests for catalog/content, progress, evaluator, sessions, assessment blueprints, presentation, mock persistence, stale-resume integrity and UI.

Latest validated run at code/content head `5a69fd9`:

- content validation: pass;
- 182/182 runnable/free profile-row coverage: pass;
- scene validation: 10 scenes / 30 entities: pass;
- Svelte: **0 errors / 0 warnings**;
- Vite production build: pass;
- Vitest: **9 files / 40 tests passed**;
- Capacitor Android generation/sync: pass;
- Gradle `assembleDebug`: **BUILD SUCCESSFUL**;
- debug APK uploaded as GitHub Actions artifact.

The GitHub Android workflow uses current supported checkout/setup-node/setup-java/upload-artifact action majors with Node 22, Java 21, locked npm install and Linux native-binding repair.

## Release state after this batch

- [x] Stable `main` remains the user-validated Windows checkpoint at `a2b0586`.
- [x] Current `kidsplay` code/content head has full Linux/browser/content/test/Android debug-build proof.
- [x] Android debug APK artifact exists for code/content head `5a69fd9`.
- [x] Animation/data/evidence additions are protected by validators and behavior tests rather than UI-only assumptions.
- [ ] Pull latest `kidsplay` locally on Windows and rerun `npm run check` before the next deliberate `main` promotion.
- [ ] Advance `main` only after that deliberate latest-head Windows validation decision.

Documentation-only commits may sit after the last code/content CI head; they do not alter the shipped runtime contract.

## Next high-value work

1. **Exact SOF row-level evidence review — 156 rows pending.** Continue core-first using the generated queue. Prefer current-year exact evidence; use historical Class 2 evidence only with an explicit current-year scope binding. Never fabricate evidence to close the number.
2. **Latest-head Windows certification and deliberate `main` promotion.** Linux/browser/Android proof is green; retain the user-controlled Windows gate before moving stable `main`.
3. **Evidence-driven goal refinement.** Adjust membership/fits only when reviewed evidence justifies it; do not manufacture paid-only facts or silently promote editorial placement.
4. **Animation expansion only where it teaches.** Add/reuse scenes for rows where motion clarifies an association, process or feedback; avoid decorative motion and assessment hints.
5. **Optional external assets only on demonstrated need.** Prefer the current original vector primitives and reusable scene system over asset bloat.

## Branch/release hygiene

- Canonical development branch: `kidsplay`.
- `kidsplay-work` is temporary/divergent; do not merge wholesale; delete when convenient (issue #2).
- `main` is the stable baseline and should move only deliberately after final checks.
- Reproducible npm lockfile / locked CI path is in place, including scoped Linux native-binding repair.

## GitHub project memory

- Canonical live tracker: issue #1.
- This durable work checkpoint: `docs/WORK_TARGETS.md`.
- Compact SOF evidence checkpoint: `docs/SOF_EVIDENCE_STATUS.md`.
- Assessment format contract: `docs/ASSESSMENT_BLUEPRINTS.md`.
- Exact row-review protocol: `docs/SOF_ROW_REVIEW.md`.
- Profile/alignment contract: `docs/CURRICULUM_METADATA.md`.
- Detailed architecture review: `docs/DATA_CONNECTOR_ENGINE_REVIEW.md`.
- Formatter rationale: `docs/KNOWLEDGE_FORMATTERS.md`.
- Keep these static GitHub checkpoints current so future sessions do not depend on chat history.
