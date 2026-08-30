# Assessment blueprints

## Purpose

Assessment format is data, not question-engine logic.

Kidsplay keeps four concerns separate:

1. **Canonical knowledge** — stable facts/relationships identified by `rowId`.
2. **Learning profile** — which rows fit a country/grade/curriculum/competition target and at what editorial fit.
3. **Assessment blueprint** — section names, question counts, marks and selectors for a particular assessment format/year.
4. **Delivery engines** — reusable interactions such as single choice, matching, sequence, word search, crossword and maze.

A new assessment format should normally add or revise blueprint/profile data before it changes an engine.

## Current blueprint

`content/assessment-blueprints/SOF_INDIA_CLASS2_2026-27.json` models the reviewed 2026–27 Class 2 SOF ISO sample-paper format:

- 5 Logical Reasoning questions × 1 mark;
- 25 Science questions × 1 mark;
- 5 Achievers questions × 2 marks;
- 35 questions and 40 marks in total.

The blueprint cites the reviewed official assessment source through `sourceRefs`. It describes **format**, not official ownership of Kidsplay-authored questions and not row-level curriculum verification.

## Contract

Each blueprint declares:

- `id`, `profileRef`, `academicYear` and status;
- reviewed `sourceRefs`;
- child-facing title/description/action label;
- `totalQuestions` and `totalMarks`;
- ordered sections with `count`, `marksPerQuestion` and a reusable selector.

Current selectors are intentionally small:

- `logical_reasoning` — questions whose traced rows are logical-reasoning rows;
- `science_core` — profile-safe science/EVS questions excluding editorial HOTS;
- `achiever_hots` — traced Kidsplay editorial HOTS questions.

Do not add a selector merely to mirror one authored question. Add one when a repeated assessment requirement needs a stable rule.

## Validation

`npm run validate:blueprints` rejects a blueprint when:

- its profile is unknown;
- its year conflicts with the profile/source year;
- it lacks a reviewed official assessment source;
- section IDs are duplicated;
- a selector is unsupported;
- counts or mark weights are invalid;
- section counts do not equal `totalQuestions`;
- weighted section marks do not equal `totalMarks`.

The validator is part of normal `npm run check` through `validate:content`.

## Product rule

Kidsplay may reproduce a reviewed **pattern** using original questions. UI copy must not imply that a Kidsplay practice mock is an official SOF paper, score or certification.

For the current Class 2 goal, ordinary profile knowledge remains available in Free Explore. The paid/goal value is the structured assessment pattern, adaptation, diagnostics, readiness and preparation workflow.

## Adding another assessment

Prefer this sequence:

1. Register and review the authoritative source.
2. Create or reuse the learning profile/membership collection.
3. Add a blueprint for the assessment year/format.
4. Reuse existing selectors and engines where they fit.
5. Add a selector/engine only when real authored content proves the existing abstraction insufficient.
6. Add behavior tests for section composition and delivery.

This keeps source data, profile targeting, assessment format and runtime engines independently extensible.
