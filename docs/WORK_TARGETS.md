# Kidsplay — canonical work targets

This is the durable project-work checkpoint for `sahnishant/kidsplay`. GitHub issue #1 is the canonical live execution tracker.

## Product constraints

- Android is the shipping target; ordinary development stays Node/npm + browser first.
- Broad foundational learning stays free as much as practical.
- Monetize structured goal paths, diagnostics, adaptation, mocks and advanced preparation rather than duplicating ordinary facts behind a paywall.
- Keep development/content-production cost low through canonical knowledge rows, reusable formatters/engines, data-driven assessment blueprints and lightweight presentation primitives.
- Animation should be lightweight, reusable and pedagogically meaningful. Do not introduce a heavy animation stack for effects that SVG/CSS/data-driven scenes can handle.
- External artwork is optional presentation data, never question/evaluator truth.

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

Stable `rowId`, shared normalizers, profile-owned curriculum placement, independent knowledge/profile/activity difficulty axes, reusable engines, row-level traceability and full-reference profile isolation are in place. Do not reopen architecture without a real failing content/use case.

Assessment remains a separate data layer:

```text
canonical knowledge
→ learning profile / membership
→ assessment blueprint
→ reusable question bank + engines
→ structured mock + section diagnostics
```

Presentation remains separate from knowledge/evaluation:

```text
canonical row / authored question
→ semanticRef / explicit visualRef
→ visual registry
→ optional admitted open-source asset OR Kidsplay SVG fallback
→ CSS motion / static reduced-motion fallback
```

## Current validated product/content state

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
- **224** registered semantic visual entities across **11** content-driven visual packs.
- **10** pinned/admitted Microsoft Fluent Emoji assets currently bundled.

For `SOF_INDIA_CLASS2`:

- **182/182** profile rows are exercised by at least one runnable question.
- **182/182** profile rows are represented in Free Explore.
- **0** current profile rows are accidentally paid-only.
- **140** profile-safe runnable questions are available to goal selection.
- Free Explore contains **142** questions while reusing the same canonical rows.

Science/EVS breadth is complete at useful prototype depth across Animals, Plants, Human Body, Food, Housing/Clothing, Habits/Safety, Transport/Communication, Air/Water/Rocks, Earth/Universe and Family/Festivals. Logical reasoning and HOTS include patterns, classification, analogy, ranking, coding-decoding, measurement/unit choices, shape properties, visual search, multi-row scenarios, statement pairs, table inference, ordered processes, passage/claim reasoning and traced visual interpretation.

## Free Explore / goal learning / mocks

- [x] Free Explore uses short adaptive sessions rather than whole-bank dumps.
- [x] Weakest referenced row drives priority for multi-row activities.
- [x] Foundational science/EVS/logical/passage/visual reasoning remains free.
- [x] Goal pack declares `knowledgeAccessPolicy: reuse_free_knowledge`; CI rejects paid-only leakage.
- [x] `SOF_INDIA_CLASS2` remains profile-isolated and weak/unseen adaptive.
- [x] NEXT FOCUS/readiness require breadth, not narrow mastery.
- [x] 20-question mixed mock.
- [x] Data-driven **35-question / 40-mark 2026-27 pattern mock**: 5 Logical Reasoning × 1 + 25 Science × 1 + 5 Achievers × 2.
- [x] Section/mark display and section diagnostics.
- [x] Long mock resumes offline/local-first with exact question order, raw responses and submitted-feedback boundary preserved.
- [x] Saved mocks fail closed against stale blueprint/profile/question contracts.
- [x] Compact local mock history and replay with fresh session identity.
- [x] UI states Kidsplay mocks/readiness are practice tools, not official SOF papers/scores/certification.

## Learning map / evaluator integrity

- [x] Player name/avatar persist locally.
- [x] Attempts, row evidence and concept mastery persist locally.
- [x] Corrupt/impossible persisted counters/attempts/checkpoints fail closed.
- [x] 17 Class 2 topic groups are summarized with practised/strong rows and weighted accuracy.
- [x] NEXT FOCUS is weak-first and then expands unpractised breadth.
- [x] All 9 shipped interactive solution families are exercised end-to-end against shipped questions.
- [x] Invalid injected answers cannot receive accidental full credit.
- [x] Maze evaluation validates every legal wall-respecting step.
- [x] Structured mock boundaries and weighted marks have runtime tests.
- [x] Resume re-evaluates raw responses rather than trusting stored scores.
- [x] Post-submit/pre-Next reload restores feedback while keeping the engine locked.

## Dheu story world — mandate complete, device acceptance pending

The story layer sits above the question bank and does not own evaluator/mastery truth.

- [x] Reusable original cast: **Dheu / Scientu / Shaitanu**.
- [x] **9** data-driven world locations.
- [x] **4 curated free missions** bound to canonical rows and existing free questions.
- [x] Five other locations launch mastery-adaptive free expeditions.
- [x] Persistent story unlocks depend on stable story mission completion rather than mutable curriculum membership, payment or mastery thresholds.
- [x] Story validator proves the free unlock graph is reachable and cannot depend on a non-free mission.
- [x] Curated replays preserve declared knowledge coverage while preferring weaker/unseen rows where safe.
- [x] Story completion/rewards persist separately from learning mastery; mission stars cannot be farmed by replay.
- [x] Adaptive Shaitanu framing changes presentation challenge only; it never changes answers/scoring.
- [x] Selective story micro-reactions are reserved for meaningful submitted moments rather than every routine answer.
- [x] Reduced-motion disables story animation without removing meaning.

Real-device usability for these flows remains tracked in issue #33.

