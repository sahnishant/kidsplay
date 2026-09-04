# Kidsplay — canonical work targets

This is the repo-local work checkpoint for `sahnishant/kidsplay`.

**Durable control plane:**
- GitHub **#1** — canonical high-level orchestration and current active checkpoint;
- GitHub **#174** — child game-feel/product laws;
- GitHub **#210** — operational 120-pass gameplay execution programme;
- `docs/GAMEPLAY_ROADMAP.md` — concise repo-local roadmap, ownership matrix and branch rules.

If this document conflicts with GitHub, **#1 wins for high-level activation and #210 wins for the pass programme**. When the checkbox body in #210 lags behind a recently merged tranche, use the most recent explicit execution-checkpoint comment on #210 until the body is reconciled.

## Current integrated baseline — 2026-09-04

- Canonical integrated branch: `main`.
- Current `main`: `9065690278d22bc03294de0993a1a957dc7188c2` — Stories V1 hardening PR #231 merge.
- There are **no open pull requests** at this checkpoint.
- Important integrated child-product sequence since the older #193 checkpoint:
  - #204 — Character Persona System V1 merged; #196 is closed completed;
  - #225/#227 — shared gameplay contracts and machine gameplay wave integrated;
  - #233 — stale Forest acceptance assertions repaired against the current runtime contract;
  - #230 — bounded Riddle Time R0/R2 production-candidate/evidence tranche merged;
  - #231 — bounded Stories manuscript/persistence hardening merged.
- Exact final #230 and #231 heads each passed Windows, Browser/Playwright and packaged/offline Android before merge.

The SHA above is a **checkpoint**, not a long-lived branch name. Always fetch current `main` before starting implementation.

## Current child-product truth

### #192 — G1 Trace & Discover
Engineering is integrated/certified. Explicit HUMAN first-production visual/CX acceptance remains separately tracked in #192; do not infer human acceptance from CI.

### #196 / #204 — Character Persona System V1
Integrated and closed. Dheu, Scientu and Shaitanu persona contracts/rendering are reusable foundations; do not reopen or fork them merely because an older roadmap paragraph still calls #204 active.

### #227 — shared machine gameplay foundations
Integrated. It supplied/reconciled reusable contracts for areas including First Play/replay policy, G2-style assembly mechanics, Learn About projection, riddle placement, Stories contracts/catalog/lexical reporting and phonics progression. Later product slices must consume these foundations rather than rebuilding parallel systems.

### #208 — Riddle Time
Requested machine slice is integrated through #230:
- four R0 zero-reading/two-visual riddle candidates;
- four R2 semantic-inference candidates;
- canonical candidate-universe uniqueness validation;
- first-attempt/retry evidence proof;
- same clue contract projected into Play / Learn About / Adventure through the existing evaluator.

**Editorial boundary:** machine-authored riddle wording/age fit remains `draft`. Broader R1/R3/R4/R5 corpus work and HUMAN visual/CX/editorial acceptance remain open programme work.

### #205 — Stories
Requested machine slice is integrated through #231:
- two real bounded calm bedtime manuscripts (>300 words each);
- Shaitanu humour, Scientu curiosity and Dheu/friends coverage;
- canonical lexical-profile reuse;
- manuscript-derived duration diagnostics clearly marked `word_count_estimate`;
- durable story/beat/completed/favourite persistence with fail-closed corruption handling;
- no learning mastery/accuracy writes from story reading state.

**Editorial/audio boundary:** all current manuscripts remain `editorialStatus: draft`; the published V1 list remains empty. #197 still owns bundled playful narration/voice production. Actual measured story narration duration and full Stories-surface packaged process-kill/resume acceptance are not complete.

### #197 — bundled playful voice
Still open/planned. Do not represent device-local speech, manuscript timing estimates or generic Android offline smoke as a completed bundled child voice pack.

## Integrated product foundations — do not rebuild

- Canonical learning flow remains `knowledge -> planner/profile -> formatter/question -> reusable engine -> evaluator -> local progress`.
- Story/presentation sits above learning truth and does not own answers.
- Immediate committed-answer submission/feedback loop is integrated.
- #173 honest retry/scaffolding preserves first-attempt evidence.
- #175 is the only offline-safe child audio runtime + Repeat + sound preference authority.
- Child/adult UI separation is integrated; `Continue Adventure` dominates Home.
- Progress-derived visible world consequences are integrated.
- #185 Forest Explorer Level 1 + reusable experience recipe is integrated and HUMAN-approved.
- #8 is the interactive Story World / mission graph authority.
- #76/#84/#114 provide semantic sense/relationship/visual presentation authority.
- Existing `single_choice@1` supports semantic visuals, shuffled options and immediate one-tap submission.
- `trace_path@1` and shared machine gameplay contracts are integrated.
- Windows, Browser/Playwright and packaged/offline Android gates are permanent.

## Child product model

Home keeps **Continue Adventure** dominant. Secondary child intents are:

1. **Adventure** — guided missions/world progression/campaigns.
2. **Play** — free practice, manipulation, riddles, replay and creative/rest play.
3. **Learn About** — topic-first exploration/depth.
4. **Stories** — calm authored listening/reading/imagination with no mandatory assessment.

