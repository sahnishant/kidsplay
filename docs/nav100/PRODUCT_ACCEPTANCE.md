# NAV100 product acceptance packet

This packet describes the current default-off NAV100 prototype after PRs #302, #304, #305 and #306. The runtime candidate immediately before this documentation-only refresh is `main@c7379f449ec97ba52eb2f8c28c4256602067cf5c`. It is **not** a claim of child acceptance.

## What to open

- Production/current home: `/`
- Navigation prototype: `/?nav100=1`
- The prototype is development-only and default-off. Removing `nav100=1` returns to the existing home without deleting progress.

## Current product shape

The test is about the front door and rediscovery, not re-testing every answer inside existing games. The first child screen should not ask a young child to understand the repository's internal content taxonomy. It now presents:

1. **one dominant activity** — currently the existing Bicycle Workshop;
2. **at most three nearby alternatives** — representative existing topic, story and sound experiences when available;
3. **Continue** — only when an existing experience has a truthful supported checkpoint. The current implemented Home proof uses the existing Stories exact-page resume store and does not invent resume for experiences that lack it;
4. **Browse all** — the route to the wider canonical catalogue.

Inside **Browse all**, the child can either search by name or use large visual groups: **All, Games, Discover, Hands-on, Stories, Sounds**. These groups are discovery aids inside Browse, not permanent Home modes, curriculum levels or a second content authority.

The wider catalogue still reuses existing owners and canonical IDs. Real examples include Bicycle Workshop, Earth, Make equal shares, Scientu’s Sound Trail, The Moonlit Leaf and Quiet Creek Rescue. Partial world content remains labelled **Preview**.

## Owner test tasks

Run these without coaching the person using the screen. Record what actually happens rather than what the implementation intends.

1. **First use:** open `/?nav100=1` with no saved state. Ask what looks like the obvious thing to do next. Record whether the dominant activity is understood without explanation.
2. **Rediscover Bicycle:** open Bicycle Workshop, leave it, then find Bicycle again using Browse.
3. **Find hands-on play without typing:** open Browse all, choose **Hands-on**, and find **Make equal shares**. Record whether the group label/icon is understandable without explaining “learning studio”.
4. **Find by name:** use Browse search to find a specific non-featured experience such as Bicycle or Quiet Creek Rescue.
5. **Primary story:** open **The Moonlit Leaf** and confirm it remains a story rather than being funnelled through a quiz.
6. **Truthful Continue:** advance The Moonlit Leaf by at least one page, return Home, then use **Continue**. Confirm it returns to the page actually left. Finish the story or mark it complete through normal use and verify Home no longer implies an unfinished resume.
7. **Topic reuse:** open **Earth** and confirm it is the existing Learn About topic rather than a duplicate topic system.
8. **Sound reuse:** open **Scientu’s Sound Trail** and confirm it is the existing phonics runtime.
9. **Browse context:** choose **Stories** or **Hands-on**, open an activity, then go Back/Escape. Confirm the same Browse group is still selected and the originating item regains focus.
10. **Partial content truth:** find **Quiet Creek Rescue** and confirm it is visibly labelled **Preview** before launch.
11. **Back stack:** try Back, Escape and browser Back through `Home -> Browse -> activity -> Browse -> Home` and `Home -> direct choice -> Home`.
12. **Prototype off:** remove `?nav100=1` and verify the existing production home is still intact.

## What to record

For each task record only observed facts:

| Task | Completed? | Wrong turn / confusion | Help needed | Could find it again? | Notes |
| --- | --- | --- | --- | --- | --- |
| Obvious first action | PENDING | | | | |
| Bicycle rediscovery | PENDING | | | | |
| Hands-on filter / Equal shares | PENDING | | | | |
| Non-featured search | PENDING | | | | |
| Primary story | PENDING | | | | |
| Exact story Continue | PENDING | | | | |
| Earth topic | PENDING | | | | |
| Sound Trail | PENDING | | | | |
| Browse group return | PENDING | | | | |
| Creek Preview truth | PENDING | | | | |
| Back/Escape/browser Back | PENDING | | | | |
| Prototype off again | PENDING | | | | |

## Product questions to answer

The review should specifically determine whether:

- one strong first action is clearer than five equal Home categories;
- three nearby alternatives provide enough choice without recreating a tile wall;
- a compact **Continue** affordance is useful when it is backed by real checkpoint state;
- **Browse all** is discoverable when the desired activity is not featured;
- visual Browse groups help a young child find a type of activity without typing;
- the Browse groups feel like helpful filters rather than a second confusing menu system;
- a child can rediscover an activity by its visible name;
- Back/return behavior preserves the place the child came from;
- **Preview** is understood as partial availability rather than mastery/lock status;
- the screen feels like a place to start playing rather than a menu of software modes.

Do not infer a product pass from automated tests. These are human-observation questions.

## Evidence separation

- **Automated technical evidence:** tracked under #292 and the relevant implementation PRs (#302, #304, #305, #306).
- **Adult/expert heuristic review:** may be recorded as such; it is not child testing.
- **Actual child-use observations:** must come from the owner and remain anonymised. Do not put names, photos, recordings, account information or sensitive observations in GitHub.
- **Untested platforms/audiences:** remain explicitly pending.

## Current gate

**G3: PENDING.** The product owner must accept or reject the prototype after the combined hands-on test. Green Windows/Browser/Android checks cannot substitute for this decision. This file does not authorise a production-default switch or G4 promotion.
