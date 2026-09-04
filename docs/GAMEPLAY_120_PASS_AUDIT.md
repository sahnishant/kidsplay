# Kidsplay — 120-pass gameplay execution audit

Canonical high-level orchestrator: GitHub #1. Product laws: #174. Operational pass queue: #210.

This file records a **pass-by-pass readiness review**, not a claim that every feature is implemented. Status vocabulary is intentionally explicit:

- **DONE** — already integrated/orchestrated and does not need rebuilding;
- **IMPLEMENTED-OPEN** — concrete change exists on an open PR and still needs its normal gates/integration;
- **AUDITED-GAP** — repository was inspected and a concrete next gap was identified;
- **CONTRACT-READY** — bounded generic contract/control-plane work can proceed without product-surface overlap;
- **QUEUED** — implementation remains behind the canonical activation/prerequisite order;
- **HUMAN-GATE** — engineering may be complete, but explicit human acceptance is separately required.

_Last reviewed: 2026-09-04 against `main` `12599cd7a5ef773130c5b1a0ccc21416097eea9c`._

## Wave A — orchestration / product truth

| Pass | Status | Review outcome / next action |
| ---: | --- | --- |
| 001 | DONE | Adventure / Play / Learn About / Stories reconciled as four distinct child intents in #1/#174/#210. |
| 002 | DONE | `Continue Adventure` remains the dominant Home action. |
| 003 | DONE | #206 First Play is cross-cutting, not another Home tab/content bank. |
| 004 | DONE | #207 Learn About inserted into the canonical sequence. |
| 005 | DONE | #208 Riddle Time positioned after the reusable Learn About `Guess!` concept. |
| 006 | DONE | #209 Across the World moved behind local-world depth/transfer proof. |
| 007 | DONE | #8 retained as the only interactive Story World / mission graph. |
| 008 | DONE | #173 retained as the only first-attempt/retry/mastery evidence authority. |
| 009 | DONE | #175 remains the audio runtime; #197 is voice/audio production only. |
| 010 | DONE | Human acceptance may overlap disjoint work but cannot be inferred from CI/engineering. |

## Wave B — repo/orchestrator hygiene

| Pass | Status | Review outcome / next action |
| ---: | --- | --- |
| 011 | DONE | `main` recorded as canonical integrated baseline. |
| 012 | DONE | #196/PR #204 recorded as active overlapping child-character/session-presentation vertical. |
| 013 | DONE | Branch inventory audited before opening new work; docs/touch work is disjoint from #204. |
| 014 | DONE | `docs/WORK_TARGETS.md` found materially stale versus current GitHub truth. |
| 015 | IMPLEMENTED-OPEN | `docs/WORK_TARGETS.md` refreshed on PR #211. |
| 016 | IMPLEMENTED-OPEN | `docs/GAMEPLAY_ROADMAP.md` added on PR #211. |
| 017 | IMPLEMENTED-OPEN | README durable-state pointers updated on PR #211. |
| 018 | IMPLEMENTED-OPEN | Ownership matrix added to gameplay roadmap. |
| 019 | IMPLEMENTED-OPEN | Branch activation/retirement/status rules added to gameplay roadmap. |
| 020 | IMPLEMENTED-OPEN | Docs/orchestration PR #211 opened from exact current `main`; docs only, 0 behind at creation. |

## Wave C — First Play / pre-reader #206

