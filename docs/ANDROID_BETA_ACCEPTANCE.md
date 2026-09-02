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

## Select one exact beta APK

The Android workflow runs automatically for pushes to both `main` and `kidsplay`, for pull requests targeting `main`, and by manual dispatch. For a final #33 physical-device acceptance attempt, select a **successful current-`main` Android run** rather than mixing binaries from different commits.

Only after the packaged offline/relaunch/rotation smoke succeeds, that run uploads:

- `kidsplay-debug-apk` — the exact APK that passed the automated Android gate;
- `kidsplay-android-beta-release-identity` — `android-beta-release-identity.json` binding that APK to the exact `commitSha`, `workflowRunId`, APK `artifactId`, package id and APK SHA-256 digest.

Copy the generated `release` object unchanged into every physical-device evidence record for that acceptance attempt. All final records must refer to the same release identity. A generated identity proves which binary was selected; it **does not** prove any physical-device observation and must never populate `qa/android-beta-acceptance/evidence/` automatically.

If `main` advances before physical testing starts, use the newer successful `main` Android run instead. Once physical testing has started for a candidate, keep that release identity fixed for the whole acceptance set; fixes require a new candidate and new immutable evidence records.

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

## Bind evidence to the workflow-generated APK identity

A self-consistent evidence set can still be wrong if the same mistyped commit/run/artifact/hash was copied into every record, or if the identity JSON and APK came from different downloads. Before any #33 closure claim, download both `android-beta-release-identity.json` and `app-debug.apk` from the **same successful current-`main` Android run whose APK was selected for physical testing**, then run the release-binding validator:

```bash
node scripts/validate-android-beta-release-binding.mjs \
  --release-identity <downloaded-path>/android-beta-release-identity.json \
  --apk <downloaded-path>/app-debug.apk \
  --dir qa/android-beta-acceptance/evidence \
  --require-complete-suite
```

This command first applies the existing physical-evidence suite validation, then requires every evidence record's entire `release` object to exactly match the workflow-generated identity, and finally hashes the downloaded APK bytes and requires that SHA-256 to match `release.apk.sha256`. The identity file may sit inside the evidence directory; the validator excludes the exact `--release-identity` path from the device-record scan.

This closes the machine-checkable record/identity/APK-byte gap only. It still cannot establish that the selected workflow run came from `main` by itself, that the verified APK was actually installed on the named physical hardware, or that a human performed the observations. Those remain explicit tester/release-selection responsibilities.

## Closure rule

Issue #33 may close only when the final evidence directory passes `--require-complete-suite`, the same records and downloaded APK pass `validate-android-beta-release-binding.mjs` against the downloaded identity from the selected current-`main` run, **and** all required observations were genuinely performed on physical devices. Repository validation proves that the records are internally complete and bound to the selected generated identity/APK bytes; it does not prove that a human observation actually happened.
