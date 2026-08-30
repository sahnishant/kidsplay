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
- Active product development continues on `kidsplay`.
- `main` should move only after a deliberate latest-head Windows `npm run check` and explicit promotion decision.

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

Assessment format remains a separate data layer:

```text
canonical knowledge
→ learning profile / membership
→ assessment blueprint (year, sections, counts, marks, selectors, provenance)
→ reusable question bank + engines
→ structured mock + section diagnostics
```

Presentation remains separate from knowledge/evaluation:

```text
canonical row / authored question
→ optional exact semantic presentation mapping
→ reusable SVG/entity/scene definition
→ CSS motion / static reduced-motion fallback
```

A visual can therefore be added, removed or changed without changing the answer contract, evaluator or canonical fact.

## Current platform checkpoint — validated 2026-08-30

Autonomous code/content checkpoint `c51bce8ad9fd35afc0cfef65cb1897cf363a0bde` passed the full GitHub Linux/web/test/Android pipeline:

- **57** canonical knowledge source objects.
- **168** formatter recipes.
- **310** stable canonical rows across **10** membership collections.
- **313** learnables.
- **214** runnable questions total.
- **168** generated traced questions.
- **32** manually-authored traced questions.
- **12** traced HOTS questions.
- **10** registered engines: 9 interactive + 1 output.
- **30** learning profiles.
- **5** assessment blueprints covering **205** question slots / **240** marks.
- **12** reusable scenes with **36** validated scene primitives.
- **212** registered semantic SVG entities across **10** content-driven visual packs.

Normal `npm run check` currently proves:

- content compilation/validation;
- engine, taxonomy/profile and planner/output contracts;
- alignment/evidence and assessment-blueprint provenance;
- knowledge traceability and free-knowledge policy;
- runnable/free row coverage;
- scene and visual semantic contracts;
- semantic visual-coverage regression floor;
- Svelte typecheck and Vite production build;
- behavior tests for content, progress, evaluation, sessions, mocks, persistence/resume integrity, presentation, semantic visuals and UI.

Latest code/content proof:

- Svelte: **0 errors / 0 warnings**.
- Vitest: **15 files / 68 tests passed**.
- Capacitor Android generation/sync: pass.
- Gradle `assembleDebug`: **BUILD SUCCESSFUL** (93 tasks).
- Android debug APK artifact: **9733275035**.

## Class 2 learning bank — beta mandate complete

For `SOF_INDIA_CLASS2`:

- **182/182** profile rows are exercised by at least one runnable question.
- **182/182** profile rows are represented in Free Explore.
- **0** current profile rows are accidentally paid-only.
- **140** profile-safe runnable questions are available to the goal selector.
- Free Explore contains **142** questions while reusing the same canonical rows.
- Engine mix: crossword 1, drag-to-target 26, memory-pairs 26, sequence-order 1, single-choice 72, word-bank-fill 2, word-search 12.

Science/EVS breadth is complete at useful prototype depth across Animals, Plants, Human Body, Food, Housing/Clothing, Habits/Safety, Transport/Communication, Air/Water/Rocks, Earth/Universe and Family/Festivals.

Logical-reasoning breadth is complete at useful prototype depth across patterns, classification/odd-one-out, analogies, ranking/ordering, coding-decoding, measurement/unit choices, shape properties and embedded visual search.

HOTS/deeper reasoning is complete for the current beta mandate: multi-row scenarios, statement pairs, table inference, ordered processes, passage/claim reasoning and traced visual interpretation are all represented. Normal sessions/mixed mocks reserve deeper reasoning when available.

## Free Explore and goal learning

