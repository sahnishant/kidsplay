# Kidsplay — canonical work targets

This is the durable project-work checkpoint for `sahnishant/kidsplay`. GitHub issue #1 is the canonical live execution tracker; this file carries the detailed technical/product state so future work does not depend on chat context.

## Product constraints

- Android is the shipping target; ordinary development stays Node/npm + browser first.
- Broad foundational learning stays free as much as practical.
- Monetize structured goal paths, diagnostics, adaptation, mocks and advanced preparation rather than duplicating ordinary facts behind a paywall.
- Keep development/content-production cost low through canonical knowledge rows, reusable formatters/engines, data-driven assessment blueprints and lightweight presentation primitives.
- Animation should be lightweight, reusable and pedagogically meaningful. Do not introduce a heavy animation stack for effects that SVG/CSS/data-driven scenes can handle.
- External artwork is optional presentation data, never question/evaluator truth.

## Stable release baseline — promoted 2026-08-30

The previous stable `main` checkpoint `a2b058616113cda0f02348813cfc35df479249c0` has been superseded.

Certified consolidated product state:

- `main`: **`f7aeec826f10bb9ef5db33fedd9a80767b92352c`**
- `kidsplay`: same certified product state before this documentation checkpoint
- Consolidated four-lane batch: PRs **#26, #27, #28, #29**
- Windows Check run **33325322813**: success on exact `f7aeec8`
- Browser Smoke run **33325322844**: success on exact `f7aeec8`
- Android Debug APK run **33325322824**: success on exact `f7aeec8`
- Android artifact **9736071646**, SHA-256 `33b23401bbec379f0cf327c71e5a980aaf0049a46a53f7897a039eaf8a53c77d`

`main` was fast-forwarded rather than merge-committed because it was an ancestor of the certified `kidsplay` head.

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
→ assessment blueprint (year, sections, counts, marks, selectors, provenance)
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

A visual can therefore be added, removed or replaced without changing an answer key, evaluator or canonical fact.

## Certified platform/content checkpoint

Current validated state on `f7aeec8`:

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

Consolidated `npm run check` proof:

- content compilation/validation: pass;
- engine, scene, story, taxonomy/profile, planner/output contracts: pass;
- alignment/evidence and assessment-blueprint provenance: pass;
- knowledge traceability/free-knowledge policy: pass;
- semantic visual validation and 40% visual-coverage floor: pass;
- third-party asset validation/notices: pass;
- Svelte: **0 errors / 0 warnings**;
- production Vite build: pass;
- bundle budget: pass;
- Vitest: **23 files / 94 tests passed**.

Production bundle at the certified checkpoint:

- JS: **663.3 KiB raw / 128.1 KiB gzip**;
- CSS: **73.4 KiB**;
- still within the existing mobile budget;
- Vite's >500 KiB advisory remains visible intentionally. Do not hide it by raising the warning threshold or adding risky manual chunking without profiling evidence.

## Class 2 learning bank — beta mandate complete

For `SOF_INDIA_CLASS2`:

- **182/182** profile rows are exercised by at least one runnable question.
- **182/182** profile rows are represented in Free Explore.
- **0** current profile rows are accidentally paid-only.
- **140** profile-safe runnable questions are available to goal selection.
- Free Explore contains **142** questions while reusing the same canonical rows.
- Engine mix: crossword 1, drag-to-target 26, memory-pairs 26, sequence-order 1, single-choice 72, word-bank-fill 2, word-search 12.
- Difficulty mix: 35 level-1, 71 level-2, 34 level-3 runnable profile questions.

Science/EVS breadth is complete at useful prototype depth across Animals, Plants, Human Body, Food, Housing/Clothing, Habits/Safety, Transport/Communication, Air/Water/Rocks, Earth/Universe and Family/Festivals.

Logical-reasoning breadth covers patterns, classification/odd-one-out, analogies, ranking/ordering, coding-decoding, measurement/unit choices, shape properties and visual search.

HOTS/deeper reasoning includes multi-row scenarios, statement pairs, table inference, ordered processes, passage/claim reasoning and traced visual interpretation.

## Free Explore / goal learning / mocks

- [x] Free Explore uses short adaptive sessions rather than whole-bank dumps.
- [x] Weakest referenced row drives priority for multi-row activities.
- [x] Foundational science/EVS/logical/passage/visual reasoning remains free.
- [x] Goal pack declares `knowledgeAccessPolicy: reuse_free_knowledge`; CI rejects paid-only leakage.
- [x] `SOF_INDIA_CLASS2` remains profile-isolated and weak/unseen adaptive.
- [x] NEXT FOCUS/readiness require breadth, not narrow mastery.
- [x] 20-question mixed mock.
- [x] Data-driven **35-question / 40-mark 2026-27 pattern mock**: 5 Logical Reasoning × 1 + 25 Science × 1 + 5 Achievers × 2.
- [x] Section/mark display and section-level diagnostics.
- [x] Long mock resumes offline with exact question order, raw responses and submitted-feedback boundary preserved.
- [x] Saved mocks fail closed against stale blueprint/profile/question contracts.
- [x] Compact local mock history and replay with fresh session identity.
- [x] UI states Kidsplay mocks/readiness are practice tools, not official SOF papers/scores/certification.

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

