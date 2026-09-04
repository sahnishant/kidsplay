# Dheu, Scientu and Shaitanu — Character Persona Bible V1

This document is the human-readable companion to `content/story/characters.json`. The machine-readable persona file is canonical for supported in-app angles, poses, expressions and motions; this document explains the creative intent.

## Product rule

These are recurring characters inside Kidsplay, not mascots pasted beside quiz text. Their face, silhouette, body language and dialogue should communicate who is speaking before the child reads the name.

The learning engine remains separate. Character presentation may react to truth, retry state and world changes, but it must never change evaluation, mastery, curriculum placement or provenance.

## Dheu — the emotional centre

**Core:** curious, brave, kind, playful, observant.

Dheu is the child inside the adventure. Dheu notices the rabbit that looks lost, the leaf that moved, the sign that feels wrong, or the tiny tunnel before anyone explains what it means. Dheu is allowed to be confused, to change an idea, to ask for another try and to celebrate loudly.

### Face and silhouette

- Tousled dark hair with a small leaf pin.
- Large warm eyes and open brows; facial expressions should read at 40–60px character size.
- Small explorer backpack and rolled kit create the silhouette from the back/side.
- Orange neckerchief plus yellow/green explorer clothes make Dheu distinct from the science-blue and trickster-purple characters.
- No adult explorer equipment or military styling.

### Speech

Short, immediate and childlike. Dheu reacts before explaining.

Good territory:

- “Wait…”
- “Look!”
- “Ooh! A tiny tunnel.”
- “Can we try again?”
- “That clue clicked!”

Avoid:

- curriculum summaries;
- “I will classify…” / “I will identify…” constructions;
- teacher praise;
- narration that makes the saved child name sound like an adult instructor.

### Body language

Dheu leans toward clues, tilts the head when uncertain, crouches to help, jumps on discovery, claps on a genuine win and can recoil or look back at the puzzle after a miss.

## Scientu — the eccentric science buddy

**Core:** inventive, curious, kind, slightly nerdy, patient.

Scientu is delighted by evidence. He is not the answer-key voice. He should create curiosity through observation and hypothesis, then explain briefly after the child has had the discovery.

### Face and silhouette

- Round teal glasses are the strongest facial identifier.
- Goggles live above the hairline and can visually bounce or be adjusted.
- Compact white/teal lab-explorer coat, never a stern adult lab uniform.
- Small gadget backpack, lens and tools provide inspect/help poses.
- Aha expressions should open the whole face; thinking should narrow/tilt rather than become sad.

### Speech

Good territory:

- “Hmm…”
- “What do you notice?”
- “Aha!”
- “That clue changes things.”
- “Wait. Look at the feet.”

Scientu may admit uncertainty. Dheu may notice something first.

Avoid:

- multi-sentence lectures;
- giving away an answer before the interaction;
- generic adult praise such as “Excellent work, learner.”

### Body language

Inspect with a lens, point at an important detail, adjust/tilt toward a clue, bounce on an aha moment, extend a tool/helping hand and occasionally get so excited by an observation that Shaitanu cuts him short.

## Shaitanu — the affectionate chaos agent

**Core:** mischievous, clever, playful, theatrical, secretly helpful.

Shaitanu is a rival and troublemaker, not a villain and not the universal wrong-answer marker. If everything Shaitanu says is false, children can answer by character rather than evidence. Therefore Shaitanu must sometimes notice a true detail, help reluctantly, be correct for the wrong reason or become genuinely impressed by Dheu.

### Face and silhouette

- Purple hair with a strong orange streak.
- Expressive asymmetric brows do most of the comedy.
- Slightly pointed playful ears, one tiny fang, short dynamic cape.
- Purple/orange costume reads immediately against the other two palettes.
- Keep the face funny and impish, never demonic/scary.

### Speech

Good territory:

- “Heh-heh.”
- “Bet you can’t.”
- “Fine, fine.”
- “That was annoyingly clever.”
- “Nobody touch the signs. Apparently I am ‘not allowed’ to improve them anymore.”

Avoid:

- cruel teasing;
- threats;
- humiliation after a miss;
- always being wrong;
- lesson-summary language.

### Body language

Wicked chuckle, smug lean, arms crossed, cape swish, sneak/pop-in, mock shock, fake innocence, theatrical recoil, sulky defeat and reluctant helping. Even when he loses, the motion should preserve playful dignity rather than make him pathetic.

## Relationship chemistry

### Dheu ↔ Scientu

Curious kid plus science buddy, not pupil plus teacher. Scientu respects Dheu’s observations. Dheu can challenge a hypothesis.

### Dheu ↔ Shaitanu

Competitive affection. Shaitanu wants to make the challenge interesting and secretly enjoys being outsmarted. Dheu pushes back without insulting him.

### Scientu ↔ Shaitanu

Long-running comic rivalry. Scientu checks shortcuts; Shaitanu interrupts over-explanation. Their exchanges can carry jokes without making the child the target.

## In-app angle vocabulary

V1 uses lightweight SVG/CSS transformations and expression geometry rather than sprite sheets or a heavyweight skeletal animation runtime.

Supported authored angles:

- `front`
- `three-quarter-left`
- `three-quarter-right`
- `side-left`
- `side-right`

The two right-facing states mirror the canonical SVG while eye/face simplification gives side views a distinct read. Future art can replace individual states without changing the story contract.

## Pose vocabulary

- `neutral`
- `inspect`
- `help`
- `action`
- `proud`
- `thinking`

These are semantic poses, not frame numbers. Story content asks for intent; the renderer owns the drawing.

## Motion vocabulary

The motion layer is intentionally small and offline-safe:

- idle/bob
- float
- bounce/jump/celebrate
- head tilt/think
- lean-in/inspect/point/help
- wiggle/chuckle
- sneak
- pop-in
- recoil/oops
- cape swish
- clap

`prefers-reduced-motion: reduce` removes animation while preserving the selected angle, pose and expression.

## Forest Explorer Level 1 proof

Forest Level 1 is the first production proof for the richer system.

Opening choreography:

1. **Shaitanu** wicked-laugh/chuckle: admits moving the signs and notices Rabbit is confused.
2. **Scientu** inspect/thinking: proposes distrusting the signs and reading the forest itself.
3. **Dheu** determined/action: chooses Rabbit first and starts the adventure.

During the session, the reaction director can give Dheu a confused first-miss reaction, Scientu a helping retry clue, Dheu/Scientu a recovery celebration, or Shaitanu a reluctant compliment on a difficult correct clue.

The ending gives Shaitanu the callback so the restored sign changes his relationship to the child rather than ending with an assessment summary.

## Audio boundary

Character motion and writing do not require cloud speech. `childAudio.ts` remains responsible for bundled/local-offline playback. These personas should eventually guide bundled voice direction:

- Dheu: bright, quick, warm, childlike.
- Scientu: curious, measured, delighted on discoveries.
- Shaitanu: energetic, theatrical, mischievous, never sinister.

Bundled authored lines should be preferred for signature laughs, gasps, chuckles, “aha” moments and recurring callbacks; offline TTS remains a fallback for dynamic text.
