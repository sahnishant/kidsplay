# Reusable matching studio — cross-topic review

Orchestrator: #272. Implementation PR: #273.

## Product boundary

`matching_studio` is a guided teaching surface over the existing `drag_to_target@1` interaction and `target_assignment` evaluator. It does not own another answer key, progress store, audio system, or chapter-specific evaluator.

A matching source is admitted only when it is reviewed, has 2–8 labelled items/targets, has a complete valid assignment map, and has distinct visible item and target labels. This deliberately excludes many-to-one grouping such as the existing plant-type recipe. That work belongs to a future explicit sorting/grouping mechanic rather than being misrepresented as one-to-one matching.

## Current cross-topic reuse

Fourteen reviewed generated questions are referenced across seven Learn About homes:

- Earth: Earth/sky ideas; planets.
- Lion / animal neighbours: animal homes; animals and young ones.
- Plants: plant parts/jobs; plant uses.
- Human Body: sense organs/jobs; body parts/jobs.
- Food: food sources; food habits/reasons.
- Homes & Clothes: home types/descriptions; clothes/weather.
- Healthy & Safe: daily habits; safety rules.

The Learn About homes are navigation/projection shells. They do not introduce new factual rows. The generated question source remains authoritative for the relationship and target assignment.

## Teaching and evidence boundary

- Explore may retain partial matches but does not evaluate them.
- Show Me reveals one source-backed pair at a time and never replaces the child's saved construction.
- Try It uses a `practice_only` clone of the source, so correct practice cannot refresh mastery or knowledge evidence.
- Work persistence is bound to activity ID, source question/revision, engine version, and the canonical task signature.
- Submitted-work accessibility describes the child's actual pair choices rather than reading out the expected answer.

## Small-screen proof

`e2e/matching-studios.spec.ts` exercises the Human Body / senses consumer at 360×640 with reduced motion and touch enabled. It creates a partial match using keyboard activation, enters Show Me, preserves the exact pair step through close/reload/reopen, returns to the child's matches, verifies no mastery/evidence storage change, and checks horizontal containment.

Automated browser proof is not real-child or physical-device approval.

## Explicit bundle review

The first post-typecheck MATCH-08 production build measured:

- total installed JavaScript: **876.8 KiB** against the previous 867 KiB cap;
- core JavaScript gzip: **167.2 KiB** against 167 KiB;
- `StudioLauncher` route: **11.4 KiB gzip / 5.6 KiB CSS** against 10.5 / 5.0 KiB.

The branch therefore records a bounded matching-family allowance rather than disabling bundle validation:

- total JS ceiling: **879 KiB**;
- core JS gzip ceiling: **168 KiB**;
- `StudioLauncher`: **12 KiB gzip / 6 KiB CSS**.

All other named-route, data, single-chunk, and Vite constraints remain enforced. Another studio family must receive another explicit review rather than silently consuming this allowance.

## Still not approved

- Human/editorial review of all cross-topic wording and placement.
- Reviewed child-facing illustrations for the matching cards/targets; text fallback is not being labelled final visual design.
- Physical Android-device and real-child acceptance.
- A generic sorting/grouping mechanic.

Keep PR #273 draft until the repository gates and the intended acceptance decision are recorded.