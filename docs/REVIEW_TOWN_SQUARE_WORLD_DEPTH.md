# Town Square world-depth human acceptance gate

Issue: #198 · pass 111 Town Square transfer · pass 112 Scientu Lab is gated behind this review.

## Engineering state

Town Square is implemented as a bounded transfer of the Forest world-depth architecture:

`problem → character beat → 3+ actions → scaffold → world change → ending → persistent changed Town`

It uses the existing story mission/progress authority, G2 assembly interaction, practical-life/cause-effect world actions, Discovery Book projection and canonical local learning evidence. It does **not** introduce a Town evaluator, Town progress store, currency, or a separate game engine.

Automated coverage must prove:

- one Town location, not a duplicate Town map;
- five actions across at least three interaction families;
- honest in-place assembly retry preserving first-attempt evidence;
- a safety review cue selected from existing canonical attempt evidence, with failed/assisted evidence prioritised;
- zero quiz questions for the world-action mission;
- persistent Town consequences reconstructed after serialized story-progress relaunch;
- deterministic Town place + Adventure Mail discoveries with no replay farming;
- Lab world-depth content remains unavailable while this gate is pending.

## Human gate — must be completed before pass 112 Lab content is authored or activated

Status: **PENDING HUMAN ACCEPTANCE**

### 360 × 640 child viewport

- [ ] Open Town Square at exactly 360 × 640 CSS pixels.
- [ ] Header, world state, current action and primary target remain usable without clipped controls.
- [ ] Every child action target is comfortably tappable; no required target is hidden under chrome.
- [ ] The child can recover from a wrong assembly placement without leaving the mission.
- [ ] The adaptive safety cue reads as part of the adventure, not as a weakness/mastery dashboard.
- [ ] The final Town consequence is visually obvious before returning to the world map.

### Android offline + relaunch

- [ ] Install/use the Android build with network disabled.
- [ ] Start Town Square and complete the mission offline.
- [ ] Force-stop/process-kill after completion, relaunch offline, and confirm the restored crossing/community corner remains visible.
- [ ] Open Discovery Book offline and confirm Town Square + Adventure Mail are present exactly once.
- [ ] Replay Town offline and confirm no duplicate reward/discovery is minted.

### Interaction-family acceptance

- [ ] Repair/assembly is understandable without reading long instructions.
- [ ] Road-safety action is understandable and does not reveal a wrong answer as decoration.
- [ ] Recycling/sorting and pack/place/help actions feel meaningfully different in context.
- [ ] Cause/effect rain-channel action visibly changes the Town object/state.
- [ ] At least three interaction families feel distinct enough to a child reviewer; if they feel like repeated buttons, revise Town before Lab.

### Real child-CX acceptance

Run with a real child in the intended age range and record observations, not coaching-driven success.

- [ ] Child can identify what to do after the character beat with minimal adult explanation.
- [ ] Child can complete or recover from each action without accidental navigation.
- [ ] Retry/scaffold language helps rather than frustrates.
- [ ] Town feels like a place being repaired/helped, not five disconnected questions.
- [ ] Persistent changed Town is noticed on return/relaunch.
- [ ] Child response to the Adventure Mail reward is positive/understandable.

Reviewer/date/device notes:

- Reviewer:
- Date:
- Android device/build:
- Child age band:
- 360 × 640 capture/reference:
- Observed blockers:
- Accepted changes:

## Pass 112 — Scientu Lab hold

Do **not** copy the Town recipe into Lab merely because automated checks are green. Pass 112 starts only after every required Town human gate above is accepted.

When opened, Lab must use the same shared world-depth resolver and existing mechanics for assemble/build, float/sink, magnets, fill/empty and state-change experiments. The child loop should remain `prediction → action → consequence`, with science entries projected into the existing Discovery Book. No Lab-specific evaluator or science progress store is permitted.
