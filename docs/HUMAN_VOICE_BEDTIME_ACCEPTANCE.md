# HUMAN acceptance — bundled voice + Stories V1

Use the exact candidate build from `feat/bundled-voice-stories-v1`. This checklist is intentionally HUMAN-only. Machine generation, duration measurement, manifest validation, browser tests, or Android packaging must not be treated as approval for the items below.

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
- [ ] Read/listen to at least one complete bedtime story and both tiny tales.
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
- [ ] Verify narration uses only an approved bundled clip or an explicitly installed offline device voice; otherwise the visible text remains usable with no network request.
- [ ] Kill the process in airplane mode and relaunch.
- [ ] Confirm Stories resume and sound preference remain intact.
- [ ] Repeat after device reboot if this is the release-candidate build.

Decision: **PENDING HUMAN DEVICE ACCEPTANCE**

## Promotion rule

Candidate assets must remain `reviewStatus: 'candidate'` until the corresponding HUMAN voice identity/quality decision is approved. Only then may a reviewed asset be changed to `approved`, which is the state that makes the runtime prefer its bundled clip over an installed offline device voice.
