# Kidsplay — canonical work targets

This is the repo-local work checkpoint for `sahnishant/kidsplay`.

**Durable control plane:**
- GitHub **#1** — canonical high-level orchestration and current active checkpoint;
- GitHub **#174** — child game-feel/product laws;
- GitHub **#210** — operational 120-pass gameplay execution programme;
- `docs/GAMEPLAY_ROADMAP.md` — concise repo-local roadmap/ownership/branch rules.

If this document conflicts with #1, GitHub issue #1 wins.

## Current integrated baseline — 2026-09-04

- Canonical integrated branch: `main`.
- Current `main`: `12599cd7a5ef773130c5b1a0ccc21416097eea9c` — PR #193 merge.
- PR #193 integrated:
  - human-approved primary-vocabulary batch 005 outcomes with HOLD boundaries preserved;
  - human-reviewed semantic tranche 004 outcomes;
  - Phase G1 Trace & Discover engineering.
- Exact certified PR #193 engineering head: `0b4072fa0d51346d71ff102acde19bbd46731bf4`.
- Permanent checks on that exact head:
  - Primary Vocabulary `33792324132` ✅
  - Priority Visual Breadth `33792323836` ✅
  - Windows `33792324023` ✅
  - Browser/Playwright `33792324042` ✅
  - Android packaged/offline `33792323834` ✅

## Current child-product gates

### #192 — G1 Trace & Discover
Engineering is integrated/certified. Explicit HUMAN first-production visual/CX acceptance remains separate and open.

### #196 / PR #204 — Character Persona System V1
Active overlapping child-character/session-presentation vertical:
- branch `feat/character-persona-system-v1`;
- base `main` `12599cd7a5ef773130c5b1a0ccc21416097eea9c`;
- exact engineering head `19d414216dc8b305b389aa2de14a3f649190fdde`;
- Windows `33802735082` ✅;
- Browser/Playwright `33802734845` ✅;
- Android packaged/offline `33802734611` ✅.

Human review is an acceptance gate, not a global engineering stop. Disjoint docs/control-plane/content/readiness work may continue while it is pending. Do not create a competing branch that owns the same child shell/story/session-presentation/audio/runtime files unless #1 explicitly reassigns ownership.

## Integrated product foundations — do not rebuild

- Canonical learning flow remains data/knowledge -> planner/profile -> formatter/question -> reusable engine -> evaluator -> local progress.
- Story/presentation sits above learning truth and does not own answers.
- Immediate committed-answer submission/feedback loop is integrated.
- #173 honest retry/scaffolding preserves first-attempt evidence.
- #175 offline-safe young-child audio runtime + Repeat + persistent sound preference is integrated.
- Child/adult UI separation is integrated; `Continue Adventure` dominates Home.
- Progress-derived visible world consequences are integrated.
- #185 Forest Explorer Level 1 + reusable experience recipe is integrated and HUMAN-approved.
- #8 is the interactive Story World / mission graph authority.
- #76/#84/#114 provide the semantic sense/relationship/visual presentation stack.
- Existing `single_choice@1` supports semantic visuals, shuffled options and immediate one-tap submission.
- G1 `trace_path@1` engineering is integrated.
- Windows, Browser/Playwright and packaged/offline Android gates are permanent.

## Child product model

Home keeps **Continue Adventure** dominant. Secondary child intents are:

1. **Adventure** — guided missions/world progression/campaigns.
2. **Play** — free practice, manipulation, riddles, replay and creative/rest play.
3. **Learn About** — topic-first exploration/depth.
4. **Stories** — calm authored listening/reading/imagination with no mandatory assessment.

