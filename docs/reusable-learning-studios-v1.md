# Reusable learning studios V1

Branch: `feat/reusable-learning-studios-v1`; PR #263; sequential execution ledger #264 (parent #210). This describes implementation, not HUMAN publication approval. Current commit/check evidence belongs in the ledger.

## Reusable mechanics and consumers

`equal_parts@1` uses the pure `src/mechanics/equalParts.mjs` model in the renderer, central evaluator and authoring validator. It accepts every allocation satisfying the rational quantities, not an item-to-position answer map. V1 supports one declared whole, 2–12 already-equal indivisible areas, circle/bar/grid representations and 2–4 categories. Positive representable goals must fill one whole.

`sequence_order@1` retains its existing evaluator. Its studio admits 2–8 uniquely identified stages and one complete source order. The Bicycle word adapter derives tiles/order from an existing word-search source; it does not introduce another spelling dictionary.

Fourteen unique consumers are placed by reference:

| Location | Activities |
|---|---|
| Fractions → Equal shares (D1+) | Original four-part half activity |
| Fractions → Share with friends (D2+) | Three friends/six areas; four friends/eight areas |
| Fractions → Half, different pieces (D2+) | Original four-part activity reused; half with six; half with eight |
| Fractions → Make and share (D2+) | Dosa; garden |
| Lion → Animal homes & families (D2+) | Existing butterfly stages, explicitly animal-neighbour content |
| Bicycle Workshop → Move | Existing motion and braking sequences |
| Bicycle Workshop → Words | Source-derived PEDAL, BRAKE, BELL, TYRE |

The four-part half activity is not counted twice. New supported consumers require question/configuration and placement, not an engine fork. Reading, explanation, discussion, practical work and chapter checks remain first-class.

## Teaching and evidence

Explore does not evaluate. Show me advances only on explicit child input. Fraction demonstrations use the same quantity model to illustrate one valid allocation, while preserving the child's separate design. Unique A/B/C/D markers agree between demonstration, palette and manipulative; colour is not the only category cue. Sequence examples use the source order.

Try it is supported practice. It uses the central evaluator, keeps work visible, offers bounded quantity/order feedback and requires an explicit Change my answer before another submission. `practice_only` prevents mastery/knowledge evidence. Local check counts and demonstration history are work-session metadata, not learning scores. Restoring or opening a studio does not create a response submission. Clearing a design does not erase help/check history.

Printed word targets remain visible: word reconstruction is not unaided spelling, phonics, pronunciation or denotation assessment. Source claims remain context and are not credited for copying letters.

## Engine / runtime boundary

Renderers receive a validated question and initial state, publish committed edits synchronously, and submit responses through host callbacks. They own no localStorage keys, navigation, audio player or mastery store. The studio owns teaching choreography. The runtime owns durable work storage through the same browser/local WebView storage mechanism already used by the app.

`src/experience/studioWorkspace.mjs` admits V2 work envelopes. Identity includes activity, question/revision, engine/version and an exact canonical descriptor of interaction, solution and task context (prompt, language, stimulus, concepts and knowledge refs). A forgotten revision bump cannot silently reinterpret old work. Payloads admit only a full valid sequence permutation or a correctly sized fraction assignment array; incomplete fraction work is allowed. Sparse/foreign/extra fields are refused. The shape gate does not assess correctness.

The envelope preserves work, teaching mode, demonstration exposure, explicit check count, checked state and demonstration step. Restore clones state. Old V1 in-memory envelopes were never a durable format and are refused. Incompatible durable work remains untouched until explicit Start over confirmation.

`src/runtime/studioWorkStore.mjs` stores one work record per stable owner/activity under `kidsplay.studioWork.v1:`. It never writes the mastery/progress namespace. The cache is bounded to 64 records across owners and approximately 48 KB UTF-16 storage per record; reaching a bound is visible and never silently evicts unfinished work. Save denial/quota/corruption preserve prior bytes and expose an on-screen notice. Sequential stale writes fail closed against the saved generation. Identical writes are idempotent. A newer durable generation takes precedence over stale launcher memory.

