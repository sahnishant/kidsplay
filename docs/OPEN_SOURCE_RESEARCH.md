# Open-source research notes

Research date: 2026-08-29.

We are using these projects for **architecture/product inspiration first**, not copying code or assets blindly. Every imported dependency or asset must have its own license checked.

| Project | License signal | What is useful for Kidsplay | Decision |
| --- | --- | --- | --- |
| [Oppia Android](https://github.com/oppia/oppia-android) | Apache-2.0 | Offline-first learning, interactive lesson state, household learner profiles, Android discipline | Study interaction/state/testing patterns. Do not adopt its heavy native stack for MVP. |
| [H5P](https://github.com/h5p) | H5P aims for MIT where possible; some components have GPL constraints | Strong separation of content types from host/runtime; reusable interactive content contracts | Strong architectural inspiration. Only reuse code after checking the exact repository/package license. |
| [Sugarizer](https://github.com/sugarlabs/sugarizer) | Apache-2.0 | HTML/JS activities, activity distribution, packaging web learning activities for Android | Strong validation of web-first Android approach. Avoid its large all-in-one media footprint. |
| [GCompris](https://github.com/gcompris/GCompris-qt) | AGPLv3/GPL-family project | Huge catalogue of child-friendly educational activity patterns and difficulty progression | Inspiration only unless we intentionally accept copyleft obligations. Do not copy code/art into this product. |
| [Phaser](https://github.com/phaserjs/phaser) | MIT | Battle-tested 2D HTML5 mechanics, touch/canvas/WebGL, Android wrapping through third-party runtimes | Keep as an optional engine for mechanics that need it; not an MVP dependency. |
| [KAPLAY](https://github.com/kaplayjs/kaplay) | MIT | Smaller approachable JS/TS game-library model and composable game objects | Optional experiment for mini-games; not an MVP dependency. |
| [Capacitor](https://github.com/ionic-team/capacitor) | MIT | Modern Android container for HTML/CSS/JS with native access later | Selected for Android packaging. |

## Specific lessons

### 1. Plugin/activity registries scale

H5P and Sugarizer both reinforce the idea that a host/runtime should discover reusable interaction/activity implementations through contracts instead of embedding each activity into curriculum content.

### 2. Offline matters for children

Oppia Android and GCompris demonstrate the value of lessons/activities that remain useful without a live network connection. Kidsplay should make foundational packs downloadable and runnable offline.

### 3. Media bloat is a real risk

Sugarizer documents a very large package footprint driven by media-heavy activities. Kidsplay should keep the base APK small and treat richer asset packs as separately downloadable content where practical.

### 4. Do not add a game engine by default

Phaser is permissively licensed and mature, while KAPLAY is approachable and MIT-licensed. Neither is needed for MCQ, fill, sorting, matching or simple animated scenes. We can introduce one behind the presentation/mini-game boundary later without changing the question bank.

### 5. Asset licensing is separate from code licensing

A permissive engine license does not automatically license example graphics/audio. Any external character, sound or sprite pack needs a separate asset inventory with source, author, license and attribution requirements.

## Initial technology choice

**TypeScript + Vite + browser-native UI + Capacitor Android.**

Reasons:

- cheapest iteration path for a JS-heavy interactive product;
- Android packaging without maintaining two UI codebases;
- SVG/CSS/Pointer Events are sufficient for the first interaction engines;
- keeps content and question data portable;
- leaves Phaser/KAPLAY/Pixi-like rendering as replaceable presentation modules rather than architectural foundations.