- [x] Free Explore uses short adaptive sessions rather than whole-bank dumps.
- [x] Weakest referenced row drives priority for multi-row activities.
- [x] Foundational science/EVS/logical/passage/visual reasoning remains free.
- [x] Goal pack declares `knowledgeAccessPolicy: reuse_free_knowledge`; CI rejects paid-only leakage.
- [x] `SOF_INDIA_CLASS2` goal remains profile-isolated and weak/unseen adaptive.
- [x] NEXT FOCUS and readiness require breadth rather than allowing a narrow mastered subset to appear mock-ready.
- [x] 20-question mixed mock.
- [x] Data-driven **35-question / 40-mark 2026-27 pattern mock**: 5 Logical Reasoning × 1 + 25 Science × 1 + 5 Achievers × 2.
- [x] Section/mark display and section-level diagnostics.
- [x] Long mock resumes offline with exact question order, responses and submitted-feedback boundary preserved.
- [x] Saved mocks fail closed against stale blueprint/profile/question contracts.
- [x] Compact local mock history and replay with fresh session identity.
- [x] UI clearly says Kidsplay mocks/readiness are practice tools, not official SOF papers/scores/certification.

Paid value therefore remains in structure, sequencing, diagnostics, adaptation, mocks and preparation workflow rather than a duplicate paid fact bank.

## Learning map / offline integrity

- [x] Player name/avatar persist locally.
- [x] Attempts, row evidence and concept mastery persist offline.
- [x] Corrupt/impossible persisted counters/attempts/checkpoints fail closed.
- [x] 17 Class 2 topic groups are summarized with practised/strong rows and weighted accuracy.
- [x] Statuses: Not started / Practise next / Growing / Strong so far.
- [x] NEXT FOCUS is weak-first and then expands unpractised breadth.
- [x] Goal readiness is explicitly a local practice signal, not certification.
- [x] One bounded active long-mock checkpoint and compact bounded history persist locally.

## Evaluator / engine integrity

- [x] All 9 shipped interactive solution families are exercised end-to-end against shipped questions.
- [x] Invalid injected answers cannot receive accidental full credit in set/record/list evaluators.
- [x] Maze evaluation validates start, goal and every legal wall-respecting step.
- [x] One-response-per-question behavior is protected.
- [x] Structured mock boundaries and weighted marks have runtime tests.
- [x] Resume re-evaluates raw responses instead of trusting stored scores.
- [x] Post-submit/pre-Next reload restores feedback while keeping the engine locked.
- [x] Corrupt/impossible/stale mock checkpoints fail closed.

## Presentation / engagement — semantic lightweight visuals materially expanded

Presentation is now a scalable content system rather than random decoration:

- [x] Asset/license admission registry + notices.
- [x] Four original modular SVG child avatars with reusable states/motion.
- [x] Answer-reactive avatar feedback and dashboard Motion Moment.
- [x] Reusable scene JSON and semantic SVG entity packs independent of question engines.
- [x] Generated activities preserve `semanticRef`; exact semantic mappings beat display-label inference.
- [x] Exact aliases support legacy/generated content without fuzzy keyword matching.
- [x] Semantic refs/visual refs survive compilation and are validator/test protected.
- [x] Animals/homes, everyday EVS, lifecycle/process, air/wind, water/rocks, body/senses, food/hygiene, safety, transport/communication, planets, family/festivals, housing/clothing, botany and selected reasoning concepts now have reusable original SVGs.
- [x] Inferred motion is post-answer reinforcement in normal practice and suppressed in structured mocks.
- [x] Explicit authored visual stimuli remain visible from the start where the question is intentionally visual.
- [x] `prefers-reduced-motion` fails safely to static presentation.

Visual-coverage audit at `c51bce8`:

- **424/990 = 42.8%** of visual-friendly question items resolve to SVG visuals.
- Before the autonomous semantic-visual passes the same metric was **283/990 = 28.6%**.
- single-choice: **185/372 = 49.7%** visual.
- memory-pairs: **217/596 = 36.4%** visual.
- sequence-order: **8/8 = 100%** visual.
- word-bank-fill: **12/12 = 100%** visual.
- hotspot: **2/2 = 100%** visual.
- drag/matching remains an **explicit-visual-only** policy and is excluded from the visual-friendly denominator; matching should not be forced into pictorial mode merely to improve a metric.

CI now enforces a **40% minimum visual-friendly coverage floor**. Do not chase 100% by adding redundant pictures to numeric answers, coded-letter strings, person-name ranking answers, intrinsic Unicode symbols or ambiguous generic predicates such as `hard`, `light`, `natural`, `flowing` or `control`. Add visuals when they improve recognition, association, process understanding or feedback.

