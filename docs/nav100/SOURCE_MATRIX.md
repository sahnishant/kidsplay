# NAV100 source examples and capability boundaries

Parent: [#284](https://github.com/sahnishant/kidsplay/issues/284).
Producer context: user-uploaded chapter PDFs in the Kidsplay design conversation, inspected before this workstream was created.

## Status and limits

This is a compact handoff of source-derived examples, not a complete review of every uploaded book and not canonical curriculum data. The PDF filenames below are identifiers from the user's attachments. Their presence in a ChatGPT session does NOT establish that these files are checked into GitHub or available to a fresh agent. No source PDFs are added by this planning PR.

Printed page numbers are distinguished from PDF page indices where known. Use the title and printed page to locate the passage. For tasks that author/correct curriculum, obtain the actual source through the repository's approved source/alignment workflow and record source version and accessibility. Missing evidence must remain missing. Do not substitute guessed facts, another edition or another online book without explicit review.

The source column describes what the supplied material asks the learner to do. The engineering column is a DESIGN INFERENCE to be tested against current capabilities, not a claim that the source mandates our UI or that an engine exists.

## Representative matrix

| Attachment and locator | Source-derived activity | Engineering implication / hypothesis | Evidence boundary |
| --- | --- | --- | --- |
| `aemr101.pdf`, Mridang, Two Little Hands, printed p. 3 (PDF page 3) | Sing the body-parts song while touching the body part named. | A song-and-action experience can stand on its own. It need not be only a mission introduction or converted into a multiple-choice test. | Playback does not prove the child performed a physical action or learned the name. |
| `demm105.pdf`, Sharing and Measuring, printed pp. 66–69 (PDF pages 5–8) | Follow the dhokla-sharing story as additional people arrive; compare shares and reason about equal sharing. | A reusable sharing model could support manipulation and reasoning while a narrative preserves the context. | Merely distributing objects with hints is not automatically independent fraction mastery. A proposed model still needs exact source/answer validation. |
| `demm111.pdf`, Fun with Symmetry, printed p. 166 (PDF page 3) | Predict the holes/cuts visible after folded paper is opened; reason about how cuts produce a shape. | An interactive folding model and a prediction challenge are different from a generic sequence-of-cards activity. | A folding animation is not proof of a correct geometric model. New model capability must be validated, not inferred from an existing drag engine. |
| `demm114(1).pdf`, Data Handling, printed pp. 203–205 (PDF pages 1–3) | Compare survey questions about favourite subjects, record responses and organise information in a table. | Support investigating and collecting/representing data, not only answering questions about a finished graph. | Personal preferences and survey responses are data, not universally correct/incorrect answers. Any real collection needs an approved privacy policy. |
| `demm110.pdf`, Elephants, Tigers, and Leopards, printed pp. 149–150 (PDF pages 1–2) | Play a two-player NIM variant: add 1 or 2 to a running total; first to the target wins; consider other targets. | A multi-turn strategy-game capability is distinct from single-question choice/sequence engines. | Do not call it implemented because a multiple-choice question about the game can be rendered. |
| `fecu107.pdf`, Temperature and its Measurement, printed p. 124 (PDF page 2) | Make predictions, compare hand sensations after different-temperature water and record observations. | A simulation can explain an investigation or rehearse a prediction, while the actual activity remains a physical sensory experiment. | Digital animation cannot establish the learner's physical sensations. This note does not supply child-facing experiment safety instructions; those require source and safety review. |
| `ceev101.pdf`, Family and Friends, printed p. 6 (PDF page 6) | Discuss personal family experiences and fill in names, forms of address and relationships. | Allow expression/conversation rather than forcing a single ideal family or answer key. | Do not publish personal family information to GitHub or treat a particular household structure as the correct answer. |
| `fecu106.pdf`, Materials Around Us, printed p. 105 (PDF page 5) | Drop different same-sized balls from a fixed height, compare bounce and record observations. | A materials/measurement model could be useful, but source facts alone do not supply a validated physics simulation. | Watching a scripted result is observation, not proof of a learner-conducted experiment or independent inference. |
| `fecu108.pdf`, A Journey through States of Water, printed pp. 143–147 (PDF pages 1–5) | Discuss ice and water, observe melting/disappearing water and investigate droplets appearing on a cold container. | A concept may support a coherent story, an experimental tool or language activities where useful. It need not produce one activity in every vertical. | Shared topic references do not imply that a vocabulary response or watched animation proves understanding of evaporation/condensation. |

These are examples of differing forms, not a proposed developmental sequence. Do not turn the sequence of rows into a curriculum or map them automatically to ages.

## Required audit output in task 01

For each representative form, report:

```text
Source file/title/page and actual repository source availability
Learner action explicitly supported by that source
Existing canonical concept/activity/model IDs, or MISSING
Exact implementation file/symbol and tests, or UNVERIFIED
LIVE / PARTIAL / MISSING / UNVERIFIED, with rationale
Current entry point and possible reference reuse
Evidence restrictions and physical/personal-data boundary
Smallest capability gap, if any
```

Do not claim every uploaded chapter was analysed from these examples. Do not enumerate files on the assumption that an attachment filename means a repository asset exists. Distinguish missing source access from missing game-engine capability.

## Existing software facts to investigate, not overgeneralise

At the inspected baseline, `src/contracts/question.ts` declares question interactions including choice, drag-to-target, equal parts, collection counting, sequence ordering, hotspot, tracing, word search, crossword and maze. It also distinguishes tested from supporting knowledge references and permits practice-only evidence.

`src/experience/experienceRecipes.ts` defines presentation choreography families and explicitly forbids ownership of question/answer authority. Its existence is not proof of a physical model, open creative workspace, survey system or multi-turn strategic game.

The prior review identified registered studios reused through topic/workshop bindings. Task 01 must locate the exact current registry/dispatch/test paths and concrete IDs before writing adapters. A file called an engine, a picture of a process or a source chapter title is not enough to establish supported behaviour.

## Content authoring is outside this navigation lane

Do not import these summaries as knowledge rows. Do not generate unreviewed science, lexical senses, translations, answer keys or experiment instructions from them. Navigation tasks reference existing approved experiences. Necessary source/engine/content work becomes a separately reviewed bounded issue.

The product may retain a primary story, physical investigation or creative activity without gamifying every part. The navigation system must accommodate their identity and return path without falsely declaring completion or mastery.
