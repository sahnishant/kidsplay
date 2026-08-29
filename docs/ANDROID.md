# Android target and local development

Android is the primary shipping target, but Android infrastructure is **not** part of the normal local development loop.

## Normal desktop development

Prerequisite:

- Node.js 22+ (includes npm)

That is enough to edit questions, learnables, scenes, interaction engines, mechanics, evaluation and UI on a normal desktop browser.

```bash
git switch kidsplay
npm install
npm run dev
```

For the same validation/build checks used before Android packaging:

```bash
npm run check
```

These commands do not require Android Studio, an Android SDK, JDK/Java, Gradle, an emulator, ADB, or a connected Android phone.

## Why this works

The learner application is browser-native TypeScript/DOM/SVG/CSS. Capacitor is only the packaging boundary. Therefore almost all product work is testable in Chrome/Edge/Firefox on the desktop, while GitHub Actions provides continuous native Android proof.

## Optional local Android setup

Install this tooling only when you specifically need to inspect/run the native wrapper locally:

- Android Studio / Android SDK
- JDK compatible with the generated Capacitor Android project

Then:

```bash
npm run android:add
npm run android:sync
npm run android:open
```

`android:add` is a one-time command for a checkout that does not already contain the generated `android/` project.

Before opening Android after browser/content changes:

```bash
npm run android:sync
npm run android:open
```

## CI strategy

The GitHub workflow generates the Capacitor Android project, compiles a debug APK, and uploads it as a workflow artifact. This lets us continuously prove that the lightweight browser runtime still packages for Android without forcing every developer machine to carry the Android toolchain.

Once native Android customization becomes meaningful (signing, splash, notifications, billing, deep links, custom plugins), commit the `android/` project and treat it as first-class source. Even then, most interaction/content development should remain browser-first.
