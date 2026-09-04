# HUMAN acceptance — bundled voice + Stories V1

**Decision recorded: APPROVED by HUMAN owner on 2026-09-04.**

The immutable source evidence remains candidate/draft provenance. Production promotion is represented by source-pinned approval records:

- `content/audio/kidsplay-v1-human-approval.json` pins the exact reviewed audio manifest and activates the approved bundled runtime path;
- `content/stories/v1-human-approval.json` pins the exact manuscript source and promotes only the four approved story IDs to effective `editorialStatus: reviewed`;
- future regenerated audio or future draft manuscripts require a separate HUMAN approval and cannot inherit this decision silently.

## Approved voice pack

The approved bounded V1 pack was generated reproducibly by `scripts/generate-bundled-voice-candidates.py` and measured in `content/audio/kidsplay-v1-candidate-manifest.json`:

- 39 real spoken Ogg/Opus clips;
- 676,114 total bundled bytes;
- 669,334 ms measured total duration;
- all 27 narration beats for the four Stories V1 manuscripts;
- 12 non-story clips covering Dheu/Scientu/Shaitanu reactions, common success/retry, Forest prompts, pre-reader vocabulary and phoneme;
- every clip has a stable utterance ID, measured duration, byte count and SHA-256.

Measured story narration:

| Story | Beats | Measured duration | Bundled bytes |
| --- | ---: | ---: | ---: |
| The Moonlit Leaf | 9 | 252.539 s (~4:13) | 256,946 |
| The Quiet Backpack | 9 | 278.382 s (~4:38) | 279,397 |
| Shaitanu and the Wobbly Cape | 4 | 45.939 s | 45,935 |
| Scientu’s Tiny Question | 5 | 57.674 s | 58,505 |

## 1. Preschool voice quality

- [x] Dheu success + retry approved.
- [x] Scientu success + retry approved.
- [x] Shaitanu success + retry approved.
- [x] Voices approved as warm, clear, playful and comfortable for roughly age 2–5.
- [x] No blocking harshness, robotic clipping, frightening tone, or adult/hoarse presentation found.
- [x] Character identities approved as distinguishable without being excessively distracting.

Decision: **APPROVED**

## 2. Prompt / pre-reader voice

- [x] Common success/retry cues approved.
- [x] Representative Forest prompts approved.
- [x] Vocabulary and phoneme candidates approved.
- [x] Phoneme accepted as educationally usable.
- [x] Short prompts accepted as understandable without depending on screen reading.

Decision: **APPROVED**

## 3. Stories narration and bedtime CX

- [x] Stories reviewed at approximately 360×640.
- [x] Both bedtime stories reviewed with all pages narrated.
- [x] Both tiny tales reviewed.
- [x] Narration pace accepted for the V1 bedtime experience.
- [x] Read to me, Repeat page, Back, Next, favourite and Replay accepted.
- [x] Quiet completion accepted: no score, XP, streak or celebration explosion.
- [x] Exact saved-page process-relaunch behavior accepted.
- [x] Persistent sound preference accepted.

Decision: **APPROVED**

## 4. Manuscript editorial publication

The source manuscripts remain immutable `editorialStatus: draft` evidence. The HUMAN approval overlay promotes exactly these four IDs to effective `reviewed` publication state:

- [x] `story.dheu.moonlit-leaf`
- [x] `story.friends.quiet-backpack`
- [x] `story.shaitanu.cape-trouble`
- [x] `story.scientu.tiny-question`

Decision: **APPROVED FOR V1 PUBLICATION**

## 5. Offline Android acceptance

- [x] Packaged Android behavior accepted.
- [x] Airplane-mode Stories behavior accepted.
- [x] Narration fallback contract accepted: approved bundled clip → explicitly installed offline/local voice → visible text.
- [x] Process-kill/relaunch resume accepted.
- [x] Sound-preference persistence accepted.

Decision: **APPROVED**

## Promotion rule after V1

This approval is deliberately source-pinned. New audio generations, replacement clips, new story manuscripts, or manuscript edits are not automatically approved. They must produce new review evidence and receive a new HUMAN approval record before the child runtime can prefer/publish them.
