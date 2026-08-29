# Kidsplay

Android-first educational play system with a strict separation between **question/content data** and **delivery engines**.

## Current direction

- Android is the primary shipping target.
- Normal development is desktop/browser-first: **Svelte 5 + TypeScript + Vite**, using browser-native DOM/SVG/CSS underneath.
- Svelte is only the UI/presentation layer. Content contracts, evaluation, generators, learning logic and reusable mechanics remain framework-independent TypeScript/data.
- **Android Studio, Android SDK, Java, Gradle, an emulator, and a phone are not required for ordinary local development.**
- Capacitor packages the same browser runtime as Android when we need a native build.
- GitHub Actions can build the Android APK so contributors can stay on the lightweight desktop loop.
- Questions, learnables, scenes and learning packs live as data.
- Interaction engines contain no curriculum answers or paid/free logic.
- Current interactions on this branch include single choice, word-bank fill, drag-to-target, word search and relationship-based memory pairs.
- Memory pairs are semantic: `DOG ↔ PET ANIMAL`, `TIGER ↔ WILD ANIMAL`, `A ↔ a`, etc. Matching identical cards is only one possible content pattern.
- No general-purpose game engine, SvelteKit, router, state library or database is included. Add heavier infrastructure only when a real requirement justifies it.

## Local development — Node.js only

Prerequisite: Node.js 22+ (npm is included with Node).

```bash
npm install
npm run dev
```

Open the local URL printed by Vite in any desktop browser.

To validate content, type-check Svelte/TypeScript and compile the browser runtime:

```bash
npm run check
```

Neither command needs Android tooling.

## Optional local Android work

Only when you specifically want to generate/open the native Android project locally do you need Android SDK/JDK tooling:

```bash
npm run android:add
npm run android:sync
npm run android:open
```

See `docs/ANDROID.md`, `docs/ARCHITECTURE.md`, `docs/OPEN_SOURCE_RESEARCH.md`, and `docs/ENGINE_RESEARCH.md`.
