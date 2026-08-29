# Android development

Android is the primary app target.

## Prerequisites

- Node.js 22+
- Android Studio / Android SDK
- JDK compatible with the generated Capacitor Android project

## First local setup

```bash
git switch kidsplay
npm install
npm run check
npm run android:add
npm run android:sync
npm run android:open
```

`android:add` is a one-time command for a checkout that does not already contain the generated `android/` project.

## Normal development

```bash
npm run dev
```

Before opening Android after web/content changes:

```bash
npm run android:sync
npm run android:open
```

## CI strategy

The GitHub workflow generates the Capacitor Android project, compiles a debug APK, and uploads it as a workflow artifact. This lets us verify Android continuously while the native wrapper is still mostly generated code.

Once native Android customization becomes meaningful (signing, splash, notifications, billing, deep links, custom plugins), commit the `android/` project and treat it as first-class source.