| Pass | Status | Review outcome / next action |
| ---: | --- | --- |
| 021 | AUDITED-GAP | Current product still contains engines/forms whose successful use depends on reading/letter knowledge. First Play must be a routed presentation tier, not a global replacement of Crossword/WordSearch/etc. Next audit should classify eligible child entry points/recipes, not ban literacy engines. |
| 022 | IMPLEMENTED-OPEN | Target-size audit found 42px defaults in `.home-button` and `.sequence-order__move`; regression issue #213 + PR #212 restore a 44px floor and add wide-viewport E2E coverage. First Play primary targets will still need a larger-than-floor policy. |
| 023 | CONTRACT-READY | No current versioned `interactionDemand`/First-Play presentation contract exists. Add one without creating a toddler content bank/evaluator. |
| 024 | CONTRACT-READY | #173 has mastery/retry semantics, but First Play still needs an explicit recipe evidence classification: `exploration` / `guided_practice` / `evaluative`; only the last may emit normal correctness evidence. |
| 025 | QUEUED | FP0 Touch & Discover must prove zero mastery writes. |
| 026 | QUEUED | FP1 should reuse existing single-choice evaluation for two-picture Listen & Find. |
| 027 | QUEUED | Choice order must be visibly shuffled; existing `SingleChoice` already has deterministic shuffling and can be reused. |
| 028 | QUEUED | Repeat must remain reachable without reading; #175 supplies the runtime. |
| 029 | QUEUED | Wrong First Play action must recover in-place without `FAILED`/blocking modal. |
| 030 | QUEUED | FP2/FP3 needs generous drag/snap tolerance; motor precision must not become the challenge. |
| 031 | QUEUED | Add one canonical cause/effect state-change proof. |
| 032 | QUEUED | Add one concrete semantic contrast proof such as big/small or full/empty. |
| 033 | QUEUED | Same canonical concept must also appear in an older-child recipe. |
| 034 | QUEUED | Character micro-reactions should consume #196 rather than per-question scripts. |
| 035 | QUEUED | Add a 360×640 no-reading First Play Playwright journey. |

## Wave D — Visual Scene Choice / Which Doesn't Belong? #203

| Pass | Status | Review outcome / next action |
| ---: | --- | --- |
| 036 | DONE | `SingleChoice.svelte` audit confirms semantic visuals, deterministic option shuffle and immediate one-tap submit already exist. No new answer evaluator is justified. |
| 037 | CONTRACT-READY | Need a presentation hint/recipe that changes layout only; correctness/evaluator must remain unchanged. |
| 038 | QUEUED | Add a true two-choice First Play layout using most of 360×640. |
| 039 | QUEUED | Add bounded 3–4 choice visual-dominant layout for later preschool/primary use. |
| 040 | CONTRACT-READY | Distractor construction needs an explicit semantic-control contract; random available pictures are forbidden. |
| 041 | CONTRACT-READY | Odd-one-out data must declare one intended comparison dimension. |
| 042 | CONTRACT-READY | Validator must require exactly one rule-failing candidate / uniquely defensible odd item. |
| 043 | QUEUED | Visible odd-one-out positions must shuffle; reuse existing stable shuffle utilities. |
| 044 | QUEUED | Production proof should span at least four semantic families. |
| 045 | QUEUED | Add Browser/Playwright proof for visual choice + odd-one-out. |

## Wave E — G2 build / assemble #192

| Pass | Status | Review outcome / next action |
| ---: | --- | --- |
| 046 | CONTRACT-READY | Smallest useful G2 primitive is place-part-in-slot; avoid freeform physics. |
| 047 | CONTRACT-READY | Contract must distinguish unordered assembly when order has no semantic meaning. |
| 048 | CONTRACT-READY | Ordered assembly is allowed only when canonical process/sequence meaning requires it. |
| 049 | CONTRACT-READY | Repair/restore should be a reusable state transition, not level-owned answer code. |
| 050 | CONTRACT-READY | Connect-compatible-parts can share the same bounded placement/compatibility contract. |
| 051 | QUEUED | Committed manipulation should auto-submit; no extra Check Answer. |
| 052 | QUEUED | Reset/retry must preserve #173 first-attempt evidence. |
| 053 | QUEUED | Prove 3+ usages across 2+ semantic domains. |
| 054 | QUEUED | Prove one Story/Forest use and one Play/Free-Explore use. |
| 055 | QUEUED | 360×640, accessibility, reduced-motion/static meaning and offline Android proof remain required. |

## Wave F — bundled playful voice #197

