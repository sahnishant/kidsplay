# Kidsplay gameplay roadmap

GitHub issue **#1** is the canonical high-level orchestrator. Issue **#174** owns child-product/game-feel laws. Issue **#210** is the operational **120-pass execution programme**.

This file is a repo-local orientation aid. If it conflicts with GitHub, GitHub wins. If #210's checkbox body temporarily lags a just-merged tranche, use its latest explicit execution-checkpoint comment and current `main` until the body is reconciled.

## Current baseline — 2026-09-04

- canonical integrated branch: `main`;
- current checkpoint: `9065690278d22bc03294de0993a1a957dc7188c2` (PR #231 merge);
- no open pull requests at this checkpoint;
- #204 Character Persona V1 is merged and #196 is closed;
- #227 shared gameplay-machine foundations are merged;
- #230 Riddle Time bounded R0/R2 machine tranche is merged;
- #231 Stories V1 manuscript/persistence hardening is merged;
- #197 bundled playful voice remains open/planned;
- G1 Trace & Discover engineering is integrated; its separate HUMAN first-production CX gate remains tracked in #192.

The recorded SHA is only a checkpoint. Always fetch current `main` before starting work.

## Child product model

`Continue Adventure` remains the visually dominant Home action. The child has four distinct intents:

1. **Adventure** — guided missions, persistent world progression and campaigns.
2. **Play** — free practice, manipulation, riddles, replay and creative/rest play.
3. **Learn About** — topic-first exploration and depth around subjects such as Earth, Moon, lions and fire stations.
4. **Stories** — calm listening/reading/imagination with authored manuscripts and no mandatory assessment.

### First Play is cross-cutting

First Play (#206) is not another Home tab or another truth bank. It lowers interaction/language/motor demand for appropriate canonical content across all four intents:

```text
touch/hear
-> listen/find
-> same-to-same / obvious relation
-> put/sort/build
-> concrete concepts
-> sound/letter exposure
```

A First Play path must not require reading to understand the task. Printed text may be exposure only. Exploration/hearing/animation is not mastery evidence.

## Current integration reality

The original dependency sequence remains useful for **product acceptance and scaling**, but machine foundations have intentionally landed ahead of some human/audio dependencies.

### Integrated machine foundations
- #173 honest first-attempt/retry evidence;
- #175 offline-safe audio runtime and Repeat;
- #196 persona renderer/reaction vocabulary;
- #227 shared First Play/replay/G2/Learn About/riddle/Stories/phonics contracts;
- #230 bounded Riddle R0/R2 candidate/evidence proof;
- #231 bounded Stories manuscripts + persistence hardening.

### Still-gated product work
- #197 approved bundled playful voice and measured narration;
- HUMAN/editorial acceptance before broad Riddle corpus scaling;
- HUMAN/editorial/audio acceptance before publishing/scaling Stories;
- actual Stories child-surface packaged process-kill/resume proof;
- deeper world and geography production slices.

Machine integration never grants HUMAN, editorial, curriculum, voice-quality or audio-duration authority by implication.

## Product dependency order

```text
First Play / visual-choice / reusable manipulation foundations
-> #197 bundled playful voice proof
-> Learn About production depth
-> Riddle production breadth
-> Stories published/audio-complete V1
-> G3 practical-life + G4 cause/effect
-> Forest L2/L3
-> Discovery Book + sound-first literacy
-> Town Square + Scientu Lab transfer
-> Across the World India proof
-> one international transfer proof
-> replay/creative rest
-> parent session controls
```

Issue #210 decomposes the programme into numbered passes. Before opening a branch, reconcile unchecked rows with the latest #210 execution checkpoint and merged repository state.

## Core product laws

- Play first, assessment second.
- The child should do things to the world rather than merely answer cards.
- A committed tap/drag/manipulation should react immediately; do not add a redundant `Check Answer` step.
- Preschool visual-selection activities should let semantic visuals dominate the viewport.
- Dheu, Scientu and Shaitanu are recurring characters, not fixed right/wrong speaker roles.
- Progress should repair/change/reveal/unlock meaningful world state rather than produce a grind currency.
- Same canonical knowledge should generate many experiences; do not duplicate fact/question truth for each mode.
- #173 first-attempt/retry/mastery evidence remains authoritative.
- Structured assessment answer safety is non-negotiable.
- Exploration, story exposure, hearing and animation do not create mastery merely by occurring.
- Random distractors are not a difficulty system; use controlled semantic contrasts.
- First Play starts with one-step intent, large forgiving targets and usually one or two meaningful choices.
- Wrong young-child actions should recover in place; avoid punishment-heavy failure modals/lives.
- Runtime cloud/LLM generation is not required for published child facts, riddles or stories.
- Age/profile is a routing hint, not proof of developmental ability or mastery.
- Prefer lightweight 2D/SVG/semantic composition over a heavy 3D/game runtime unless a demonstrated pedagogical need justifies it.
- Reduced-motion/static rendering must preserve meaning.

## Ownership matrix

| Authority / surface | Canonical owner | Typical ownership | Must not be duplicated by |
| --- | --- | --- | --- |
| High-level activation | #1 | active/parallel branch decision | chat-only roadmaps |
| Child-product laws | #174 | UX/game-feel invariants | per-feature product laws that conflict |
| Pass execution queue | #210 | numbered machine/HUMAN checkpoints | alternate hidden execution plans |
| Interactive mission/world graph | #8 | Story World mission progression | #205 Stories, #207 topics, #209 routes |
| Retry/scaffold/mastery evidence | #173 | first-attempt and recovery evidence | First Play/riddle/story-local score stores |
| Audio playback/runtime | #175 | speech/Repeat/cancel/fallback | #197 or Stories second players |
| Bundled voice/audio production | #197 | approved assets/manifests/measurement | component-local speech files |
| Reviewed child vocabulary/meaning | #51 | child wording/meaning authority | Stories/topic metadata self-approval |
| Semantic senses/relationships/visual meaning | #76/#84/#114 | semantic truth/presentation | per-mode visual/fact banks |
| Reusable manipulation families | #192 | mechanics/evaluator contracts | per-level bespoke engines |
| Core character persona vocabulary/renderer | #196 | Dheu/Scientu/Shaitanu presentation | per-story/per-topic renderer forks |
| First Play demand tier | #206 | pre-reader presentation demand | toddler-only truth/evaluator/progress store |
| Visual selection / odd-one-out recipes | #203 | choice presentation/semantic rules | new choice evaluator |
| Learn About projection | #207 | topic-first choreography | encyclopedia/fact database |
| Riddle/clue content/projection | #208 | clue records/reuse | separate answer engine |
| Calm story library/read state | #205 | manuscripts + reading navigation state | mission graph/mastery runtime |
| Discovery collection projection | #200 | deterministic discoveries | coins/XP/fact bank |
| Across the World routes/destinations | #209 | route/destination campaign projection | geography engine/vehicle simulator |

## File ownership guidance

These are **coordination boundaries**, not hard package ownership declarations:

- `src/App.svelte`, `src/ui/**`, child-shell CSS — overlapping product surface; one activated branch at a time unless #1 explicitly splits ownership.
- story mission/world runtime/data — #8 authority.
- `src/runtime/childAudio*` — #175 runtime; #197 may add approved asset lookup/production without replacing it.
- persona registry/renderer/reaction code — #196 foundation; downstream consumers reuse it.
- `src/mechanics/**` / reusable engine contracts — #192 family ownership when adding manipulation behavior.
- semantic presenters/registries — #76/#84/#114 authority.
- topic projection — #207; riddle/clue projection — #208; story manuscript/read-state — #205.
- `README.md`, `docs/WORK_TARGETS.md`, this file — repo-local mirrors of #1/#174/#210, never a competing control plane.

When a change spans multiple authority rows, reconcile ownership on #1 before creating overlapping branches.

## Branch activation and retirement

1. `main` is the only canonical integrated baseline.
2. Always inspect open PRs and surviving branches before creating a new implementation branch.
3. A planning issue is not branch permission.
4. #1 activates overlapping child-product work; #174 supplies laws; #210 supplies the pass queue.
5. Prefer one active branch where file ownership overlaps the child shell, session/story presentation, persona or audio runtime.
6. Explicitly disjoint docs/control-plane/validation/authority-content work may run in parallel.
7. If an issue names an existing branch to continue, reuse it rather than forking another branch.
8. Do not rebase or absorb unrelated work into a branch under HUMAN review merely for convenience.
9. Reuse merged contracts; do not create duplicate subsystems plus compatibility wrappers.
10. Every final PR records base SHA, exact final head, relevant permanent gates and remaining HUMAN/editorial/audio boundaries.
11. After merge, the feature branch is retired. Delete stale refs when tooling/permissions permit; issue/PR history remains the durable record.
12. Keep `engineering complete`, `integrated`, `HUMAN accepted`, `audio accepted` and `editorially authoritative` distinct.

## Current product-family checkpoints

### #208 Riddle Time
Machine proof now exists for R0 and R2 plus first-attempt evidence, semantic uniqueness and cross-surface reuse. It is **not a published reviewed riddle corpus**: current machine-authored wording remains draft, and broader R1/R3/R4/R5/editorial/CX work remains.

### #205 Stories
Machine proof now includes two real bedtime-length manuscripts, Shaitanu/Scientu/Dheu coverage, lexical measurement reuse and durable local reading state. Manuscripts remain `draft`; `PUBLISHED_STORIES_V1` remains empty. Measured narration and child-surface audio/process-kill proof remain #197/later integration work.

### #197 bundled voice
Still a real dependency. Device-local/offline speech and generic packaged Android smoke do not substitute for an approved bundled preschool voice pack or measured story narration.

### #198 world depth
Forest L2/L3 first, then Town and Lab. Target level shape:

```text
problem
-> character beat
-> varied actions
-> honest retry/scaffold
-> world consequence
-> ending/unlock
-> persistent changed world
```

### #200 Discovery Book
A deterministic view of canonical discoveries/world events. No separate currency or fact truth.

### #199 literacy
`hear -> discriminate -> sound/object/word -> grapheme -> recognition -> spelling/reading`. Phoneme/grapheme mappings require explicit validated data.

### #209 Across the World
Adventure campaign, not a transport game. Preserve the existing near world; prove India first, then one international transfer. Transport remains a short reusable bridge.

## Permanent acceptance law

A child-facing family may be engineered while another human gate is pending, but it must not broadly scale until its first production use has:

1. focused contract/unit tests;
2. representative 360x640 Browser/Playwright child journey;
3. Windows/full check;
4. relevant semantic/vocabulary/content gates;
5. packaged Android offline first launch/relaunch/rotation;
6. unchanged bundle budget unless explicitly justified;
7. accessibility + sound-off where relevant + reduced-motion/static meaning;
8. explicit HUMAN visual/CX review of the exact production behavior.

Additional family-specific fail-closed laws live in #1/#174/#210.

## Selecting the next work

At this checkpoint there is no open PR. Use this sequence:

1. fetch current `main`;
2. inspect open PRs/branches for ownership collisions;
3. read #1, #174 and #210's latest checkpoint comments;
4. choose the next compatible machine-executable pass;
5. keep HUMAN/editorial/audio gates explicit rather than blocking unrelated engineering or fabricating acceptance.

Do not reopen merged machine tranches simply because older issue-body checkboxes have not yet been reconciled.
