# Kidsplay

Android-first educational play system with a strict separation between **question/content data** and **delivery engines**.

## Current direction

- Android is the primary shipping target.
- Web technology is used for low-cost iteration: TypeScript + browser-native DOM/SVG/CSS.
- Capacitor packages the same runtime as an Android app.
- Questions, learnables, scenes and learning packs live as data.
- Interaction engines contain no curriculum answers or paid/free logic.
- The first engine set is deliberately small: single choice, word-bank fill and drag-to-target.
- No general-purpose game engine is included yet. Phaser/KAPLAY can be introduced only for mechanics that justify them.

## Run

```bash
npm install
npm run dev
```

## Validate and build

```bash
npm run check
```

## Android

```bash
npm run android:add
npm run android:sync
npm run android:open
```

See `docs/ANDROID.md`, `docs/ARCHITECTURE.md`, and `docs/OPEN_SOURCE_RESEARCH.md`.