| Pass | Status | Review outcome / next action |
| ---: | --- | --- |
| 056 | AUDITED-GAP | `childAudio.ts` has prompt/character/vocabulary/phoneme channels and correct offline fallback behavior, but callers still supply text + optional `/audio/...` path. There is **no stable utterance-ID manifest** yet. |
| 057 | CONTRACT-READY | Add one versioned utterance/asset manifest consumed by #175; do not create another player. |
| 058 | DONE | Existing canonical knowledge is not required to store speech file paths; preserve this boundary. |
| 059 | DONE | Runtime already prefers bundled audio then explicit offline/local voice then silent/accessibility fallback; manifest work should preserve this. |
| 060 | QUEUED | Stable ID lookup must retain current Repeat/cancel/generation semantics. |
| 061 | QUEUED | Produce a reviewed bundled Dheu signature proof. |
| 062 | QUEUED | Produce a reviewed bundled Scientu signature proof. |
| 063 | QUEUED | Produce a reviewed bundled Shaitanu signature proof. |
| 064 | CONTRACT-READY | Manifest must support segmented story/beat utterance IDs; no second long-form player. |
| 065 | QUEUED | Bundle accounting + airplane-mode relaunch proof required before scaling audio. |

## Wave G — Learn About #207

| Pass | Status | Review outcome / next action |
| ---: | --- | --- |
| 066 | CONTRACT-READY | No topic runtime exists yet; first work is one generic topic contract containing refs/order/presentation metadata only, never copied fact truth/answer keys. |
| 067 | CONTRACT-READY | Topic contract should carry ordered knowledge-spine refs/sections, not a bag of trivia. |
| 068 | CONTRACT-READY | D0/D1/D2/D3+ must be explicit depth/presentation bands over the same canonical knowledge. |
| 069 | CONTRACT-READY | Bounded archetypes can guide section recipes without owning truth: animal, celestial/system, community place, nature/system, body/system, how-it-works. |
| 070 | QUEUED | Explore/Look & Touch is non-evaluative and writes no mastery. |
| 071 | QUEUED | Did You Know must expose canonical reviewed/admitted facts only and write no mastery. |
| 072 | CONTRACT-READY | `Guess!` should be a reusable clue record resolving to existing single-choice/matching evaluation. |
| 073 | QUEUED | Compare/Try It should consume #76/#84/#192 relationships/actions where supported. |
| 074 | CONTRACT-READY | Topic-open/read/reveal persistence must be explicitly separate from mastery. |
| 075 | QUEUED | Earth first generic topic proof. |
| 076 | QUEUED | Lion second generic topic proof through the same contract. |
| 077 | QUEUED | Fire Station third generic topic proof through the same contract. |
| 078 | QUEUED | 360×640 topic journey must feel like subject exploration rather than a quiz folder. |

## Wave H — Riddle Time #208

| Pass | Status | Review outcome / next action |
| ---: | --- | --- |
| 079 | CONTRACT-READY | Riddle Time should extend/reuse the same clue contract introduced for #207 `Guess!`; no parallel riddle evaluator. |
| 080 | CONTRACT-READY | R0–R5 bands are reasoning/language demand, not merely text length. |
| 081 | QUEUED | R0 production proof: one short spoken clue + one/two huge visual answers, no reading. |
| 082 | CONTRACT-READY | Progressive clue contract should expose `another clue` without treating help as failure. |
| 083 | QUEUED | If evaluative, first guess remains #173 evidence even after more clues. |
| 084 | CONTRACT-READY | Semantic clue validation must establish one intended answer in the declared candidate universe. |
| 085 | QUEUED | Add R2 semantic-inference production examples. |
| 086 | CONTRACT-READY | Classic riddles need explicit authored/reviewed provenance fields rather than scraped corpus assumptions. |
| 087 | CONTRACT-READY | Wordplay requires explicit language/locale/reading-demand metadata. |
| 088 | QUEUED | Same riddle record must render in Play, Learn About and occasional Adventure use without a new evaluator. |

## Wave I — Stories V1 #205

| Pass | Status | Review outcome / next action |
| ---: | --- | --- |
| 089 | CONTRACT-READY | Story metadata/manuscript/beat contract must be independent of #8 mission graph and must not carry evaluator/mastery fields. |
| 090 | CONTRACT-READY | Lexical/readability reporting can consume existing corpus signals conservatively; no board/profile authority inference. |
| 091 | CONTRACT-READY | Story exposure must have an explicit no-correctness/no-mastery policy invariant. |
| 092 | CONTRACT-READY | Tappable word must map to an exact reviewed story sense before meaning expansion. |
| 093 | CONTRACT-READY | Missing exact sense falls back to pronunciation-only/no expansion. |
| 094 | QUEUED | Story scenes should consume #196 persona + existing semantic composition rather than fork renderers. |
| 095 | CONTRACT-READY | Narration metadata should reference #197 stable utterance IDs and #175 playback only. |
| 096 | CONTRACT-READY | Story persistence is resume/completed/favourite/replay only; separate from mastery/world-reward farming. |
| 097 | QUEUED | Author/review at least two calm bedtime stories. |
| 098 | QUEUED | Bounded pack also needs funny Shaitanu, Scientu curiosity and Dheu/friends coverage. |
| 099 | QUEUED | Prove at least two lexical bands and two measured narration-duration bands. |
| 100 | QUEUED | Offline process-kill/resume + zero-mid-story-assessment Browser/Android proof. |

