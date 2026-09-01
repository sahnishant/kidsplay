# Android real-device beta acceptance

Issue #33 is the release-quality gate for physical Android observation. Emulator, Playwright and packaged-offline CI remain necessary regression evidence, but they **cannot** satisfy this gate by themselves.

## Acceptance law

A final acceptance set must prove all of the following on physical Android hardware:

- every journey `A` through `G` has a passing observation;
- the device set covers `small_phone`, `large_phone_or_tablet`, `low_mid_range` and `offline` roles;
- offline/relaunch behavior is explicitly exercised with networking disabled before launch;
- reduced-motion / Android animation-accessibility behavior is explicitly exercised where supported;
- portrait layout is observed and rotation is exercised at least once;
- no unresolved `blocker` or `major` defect remains;
- remaining `minor` / `polish` defects are linked to focused GitHub issues;
- the tested APK is tied to an exact commit SHA, workflow run/artifact and SHA-256 digest.

Do not commit child names, faces, recordings or other personal data. Evidence references should point to privacy-safe issue attachments or non-sensitive artifacts. The machine-readable records are for release facts and observations, not child identity.

## Device coverage roles

A device record may satisfy more than one role.

- `small_phone`: common phone whose effective portrait CSS width is approximately 360–400 px.
- `large_phone_or_tablet`: larger phone/tablet used to expose scaling and rotation defects.
- `low_mid_range`: hardware representative of lower/mid-range performance.
- `offline`: network is disabled before launch for the offline/recovery journey.

A two-device set can satisfy all four roles when, for example, the small phone is also low/mid-range and used offline.

## Journey IDs

The durable journey IDs match issue #33:

- `A` — first-run/player setup
- `B` — Free Explore
- `C` — Story World
- `D` — SOF goal + long mock resume
- `E` — offline/recovery
- `F` — motion/accessibility
- `G` — layout stress / rotation / soft keyboard

Use the issue text as the detailed manual checklist. The evidence record stores the result, observations and defect links; it does not replace the human observation.

## Recording evidence

Copy `qa/android-beta-acceptance/template.json` to a new JSON file per physical device/session. Keep records immutable after they are used for a release claim; add a new record for a retest after fixing a defect.

Each final record must include:

1. exact tested release identity (`commitSha`, APK run/artifact, SHA-256);
2. physical device facts and coverage roles;
3. the journeys actually observed on that device;
4. explicit network / reduced-motion / rotation facts where applicable;
5. defects with severity, reproducibility, expected/actual behavior, evidence references and tracking issue;
6. tester/date attestation that this was direct physical-device observation.

Validate one record:

```bash
node scripts/validate-android-beta-evidence.mjs --file qa/android-beta-acceptance/evidence/<record>.json
```

Validate the complete acceptance set:

```bash
node scripts/validate-android-beta-evidence.mjs --dir qa/android-beta-acceptance/evidence --require-complete-suite
```

The suite validator intentionally fails when evidence is incomplete. Do not weaken it to turn CI/emulator proof into physical acceptance.

## Closure rule

Issue #33 may close only when the final evidence directory passes `--require-complete-suite` **and** all required observations were genuinely performed on physical devices. Repository validation proves that the record is internally complete; it does not prove that a human observation actually happened.