The current product still has **one local child profile**. The host accepts explicit stable owner IDs for isolation; `local-child` is the current single-profile default. Names and avatars are not identities. Service-level owner isolation does not constitute a shipped multi-profile switcher.

### Exact durability limits

After route destruction or app restart, reopening the same activity restores compatible saved work and teaching state. The app need not reopen that route automatically. Transient selection, undo stacks and an open Explore preview are not durable. Corrupt bytes are retained; no automatic corruption-repair or archive UI is claimed. Compare-before-write protects sequential stale writers, **not atomic simultaneous multi-tab transactions**. None of these records prove mastery.

## Authoring boundaries

The registry permits only named source/placement references and declared metadata. Unknown fields, answer-bearing placements, duplicate IDs, sparse/unresolved refs, invalid depth and unplaced activities are rejected. A valid reference is not proof of semantic entailment: factual tasks still require supporting facts/processes, story tasks remain story-scoped, and mathematical goals remain mathematical constraints.

There is no support here for freehand partitioning, collections, number lines, general fraction arithmetic, equal-part-construction assessment, cyclic sequences or dependency-based ordering. Do not imitate those capabilities through misleading skins or exact-position keys.

## Validation and proof artifacts

- `node scripts/test-equal-parts.mjs`: original bounded exhaustive model matrix.
- `node scripts/test-studio-reuse.mjs`: 402,011 complete/partial assignments against independent count requirements.
- `node scripts/test-studio-workspace.mjs`: 57 admission/storage checks.
- `tests/studio-context-signature.behavior.test.ts`: seven additional context/finite-data guards.
- `tests/studio-admission.behavior.test.ts`: real-consumer roundtrips and reference-only authoring guards.
- `tests/studio-committed-work.presentation.test.ts`: synchronous edit/swap callbacks and non-colour markers.
- Existing actual-source word tests: all 288 labelled permutations, including interchangeable L tiles.
- `npm run check`: normal content/type/build/bundle/full-unit path, unchanged.
- `e2e/learning-studios.spec.ts`: eight 360×640 touch/keyboard/reduced-motion browser journeys for work recovery, context mismatch, save failures, reset, quantities and warm offline reopening.
- `e2e/studio-word-workspace.spec.ts`: real Bicycle word work, manual demo-step restoration, visible-target practice, 48px tiles and no progress writes.
- `qa/android-studios-offline-smoke.sh`: sourced after the existing Stories proof in its installed APK/offline emulator. It exercises real navigation, native Back, force-stop/new PID, restored work/demo step, rotation back to portrait and continued airplane mode. Syntax/wiring alone is not proof that this journey passed.

Browser screenshots are uploaded as `learning-studio-browser-proof`. Android diagnostics remain in `kidsplay-stories-airplane-mode-proof`, with a separate `studio-process-relaunch.txt` and `studio-*.png` when that journey completes. Inspect exact-head workflow results in #264 before claiming acceptance.

## Explicit performance allowances

Initial #263 work changed installed JS 784→816 KiB, core gzip 162→166 KiB and Learn About CSS 2→3 KiB. STUDIO-04 adds a separately documented installed-code allowance of 16 KiB (total 832), and bounds the expanded StudioLauncher at 10 KiB gzip / 4 KiB CSS (previously 6/3). Measured at 737ec69 before that allowance: total 826.8 KiB, studio 9.2 KiB gzip / 3.7 KiB CSS. Core remains capped at 166 KiB; the already-lazy word projection is measured separately at a 1.5 KiB gzip cap. Renderer, single-chunk, Vite-warning and data caps remain enforced.

## Release gate

All new fraction and projected-word records remain draft. Final narration/art, editorial review and real-child usability must be accepted explicitly. A browser reload is not Android process recovery; emulator proof is not physical-device or child acceptance. The wider topic/model queue remains gated by #264 STUDIO-04. No supplied textbook artwork is imported or republished.
