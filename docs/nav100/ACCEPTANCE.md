# NAV100 acceptance contract

Authority: [#284](https://github.com/sahnishant/kidsplay/issues/284) under [#1](https://github.com/sahnishant/kidsplay/issues/1). This document specifies future proof; it does not report completed tests. See [ORCHESTRATION.md](ORCHESTRATION.md) and [AGENT_RUNBOOK.md](AGENT_RUNBOOK.md).

## Gate 0: evidence, not assumptions

Task 01 must map real entries/IDs, registry and evidence ownership, existing checkpoint support, current test commands and source availability. Each capability is LIVE/PARTIAL/MISSING/UNVERIFIED with an exact implementation/test or an explicit gap. Complete-looking source tables are not evidence of implemented gameplay.

## Gate 1: decisions before coding

The approved design record must state:

- exact entrance names/promises, hierarchy and stable locations;
- where 100+ substantial games, primary stories and direct manipulable tools can be found;
- one meaning of Knowledge Journey and no competing daily progress system;
- new/returning/empty/stale/unavailable states;
- canonical IDs, entry context, launch contract and supported continuation per pilot;
- exact allowed paths, integration seams and file ownership;
- six actual pilot IDs or explicitly approved missing-capability amendments;
- criteria for discovery depth, small-screen usability, focus order, reading support and target sizing;
- agreed measurement method and performance expectations before results are observed.

No worker may retroactively loosen acceptance to fit an implementation. Unresolved decisions block affected code, not the whole repository.

## Gate 2: technical verification

Use the current repository-required checks and add targeted coverage. The following are acceptance scenarios, not assumptions about implementation APIs.

| Area | Scenario | Required observation |
| --- | --- | --- |
| Prototype isolation | Off, explicitly on, then off again | Production entry behaviours remain usable; no unintended state writes; fallback works |
| First use | No progress/history | A meaningful playable entry and visible way to choose another area; no mandatory reading/filter setup |
| Returning use | Existing supported checkpoint | Resume/reopen wording matches real capability and resolves the correct canonical experience |
| Rediscovery | Item no longer featured | Item remains findable by the approved browse/recent/saved/name path |
| Multiple entrances | Same studio from Lab and topic/workshop | Same canonical activity; correct distinct parent return; no duplicate evidence |
| Back/focus | Browser Back, Escape, keyboard and touch | Exactly one logical layer closes; focus restored; no surprise Home reset |
| Async lifecycle | Double activation, Back during import, import failure | No late reopen, duplicate session or stranded overlay; safe retry/return |
| Stale state | Removed ID, changed revision, invalid navigation storage | Truthful fallback without fabricated progress or silent assessment reset |
| Evidence | View, observe, guided action, independent response, reopen | Current exploration/practice/evaluative rules retained; no word-to-science mastery inference |
| Session/audio | Limit at start/mid/end, leave during narration | Existing limits and cancellation honoured; clear ending; no compulsory next session |
| Curriculum | Partially mapped chapter | Partial/unknown shown accurately; no chapter-complete claim from activity counts |
| Scale | 0, 1, 150, 1,000 synthetic descriptors | Stable results; non-featured content findable; bounded rendering; fixtures absent from production |
| Loading cost | List cards before launching games | Does not eagerly load all game modules/assets; current bundle rules respected |
| Offline | Available versus unavailable assets, relaunch | Available experience remains usable; unavailable content explained; no fake offline success |
| Native boundary | Applicable Android installed/offline/back flows | Actual native proof, not browser-only emulation relabelled as Android |

Required views: 360×640, 390×844, phone landscape and a larger tablet/desktop layout. Record exact viewport and zoom. Check visible labels, unclipped controls, reading order, focus indication, touch bounds, text growth and reduced-motion state. Screenshot evidence must be paired with actual interaction tests. Avoid shrinking navigation to conceal overflow; not every home state must fit in one non-scrolling viewport.

Keyboard and semantic accessibility must be tested independently of visuals. Use the repository's supported testing libraries; adding a new service/tool is not part of this lane. Voice is helpful where existing assets support it, but navigation must have accessible no-audio fallbacks.

### Proof record

```text
Scenario ID / expected outcome:
Actual base and tested head SHA:
Device / OS / browser / viewport / toolchain:
Real experience and canonical IDs, or explicitly synthetic fixture:
Command / manual steps:
PASS / FAIL / NOT RUN / BLOCKED:
Observed result and artifact link:
Remaining limitation / owner issue:
```

An earlier green head does not certify subsequent changes. Source inspection, mock tests, real browser interaction and native device evidence must be labelled separately. Native runner unavailable means NOT RUN and a pending affected-platform gate, not permission to claim certified release. Never widen bundle budgets, skip tests or alter evidence semantics just to close a proof row.

## Gate 3: product clarity

Technical correctness does not establish that a child understands the entrances. Prepare an owner-approved test packet with an exact build, activation instructions and the following jobs. Ask for the job, not a coached path through the menu.

1. Start something interesting on first use without a reading requirement.
2. Return to Bicycle after a different activity.
3. Deliberately choose the Lab and operate a real registered model.
4. Find a previously seen non-featured experience.
5. Open a story as the main experience, not an unavoidable quiz prelude.
6. As a parent/older reader, locate a book/chapter and recognise incomplete coverage.
7. Leave the same studio after entering through two different contexts.
8. Stop, relaunch and continue only as the existing offline/checkpoint support permits.

Record observed completion, wrong turns, requested help, misunderstood labels, unsupported resume expectations and lost-context incidents. Measure taps/times only when actually observed. Apply G1's criteria rather than inventing success thresholds afterwards.

Separate automated proof, independent adult/expert heuristic review, actual child-use observations and untested audiences. Agent role-play is never child testing. Do not put children's names, images, recordings, account data or identifiable family responses in GitHub; use consented, non-identifying owner notes. If observations have not happened, keep them pending and describe the limitation.

The product owner records G3 ACCEPTED, REJECTED or PENDING with exact artifacts and limits. Corrections return to their owning bounded implementation task and receive fresh tests/review. Rejection is a valid outcome; do not replace the design without a revised G1 decision.

## Gate 4: production change

Requires a separate explicit owner authorisation naming candidate design/head, target platforms, accepted limitations, activation seam and rollback. The initial request to organise agents is not G4.

Promotion must preserve existing progress, inbound routes and a usable fallback; must not introduce taxonomy/model/evidence changes. Run required checks at the promotion head and demonstrate rollback without data deletion. Retiring the old home is separate from merely activating an accepted new one.

After authorised merge, update work targets, #284 and #1 with actual shipped/preview/missing state. Keep content/model gaps open. Synthetic catalogue scale must not be reported as produced games.

## Planning-pack verification boundary

This PR adds orchestration documents only. It does not implement UI, execute workers, run gameplay tests or provide usability evidence. Its relevant immediate checks are changed-path review, document consistency, valid issue references and source-note provenance/limitations. Runtime and product proof belongs to the tasks above.
