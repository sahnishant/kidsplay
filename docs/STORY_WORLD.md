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

## Data layout

```text
content/story/characters.json
content/story/locations.json
content/story/missions.json
```

`characters.json` defines stable story identities and pedagogical roles. `locations.json` defines the navigable world and topic affinities. `missions.json` defines short authored narrative wrappers around reusable learning goals.

The runtime story director is responsible for resolving mission knowledge refs to current runnable questions. If a mission cannot obtain enough suitable current questions, it must fail closed rather than inventing content or silently changing its learning goals.

## Story scales

### Micro-story

A short reaction around a suitable individual question: setup → decision → character reaction. Use only where the story does not leak the answer.

### Mission

A 5–10 minute problem containing several interactions and potentially several engines. Missions request learning goals and question count; the director selects from the current reusable bank.

### World arc

Long-lived progression across weeks/months. World unlocks and story beats are independent of a specific curriculum version so the bank can evolve without invalidating the narrative.

## Initial world

- Home & Garden — family, food, habits, plants and nearby animals.
- Farm — domestic animals, food sources and plants.
- Forest — wild animals, habitats and conservation.
- River & Pond — water, aquatic life and water safety.
- Road & School — transport, communication, safety and reasoning.
- Scientu's Lab — experiments, body, air/water and deeper reasoning.
- Observatory — Earth, Moon, Sun and space.
- Shaitanu's Hideout — puzzles, misconceptions and revision challenges.
- Town Square — family, community, festivals and mixed exploration.

Locations are narrative navigation, not hard curriculum partitions. A mission may mix learning goals from several topic groups when the story naturally supports them.

## First vertical slice

**The Puppy by the Pond** proves the architecture end to end.

Opening idea: Shaitanu suggests that because some animals live in water, the puppy should jump into the pond. Scientu asks Dheu to investigate rather than simply accepting the claim. The mission uses current reusable knowledge about dogs, puppies, animal homes/classification and water places, then returns to a success beat.

Acceptance boundary:

1. Story world appears on app home.
2. Mission starts from story data.
3. Mission resolves 4–6 current questions through existing engines.
4. Normal attempts update normal mastery/progress.
5. Mission completion is persisted separately as story progress.
6. The child returns to the world and sees the mission completed/rewarded.

## Character/art policy

Dheu, Scientu and Shaitanu should form coherent Kidsplay-owned character IP. Build them from reusable SVG/CSS parts and states rather than dozens of bespoke full-frame illustrations.

Useful state/motion vocabulary includes `idle`, `happy`, `thinking`, `worried`, `celebrate`, `point`, `bounce`, `shake`, `blink`, `walk` and `float`. Reduced-motion behavior remains mandatory.

Generic entities (animals, food, vehicles, objects, weather) may use exact-provenance permissive open-source assets when that materially lowers production cost. Runtime should consume only selected/admitted assets, not giant external packs.

## Commercial boundary

The story world must not become a disguised paywall around ordinary foundational facts. Broad exploration and foundational missions remain free. Paid value remains structured Olympiad goals, diagnostics, adaptation, mocks and advanced preparation workflows built from the same underlying canonical knowledge.

## Stable project memory

- Canonical product tracker: issue #1.
- Story-world tracker: issue #8.
- Overall checkpoint: `docs/WORK_TARGETS.md`.
- This contract: `docs/STORY_WORLD.md`.

Future story work should update issue #8 and this document when the contract changes materially so chat context is never required to recover the intended architecture.
