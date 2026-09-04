# HUMAN REVIEW — Forest Explorer Level 2 visual/CX acceptance

**Status: PENDING HUMAN REVIEW. Agent D / automation must not approve this gate.**

Review the branch `feat/forest-world-depth-l2-l3` after automated Windows, Browser and Android checks are green. This is a child-experience review, not a code review.

## Setup

- Use a fresh profile, then complete Forest Explorer Level 1 normally; alternatively use a test profile with L1 complete and L2 incomplete.
- Primary Browser review viewport: **360 × 640** with touch emulation enabled.
- Repeat the key path on the packaged Android build with network connectivity disabled.
- Run once with sound off. The mission must remain fully understandable from visible prompts, state changes and feedback.
- Run once with reduced motion enabled. Meaning must remain clear without animation.

## Journey to review

1. On the child home, confirm the Forest remains one place on the map and the HUD shows **Level 2**. `Continue Adventure` should lead to **The Quiet Creek Rescue** rather than a duplicate Forest node or a generic quiz folder.
2. Read/play all three character setup beats. Shaitanu should frame the bad shortcut, Scientu should identify the connected creek/root/crossing problem, and Dheu should take the action role. Judge whether this feels like a problem in a world, not prefatory quiz text.
3. Start Forest Level 2. Confirm the broken crossing, split channel, dry saplings and blocked creek are visually legible as a damaged place.
4. On **Repair the creek crossing**, deliberately put the plank in the rail slot first. Confirm the response is an immediate local retry/scaffold, not a failure screen; correct work should not be erased. There must be no separate `Check Answer` button after placing a piece.
5. Finish the crossing repair, then reconnect the two water-channel pieces. Confirm these feel like different physical jobs even though both use the same reusable assembly machinery.
6. Water the saplings. Confirm the before/after state is visually apparent without audio.
7. Release the creek flow. Confirm the physical consequence reads causally: blocked creek → flowing water → restored creek-bank environment.
8. At completion, confirm the ending explicitly reflects the repaired world and shows **Forest Level 3 unlocked**. There should be no farmable currency loop or invitation to repeat for more rewards.
9. Return to the world. Confirm the Forest visibly carries the creek-restoration consequence and shows two bounded Forest discoveries.
10. Kill/relaunch or reload. Confirm the restored creek state, L2 completion, two Discovery entries and Level 3 continuation all persist. Replaying L2 must not increase the Discovery count.

## Child-CX acceptance questions

Mark each item **APPROVE** or **REJECT** and note the concrete reason:

- The full arc feels like one coherent 5–10 minute creek rescue rather than four unrelated cards.
- A young child can understand what to touch without reading every sentence.
- Touch targets are comfortable on a 360 × 640 phone.
- The wrong-first repair gives useful, non-punitive help and preserves the sense of progress.
- The crossing/channel/watering/flow actions feel materially different enough to sustain play.
- The child can see that their action changed the Forest, not merely that an answer was marked correct.
- Dheu, Scientu and Shaitanu contribute to the adventure rather than appearing as decorative mascots.
- Reduced-motion mode preserves all semantic state changes.
- Sound-off mode preserves every required instruction, retry cue and consequence.
- The persistent changed Forest is visible after relaunch and does not look like a transient celebration overlay.
- There is no redundant `Check Answer` interaction and no replay-farming incentive.

## Packaged Android checks

On the debug APK produced from this exact branch/head:

- Launch with Wi-Fi/mobile data off and enter L2.
- Complete at least the first repair and one cause/effect step offline.
- Force-stop and relaunch; confirm saved world state remains coherent.
- Rotate portrait → landscape → portrait during L2; verify controls remain reachable and no content becomes permanently clipped.
- Confirm Android Back exits the mission safely rather than losing saved completed-mission state.

## Review record

- Reviewer:
- Device/browser:
- Branch/head SHA:
- Date:
- Browser 360 × 640: APPROVE / REJECT
- Touch accessibility: APPROVE / REJECT
- Reduced motion: APPROVE / REJECT
- Sound off: APPROVE / REJECT
- Android offline/relaunch/rotation: APPROVE / REJECT
- Overall Forest L2 visual/CX gate: **PENDING / APPROVE / REJECT**
- Notes/screenshots:
