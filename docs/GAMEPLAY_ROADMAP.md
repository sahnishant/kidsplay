# Kidsplay gameplay roadmap

GitHub issue **#1** is the canonical high-level orchestrator. Issue **#174** owns the child-product/game-feel mandate. Issue **#210** is the operational **120-pass execution checklist**.

This document is a repo-local orientation aid. If it conflicts with those GitHub issues, GitHub wins.

## Current baseline

As of 2026-09-04:

- canonical integrated branch: `main`;
- current integrated checkpoint: `12599cd7a5ef773130c5b1a0ccc21416097eea9c` (PR #193 merge);
- Forest Explorer Level 1 / Phase F is integrated and HUMAN-approved (#185);
- G1 Trace & Discover engineering is integrated/certified; first-production HUMAN CX acceptance remains separately tracked in #192;
- active overlapping child-character/session-presentation vertical: #196 / PR #204 on `feat/character-persona-system-v1`;
- exact PR #204 engineering head at this checkpoint: `19d414216dc8b305b389aa2de14a3f649190fdde` with Windows, Browser/Playwright and packaged/offline Android green.

Human review is an acceptance gate, not a reason to leave unrelated engineering idle. Disjoint docs/control-plane/content/readiness work may proceed while a human gate is open. Competing branches must not own the same child shell/story/session-presentation/audio/runtime files unless #1 explicitly reassigns ownership.

## Child product model

`Continue Adventure` remains the visually dominant Home action. The child has four secondary intents/modes:

1. **Adventure** — guided missions, persistent world progression and campaigns.
2. **Play** — free practice, manipulation, riddles, replay and creative/rest play.
3. **Learn About** — topic-first exploration and depth around subjects such as Earth, Moon, lions and fire stations.
4. **Stories** — calm listening/reading/imagination with authored manuscripts and no mandatory assessment.

### First Play is cross-cutting

First Play (#206) is not another Home tab or another content bank. It lowers interaction/language/motor demand for appropriate canonical content across Adventure, Play, Learn About and Stories:

```text
touch/hear
-> listen/find
-> same-to-same / obvious relation
-> put/sort/build
-> concrete concepts
-> sound/letter exposure
```

A First Play path must not require reading to understand the task. Printed text may be exposure only. Exploration/hearing/animation is not mastery evidence.

## Canonical activation sequence

The durable order is:

```text
current HUMAN gates + #196/#204 Character Persona V1
-> #206 bounded First Play sampler
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

Issue #210 decomposes this into 120 numbered passes. Agents should take the next compatible unchecked pass from #210 rather than inventing a different order from chat history.

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
- Random distractors are not a difficulty system. Use controlled semantic contrasts.
- First Play starts with one-step intent, large forgiving targets and usually one or two meaningful choices.
- Wrong young-child actions should recover in place; avoid punishment-heavy failure modals/lives.
- Runtime cloud/LLM generation is not required for published child facts, riddles or stories.
- Age/profile is a routing hint, not proof of developmental ability or mastery.
- Prefer lightweight 2D/SVG/semantic composition over a heavy 3D/game runtime unless a demonstrated pedagogical need justifies it.
- Reduced motion/static rendering must preserve meaning.

## Ownership matrix

| Authority / surface | Canonical owner | Must not be duplicated by |
| --- | --- | --- |
| Interactive mission/world graph | #8 | #205 Stories, #207 Learn About, #209 destinations |
| Retry/scaffold/mastery evidence | #173 | First Play, riddles, Stories, topic state |
| Audio playback/runtime | #175 | #197 voice production, Stories narration |
| Bundled voice/audio production | #197 | component-local audio players/file paths |
| Reviewed child vocabulary/meaning | #51 | Stories manuscripts, Learn About topic metadata |
| Semantic senses/relationships/visual meaning | #76/#84/#114 | per-mode visual/fact banks |
| Reusable manipulation families | #192 | per-level bespoke engines |
| Core character persona vocabulary/renderer | #196 | per-story/per-topic character forks |
| First Play demand tier | #206 | toddler-only truth/evaluator/progress store |
| Visual selection / odd-one-out recipes | #203 | new choice evaluator |
| Learn About topic projection | #207 | encyclopedia/fact database |
| Riddle/clue recipe/content | #208 | separate answer engine |
| Calm story library/manuscripts/read state | #205 | second mission graph/mastery runtime |
| Discovery collection projection | #200 | coins/XP/fact bank |
| Across the World routes/destinations | #209 | geography game engine/vehicle simulator |

## Branch ownership rules

1. `main` is the only canonical integrated baseline.
2. A planning issue is not permission to create a branch.
3. #1 activates or explicitly permits overlapping child-product work.
4. Prefer one branch at a time when work touches the same child shell, Story World/session presentation, persona renderer or audio runtime.
5. Disjoint docs, control-plane, validation and independent content-authority lanes may run in parallel when their file ownership is explicit.
6. Never rebase an active human-review branch merely to absorb unrelated roadmap work.
7. A later phase should consume earlier contracts rather than creating compatibility wrappers around a duplicate subsystem.
8. Close/delete/supersede stale implementation branches after their work is integrated; keep GitHub issue/PR history as the durable record.
9. Record exact base SHA, final head SHA, permanent checks and human gate separately.
10. Keep `engineering complete`, `integrated`, `HUMAN accepted` and `editorially authoritative` as separate statuses.

## Product-family boundaries

### #206 First Play
Bounded proof: touch/discover, two-choice listen/find, matching/placing, forgiving drag/snap, cause/effect, one concrete semantic contrast, optional validated sound/letter exposure and character micro-reactions. Representative path works at 360x640 with no reading and no grown-up instruction after entry.

### #203 Visual Scene Choice / Which Doesn't Belong?
Reuse `single_choice@1`. Odd-one-out must declare one intended comparison dimension and exactly one defensible odd item. Visible positions shuffle. Distractors are semantically meaningful.

### #192 G2/G3/G4
G2: place/assemble/repair/connect. G3: bounded practical-life actions such as pack/place/sort/help/clean/feed/water/safety. G4: bounded semantic cause/effect and state change. No freeform physics engine rewrite.

### #197 bundled voice
Stable semantic/prompt/character utterance IDs consumed by #175. Core prompts and character identity must work offline. Contract must also support segmented narrative utterances for Stories without adding a second player.

### #207 Learn About
One generic topic contract projects canonical knowledge through Explore / Did You Know / Guess / Compare / Try It / existing quiz recipes. First proof: Earth, Lion and Fire Station. Topic navigation/read state must not inflate mastery.

### #208 Riddle Time
Reusable clue contract across Play, Learn About and occasional Adventure beats. R0/R1 supports zero-reading visual answers; later wordplay carries explicit language metadata. Semantic clue sets must uniquely identify the intended answer within the declared candidate universe.

### #205 Stories
Authored/reviewed manuscripts + lexical/readability report + character/semantic scene beats + #175/#197 narration. No mandatory mid-story assessment, score, streak or mastery promotion. Story state is resume/completed/favourite/replay only.

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
A deterministic view of canonical discoveries and world events: discovered animals/plants/words/places, field notes, postcards and similar meaningful collection rewards. No separate currency/fact truth.

### #199 literacy
Hear -> discriminate -> connect sound to object/word -> grapheme -> recognition -> spelling/reading. Phoneme/grapheme mappings are explicit authored/validated data, not naive spelling inference.

### #209 Across the World
Adventure campaign, not a transport game. Preserve the existing near world. First bounded India proof: Delhi, Agra, carefully reviewed Ayodhya city scope and at least one nature/community stop. Transport is a short reusable journey bridge. Only after India acceptance should one international destination prove the contracts transfer before broad catalogue production.

## Permanent acceptance law

A new child-facing family may be engineered while other human work is pending, but it must not broadly scale until the first production use has:

1. focused contract/unit tests;
2. representative 360x640 Browser/Playwright child journey;
3. Windows/full check;
4. relevant semantic/vocabulary/content gates;
5. packaged Android offline first launch/relaunch/rotation;
6. unchanged bundle budget unless explicitly justified;
7. accessibility + sound-off where relevant + reduced-motion/static meaning;
8. explicit HUMAN visual/CX review of the exact production behavior.

Additional family-specific fail-closed laws live in #1/#174/#210.

## Current next work

While #196/PR #204 is in human review, use #210 for compatible disjoint work. The initial repo-orchestration tranche is passes 015–020. After that, bounded readiness audits can prepare First Play, `SingleChoice` visual-choice reuse, audio IDs, topic/riddle/story contracts and Across-the-World route/destination contracts without creating competing child-session presentation implementations.
