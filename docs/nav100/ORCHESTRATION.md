# NAV100: scalable home and experience discovery

Status: planning and evidence lane; production unchanged.
Date: 2026-09-13.
Master: [#1](https://github.com/sahnishant/kidsplay/issues/1).
Scoped workstream: [#284](https://github.com/sahnishant/kidsplay/issues/284).
Inspected baseline: `main@0e719263c676154e5573ff7a4b98be509044b1df`.

Read [AGENT_RUNBOOK.md](AGENT_RUNBOOK.md), [SOURCE_MATRIX.md](SOURCE_MATRIX.md) and [ACCEPTANCE.md](ACCEPTANCE.md). The live issue thread controls claims, dependencies and decisions. These files are a versioned contract, not a second master roadmap or a scheduler. Existing repository instructions and production rules remain in force. Reconcile conflicts with the coordinator before writing.

## User problem

Kidsplay should eventually carry more than 100 substantial Bicycle-like games, large knowledge and vocabulary collections, reusable learning models, many books/chapters, and different presentation and capability needs. The current user complaint is fragmented modes and valuable experiences hidden behind small controls. A redesign must make content discoverable without exposing engines or a wall of hundreds of cards.

The desired child jobs are:

1. Return to a recognisable experience and continue as far as that experience actually supports.
2. Deliberately choose a familiar kind of play through a visible, stable entrance.
3. Find an earlier or specific experience even when it is not recommended.
4. Explore independently, while parents/older readers can also locate a book/chapter mapping.
5. Leave an activity, including a shared studio, and return to the correct context.

This lane is NOT a mandate to build 100 games now. It proves the discovery architecture using real varied pilots plus explicitly segregated synthetic-scale test data.

## Decisions already fixed

- One existing set of canonical knowledge, claims, source/lexicon/profile mappings and evidence authorities; do not create a new learning database or evaluator.
- Reuse registered activities/models. Multiple entrances point to the same canonical activity; navigation context is not another achievement identity.
- Standardise entry, orientation, exit and supported continuation. Do not force stories, open tools and authored games into identical level ladders.
- Completion, observation, guided practice and independent performance are distinct. A word recognition result is not proof of a mechanical/scientific relationship.
- Preserve coherent authored sessions, existing session limits, offline behaviour, audio cancellation and parent/access safeguards.
- Real-world sensory/motor actions cannot be certified by a digital animation. Personal expression is not a universal right/wrong test.
- Separate readability/presentation/motor support, demonstrated capability and curriculum placement. Do not invent one global child level or an age-to-mastery table.
- Chapter coverage can be partial or unknown. Do not call a chapter mastered because several activities exist.
- Start with an isolated default-off prototype. The present production home remains usable and unchanged until explicit G4 permission.

## Decisions NOT yet approved

Words/Vocabulary, Knowledge Journey and Scientu's Lab are candidate entrance identities raised by the user. Exactly five verticals was a prior proposal, not a settled requirement. G1 must decide their promises, boundaries, labels and how substantial games and primary stories are found.

Knowledge Journey must have one clear meaning. A short next-step recommendation may enter an existing longer journey; it must not create a competing Today's Trail curriculum or progress system.

No decision has been made here about premium pricing, artificial locked worlds, star economies, mandatory daily routes, 10–20 minute sessions, fixed engine counts or automatically generating five adaptations of every chapter.

## Architecture boundaries to preserve

| Layer | Responsibility | Must not become |
| --- | --- | --- |
| Book/chapter/source mapping | Provenance and scoped learning objectives | A mandatory child navigation funnel |
| Concept/objective/lexical sense | Canonical meaning and learning target | A copied truth inside each game menu |
| Playable experience | Recognisable thing to enter and revisit | Necessarily a quiz or identical set of levels |
| Activity/model | Reusable registered learning interaction | A copy per entrance |
| Engine | Interaction and declared rules | The child-facing menu taxonomy |
| Journey | Coherent selection/sequence around a purpose | Another mastery store |
| Discovery projection | Reference-only catalogue, eligibility and view state | A second source/answer registry |

Existing code anchors inspected at the baseline include `src/App.svelte`, `src/ui/HomeViewport.svelte`, `src/ui/home/HomeBottomNav.svelte`, `src/ui/StoryWorldViewport.svelte`, `src/contracts/question.ts` and `src/experience/experienceRecipes.ts`. Question contracts distinguish practice-only/supporting knowledge; experience recipes explicitly do not own answer authority. These observations are not a comprehensive capability audit. Task 01 must locate actual Learning Studio, topic, source, lexicon, profile, world-action, persistence and session-cap owners and tests before further design or code.

New path names mentioned in issues are proposed ownership boundaries. G1 must confirm them against the actual repository; workers must not treat proposed modules as existing APIs.

## Queue

Statuses below are initial states. The latest coordinator decision in #284 is authoritative; update issue titles and this table when advancing.

| Task | Issue | Initial status | Depends on | Bounded output |
| --- | --- | --- | --- | --- |
| 01 Evidence audit | [#285](https://github.com/sahnishant/kidsplay/issues/285) | READY, claim required | Read this planning pack | Actual entries, IDs, owners, source access and capability matrix |
| 02 Design decision | [#286](https://github.com/sahnishant/kidsplay/issues/286) | BLOCKED | 01 + G0 | Two comparable alternatives; approved hierarchy/launch contract |
| 03 Discovery projection | [#287](https://github.com/sahnishant/kidsplay/issues/287) | BLOCKED | 02 + G1 | Pure reference adapter and segregated scale fixtures |
| 04 Prototype home | [#288](https://github.com/sahnishant/kidsplay/issues/288) | BLOCKED | 03 | Default-off shell and explicit state handling |
| 05 Browse/find | [#289](https://github.com/sahnishant/kidsplay/issues/289) | BLOCKED | 04 | Findable non-featured catalogue; truthful curriculum view |
| 06 Launch/return | [#290](https://github.com/sahnishant/kidsplay/issues/290) | BLOCKED | 05 | Existing runtime integration; parent/focus and supported resume |
| 07 Real pilots | [#291](https://github.com/sahnishant/kidsplay/issues/291) | BLOCKED | 06 | Six approved existing cross-format pilots |
| 08 Technical proof | [#292](https://github.com/sahnishant/kidsplay/issues/292) | BLOCKED | 07 | Exact-head regression, evidence, scale, offline and accessibility proof |
| 09 Product acceptance | [#293](https://github.com/sahnishant/kidsplay/issues/293) | BLOCKED | 08 + G2 | Actual usability packet, findings and owner G3 decision |
| 10 Promotion | [#294](https://github.com/sahnishant/kidsplay/issues/294) | BLOCKED | 09 + explicit G4 | Minimal authorised default change, rollback and roadmap closure |

The default execution order is serial. This intentionally avoids several implementation agents changing Home, navigation or contracts concurrently. The coordinator may split a task into smaller disjoint units after exact API/path approval; readiness and merge ordering must remain explicit. Do not pre-create ten implementation branches or implement blocked tasks speculatively.

## Decision gates

| Gate | Required record | Who may approve |
| --- | --- | --- |
| G0 | Exact code/source inventory, capability limits, proposed pilot/path/test map | Independent reviewer/coordinator |
| G1 | Chosen design, labels, hierarchy, launch/return/resume contract, file ownership, pilot set and success criteria | Product owner or explicitly delegated design reviewer |
| G2 | Exact-head complete technical proof with required platform evidence | Independent technical reviewer |
| G3 | Product acceptance and actual evidence limits; adult heuristic review distinguished from child observations | Product owner |
| G4 | Explicit production authorisation, platforms, accepted limitations and rollback | Product owner |

Use comments naming the gate, decision, artifact SHA, reviewer and scope. A PR creation, worker claim or unchecked task list is not approval. G3 does not automatically grant G4. Missing native evidence must remain pending for the affected release platform; browser offline tests do not substitute for Android certification.

## Six real pilot forms

Task 01 identifies exact available instances; G1 approves the set. The target is Bicycle Workshop; a knowledge/topic journey; a manipulable registered studio entered both directly and in context; real words/phonics; a primary story/listening experience; and a world-action experience. Do not invent IDs or reskin an MCQ to conceal a missing model. Missing capability requires a linked bounded gap and explicit pilot amendment.

Use synthetic 0/1/150/1,000 descriptor fixtures only to test catalogue scale. Those are proposed test sizes, not claims about existing content. Production catalogues/assets and child progress must not contain fixture entries.

## Source handoff

The user supplied chapter PDFs in ChatGPT. Fresh GitHub agents may not have them. SOURCE_MATRIX is an attributed inspection-note pack sufficient to illustrate format boundaries, not a new canonical source or a licence to fill gaps from memory. Verify actual source availability via the repository's source workflow for any curriculum-authoring task. Do not upload the full source books here or silently replace them with guessed online editions.

## Out of scope

Mass curriculum ingestion, 100 new games, new assessment logic, complete multilingual/age curriculum generation, new scientific models, commerce changes, replacing the story/knowledge runtime, arbitrary performance-budget increases, mass deletion of old branches, and merging unrelated open PRs. Track necessary gaps separately without falsely closing them when navigation ships.

## Current delivery truth

This planning pack and its issues organise future work. They do not implement the redesign, run agents, provide a new production screen, certify tests or establish child acceptance. Until this docs PR is merged, read it from `orchestration/nav100-agent-workstream`; workers' task bodies remain self-contained.
