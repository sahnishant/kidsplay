# Kidsplay Story World — Dheu, Scientu and Shaitanu

This document is the durable contract for the child-facing story layer. GitHub issue #8 is the live implementation tracker. The story layer sits above the existing knowledge/question/engine architecture; it does not replace it.

## Product role

The normal child-facing home experience is a small persistent world rather than a syllabus dashboard. The saved child name is the hero name when present; `Dheu` is the story fallback. Dheu explores places, receives missions, solves learning interactions through the existing engines, and changes the world through progress.

Recurring characters:

- **Dheu** — the child hero and decision maker.
- **Scientu** — the curious scientific guide: observes, asks why, explains and hints.
- **Shaitanu** — the playful misconception/challenge character: proposes funny or plausible wrong ideas and becomes more subtle as challenge rises.

## Architecture boundary

```text
story world / mission graph
→ story director (mission goals + player state)
→ existing canonical knowledge/question selector
→ existing reusable question bank + engines
→ existing evaluator
→ existing mastery/progress persistence
→ separate story/world progress
```

Hard rules:

1. Story data never contains answer keys or evaluator rules.
2. Missions select **learning goals/knowledge refs**, not a new parallel question bank.
3. Existing question contracts, engine registry and evaluator remain authoritative.
4. Story completion may award world/story rewards, but normal learning attempts remain the only source of mastery evidence.
5. Structured mocks remain assessment experiences and do not receive pre-answer story hints.
6. Story content can change without changing canonical facts; canonical facts can be refreshed without rewriting the world arc.
7. Story-map unlocks depend only on stable story mission IDs/completions, never curriculum membership, mastery thresholds or payment state.
8. Locking a story-map place does not paywall its foundational knowledge; the ordinary free-learning catalog remains available independently.

## Data layout

```text
content/story/characters.json
content/story/locations.json
content/story/missions.json
```

`characters.json` defines stable story identities and pedagogical roles. `locations.json` defines the navigable world, topic affinities and story-only unlock rules. `missions.json` defines short authored narrative wrappers around reusable learning goals.

The runtime story director is responsible for resolving mission knowledge refs to current runnable questions. If a mission cannot obtain enough suitable current questions, it must fail closed rather than inventing content or silently changing its learning goals.

The story validator additionally proves that the free-map unlock graph is reachable from `start` locations. A location may unlock after a directly playable free mission; cyclic/unreachable paths and unlock dependencies on goal/paid missions fail validation.

## Story scales

### Micro-story

A short reaction around a suitable individual question: setup → decision → character reaction. Use only where the story does not leak the answer. This remains optional rather than wrapping every question in repetitive dialogue.

### Mission

A multi-question problem containing several interactions and potentially several engines. Missions request learning goals and question count; the director selects from the current reusable bank. The current missions use 5–6 clues and may cover more canonical rows than clue cards when one question legitimately combines several facts.

### World arc

Long-lived progression across weeks/months. World unlocks and story beats are independent of a specific curriculum version so the bank can evolve without invalidating the narrative.

Current free-map arc:

```text
START
├─ Home & Garden
├─ Farm
├─ Forest
├─ Road & School
└─ River & Pond → Puppy by the Pond
                   ↓
             Scientu's Lab → Invisible Air Mystery
                   ↓
          Shaitanu's Hideout → Rock Look-Alike Case
                   ↓
               Observatory → Night-Sky Mix-Up
                   ↓
               Town Square
```

The five `start` places remain immediately explorable. Completing each curated story mission reveals the next narrative location. The unlock state is derived from separate story progress, so curriculum/profile revisions do not erase or reinterpret the world arc.

## Adaptive Shaitanu framing

Shaitanu's presentation challenge is separate from question scoring. Before a curated mission, the UI combines:

- current topic-progress status for the mission location; and
- the actual average difficulty of the mission's current reusable question set.

It selects one of three presentation bands:

- **Warm-up tease** — one plausible misconception and a clear evidence cue.
- **Tricky twist** — mixes a true clue with a tempting guess.
- **Clever trap** — asks the child to separate or combine several clues carefully.

This only changes story framing/motion. It never changes answer keys, evaluation, mastery rules or mock behavior. Curated mission question selection separately remains mastery-aware while preserving complete declared row coverage.

## Initial world

- Home & Garden — family, food, habits, plants and nearby animals.
- Farm — domestic animals, food sources and plants.
- Forest — wild animals, habitats and conservation.
- River & Pond — water, aquatic life and water safety.
- Road & School — transport, communication, safety and reasoning.
- Scientu's Lab — experiments, body, air/water and deeper reasoning.
- Observatory — Earth, Moon, Sun and space.
- Shaitanu's Hideout — puzzles, rocks, misconceptions and revision challenges.
- Town Square — family, community, festivals and mixed exploration.

Locations are narrative navigation, not hard curriculum partitions. A mission may mix learning goals from several topic groups when the story naturally supports them.

## Curated missions

- **The Puppy by the Pond** — 6 clues.
- **The Invisible Air Mystery** — 5 clues covering 6 declared air rows.
- **The Rock Look-Alike Case** — 6 clues covering 7 declared rock/mineral rows.
- **The Night-Sky Mix-Up** — 6 clues.

All four resolve through the current free question bank and existing engines. Director-level tests require the declared clue count, unique question IDs and full declared canonical-row coverage. Replays accept existing mastery and prefer weak/unseen rows without losing mission coverage.

## Character/art policy

Dheu, Scientu and Shaitanu should form coherent Kidsplay-owned character IP. Build them from reusable SVG/CSS parts and states rather than dozens of bespoke full-frame illustrations.

Current shared story vocabulary includes moods `happy`, `thinking`, `mischievous`, `celebrate`, `worried`, `ready` and motions `idle`, `think`, `bounce`, `wiggle`, `float`. Add `point`, `walk`, `shake` or other states only when a concrete scene needs them. Reduced-motion behavior remains mandatory.

Generic entities (animals, food, vehicles, objects, weather) may use exact-provenance permissive open-source assets when that materially lowers production cost. Runtime should consume only selected/admitted assets, not giant external packs.

## Commercial boundary

The story world must not become a disguised paywall around ordinary foundational facts. Broad exploration and foundational missions remain free. Paid value remains structured Olympiad goals, diagnostics, adaptation, mocks and advanced preparation workflows built from the same underlying canonical knowledge.

## Stable project memory

- Canonical product tracker: issue #1.
- Story-world tracker: issue #8.
- Overall checkpoint: `docs/WORK_TARGETS.md`.
- This contract: `docs/STORY_WORLD.md`.

Future story work should update issue #8 and this document when the contract changes materially so chat context is never required to recover the intended architecture.
