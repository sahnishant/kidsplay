# Reusable studios: sequential execution

Execution ledger: GitHub #264, linked from #210. Implementation stays on PR #263. `main` remains canonical; do not mark draft-branch work integrated or HUMAN approved.

## Implemented slices

- STUDIO-00: repair the catalogue test that assumed only the first three Learn About topics could exist. Keep baseline D0 promises and validate all topics at their declared depths.
- STUDIO-01: `Share with friends` inside Fractions at D2+: six equal areas shared among three friends; eight shared among four. Existing equal_parts@1 is unchanged.
- STUDIO-02: `Half, different pieces` inside Fractions at D2+: reuse the existing four-part activity by ID; add six/eight-part versions of the same 1/2 target. These are separate rounds, not freehand partitioning or a simultaneous two-whole comparison engine.
- STUDIO-03: `Build PEDAL/BRAKE/BELL/TYRE` inside Bicycle Workshop → Words. A bounded lazy content projection derives letter tiles and order from the existing word-search terms. It uses sequence_order@1 and the central evaluator, including interchangeable repeated letters. No second spelling dictionary or hand-authored answer list.

## Word projection boundary

The binding contains the source question ID and term/concept/knowledge references only. Referenced concepts and claims must belong to that source. Content review must additionally verify their semantic alignment; membership checks are not an entailment proof. V1 admits explicit uppercase A–Z words of 2–8 letters, one uniquely referenced required term, and a valid source revision. Unsupported sources fail closed.

The printed target remains visible: these are reconstruction-from-a-model teaching activities, not phonics, pronunciation or unaided spelling assessments. Generated activities remain draft and practice_only, even when the source question has an earlier review. Source records are never mutated. Question identity includes projection version and term; source revision is retained for workspace mismatch checks.

## Verification

Run `node scripts/test-studio-reuse.mjs` for 402,011 complete/partial allocations checked against independent count requirements (90 / 2,520 / 20 / 70 accepted arrangements). The production model is shared, not copied into tests. The original dependency-free model test remains `node scripts/test-equal-parts.mjs`.

Run normal `npm run check`. Tests in `studio-reuse.behavior.test.ts` cover actual catalogue loading, depth placement, source immutability, central evaluation and reuse of the original half task. Tests in `studio-word-reuse.behavior.test.ts` load the actual Bicycle source, test all 288 labelled tile permutations, check the repeated-L case, reject malformed projections and preserve workspace revision boundaries.

Observe current-head GitHub checks before reporting a pass. Historical and current run totals must not be conflated. No JS/CSS or original pilot-data cap is raised by this execution tranche. The new fraction reuse JSON chunk has its own 6 KiB raw / 2 KiB gzip ceiling.

## Still open / stop before wider scaling

STUDIO-04 owns dedicated studio 360×640 acceptance, sound-off/reduced-motion/input parity, child-scoped durable workspace via existing persistence and packaged Android offline/relaunch proof. Real-child/editorial/audio/visual acceptance stays explicit. Existing generic Browser/Android checks passing is not proof of these new studio-specific cases.

After the acceptance gate: reviewed Earth day sequencing, Lion growth and Fire Station story reconstruction. Later: collections and dependency-based sequencing as separately bounded model extensions. Do not force all chapter segments into games, duplicate knowledge/answer banks, create a new progress/audio stack, or infer mastery from studio exploration/practice.
