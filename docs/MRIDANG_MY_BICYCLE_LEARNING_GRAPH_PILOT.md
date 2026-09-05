# Mridang Class II English - My Bicycle Learning Graph pilot

Issue: #256. Parent architecture: #254.

## Purpose

This pilot turns one seven-page curriculum chapter into a bounded, source-traceable Learning Graph module without copying the textbook into Kidsplay. It proves the separation between shared knowledge, chapter-local context, English capabilities, semantic media and assessment evidence.

## Source boundary

- Source: NCERT, *Mridang*, Class II English, Unit 1, Chapter 1, 2026-27 reprint.
- Chapter PDF SHA-256: `ed3d9b6b69d1dc74462eb9b7a95cd29f5ef90ba04b496c33d08e1b743bcc3785`.
- Chapter PDF size: `1306355` bytes.
- The book prelims state that the source is all rights reserved.
- The PDF, page images, textbook artwork, full poem, copied exercises and verbatim narration are not committed or runtime-bundled.
- All runtime publication remains disabled until separate rights and human editorial review exist.

## Chapter decomposition

The source was decomposed into semantic blocks rather than copied pages:

| PDF page | Module block | Graph treatment |
| --- | --- | --- |
| 1-2 | Poem context | Chapter-local speaker, bicycle instance and explicitly scoped details |
| 2 | Vocabulary candidates | Sense-specific lexical candidates; `handle` requires mapping review and ambiguous `track` remains blocked |
| 3 | Oral description and mobility examples | Capabilities plus shared bicycle/tricycle/wheelchair nodes |
| 3 | Bell listening | Auditory capability and neutral sound-set media contract |
| 4 | Short-a and a/an examples | Curriculum-conventional language targets, not a complete universal grammar rule |
| 5 | Bicycle-part labelling | Shared part claims plus instructional and assessment-safe diagram bindings |
| 6 | Creative extension | Non-evaluative drawing/speaking target |
| 7 | Comprehension | English retrieval/verification targets over chapter-local claims |

## Authority separation

### Shared canonical candidates

Reusable independently worded candidates include bicycle classification, typical or optional bicycle parts, pedal-to-movement relation, bell sound, helmet protection and selected lexical senses. They are marked `editorial_candidate` and are not publishable merely because they appear in the source.

### Chapter-local context

The poem speaker, the bicycle instance and its source-specific attributes are marked `chapter_contextual` and scoped to the exact chapter module. They cannot be reused as universal facts.

### Curriculum-conventional language targets

The short-a and a/an examples are retained as chapter targets with an explicit warning that the chapter observation is not the full English article rule. Runtime audio remains ineligible until pronunciation review and the active phonics authority admit it.

## Evidence model

Each activity target distinguishes:

- primary English capability;
- target canonical claim, when the fact itself is being tested;
- supporting knowledge;
- chapter-local context;
- evaluative, guided-practice or non-evaluative mode.

Supporting knowledge and chapter context never receive mastery by default. Reading a poem, hearing a sound, watching an animation, describing an object or drawing an imagined bicycle cannot silently create correctness evidence.

## Media model

The pilot defines semantic media contracts only. No source or replacement asset is embedded.

- unlabelled bicycle entity: neutral assessment stimulus;
- labelled parts diagram: instructional and answer-revealing;
- unlabelled part-focus diagram: assessment-safe;
- pedal-to-movement transition: instructional/answer-revealing with static and reduced-motion equivalents;
- bell sound set: neutral offline assessment stimulus requiring original or licensed recordings;
- creative canvas: non-evaluative.

Knowledge records contain no asset path, media URL, coordinates, CSS or one-off animation ID.

## Validation

Run:

```bash
node scripts/learning-graph/validate-curriculum-module.mjs \
  content/curriculum-modules/ncert/2026-27/class-2/english/mridang/chapters/my-bicycle.json

npx vitest run tests/mridang-my-bicycle-learning-graph.behavior.test.ts
```

The validator checks source rights, ID resolution, ontology/predicate compatibility, open-world semantics, claim scope, media answer-safety and evidence boundaries.

## Not completed by this pilot

- no child-facing chapter screen;
- no source-text narration;
- no final child wording;
- no audio files or phonics runtime changes;
- no generated production questions;
- no CBSE official-alignment claim;
- no human editorial, visual, inclusion or child-CX approval;
- no whole-book ingestion.

The next step after review is to compile this validated module slice into existing Learn/Practise/Revise/Test renderers without creating a chapter-specific evaluator or duplicate question bank.
