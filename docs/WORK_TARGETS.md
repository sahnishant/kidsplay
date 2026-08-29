# Kidsplay — canonical work targets

This is the durable project-work checkpoint for branch `kidsplay`. For the smallest resume context, read `docs/ARCHITECTURE_STATUS.md` first; GitHub issue #1 is the canonical live execution tracker.

## Product constraints

- Android is the shipping target; ordinary development stays Node/npm + browser only.
- Broad foundational learning stays free as much as practical.
- Monetize structured goal paths, diagnostics, adaptation, mocks and advanced preparation.
- Keep development/content-production cost low through reusable systems rather than handcrafted games/questions.

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

Core invariants remain complete: stable `rowId`, shared normalizers, profile-owned curriculum placement, independent knowledge/profile/activity difficulty axes, generated build/cache questions, reusable engines, and row-level traceability.

## Product/runtime baseline — complete

- [x] Svelte home/catalog replaces hard-coded pack bootstrap.
- [x] Player name/avatar stored locally.
- [x] Free Explore and Goal Learning are distinct entry points.
- [x] SOF Class 2 goal is profile-driven through `SOF_INDIA_CLASS2`.
- [x] Runtime admits only activities whose complete `knowledgeRefs` set belongs to the selected profile.
- [x] Goal selection uses profile fit, unseen/weaker mastery, topic/activity-family diversity and engine variety.
- [x] Multi-row goal activities are ranked by the hardest included profile fit.
- [x] Attempts, row evidence and concept mastery persist offline.
- [x] Progress summary is visible on home.
- [x] Free-vs-purchase policy is visible without premature payment/account infrastructure.
- [x] Svelte health is 0 errors / 0 warnings.
- [x] Windows-safe Vitest execution uses one worker thread; Linux/Android CI remains green.

## First useful living-world learning slice — complete

The bank has moved beyond proof content.

- [x] 42 stable reusable knowledge rows across 8 knowledge sources.
- [x] 48 canonical learnables.
- [x] 31 knowledge-generated questions plus existing authored activities; 45 runnable questions currently validate.
- [x] Animal homes: dog/kennel, horse/stable, cow/cowshed, hen/coop, rabbit/burrow, lion/den.
- [x] Animal young ones: puppy, kitten, calf, foal, lamb, tadpole.
- [x] Animal coverings/features: scales, feathers, wool, shell, thick fur, webbed feet.
- [x] Plant-part functions: roots, stem, leaves, flower, fruit, seed.
- [x] Plant types: tree, shrub, herb, climber, creeper, aquatic.
- [x] Plant uses/products: cotton, sugarcane, rubber tree, tea, neem, bamboo.
- [x] Same rows are reused in Free Explore and the SOF goal path.
- [x] New sets generate memory, matching, word-search and MCQ activities where they fit naturally.
- [x] Do not force crossword generation when the word set cannot form a natural connected grid.

## Free Explore — meaningful session behavior

`Living World: Animals & Plants` now launches short adaptive sessions rather than the entire pack.

- [x] 8 questions per session.
- [x] Animals + Plants mixed in representative sessions.
- [x] Unseen/weaker knowledge first.
- [x] At least four representative interaction types.
- [x] Prefer distinct activity/knowledge families before heavy repetition.
- [x] Behavioral test requires at least six distinct activity families in representative 8-question sessions.

## Goal Learning — focused prototype

Current title: **Class 2 Science Olympiad: Animals & Plants**.

- [x] Transparent partial-syllabus title instead of implying full Olympiad coverage.
- [x] SOF 2026-27 profile scope is reviewed at the chapter/syllabus level.
- [x] Complete knowledge-reference isolation prevents profile leakage.
- [x] Session selection is mastery-aware and topic-diverse.
- [x] Purchase policy remains modeled outside engines/knowledge; prototype is still tryable without payment infrastructure.
- [ ] Exact row memberships/fits remain `prototype_unverified` until row-level review evidence exists.

## Behavioral protection

Behavior tests run inside `npm run check` using Vitest + Svelte Testing Library + jsdom.

Current coverage includes:

- [x] Free-vs-goal catalog behavior.
- [x] Short mixed free sessions.
- [x] Animals + Plants session mix.
- [x] Engine diversity and activity-family diversity.
- [x] Profile isolation via complete `knowledgeRefs` membership.
- [x] Mastery feedback into later selection.
- [x] Session single-submit, advance and replay state.
- [x] Runtime engine registry coverage across all nine shipped interactive engines.
- [x] Local player/attempt/mastery persistence.
- [x] Svelte home → goal → home behavior.
- [x] Engine submission → feedback → completion behavior.

## Alignment provenance — infrastructure complete

- [x] Central alignment-source registry.
- [x] Every profile has explicit source refs/version applicability metadata.
- [x] Every membership collection has provenance and placement-basis metadata.
- [x] `reviewed` profile status requires reviewed official source + version + review date + applicability.
- [x] `reviewed` membership status independently requires equivalent evidence.
- [x] SOF Class 2 profile scope reviewed against official current ISO syllabus plus official 2026-27 reference.
- [x] Keep current SOF row placements `prototype_unverified`; broad syllabus scope does not validate individual row fits.

Detailed contract: `docs/CURRICULUM_METADATA.md`.

## Next P0 — broaden and deepen actual learning

The next pass should continue content/product depth rather than architecture.

- [ ] Add **Human Body** reusable knowledge and activities.
- [ ] Add **Food** reusable knowledge and activities.
- [ ] Then cover Housing/Clothing, Safety, Transport/Communication, Air/Water/Rocks, Earth/Universe.
- [ ] Add real logical-reasoning/HOTS activities that combine knowledge instead of simply reformatting one association.
- [ ] Add topic-level mastery visibility for parent/child once more topics exist.
- [ ] Review individual SOF membership/fit decisions against row-level evidence before marking alignment reviewed.
- [ ] Decide `main` promotion after this living-world baseline is locally verified and dependency-lock policy is settled.

## P1 — semantic datatypes only when real content needs them

- [ ] `passage@1` for comprehension/claim reuse.
- [ ] `entity_table@1` for attributes/classification/compare.
- [ ] `ordered_process@1` for lifecycle/procedure/timeline.
- [ ] `labeled_diagram@1` for hotspot/label/matching.
- [ ] Better distractor policies using category/type/misconception metadata.
- [ ] Stable media/asset refs on canonical knowledge units.
- [ ] Source revision/provenance policy for generated item families.

## Presentation assets — separate workstream

- [x] Asset/license admission registry.
- [x] Build-time third-party notices.
- [ ] Admit a permissively licensed modular character/animal source with exact per-asset provenance.
- [ ] Build reusable poses/parts and cheap expression/action variants.
- [ ] Replace platform emoji scenes incrementally without coupling art to question types.

## Branch/release hygiene

- Canonical branch: `kidsplay`.
- `kidsplay-work` is temporary/divergent; do not merge wholesale; delete when convenient (issue #2).
- `main` remains repository initialization until deliberately promoted.
- [ ] Track a reproducible npm lockfile and move CI from `npm install` to `npm ci` before/with main promotion.

## GitHub project memory

- Compact current state: `docs/ARCHITECTURE_STATUS.md`.
- Canonical live tracker: issue #1.
- Profile/alignment contract: `docs/CURRICULUM_METADATA.md`.
- Detailed architecture review: `docs/DATA_CONNECTOR_ENGINE_REVIEW.md`.
- Formatter rationale: `docs/KNOWLEDGE_FORMATTERS.md`.
- Keep static GitHub checkpoints current so future sessions do not depend on chat history.