## Wave J — G3/G4, world depth, Discovery and phonics

| Pass | Status | Review outcome / next action |
| ---: | --- | --- |
| 101 | CONTRACT-READY | Practical-life actions should be a bounded reusable action vocabulary over canonical truth, not scene scripts. |
| 102 | CONTRACT-READY | Cause/effect/state-change actions should reuse #76 process relationships and bounded state transitions. |
| 103 | QUEUED | Forest L2 begins only after the interaction vocabulary is production-accepted enough to avoid a quiz-sequence regression. |
| 104 | QUEUED | Forest L2 must leave one persistent progress-derived visible consequence. |
| 105 | QUEUED | Forest L3 repeats the coherent problem/action/consequence structure with additional depth. |
| 106 | CONTRACT-READY | Discovery Book is a deterministic projection from canonical world/progress events; no fact/currency store. |
| 107 | QUEUED | First proof: animal/nature discovery + semantic/vocabulary discovery + field note, with no replay farming. |
| 108 | CONTRACT-READY | Phoneme/grapheme mapping must be explicit authored/validated data; runtime spelling inference is forbidden. |
| 109 | QUEUED | Production proof: hear -> discriminate -> object/word -> grapheme across 3–5 sounds. |
| 110 | QUEUED | Trace is a later sound-to-letter reinforcement, not the literacy foundation. |
| 111 | QUEUED | Transfer deep-world recipe to Town Square only after Forest depth proof. |
| 112 | QUEUED | Transfer same recipe to Scientu Lab; no Lab-only runtime. |

## Wave K — Across the World #209

| Pass | Status | Review outcome / next action |
| ---: | --- | --- |
| 113 | DONE | Product contract explicitly preserves the existing nine Story World locations as the familiar/local starting world; #209 extends rather than replaces them. |
| 114 | CONTRACT-READY | Need a generic geographic hierarchy + route graph independent of visual screen coordinates. |
| 115 | CONTRACT-READY | Need generic destination records containing canonical refs/archetype/routes/depth/recipe/discovery metadata, not fact/evaluator truth. |
| 116 | CONTRACT-READY | Transport contract is a short route bridge declaring admissible modes/actions; no driving-simulator subsystem. |
| 117 | QUEUED | First India production slice: Delhi / Agra / carefully reviewed Ayodhya city scope + at least one nature/community stop. |
| 118 | QUEUED | India proof needs 3+ interaction/recipe families and one zero-reading First Play route beat. |
| 119 | CONTRACT-READY | Route/destination completion should emit normal progress/discovery hooks, not coins or a second collection store. |
| 120 | HUMAN-GATE | Only after India HUMAN/content acceptance should one international destination prove the same contracts before broad scaling. |

## Review conclusion

All **120 passes have now been individually reviewed and classified**. This is not 120 implementation-complete claims. The next work should consume `IMPLEMENTED-OPEN`, `AUDITED-GAP` and `CONTRACT-READY` rows first, while respecting #1's active-file ownership.

Immediate machine-executable opportunities that do not require human input:

1. land/review #211 and #212 through their normal permanent gates;
2. add the First Play demand/evidence contract (023–024) without touching active #204 surfaces;
3. add semantic visual-choice/odd-one-out validation contracts (040–042);
4. add the stable audio utterance manifest contract (057/064) while preserving #175;
5. add generic Learn About + shared Guess/riddle contracts (066–069/072/079–084);
6. add Stories metadata/persistence-policy contracts (089–096) without UI/manuscripts yet;
7. add route/destination/transport data contracts (114–116/119) without activating the world campaign UI.