## Presentation / semantic visuals / OSS assets

- [x] Semantic refs/visual refs survive generation and are validator/test protected.
- [x] Exact semantic mappings beat display-label inference; no fuzzy keyword matching.
- [x] Original reusable SVGs cover the main Class 2 EVS/science domains and selected reasoning concepts.
- [x] Inferred motion is post-answer reinforcement in normal practice and suppressed in structured mocks.
- [x] Explicit authored visual stimuli remain visible from the start where intentionally visual.
- [x] `prefers-reduced-motion` fails safely to static presentation.

Current visual audit at the latest recorded full run:

- **439/990 = 44.3%** of visual-friendly question items resolve to semantic visuals.
- single-choice: **186/372 = 50%**;
- memory-pairs: **231/596 = 38.8%**;
- sequence-order: **8/8 = 100%**;
- word-bank-fill: **12/12 = 100%**;
- hotspot: **2/2 = 100%**;
- matching/drag remains explicit-visual-only and is excluded from the visual-friendly denominator.

CI enforces a **40% minimum visual-friendly floor**. Do not chase 100% with misleading icons for numeric answers, coded strings, person names or ambiguous predicates.

### Open-source admission

- **Microsoft Fluent Emoji** is approved at pinned revision `1ffb34c752ecf5d402f04cfb4b392c77f57c54bc`, MIT.
- **Kenney assets** are approved as CC0, but each imported item still requires exact pack provenance.
- Bundled third-party files live under `public/assets/open/` and record source revision/path/blob SHA/license/local path.
- Normal builds remain offline/deterministic; upstream synchronization is an explicit authoring action.
- Current bundled Fluent proof set: dog, whale, cow, camel, rabbit, bird, fish, tree, sun and bone.
- Current Kidsplay SVG renderer/glyph remains the fallback when no `assetRef` is present.
- Asset validation, notices and behavior tests are part of normal project checks.

Further OSS expansion should be selective and reuse-driven.

## Browser / platform release gates

Permanent proof includes:

### Windows

`.github/workflows/windows-check.yml` runs clean `npm ci` + unchanged `npm run check` on `windows-latest` with Node 22.

### Browser child journeys

`.github/workflows/browser-smoke.yml` installs Chromium and runs normal project checks before Playwright.

The suite covers:

1. player setup → Free Explore → feedback → local persistence;
2. Story World mission completion → next-location unlock;
3. 35-question SOF pattern mock → exact submitted/unsubmitted resume boundaries;
4. reduced-motion experience;
5. Android-like **360×800** touch/layout pressure with 44px core target assertions, reduced-height name-entry stress and no-horizontal-overflow checks;
6. 35-question mock portrait layout plus portrait→landscape rotation check.

These browser checks are strong proxies, not a substitute for actual child/device observation.

### Android

Android CI validates/builds the web runtime, syncs Capacitor Android, runs Gradle `assembleDebug`, and uploads the APK.

## Alignment / provenance — principal unresolved product-truth mandate

Broad current Class 2 SOF scope and assessment format are backed by reviewed official sources. Exact row-level evidence intentionally uses a stricter standard.

Current machine-readable state:

- **27/182** profile rows/skills have reproducible exact official evidence anchors.
- **13** are current-year direct anchors.
- **14** are historical official Class 2 anchors with explicit current-year scope binding.
- **155/182** remain pending exact row/skill evidence.
- `fitBasis: editorial_retained` remains explicit; Kidsplay does not pretend SOF supplied internal fit labels.
- `SOF_INDIA_CLASS2` correctly remains `prototype_unverified`.

The public official sample set is small and substantially repetitive. The named official **2018-19** Class 2 sample is now registered and reviewed; it adds zero new exact anchors because its inspectable useful facts repeat already-evidenced rows or do not match pending canonical rows narrowly enough. Do **not** close the remaining 155 rows by counting syllabus headings, duplicate yearly questions, inaccessible paid material, near-matches, mirrors or uninspectable visual assumptions.

Operational evidence queue: `node scripts/report-sof-row-review.mjs --json`.
Contract: `docs/SOF_ROW_REVIEW.md`.
Checkpoint: `docs/SOF_EVIDENCE_STATUS.md`.

## Release / branch state

- Canonical development branch: `kidsplay`.
- Stable release branch: `main`.
- Previous parallel lanes #18–#21 and story micro-reaction work are consolidated.
- OSS semantic asset proof is integrated with exact provenance and fallback.
- Windows/browser/Android automated release gates are permanent.

## Remaining mandate — ordered

1. **Official SOF source recovery / exact row evidence.** Continue only when genuinely new reproducible official anchors exist. Current high-value source gaps: named-year official Class 2 artifacts for 2017-18, 2020-21 and 2021-22, or an official year binding for `Class-2_7.pdf`. Evidence quality is more important than count.
2. **Real-device child UX acceptance (#33).** Automated 360px/touch/layout pressure is now covered, but physical-device touch, packaged-offline, process-kill, safe-area, soft-keyboard and real-child comprehension observations cannot be certified by browser CI.
3. **Fix defects found by #33.** Each blocker/major defect gets a focused issue/commit from the certified `kidsplay` base.
4. **Selective semantic asset expansion.** Add Fluent/Kenney only for recurring concrete entities/scenes where recognition improves; preserve local fallback and bundle budget.
5. **Performance work only from profiling evidence.** Do not introduce chunking/architecture changes merely to silence Vite's advisory.

Do not add another interaction architecture, heavy animation framework, backend/router/graph database or broad runtime dependency without a demonstrated failing use case.
