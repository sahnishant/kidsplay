# Agent A engineering audit — First Play + visual choice

Branch: `feat/first-play-visual-choice-production`

PR: #247

Roadmap ownership: #206 First Play, #203 Visual Scene Choice / Which Doesn't Belong?, #210 Wave C 021–035 + Wave D 036–045.

This is an engineering closure audit. It does **not** replace the separate 2–3-year-old human acceptance gate in `FIRST_PLAY_VISUAL_CHOICE_HUMAN_REVIEW.md`.

## Production surface

The branch adds two bounded launches inside the existing **Play** surface:

- **First Play** — nine picture/audio/direct-manipulation activities;
- **Picture Play** — six visual scene choices followed by six explicit odd-one-out sets.

Neither launch becomes a new Home pillar. Both use existing child navigation/back handling and local assets.

The First Play sampler is:

1. Touch & Discover — Dog;
2. Touch & Discover — Bell;
3. Listen & Find — Dog / Cow;
4. Listen & Find — Earth / Sun;
5. Place / Match — Dog;
6. Place / Match — Apple;
7. Concrete contrast — Full / Empty;
8. Letter → picture exposure — A → Apple;
9. Cause / Effect — Empty → Full.

The A → Apple activity is deliberately **letter-name-to-word-initial exposure**, not an inferred phoneme claim. Explicit phonics truth/mastery remains outside this branch and under #199.

## Wave C — First Play 021–035

| Pass | Requirement | Engineering evidence |
| --- | --- | --- |
| 021 | Audit reading-required child entry | `FirstPlayViewport.svelte` requires no reading after launch: option labels are hidden in First Play, instructions are audio-repeatable, and meaning is carried by pictures/direct manipulation. `FIRST_PLAY_VISUAL_CHOICE_HUMAN_REVIEW.md` keeps the real-child no-coaching gate pending. |
| 022 | Audit normal target sizes against 44 px floor | Existing global choice controls are 54 px minimum. First Play raises controls further: Back/Sound 56 px, Repeat 58 px, two-choice visual targets ~300 px tall, discover/cause targets 300 px, state targets 280 px, oversized drag item/targets use the hardened DragToTarget mode. E2E measures representative targets at 360×640. |
| 023 | Versioned interaction-demand contract | Existing `firstPlayPolicy.ts` is the versioned source of truth for FP0–FP5 demand, reading, instruction count, choice count, target scale, retry, submit, Repeat and failure-modal policy. Production proofs are validated against it in `firstPlayProductionValidation.ts`. |
| 024 | Evidence classes | `firstPlayPolicy.ts` defines `exploration`, `guided_practice`, `evaluative`. `FIRST_PLAY_PROOFS` assigns an explicit class to every production First Play activity. |
| 025 | FP0 must not create mastery | Touch & Discover is exploration-only and never calls the evaluator/progress writer. Unit tests lock the classification. |
| 026 | FP1 uses existing evaluator | Listen & Find uses `single_choice@1` and the canonical `evaluate()` path. `evaluateFirstPlayQuestion()` then applies the existing guided-practice evidence policy, stripping mastery/knowledge evidence. |
| 027 | Shuffle visible correct positions | First Play single-choice questions use `shuffleOptions: true`; the shared SingleChoice engine performs the shuffle. |
| 028 | Repeat reachable without reading | Repeat is a large `↻ 🔊` control with accessible name `Repeat`; 360×640 E2E exercises it. |
| 029 | Wrong action recovers in place | Wrong guided responses set `retry_in_place`, show Scientu's existing persona reaction, and remount the same interaction after a short bounded reaction. E2E explicitly verifies no dialog/failure page. |
| 030 | Forgiving drag/snap | Existing `resolveForgivingDropTarget` is reused. First Play passes a bounded 40 px tolerance and also retains select-then-place accessibility. E2E releases Dog 18 px outside the target and verifies success. |
| 031 | Cause/effect interaction | Empty bucket → Full bucket is a direct state change, not a quiz. Authoring proof validates it through the existing world-action contract. |
| 032 | Concrete contrast | Full / Empty is rendered as two static semantic bucket states. Meaning survives reduced motion. |
| 033 | Canonical concept reused at older depth | Earth Listen & Find references `kr.universe.earth.type.planet`; unit test proves the same row is consumed by the existing Earth Learn About topic. No toddler-only duplicate truth is created. |
| 034 | Persona micro-reactions, no bespoke scripts | Event grammar resolves Dheu/Scientu/Shaitanu reactions from the merged persona signature vocabulary in `storyPersona.ts`; tests verify each reaction begins with a registered signature. |
| 035 | 360×640 no-reading child journey | `e2e/first-play-visual-choice.spec.ts` runs the complete nine-activity sampler at 360×640, including audio-off fallback, wrong retry, near-miss drag, static contrast, A→Apple and cause/effect. |

