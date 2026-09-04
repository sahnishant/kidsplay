# HUMAN REVIEW — First Play + visual-choice production vertical

Branch: `feat/first-play-visual-choice-production`

PR: #247

Roadmap: #206 First Play, #203 Visual Scene Choice / Which Doesn't Belong?, #210 Wave C + Wave D.

**Status: HUMAN 2–3-year-old acceptance is PENDING. This document does not claim it.**

The automated suite can establish contracts, geometry, shuffling, evaluator/evidence behavior and packaged/offline mechanics. A real young-child review must still judge whether the experience is naturally understandable and pleasant without adult coaching.

## Review setup

Use current branch/PR build. Prefer an Android phone. For browser review use an exact **360×640** viewport.

Start with local child progress cleared. Open Kidsplay normally, enter **Play**, then launch the paw-print **First Play** card.

Do not read the written prompt aloud after launch unless the child independently uses the on-screen Repeat control. Do not point at the correct answer. The review is specifically testing whether the child can proceed from voice + visuals + direct manipulation.

## A. First Play child review

### 1. Touch & Discover — Dog

Expected child surface:
- one very large dog target;
- Repeat is a large icon control;
- touching the dog immediately names/reacts to it;
- no Check Answer button;
- no score, stars, mastery meter or failure state.

Human judgment:
- Did the child understand that the dog can be touched without instruction?
- Is the target comfortably larger than a normal app button?
- Is the response immediate enough to feel causal?

Mark: `APPROVE / NEEDS WORK`

### 2. Touch & Discover — Bell

Expected:
- one very large bell target;
- immediate bell naming/reaction;
- Shaitanu micro-reaction feels playful rather than punitive;
- no mastery/assessment framing.

Mark: `APPROVE / NEEDS WORK`

### 3. Listen & Find — Dog vs Cow

Expected:
- exactly two very large visual candidates;
- visible text labels are not required;
- correct position is not a fixed authoring position;
- Repeat remains reachable as an icon.

First deliberately choose the wrong animal once.

Expected wrong path:
- no failure modal;
- no dead end;
- Scientu gives a small "look again" scaffold;
- the same two pictures become usable again in place after the short reaction;
- the child can then choose the dog and continue.

Human judgment:
- Does wrong feedback feel like "try the picture again" rather than failure?
- Is the delay short enough that the child remains in control?

Mark: `APPROVE / NEEDS WORK`

### 4. Listen & Find — Earth vs Sun

Expected:
- two large visuals;
- spoken prompt is sufficient;
- Earth is a reviewed concept reused by older-child surfaces rather than toddler-only truth.

Mark: `APPROVE / NEEDS WORK`

### 5. Place / Match — Dog

Expected:
- one large draggable dog;
- two large destination pictures;
- dragging near the correct destination should snap forgivingly;
- a wrong placement returns gently rather than showing a failure screen;
- select-then-place also works as a lower-precision accessibility path.

Human judgment:
- Can the child place without pixel-perfect aim?
- Does the object clearly return/reappear after a wrong action?

Mark: `APPROVE / NEEDS WORK`

### 6. Place / Match — Apple

Repeat the same motor review with apple/orange visuals.

Mark: `APPROVE / NEEDS WORK`

### 7. Concrete contrast — Full / Empty

Expected:
- two large bucket states are visibly different;
- the task is learned by seeing the amount/state, not by reading a definition;
- no text label is needed to distinguish the two states.

Human judgment:
- Can a non-reader distinguish the states reliably?
- Is the static image still unambiguous with motion disabled?

Mark: `APPROVE / NEEDS WORK`

### 8. Cause / Effect — Empty → Full

Expected:
- one large empty bucket;
- touch visibly changes it to a full bucket;
- Scientu reacts to the state change;
- there is no "correct/incorrect" quiz framing.

Mark: `APPROVE / NEEDS WORK`

## B. Audio-off fallback

Return to a Listen & Find activity and turn sound off using the speaker icon.

Expected:
- the target semantic visual appears as a compact visual clue;
- the child can still complete the interaction without reading;
- no network/audio error is exposed as a blocking child state.

Mark: `APPROVE / NEEDS WORK`

## C. Reduced-motion/static meaning

Enable OS/browser reduced motion and repeat Full/Empty plus one visual-choice activity.

