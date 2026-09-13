# NAV100 product acceptance packet

This packet is for the consolidated `kidsplay` branch and PR #302. It is **not** a claim of child acceptance.

## What to open

- Production/current home: `/`
- Navigation prototype: `/?nav100=1`
- The prototype is default-off. Removing `nav100=1` returns to the existing home without deleting progress.

## What the prototype is trying to solve

The test is about the front door, not re-testing every answer inside existing games. A child should be able to see a few stable choices, find a specific experience without a wall of tiles, open a real existing experience, and return to the place they came from.

Current prototype lanes are deliberately concrete and small:

- **Big games** — substantial authored experiences such as Bicycle Workshop.
- **Discover** — topic exploration such as Earth.
- **Scientu’s Lab** — registered hands-on studios such as Make equal shares.
- **Words & sounds** — sound/literacy experiences such as Scientu’s Sound Trail.
- **Stories** — primary reading/listening experiences such as The Moonlit Leaf.
- **Browse all** — deterministic find-by-name access to the broader catalogue, including world actions such as Quiet Creek Rescue.

These labels remain product-testable; they are not a new learning/content authority.

## Owner test tasks

Run these without coaching the person using the screen:

1. From first use, choose something interesting.
2. Open Bicycle Workshop, leave it, then find Bicycle again.
3. Deliberately choose **Scientu’s Lab** and open **Make equal shares**.
4. Use **Browse all** to find a specific non-featured experience by name.
5. Open **The Moonlit Leaf** as a story without being funnelled through a quiz.
6. Open **Earth** from Discover and confirm it is the existing Learn About topic rather than a duplicate topic system.
7. From Browse, open **Quiet Creek Rescue**, then return to Browse rather than being dumped at an unrelated home.
8. Try Back, Escape and browser Back through `Home -> Browse -> activity -> Browse -> Home`.
9. Remove `?nav100=1` and verify the existing production home is still intact.

## What to record

For each task record only observed facts:

| Task | Completed? | Wrong turn / confusion | Help needed | Could find it again? | Notes |
| --- | --- | --- | --- | --- | --- |
| First choice | PENDING | | | | |
| Bicycle rediscovery | PENDING | | | | |
| Scientu’s Lab | PENDING | | | | |
| Non-featured search | PENDING | | | | |
| Primary story | PENDING | | | | |
| Earth topic | PENDING | | | | |
| Creek return | PENDING | | | | |
| Back/Escape/browser Back | PENDING | | | | |
| Prototype off again | PENDING | | | | |

## Evidence separation

- **Automated technical evidence:** tracked under #292 / PR #302.
- **Adult/expert heuristic review:** may be recorded as such; it is not child testing.
- **Actual child-use observations:** must come from the owner and remain anonymised. Do not put names, photos, recordings or sensitive information in GitHub.
- **Untested platforms/audiences:** remain explicitly pending.

## Current gate

**G3: PENDING.** The product owner must accept or reject the prototype after the combined test. Automated green checks cannot substitute for this decision, and this file does not authorise a production-default switch.