## Wave D — visual choice 036–045

| Pass | Requirement | Engineering evidence |
| --- | --- | --- |
| 036 | Audit existing SingleChoice | No new evaluator/answer engine was created. Production continues through `single_choice@1` + `exact_option`. |
| 037 | Generic visual-dominant presentation hint | `contracts/question.ts` adds optional presentation-only `visual_dominant` metadata. Correctness/evaluator contracts are unchanged. |
| 038 | First Play two-choice viewport | First Play visual choice uses exactly two options, hidden visual labels, and substantially oversized two-column targets. |
| 039 | Preschool 3–4 choice viewport | Picture Play uses the same SingleChoice component with 3–4 large picture choices and secondary labels. |
| 040 | Controlled semantic distractors | `VISUAL_REASONING_PROOFS` declares one comparison dimension and canonical evidence for every scene-choice candidate. `validateSemanticChoicePlan()` rejects malformed plans. |
| 041 | Explicit comparison dimension for odd-one-out | Every odd-one-out proof declares a stable `comparisonDimensionRef`. |
| 042 | Reject ambiguous odd sets | `resolveOddOneOutPlan()` must resolve exactly one `satisfiesRule: false` candidate; validator additionally requires the runtime answer to match that declared outlier. Human defensibility review remains a separate gate. |
| 043 | Shuffle odd/correct positions | All Picture Play questions use shared option shuffling. Unit tests run 96 deterministic seeds and require more than one visible correct position for every production activity. |
| 044 | Production breadth ≥4 semantic families | Six scene-choice + six odd-one-out activities cover animals, transport, communication, human senses, plants, food sources and animal features. Unit tests require at least four families. |
| 045 | Focused browser proof | The second 360×640 Playwright journey proves 3-choice and 4-choice visual modes, safe wrong retry, odd-one-out flow, reduced-motion operation and no horizontal overflow. |

## Runtime / evidence boundary

The child runtime in `firstPlayProduction.ts` contains only what the child surface needs: visual items, existing question contracts, direct state records and the guided-practice evaluator wrapper.

Authoring-only semantic evidence, policy stage/evidence assignments, world-action proof, odd-one-out dimensions and deterministic position validation live in `firstPlayProductionValidation.ts`. This keeps semantic safeguards explicit while avoiding shipping review metadata to the child bundle.

First Play exploration and guided practice do not call `recordAttempt()` and do not introduce a progress store, currency or mastery model. Picture Play uses the canonical evaluator for feedback and likewise introduces no alternate evidence system.

## Visual / offline boundary

Every production option with an explicit `visualRefs` entry is checked against the bundled visual registry in `first-play-production.behavior.test.ts`. The sampler has no remote visual dependency.

Audio follows the already-existing child audio path and exposes a child-accessible audio-off fallback. Bundled-voice production itself remains Agent B ownership.

## Required automated gates before engineering closure

The exact PR head must have all of these green:

- **Windows Check** — full `npm run check`;
- **Browser Smoke** — production build + Playwright, including the two Agent A journeys;
- **Android Debug APK** — validation/build, Capacitor Android packaging, debug APK, packaged offline relaunch/rotation smoke.

Bundle budgets are not to be loosened for this branch.

## Human gate remains separate

Engineering completion does not mean the product has passed real-child acceptance. The branch must continue to report the following until the documented physical-device/child review is actually performed:

- `HUMAN FIRST PLAY ACCEPTANCE: PENDING`
- `HUMAN VISUAL-CHOICE ACCEPTANCE: PENDING`