## Dheu story world — operational reusable learning layer

The story layer sits above the question bank and does not own evaluator/mastery truth.

- [x] Reusable original cast: **Dheu / Scientu / Shaitanu**; Dheu uses the saved child name/avatar.
- [x] **9** data-driven world locations.
- [x] **4 curated free missions** bound to canonical rows and existing free questions:
  - Puppy by the Pond — River & Pond — 6 clues.
  - Invisible Air Mystery — Scientu's Lab — 5 clues covering 6 declared air rows.
  - Rock Look-Alike Case — Shaitanu's Hideout — 6 clues covering 7 declared rock rows.
  - Night-Sky Mix-Up — Observatory — 6 clues.
- [x] Five start locations remain immediately explorable through short mastery-adaptive expeditions.
- [x] Persistent story unlocks depend on stable story mission completion, not curriculum membership, mastery threshold or payment state.
- [x] Story validator proves the free unlock graph is reachable and cannot depend on a non-free mission.
- [x] Curated replays preserve declared knowledge coverage while preferring weaker/unseen rows where safe.
- [x] Story completion/rewards persist separately from learning mastery; mission stars cannot be farmed by replay.
- [x] Adaptive Shaitanu framing changes presentation challenge only; it never changes answers/scoring.

## Presentation / semantic visuals / OSS assets

Presentation is a scalable content system rather than random decoration.

- [x] Semantic refs/visual refs survive generation and are validator/test protected.
- [x] Exact semantic mappings beat display-label inference; no fuzzy keyword matching.
- [x] Original reusable SVGs cover animals/homes, EVS objects, processes, body/senses, food/hygiene, safety, transport/communication, space, family/festivals, housing/clothing, botany and selected reasoning concepts.
- [x] Inferred motion is post-answer reinforcement in normal practice and suppressed in structured mocks.
- [x] Explicit authored visual stimuli remain visible from the start where the question is intentionally visual.
- [x] `prefers-reduced-motion` fails safely to static presentation.

Current visual audit:

- **439/990 = 44.3%** of visual-friendly question items resolve to semantic visuals.
- single-choice: **186/372 = 50%**;
- memory-pairs: **231/596 = 38.8%**;
- sequence-order: **8/8 = 100%**;
- word-bank-fill: **12/12 = 100%**;
- hotspot: **2/2 = 100%**;
- matching/drag remains explicit-visual-only and is excluded from the visual-friendly denominator.

CI enforces a **40% minimum visual-friendly floor**. Do not chase 100% with misleading icons for numeric answers, coded strings, person names or ambiguous predicates such as `hard`, `light`, `natural`, `flowing` or `control`.

### Open-source asset admission — first production pass complete

The asset registry is now fail-closed and exact-provenance based:

- **Microsoft Fluent Emoji** is approved at pinned revision `1ffb34c752ecf5d402f04cfb4b392c77f57c54bc`, MIT.
- **Kenney assets** are approved as CC0, but each imported item still requires exact pack provenance.
- Bundled third-party files must live under `public/assets/open/` and record source revision/path/blob SHA/license/local path.
- Normal builds remain offline/deterministic; upstream synchronization is an explicit authoring action.
- Current bundled Fluent proof set: dog, whale, cow, camel, rabbit, bird, fish, tree, sun and bone.
- Current Kidsplay SVG renderer/glyph remains the fallback when no `assetRef` is present.
- `tests/oss-assets.behavior.test.ts`: **6/6** within the consolidated 94-test suite.

Further OSS expansion should be selective and reuse-driven. Kenney is available for exact-provenance gaps; do not bulk-import packs merely to increase coverage.

## Browser and platform release gates

Permanent cross-platform proof now includes:

### Windows

`.github/workflows/windows-check.yml` runs on a real GitHub-hosted `windows-latest`/Windows Server 2025 environment with Node 22 and executes clean `npm ci` + unchanged `npm run check`.

Consolidated exact-head proof: **run 33325322813 — success**.

### Browser child journeys

`.github/workflows/browser-smoke.yml` installs Chromium and runs the normal project checks before Playwright.

Current Playwright suite: **4/4 passed**:

1. player setup → Free Explore → feedback → local persistence;
2. Story World mission completion → next-location unlock;
3. 35-question SOF pattern mock → exact submitted/unsubmitted resume boundaries;
4. reduced-motion experience remains static/usable.

Consolidated exact-head proof: **run 33325322844 — success**.