First Play (#206) is cross-cutting, not another Home tab. Appropriate content can lower demand through:

`touch/hear -> listen/find -> match -> put/sort/build -> concrete concept -> sound/letter exposure`.

## Canonical roadmap order

```text
current HUMAN gates + #196/#204
-> #206 First Play bounded sampler
-> #203 Visual Scene Choice / Which Doesn't Belong?
-> #192 G2 build/assemble
-> #197 bundled playful voice proof
-> #207 Learn About V1: Earth / Lion / Fire Station
-> #208 Riddle Time bounded proof
-> #205 Stories V1: 3–5 stories
-> #192 G3 practical-life + G4 cause/effect
-> #198 Forest Explorer L2/L3
-> #200 Discovery Book + #199 sound-first literacy
-> #198 Town Square + Scientu Lab transfer
-> #209 Across the World India proof
-> #209 one international transfer proof
-> #201 replay/creative rest
-> #202 parent session controls
```

Issue #210 owns the numbered 120-pass checklist and is the preferred next-work queue.

## Architecture authorities

- #8 — interactive Story World/mission graph.
- #173 — first-attempt/retry/scaffold/mastery evidence.
- #175 — audio runtime.
- #197 — bundled voice/audio production only.
- #51 — reviewed child vocabulary/meaning authority.
- #76/#84/#114 — semantic senses/relationships/visual meaning.
- #192 — reusable toy/manipulation families.
- #196 — Dheu/Scientu/Shaitanu persona vocabulary/renderer.
- #206 — First Play interaction-demand tier; no toddler truth/evaluator/progress store.
- #203 — visual-selection/odd-one-out recipes over existing evaluator.
- #207 — topic-first projection; no encyclopedia/fact bank.
- #208 — riddle/clue recipe/content; no second evaluator.
- #205 — calm story manuscripts/library/read persistence; no mission/mastery runtime.
- #200 — deterministic discovery projection; no currency/fact bank.
- #209 — route/destination Adventure campaign; no geography game engine/vehicle simulator.

## Ongoing independent authority/content lanes

### #51 — primary vocabulary editorial production
The generic delivery architecture is proven. Continue bounded human/editorial production without allowing corpus grade/frequency, AI drafts or gameplay usage to impersonate human meaning/profile-placement authority.

### #76 — semantic visual vocabulary + intelligent animation at scale
Continue exact-sense review, semantic depth and reusable scene/visual maturity through the existing generic control plane. Gameplay phases consume this authority; they do not create parallel semantic truth.

### SOF / profile work
Assessment/provenance remains distinct from the gameplay roadmap. Official source evidence, profile placement and product game-feel must not be conflated.

## Permanent product laws

- Play first, assessment second.
- The child should do things to the world, not merely answer cards.
- A committed tap/drag/action should react immediately; avoid redundant `Check Answer`.
- Preschool visual selection should let semantic meaning dominate the viewport.
- Progress should change/reveal/unlock meaningful world state; avoid coin/XP grind.
- Exploration/hearing/animation/story exposure is not mastery evidence.
- Same canonical knowledge should generate multiple experiences; no duplicate fact/question banks.
- Random distractors are not difficulty; use controlled semantic contrasts.
- First Play must work without reading, with one-step intent, huge forgiving targets and gentle in-place recovery.
- Structured assessment answer safety remains non-negotiable.
- Published child facts/riddles/stories are deterministic/reviewable; no core runtime cloud/LLM requirement.
- Age/profile is a routing hint only, not proof of ability or mastery.
- Prefer lightweight SVG/CSS/semantic composition over heavy 3D/game runtimes.
- Reduced-motion/static meaning must remain complete.

## Release / acceptance law

Every new child-facing family may be engineered before human acceptance, but it must not broadly scale until its first production use has:

1. focused contract/unit tests;
2. representative 360x640 Browser/Playwright child journey;
3. Windows/full check;
4. relevant semantic/vocabulary/content gates;
5. packaged Android offline first launch/relaunch/rotation;
6. unchanged bundle budget unless explicitly justified;
7. accessibility + sound-off where relevant + reduced-motion/static meaning;
8. explicit HUMAN visual/CX review of the exact production behavior.

Keep `engineering complete`, `integrated`, `HUMAN accepted` and `editorially authoritative` as separate statuses.

## Current immediate work

While #196/PR #204 is in human review:
- execute #210 passes 015–020 for repo/orchestrator hygiene;
- then perform compatible readiness audits/contracts that do not compete for the active child-session presentation surfaces;
- continue genuinely independent #51/#76 authority/content work as separately orchestrated;
- do not start broad First Play/Stories/world-presentation implementation until #1 activates the relevant overlapping slice.

Do not reopen core learning architecture, add another evaluator/progress store/audio runtime/story graph, or introduce a heavy game framework without a demonstrated failing use case and explicit #1 decision.
