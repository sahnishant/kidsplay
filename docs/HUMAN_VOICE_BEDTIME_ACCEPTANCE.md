# HUMAN acceptance — bundled voice + Stories V1

Use the exact candidate build from `feat/bundled-voice-stories-v1`. This checklist is intentionally HUMAN-only. Machine generation, duration measurement, manifest validation, browser tests, or Android packaging must not be treated as approval for the items below.

## Candidate pack under review

The branch now contains the complete bounded V1 candidate pack, generated reproducibly by `scripts/generate-bundled-voice-candidates.py` and measured in `content/audio/kidsplay-v1-candidate-manifest.json`:

- 39 real spoken Ogg/Opus candidate clips;
- 676,114 total bundled bytes;
- 669,334 ms measured total duration;
- all 27 narration beats for the four Stories V1 manuscripts;
- 12 non-story candidates covering Dheu/Scientu/Shaitanu reactions, common success/retry, Forest prompts, pre-reader vocabulary and phoneme;
- every candidate has a stable utterance ID, measured duration, byte count and SHA-256;
- every candidate remains `reviewStatus: candidate`; the runtime approved map is empty until HUMAN promotion.

Measured story narration in this exact candidate pack:

| Story | Beats | Measured duration | Bundled bytes |
| --- | ---: | ---: | ---: |
| The Moonlit Leaf | 9 | 252.539 s (~4:13) | 256,946 |
| The Quiet Backpack | 9 | 278.382 s (~4:38) | 279,397 |
| Shaitanu and the Wobbly Cape | 4 | 45.939 s | 45,935 |
| Scientu’s Tiny Question | 5 | 57.674 s | 58,505 |

## 1. Preschool voice quality

- [ ] Listen to Dheu success + retry candidates on a phone speaker at normal child volume.
- [ ] Listen to Scientu success + retry candidates.
- [ ] Listen to Shaitanu success + retry candidates.
- [ ] Confirm each voice is warm, clear, playful and comfortable for roughly age 2–5.
- [ ] Confirm there is no harshness, robotic clipping, frightening tone, or adult/hoarse presentation.
- [ ] Confirm character identities are distinguishable without becoming exaggerated or distracting.

Decision: **PENDING HUMAN**

## 2. Prompt / pre-reader voice

- [ ] Listen to common success/retry cues.
- [ ] Listen to both representative Forest prompts.
- [ ] Listen to the vocabulary and phoneme candidates.
- [ ] Confirm the phoneme is educationally usable and not distorted by the candidate codec/voice.
- [ ] Confirm short prompts are understandable without reading the screen.

Decision: **PENDING HUMAN**

## 3. Stories narration

- [ ] Open Stories at approximately 360×640.
- [ ] Listen to all pages of both bedtime candidates at least once before approving the narrator identity.
- [ ] Read/listen to both tiny tales.
- [ ] Confirm pace is calm enough for bedtime and not tiring or uncanny.
- [ ] Confirm Read to me, Repeat page, Back, Next, favourite and Replay feel child-usable.
- [ ] Confirm completion is quiet: no score, XP, streak or celebration explosion.
- [ ] Kill/relaunch while part-way through a story, reopen Stories, and confirm the exact saved page resumes.
- [ ] Confirm sound preference survives relaunch.

Decision: **PENDING HUMAN BEDTIME CX**

## 4. Manuscript editorial publication

The existing manuscripts remain `editorialStatus: draft`. This branch does not promote them.

- [ ] Editorial reviewer approves each manuscript intended for publication.
- [ ] Any requested manuscript changes are reviewed separately from audio integration.

Decision: **PENDING HUMAN EDITORIAL**

## 5. Offline Android acceptance

- [ ] Install the packaged Android build fresh.
- [ ] Enable airplane mode before launching.
- [ ] Launch Kidsplay and open Stories.
- [ ] Verify narration uses only a HUMAN-approved bundled clip or an explicitly installed offline device voice; otherwise the visible text remains usable with no network dependency.
- [ ] Kill the process in airplane mode and relaunch.
- [ ] Confirm Stories resume and sound preference remain intact.
- [ ] Repeat after device reboot if this is the release-candidate build.

Decision: **PENDING HUMAN DEVICE ACCEPTANCE**

## Promotion rule

Candidate assets must remain `reviewStatus: candidate` until the corresponding HUMAN voice identity/quality decision is approved. Only then may a reviewed asset be changed to `approved`, which is the state that makes the runtime prefer its bundled clip over an installed offline device voice.