Expected:
- semantic meaning remains visible when motion is effectively removed;
- controls and reactions do not depend on animation to communicate state.

Mark: `APPROVE / NEEDS WORK`

## D. Picture Play — Visual Scene Choice

Exit First Play, remain in **Play**, launch the puzzle-piece **Picture Play** card.

Review at least:
- 3-choice animal scene: Dog / Cow / Rabbit;
- 4-choice transport scene: Bus / Train / Ship / Aeroplane;
- one sense-organ scene;
- one plant or food-source scene.

Expected:
- pictures dominate the viewport;
- 3–4 choices remain comfortably tappable at 360×640;
- labels, when shown, are secondary rather than the main clue;
- choosing an option immediately commits the action—there is no second submit button;
- one deliberate wrong answer recovers in place with the same safe scaffold.

Mark: `APPROVE / NEEDS WORK`

## E. Which Doesn't Belong?

Continue Picture Play until **Which one doesn't belong?** appears.

Review at least four semantic families, including transport, communication, human senses and plants/food/animals.

For every reviewed set ask the grown-up reviewer, not the child:
1. Is there one explicit comparison dimension?
2. Do exactly three items satisfy that dimension?
3. Is exactly one item defensibly outside it?
4. Could a second answer reasonably be defended? If yes, mark NEEDS WORK.
5. Does the odd item move between visible positions over repeated replays?

The production manifest also carries candidate-level canonical evidence refs; human review is checking the child-facing defensibility, not replacing that evidence.

Mark: `APPROVE / NEEDS WORK`

## F. Accessibility / motor review

Check:
- Repeat, Back, sound and Next/Replay all have accessible names;
- keyboard focus is visible in browser;
- every primary First Play target is materially larger than 44×44 px;
- two-choice targets are substantially larger than the 3–4 choice targets;
- no precision drag is required for basic completion;
- no interaction depends on reading a label;
- screen-reader names remain available even where visual text labels are hidden.

Mark: `APPROVE / NEEDS WORK`

## G. Persistence truth

After completing the whole First Play sampler, open grown-up progress.

Expected:
- First Play exploration/guided actions have not created mastery evidence or changed canonical knowledge state;
- Picture Play uses the existing canonical evaluator for feedback but this bounded sampler does not introduce progress writes, a second evidence model or a separate store;
- there is no First-Play-specific progress store or currency.

Mark: `APPROVE / NEEDS WORK`

## H. Packaged Android / offline review

Use the PR Android debug APK from the green `Android Debug APK` workflow.

1. Install the APK.
2. Launch once with networking available, then fully kill the app.
3. Disable Wi-Fi/mobile data.
4. Relaunch the packaged app.
5. Enter Play → First Play.
6. Complete Touch & Discover, Listen & Find, a placement, Full/Empty and Empty→Full.
7. Rotate once if the test device permits rotation, then return to portrait.
8. Kill and relaunch once more offline.

Expected:
- all visuals and interaction logic remain local;
- First Play remains usable offline;
- missing/disabled voice degrades to the visual clue/text accessibility path rather than a blocked activity;
- no remote asset is required for the sampler.

Mark: `APPROVE / NEEDS WORK`

## Automated evidence that must be green before human approval

On PR #247 verify:
- `Windows Check` — full `npm run check` green;
- `Browser Smoke` — build + Playwright green, including `e2e/first-play-visual-choice.spec.ts`;
- `Android Debug APK` — web validation/build, Capacitor package, debug APK and packaged offline relaunch smoke green.

Focused invariants are in:
- `tests/first-play-production.behavior.test.ts`;
- `tests/visual-choice-production.behavior.test.ts`;
- existing First Play policy/runtime/semantic-choice/drag-snap tests.

## Final human gate

Only mark Agent A human acceptance complete when all of the following are true:
- an actual roughly 2–3-year-old child can progress through the First Play sampler with no reading and minimal/no adult coaching;
- targets and drag tolerance are comfortable on the physical device;
- wrong actions feel safe and recoverable;
- character reactions help rather than distract;
- full/empty and cause/effect meanings remain obvious without animation;
- the grown-up reviewer finds no ambiguous odd-one-out set;
- offline packaged Android behavior is acceptable.

Record final result here only after that review:

`HUMAN FIRST PLAY ACCEPTANCE: PENDING`

`HUMAN VISUAL-CHOICE ACCEPTANCE: PENDING`
