# NAV100 product acceptance packet

This packet is for the consolidated `kidsplay` branch and PR #302. It is **not** a claim of child acceptance.

## What to open

- Production/current home: `/`
- Navigation prototype: `/?nav100=1`
- The prototype is default-off. Removing `nav100=1` returns to the existing home without deleting progress.

## What the prototype is trying to solve

The test is about the front door, not re-testing every answer inside existing games. The first child screen should not ask a young child to understand the repository's content taxonomy. It now presents:

1. **one dominant adventure** — currently the existing Bicycle Workshop;
2. **at most three nearby alternatives** — representative topic, story and sound experiences when available;
3. **Browse all** — a secondary escape hatch for finding the wider canonical catalogue.

The old five equal mode/category buttons were deliberately removed. Categories remain discovery/search metadata rather than permanent child-facing Home modes. This does not create a new learning sequence, mastery ladder or content authority.

The wider catalogue still reuses the existing owners and canonical IDs. Examples include Earth, Make equal shares, Scientu’s Sound Trail, The Moonlit Leaf and Quiet Creek Rescue.

## Owner test tasks

Run these without coaching the person using the screen:

1. From first use, say what looks like the obvious thing to do next. Record whether the large adventure card is understood without explanation.
2. Open Bicycle Workshop, leave it, then find Bicycle again.
3. Find **Make equal shares** without a permanent **Scientu’s Lab** button on Home. The intended route is **Browse all**.
4. Use **Browse all** to find a specific non-featured experience by name.
5. Open **The Moonlit Leaf** directly from the small choice set and confirm it remains a story rather than being funnelled through a quiz.
6. Open **Earth** directly and confirm it is the existing Learn About topic rather than a duplicate topic system.
7. Open **Scientu’s Sound Trail** from the small choice set and confirm it is the existing phonics runtime.
8. From Browse, open **Quiet Creek Rescue**, then return to Browse rather than being dumped at an unrelated home.
9. Try Back, Escape and browser Back through `Home -> Browse -> activity -> Browse -> Home` and through `Home -> direct choice -> Home`.
10. Remove `?nav100=1` and verify the existing production home is still intact.

## What to record

For each task record only observed facts:

| Task | Completed? | Wrong turn / confusion | Help needed | Could find it again? | Notes |
| --- | --- | --- | --- | --- | --- |
| Obvious first action | PENDING | | | | |
| Bicycle rediscovery | PENDING | | | | |
| Equal shares via Browse | PENDING | | | | |
| Non-featured search | PENDING | | | | |
| Primary story | PENDING | | | | |
| Earth topic | PENDING | | | | |
| Sound Trail | PENDING | | | | |
| Creek return | PENDING | | | | |
| Back/Escape/browser Back | PENDING | | | | |
| Prototype off again | PENDING | | | | |

## Product questions to answer

The review should specifically determine whether:

- one strong first action is clearer than five equal category choices;
- three alternatives are enough choice without feeling like a catalogue wall;
- **Browse all** is discoverable when the desired activity is not featured;
- a child can rediscover an activity by its visible name;
- the screen feels like a place to start playing rather than a menu of software modes.

Do not infer a pass from automated tests. These are human-observation questions.

## Evidence separation

- **Automated technical evidence:** tracked under #292 / PR #302.
- **Adult/expert heuristic review:** may be recorded as such; it is not child testing.
- **Actual child-use observations:** must come from the owner and remain anonymised. Do not put names, photos, recordings or sensitive information in GitHub.
- **Untested platforms/audiences:** remain explicitly pending.

## Current gate

**G3: PENDING.** The product owner must accept or reject the prototype after the combined test. Automated green checks cannot substitute for this decision, and this file does not authorise a production-default switch.