First Play (#206) is cross-cutting, not another Home tab. Appropriate content can lower demand through:

`touch/hear -> listen/find -> match -> put/sort/build -> concrete concept -> sound/letter exposure`.

## Product dependency order

The product dependency order remains:

```text
First Play / visual-choice / reusable manipulation foundations
-> #197 bundled playful voice proof
-> Learn About production depth
-> Riddle production breadth
-> Stories published/audio-complete V1
-> G3/G4 practical-life + cause/effect
-> deeper Forest/Town/Lab worlds
-> Discovery Book + sound-first literacy
-> Across the World India proof
-> one international transfer proof
-> replay/creative rest
-> parent session controls
```

Several **machine contracts** from later rows have already landed through #227/#230/#231. That does not waive unresolved product dependencies, human gates, editorial authority or #197 audio acceptance.

Issue #210 owns the numbered pass programme. Before opening a branch, reconcile its checkbox body with its latest checkpoint comments and current `main`.

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

## File-ownership matrix

| Area | Canonical owner | Typical files | Do not duplicate with |
| --- | --- | --- | --- |
| Child shell / Home / session presentation | #1/#174 activation + existing UI | `src/App.svelte`, `src/ui/**`, child surface CSS | parallel product shells or dashboard forks |
| Interactive Story World graph | #8 | story mission/world data/runtime | Stories library or Learn About mission graphs |
| Retry/mastery evidence | #173 | session/progress/evidence runtime | per-feature score/progress stores |
| Audio runtime | #175 | `src/runtime/childAudio*` | second story/riddle/audio player |
| Bundled voice assets/manifest | #197 | audio manifests/assets/pipeline | component-local speech file paths |
| Semantic meaning/visuals | #76/#84/#114 | semantic registries/presenters | per-mode fact/visual truth banks |
| Character personas | #196 | persona registry/renderer/reactions | per-story character renderers |
| Manipulation families | #192 | mechanics/engine contracts | level-specific bespoke evaluators |
| Learn About | #207 | topic projection/contracts | encyclopedia/fact duplication |
| Riddles | #208 | clue/riddle content/projection | separate answer engine |
| Stories | #205 | story manuscripts/contracts/read state | mission graph or mastery system |
| Geography campaign | #209 | route/destination projection | vehicle simulator/geography engine |
| Orchestration/docs | #1/#174/#210 | `README.md`, `docs/WORK_TARGETS.md`, `docs/GAMEPLAY_ROADMAP.md` | chat-only roadmaps |

If an intended change crosses two active ownership rows, stop and reconcile ownership on #1 before opening competing implementation branches.

## Branch activation / retirement rules

1. `main` is the only canonical integrated baseline; always branch from current `main` unless an issue explicitly names an existing branch to continue.
2. A planning issue is not branch permission.
3. #1 controls overlapping product activation; #174 supplies product laws; #210 supplies the pass queue.
4. Before creating a branch, inspect open PRs and surviving branches for overlapping ownership.
5. Prefer one branch at a time for the same child shell/session/story/presentation/audio surface.
6. Explicitly disjoint docs, control-plane, validation and independent authority/content work may run in parallel.
7. Reuse merged contracts. Do not create compatibility wrappers around a duplicate subsystem merely to avoid touching the canonical one.
8. Every implementation PR records base SHA, exact final head, relevant permanent gates and remaining HUMAN/editorial boundaries.
9. After merge, treat the branch as retired; delete/close stale refs when tooling/permissions allow. PR/issue history is the durable record.
10. Never use a branch being HUMAN-reviewed as a dumping ground for unrelated roadmap work.
11. Keep `engineering complete`, `integrated`, `HUMAN accepted`, `audio accepted` and `editorially authoritative` separate.

## Ongoing independent authority/content lanes

### #51 — primary vocabulary editorial production
Continue bounded human/editorial production without allowing corpus grade/frequency, AI drafts or gameplay usage to impersonate human meaning/profile-placement authority.

### #76 — semantic visual vocabulary + intelligent animation at scale
Continue exact-sense review, semantic depth and reusable scene/visual maturity through the existing generic control plane. Gameplay consumes this authority; it does not create parallel semantic truth.

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
- First Play must work without reading, with one-step intent, forgiving targets and gentle in-place recovery.
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

Keep `engineering complete`, `integrated`, `HUMAN accepted`, `audio accepted` and `editorially authoritative` as separate statuses.

## Current immediate work

At this checkpoint there is no open implementation PR. Safe next work should be selected from the **current reconciled #210 queue**, with these constraints:
- finish repo/orchestrator hygiene before creating more chat-only roadmap state;
- prefer bounded readiness/control-plane work that consumes the merged #227 contracts;
- #197 bundled voice remains a real dependency for audio-complete pre-reader/Stories production;
- broad Riddle/Stories scaling remains behind editorial/HUMAN gates;
- continue genuinely independent #51/#76 authority/content work only through their existing factories/queues;
- do not reopen core learning architecture, add another evaluator/progress store/audio runtime/story graph, or introduce a heavy game framework without a demonstrated failing use case and explicit #1 decision.
