# Kidsplay Android

Android is the shipping target. Routine development remains browser/Node first; the Android wrapper is generated/synced through Capacitor and built in CI.

## Build and sync

```powershell
npm ci
npm run check
npm run android:sync
```

To open the generated project locally when Android Studio is installed:

```powershell
npm run android:open
```

The GitHub Android workflow validates the web/content runtime, syncs Capacitor, runs Gradle `assembleDebug` and uploads a debug APK artifact. Use the exact-head artifact referenced by GitHub issue #33 for beta device acceptance rather than an untracked local build.

## Automated platform gates

The permanent release proof includes:

- Windows `npm ci` + unchanged `npm run check` on `windows-latest`;
- Browser Smoke with Playwright child journeys;
- Android debug APK build through Capacitor + Gradle.

Playwright additionally exercises Android-like 360px touch/layout pressure, 44px core target sizes, reduced-height name entry, horizontal-overflow checks and portrait→landscape mock rotation. These tests are useful proxies; they do **not** replace physical-device observation.

## Real-device acceptance

GitHub issue #33 is the canonical beta-device checklist. Test at minimum:

- one common small/medium Android phone around 360–400 CSS px portrait width;
- one larger phone or tablet;
- a lower/mid-range device if available;
- an Android device with network disabled for packaged-offline/relaunch cases.

Record device model, Android version, screen size/resolution and relevant animation/reduced-motion settings.

### Core journeys

1. Fresh install → child name/avatar setup → return to Home.
2. Free Explore → visual single-choice plus other interaction families → feedback.
3. Story World → Puppy by the Pond → mission reward/unlock → relaunch.
4. SOF 35-question mock → answer → process kill → exact resume; also kill after submit/before Next.
5. Network disabled before launch → profile, Free Explore, story and mock resume remain usable from packaged assets/local storage.
6. Reduced-motion/animation accessibility setting → all tasks remain understandable without motion.
7. Portrait layout stress plus one rotation on a supported device/tablet.

### Defect capture

For every blocker/major/minor/polish finding record:

- journey/question/mission;
- device and Android version;
- screenshot or short recording;
- expected vs actual;
- severity;
- reproducibility.

Create focused bug issues/branches from the certified base. Do not use device acceptance as a reason to redesign the completed data/formatter/engine architecture.

## Exit boundary

Device acceptance is complete only after physical observation confirms no blocker/major defect in first-run, Free Explore, Story World, long-mock resume or packaged offline relaunch; no core journey requires precision tapping/zooming; persistence survives process kill; and reduced-motion remains fully usable.
