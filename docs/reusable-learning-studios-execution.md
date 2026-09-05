# Reusable studios: sequential execution

GitHub #264 is the execution ledger, linked from #210. Work remains on PR #263. `main` is canonical; implementation, automated verification, merge and HUMAN approval are separate states.

## Initial consumer tranche: STUDIO-00–03

| Step | Change | Commit |
|---|---|---|
| 00 | Remove the fixed three-topic test ceiling while preserving original D0 promises and validating every declared topic depth | 40b5bba |
| 01 | Three/four-friend equal-area sharing; unchanged allocation model | 6103394 |
| 02 | Same half across four/six/eight parts; original four-part task reused | fddabcc |
| 03 | PEDAL/BRAKE/BELL/TYRE projected from the existing word-search source through the existing sequence evaluator | 6ebf8fc |

These made fourteen unique consumers. Word bindings carry references, not a second spelling/answer list. Membership checks still require semantic review. Printed targets remain visible, so copying letters is not credited as unaided spelling, pronunciation or word meaning.

## STUDIO-04: 24 bounded implementation / verification passes

The rows below identify work and its proof location. They do not assert HUMAN acceptance or replace exact-head CI evidence in #264.

| Pass | Concrete work | Proof / implementation |
|---|---|---|
| A | Strict fraction/permutation work admission | studioWorkspace; workspace matrix |
| B | Bind work to source revision, engine and exact configuration | studioWorkspace; stale-source tests |
| C | Persist work through a runtime-owned durable cache | studioWorkStore; fresh-service reload tests |
| D | Separate stable owner/activity scopes; no name/avatar identity | owner-isolation tests; explicit host ownerId |
| E | Reject sequential stale writers and stale resurrection | generation/token and tombstone tests |
| F | Preserve work on quota/corruption/cache bounds; visible failures | storage tests and browser failure injection |
| G | Reject answer-bearing/unknown placement fields | registry negative tests |
| H | Validate reachable bindings and real-consumer workspace shapes | fourteen actual-source roundtrips |
| I | Restore teaching mode, demonstration exposure and step | LearningStudio; browser reload journeys |
| J | Confirm destructive restart; preserve help and check history | reset/check guards and browser tests |
| K | Contained modal, host Back/Escape and focus restoration | StudioLauncher; actual browser navigation |
| L | Show a valid fraction construction visually, step by step | FractionDemonstration; screenshot artifact |
| M | Retain the child's design and give quantity/order diagnostics | LearningStudio; alternate-arrangement test |
| N | Prefer newer durable work over stale launcher memory | browser generation-conflict regression |
| O | Add eight dedicated small-screen recovery/input/failure journeys | e2e/learning-studios.spec.ts |
| P | Measure and explicitly bound durable/visual feature cost | bundle validator; unchanged core/data/single-chunk gates |
| Q | Include prompt, stimulus, language and knowledge context in compatibility | seven context/finite-data tests |
| R | Refuse non-finite or sparse configuration data | signature admission tests |
| S | Publish committed fraction edits and sequence swaps synchronously | committed-work presentation tests |
| T | Align unique non-colour markers and 48px word tiles | renderer/demo and browser target-size tests |
| U | Prove real Bicycle word workspace/demo/check restoration | e2e/studio-word-workspace.spec.ts |
| V | Exercise packaged native Back through the existing Android harness | studio Android proof hook |
| W | Force-stop/relaunch an offline APK and check restored design/demo step | separate studio PID/result file |
| X | Exercise rotation and preserve work on returning to portrait | studio landscape and restored-design screenshots |

### Commits

- `9ad9e40`: A–F, codec/storage and dependency-free checks.
- `02749b3`: G–H, authoring gates and actual-source admission.
- `737ec69`: I–M, durable UI lifecycle and visual teaching.
- `8f3e5a1`: N–P, stale-memory fix, browser journeys, measured budget accounting.
- `f1ad996`: Q–U, contextual identity, synchronous edits, markers and Bicycle word journey.
- `7cfc8c1`: V–X, packaged studio native-Back/process/rotation proof wiring.

## Proof hierarchy and current limitations

A script existing is not a passing device test. #264 records current-head workflow results and artifacts. Earlier `8f3e5a1` Windows/full and Browser runs passed; `f1ad996` Windows/full and Browser runs also passed. Do not promote these earlier runs to a later-head claim without observing that head.

The work store uses existing localStorage infrastructure and never writes progress/mastery. There is still one local child profile in the product. The API tests isolated stable owner IDs; there is no new multi-child UI. Compare-before-write is not atomic cross-tab CAS. Persisted work does not include transient selection/undo/preview state. Corrupt saved bytes are preserved, not automatically repaired.

Full engine boundaries, commands, cache bounds and explicit bundle allowances: `docs/reusable-learning-studios-v1.md`.

## Still gated before broader scaling

STUDIO-04 needs the recorded dedicated runtime/device results plus explicit editorial, visual, narration and real-child acceptance. Emulator proof and automated browser screenshots cannot supply those human decisions. The PR remains draft unless that status is deliberately changed after review.

Next, in ledger order: STUDIO-05 Earth day sequence; 06 Lion growth; 07 Fire-engine story; 08 count-based collections; 09 dependency-based sequences. Those are not implemented in this hardening tranche. Do not force every chapter segment into a game, broaden factual claims through a visual skin, fork evaluators or create another mastery/audio stack.
