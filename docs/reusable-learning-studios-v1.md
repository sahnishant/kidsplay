# Reusable learning studios V1 — bounded implementation

Branch: `feat/reusable-learning-studios-v1`.

## Included

One new registered mechanic, `equal_parts@1`, with solution type `fraction_allocation`. The pure shared model in `src/mechanics/equalParts.mjs` is used by the renderer, canonical evaluator and content validator. It accepts any allocation satisfying the rational quantities, not an authored item-to-position key.

The existing `sequence_order@1` gains optional host-owned state and non-evaluative exploration. It keeps its existing ordering evaluator. A common studio offers Explore, Show me and Try it; sequence demonstrations advance only when the child presses Next.

Six activity bindings, with no copied narrative answer keys:

| Location | Activity | Source |
| --- | --- | --- |
| Learn About → Fractions → Equal shares (D1+) | Make equal shares | new bounded mathematics task |
| Learn About → Fractions → Make and share (D2+) | Dosa designer | new bounded mathematics task |
| Learn About → Fractions → Make and share (D2+) | Plan a flower garden | new bounded mathematics task |
| Learn About → Lion → Animal homes & families (D2+) | How a butterfly changes | existing compiled butterfly lifecycle question; explicitly an animal-neighbour activity, not a lion life cycle |
| Bicycle Workshop → Move | Follow the bicycle movement | existing curriculum question |
| Bicycle Workshop → Move | Follow the slowing sequence | existing curriculum question |

The fraction examples exercise grid, circle and bar representations. The shared activity registry owns references and navigation only. Add another supported activity by authoring its question/configuration and adding a registry/placement reference—not changing engine code.

## Explicit boundaries

- V1 covers one whole, 2–12 already-equal indivisible areas and 2–4 categories. Positive rational goals must conserve the whole and be representable with the supplied partition.
- No arbitrary freehand partitioning, fractions of collections, number-line tasks, general fraction operations or proof of constructing equal parts.
- Correctness is computed by the existing central evaluator. `evidencePolicy: practice_only` suppresses mastery and knowledge evidence for studio practice. Exploration bypasses checking altogether. Source questions are cloned, never mutated.
- No new progress database, no external service and no component-local audio player.
- Engines expose initial state and state-change callbacks. Workspace envelopes bind activity ID, question ID/revision and engine version. A launcher keeps work while closing and reopening an activity within that mounted section.
- Workspace durability across route destruction, process kill or app relaunch is **not implemented in this tranche**. There is no claim of offline relaunch certification.
- Existing explanations, reading and chapter checks remain in place. Studio completion does not mark the chapter mastered.

## Validation

Run `node scripts/test-equal-parts.mjs` for the dependency-free exhaustive model test. It covers 82,001 complete/partial assignments, including 6 valid equal-share arrangements, 280 dosa arrangements and 140 garden arrangements. Additional assertions cover impossible configurations, malformed responses, representation changes, geometry bounds and cloned restore state.

Run the normal `npm run compile:content`, `npm run typecheck`, `npm run test:run` and `npm run build` in the full repository. Added Vitest suites cover canonical evaluation/evidence, source and topic bindings, workspace identity, manipulation, undo, explicit submission and non-evaluative host routing.

## Still requires acceptance

This is a review implementation, not a claim of complete production acceptance. New fraction activity records remain draft. The three studio modes are teaching/practice only; no independent-assessment journey is approved here. Final narration/art, real-child usability, 360×640 runtime review, Android offline/process-relaunch proof and durable workspace integration remain separate gates. The supplied source chapter artwork is not imported or republished.