External permissively licensed packs remain optional; prefer current original/reusable primitives unless an external pack materially lowers production cost with exact provenance.

## Alignment / provenance — remaining product-truth mandate

Broad current Class 2 SOF scope and assessment format are backed by reviewed official sources. Exact row-level evidence is intentionally stricter.

Current machine-readable state:

- **26/182** profile rows/skills have reproducible exact evidence anchors.
- **13** are current-year direct anchors.
- **13** are historical official Class 2 direct anchors with explicit current-year scope binding.
- **156/182** remain pending exact row/skill evidence.
- `fitBasis: editorial_retained` remains explicit; Kidsplay does not pretend SOF supplied internal `core/review/stretch/challenge` fit.
- `SOF_INDIA_CLASS2` correctly remains `prototype_unverified`.

The public official Class 2 sample set reviewed so far spans current 2026-27 plus historical 2025-26, 2024-25, 2023-24, 2022-23 and 2019-20 samples. The 2023-24 paper was explicitly registered as **reviewed but redundant** because its usable science/achievers items repeat already-evidenced themes. Reviewed source count and exact evidenced-row count are deliberately separate metrics.

Public samples are small and substantially repetitive. Do **not** close the remaining 156 rows by counting syllabus headings, duplicate yearly questions, inaccessible paid material or uninspectable visual assumptions as exact evidence. Continue only when a reproducible official fact/skill anchor exists.

Operational evidence queue: `node scripts/report-sof-row-review.mjs` / `--json`.
Contract: `docs/SOF_ROW_REVIEW.md`.
Checkpoint: `docs/SOF_EVIDENCE_STATUS.md`.

## Release state

- [x] Stable `main` remains the user-validated Windows checkpoint at `a2b0586`.
- [x] Current `kidsplay` code/content has full Linux/browser/content/test/Android debug-build proof.
- [x] Current Android debug APK artifact exists.
- [x] Semantic animation/visual expansion is validator/test protected and now has a CI coverage floor.
- [x] Public SOF sample-source review has been pushed to the point where additional exact row claims require genuinely new reproducible evidence rather than repeated samples.
- [ ] Pull latest `kidsplay` locally on Windows and run `npm run check`.
- [ ] Advance `main` only after that latest-head Windows validation and explicit decision.

## Next high-value work

1. **Latest-head Windows certification and deliberate `main` promotion.** This is intentionally user-controlled; Linux/browser/Android proof is green.
2. **Exact SOF row-level evidence — 156 rows pending.** Continue only when genuinely new reproducible official anchors are available. Never manufacture evidence to close the number.
3. **Evidence-driven profile refinement.** Adjust membership/fit only when evidence/product reasoning justifies it.
4. **Selective visual expansion.** The scalable system and 40% floor are in place; add further visuals only where pedagogically useful rather than for metric inflation.
5. **Optional external assets only on demonstrated need** with exact license/provenance admission.

## Branch/release hygiene

- Canonical development branch: `kidsplay`.
- `kidsplay-work` remains temporary/divergent; do not merge wholesale; cleanup is tracked in issue #2.
- `main` is stable and should move only deliberately after the Windows gate.
- Reproducible npm lockfile / locked CI path is in place, including scoped Linux native-binding repair.

## Durable project memory

- GitHub issue #1 — canonical live execution tracker.
- `docs/WORK_TARGETS.md` — detailed durable checkpoint.
- `docs/ASSESSMENT_BLUEPRINTS.md` — assessment-format contract.
- `docs/SOF_ROW_REVIEW.md` — exact evidence protocol.
- `docs/SOF_EVIDENCE_STATUS.md` — compact evidence checkpoint.
- `content/alignment-reviews/SOF_INDIA_CLASS2.json` — machine-readable exact evidence.
- `content/alignment-sources/registry.json` — reviewed/internal source registry.
- `content/assessment-blueprints/SOF_INDIA_CLASS2_2026-27.json` — current Class 2 mock blueprint.
- `docs/CURRICULUM_METADATA.md`, `docs/DATA_CONNECTOR_ENGINE_REVIEW.md`, `docs/KNOWLEDGE_FORMATTERS.md` — architecture/curriculum contracts.

Keep these artifacts current so future work does not depend on chat context.
