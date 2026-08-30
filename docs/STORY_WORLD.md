# Kidsplay story world

The story layer is a presentation/progression system above the reusable learning bank. It does not own canonical facts, answer keys, evaluator logic or learning mastery.

## Architecture contract

```text
story world / mission graph
→ story director + story-only progress
→ existing knowledge/question selectors
→ existing reusable questions and engines
→ existing evaluator / learning progress
→ story outcome / reward / unlock
```

Story content remains independently authored under:

```text
content/story/characters.json
content/story/locations.json
content/story/missions.json
```

## Cast

- **Dheu** is the persistent child hero. The saved child name/avatar is used when present; Dheu is the fallback identity.
- **Scientu** provides observations, hints and scientific framing.
- **Shaitanu** provides playful misconceptions/challenges. His framing may adapt to current mastery/difficulty, but never changes the correct answer or scoring contract.

The three core characters remain coherent Kidsplay presentation/IP. Generic objects, animals and world props may use admitted permissive open-source assets when that reduces production cost.

## Shipped world contract

- 9 data-driven world locations.
- 4 curated free missions bound to canonical rows and existing free questions.
- 5 additional locations launch short mastery-adaptive free expeditions.
- Persistent story unlocks depend on stable story mission completion rather than curriculum membership, payment state or mastery thresholds.
- Story completion and rewards persist separately from learning mastery.
- One-time mission rewards cannot be farmed by replay.
- Curated replays preserve declared canonical-row coverage while preferring weak/unseen rows where safe.
- Selective Scientu/Shaitanu micro-reactions are presentation-only and appear for meaningful moments such as a first miss, turnaround, genuinely hard clue or final clue rather than every routine answer.
- Reduced-motion disables story actor animation without removing meaning or task affordances.

## Mission rules

A mission declares learning goals/knowledge refs and a clue count. It must not embed answer logic.

At runtime the story director assembles a mission from the existing reusable bank. Mission validation proves that curated free missions can be assembled from shipped free questions with unique questions and full declared row coverage.

A mission may therefore survive curriculum/profile edits as long as its stable story contract and referenced canonical knowledge remain valid. Story unlock progression is intentionally independent of profile membership revisions.

## Current curated missions

- **The Puppy by the Pond** — River & Pond — 6 clues.
- **The Invisible Air Mystery** — Scientu's Lab — 5 clues covering 6 declared air rows.
- **The Rock Look-Alike Case** — Shaitanu's Hideout — 6 clues covering 7 declared rock rows.
- **The Night-Sky Mix-Up** — Observatory — 6 clues.

Do not hard-code elapsed-minute promises for missions; device, age and engine mix make exact durations unreliable.

## Access model

Foundational story exploration remains free. Future goal/paid missions may request structured goal-learning content, but a free unlock path must never depend on completing a non-free mission.

The validator enforces the current free unlock graph and one directly playable free curated mission per map location.

## Presentation and motion

Use existing reusable character states, semantic visuals, admitted OSS assets and lightweight CSS/SVG motion. Add poses/states only when a real scene needs them; do not pre-build large animation inventories or introduce a heavy game engine.

No important state may rely on motion alone. Reduced-motion users receive static, fully understandable surfaces.

## Acceptance boundary

The story-world mandate is operational when a clean app can:

1. show Dheu's world;
2. enter a curated or adaptive location;
3. assemble activities from the existing reusable question bank;
4. evaluate those activities through existing engines/evaluator;
5. persist ordinary learning attempts normally;
6. complete the story mission and award story-only progress once;
7. unlock the next story location through the story graph;
8. replay without farming rewards; and
9. restore this state after relaunch without creating a second learning/evaluation path.

This boundary is implemented and protected by the story, story-arc, story-progress, story-reaction and presentation test suites. Real-device usability acceptance remains tracked separately in GitHub issue #33.

## Guardrails

- Do not duplicate canonical facts in story files.
- Do not put correct-answer/scoring logic in story data.
- Do not couple world unlocks to mutable curriculum membership.
- Do not let Shaitanu adaptation alter answer truth.
- Do not make free world progression depend on paid missions.
- Do not add a heavy animation/game framework without a demonstrated failing use case.
- Treat real child/device observations as product-quality evidence distinct from automated correctness.