### Android

Android CI validates/builds the web runtime, generates/syncs Capacitor Android, runs Gradle `assembleDebug`, and uploads the APK.

Consolidated exact-head proof: **run 33325322824 — success**, artifact **9736071646**.

## Alignment / provenance — principal remaining product-truth mandate

Broad current Class 2 SOF scope and assessment format are backed by reviewed official sources. Exact row-level evidence intentionally uses a stricter standard.

Current machine-readable state after evidence pass #19:

- **27/182** profile rows/skills have reproducible exact official evidence anchors.
- **13** are current-year direct anchors.
- **14** are historical official Class 2 anchors with explicit current-year scope binding.
- **155/182** remain pending exact row/skill evidence.
- Newly evidenced row in the latest pass: `kr.universe.earth.type.planet` via an official historical Class 2 sample plus current-year Earth/Universe scope binding.
- `fitBasis: editorial_retained` remains explicit; Kidsplay does not pretend SOF supplied internal `core/review/stretch/challenge` fit labels.
- `SOF_INDIA_CLASS2` correctly remains `prototype_unverified`.

The public official sample set is small and substantially repetitive. Several older/alternate samples were reviewed in the latest pass and correctly produced zero new exact anchors. Do **not** close the remaining 155 rows by counting syllabus headings, duplicate yearly questions, inaccessible paid material, near-matches or uninspectable visual assumptions.

Operational evidence queue: `node scripts/report-sof-row-review.mjs --json`.
Contract: `docs/SOF_ROW_REVIEW.md`.
Checkpoint: `docs/SOF_EVIDENCE_STATUS.md`.

## Release state

- [x] Consolidate parallel lanes A–D into `kidsplay`.
- [x] Full consolidated Windows latest-head `npm run check`.
- [x] Consolidated Browser Smoke / Playwright child journeys.
- [x] Consolidated Android debug APK build and artifact.
- [x] Fast-forward stable `main` to certified product state `f7aeec8`.
- [x] OSS semantic asset proof integrated with exact provenance and fallback.
- [x] SOF exact evidence improved without provenance inflation.

## Next high-value work

1. **Exact SOF row-level evidence — 155 rows pending.** Continue only when genuinely new reproducible official anchors exist. Evidence quality is more important than count.
2. **Evidence-driven profile refinement.** Adjust membership/fit only when exact evidence/product reasoning justifies it; do not use sample occurrence as an official difficulty label.
3. **Selective semantic asset expansion.** Use Fluent/Kenney only where a real reused entity/scene benefits from it; preserve local fallback and bundle budget.
4. **Real-device child UX testing.** Automated browser/Android build proof is now strong; the next product-quality signal should increasingly be observation on actual phones/tablets and with real child flows rather than more framework construction.
5. **Performance optimization only with evidence.** Bundle budget prevents silent bloat; profile startup/loading before introducing chunking or architecture changes.

Do not add another interaction architecture, heavy animation framework, backend/router/graph database, or broad runtime dependency without a demonstrated failing use case.

## Branch / release hygiene

- Canonical development branch: `kidsplay`.
- Stable release branch: `main`; product code baseline is now `f7aeec8`.
- Parallel batch issues #18–#21 have been consolidated through PRs #26–#29.
- Coordination issue #22 should be closed after this checkpoint is recorded.
- `kidsplay-work` remains temporary/divergent; do not merge wholesale; cleanup remains tracked separately.
- Keep `main` as a fast-forwarded certified checkpoint rather than creating unnecessary promotion merge commits.

## Durable project memory

- GitHub issue #1 — canonical live execution tracker.
- `docs/WORK_TARGETS.md` — detailed durable checkpoint.
- `docs/ASSESSMENT_BLUEPRINTS.md` — assessment-format contract.
- `docs/SOF_ROW_REVIEW.md` — exact evidence protocol.
- `docs/SOF_EVIDENCE_STATUS.md` — compact evidence checkpoint.
- `content/alignment-reviews/SOF_INDIA_CLASS2.json` — machine-readable exact evidence.
- `content/alignment-sources/registry.json` — reviewed official/internal source registry.
- `content/assessment-blueprints/SOF_INDIA_CLASS2_2026-27.json` — current Class 2 mock blueprint.
- `content/assets/registry.json` + `public/assets/open/` — third-party art provenance/admission ledger and bundled files.
- `e2e/child-journeys.spec.ts` — browser child-journey acceptance coverage.
- `content/story/*.json` + `src/story/*` — story-world data/directors/progress contracts.
- `docs/CURRICULUM_METADATA.md`, `docs/DATA_CONNECTOR_ENGINE_REVIEW.md`, `docs/KNOWLEDGE_FORMATTERS.md` — architecture/curriculum contracts.

Keep these artifacts current so future work remains GitHub-driven rather than chat-memory-driven.
