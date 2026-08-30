# Production bundle budget

Kidsplay ships through a Capacitor Android shell, so browser bundle growth is mobile-app growth. The production build therefore has a fail-fast size budget in `scripts/validate-bundle-budget.mjs`.

Current budgets:

- largest JavaScript chunk: **700 KiB raw / 140 KiB gzip**;
- all JavaScript assets combined: **760 KiB raw / 160 KiB gzip**;
- all CSS assets combined: **100 KiB raw**.

These limits intentionally sit above the August 30, 2026 checkpoint (~650 KiB single JS chunk / ~125 KiB gzip and ~72 KiB CSS) so ordinary small content changes have room, while large accidental framework/data/runtime additions fail CI.

The budget is not a substitute for performance work. In particular:

- do not increase Vite's chunk warning limit simply to hide a warning;
- do not force manual code splitting solely to make one warning disappear—manual chunk boundaries can affect module execution order;
- prefer deleting duplication, reusing semantic SVG/data systems, or lazily loading genuinely optional surfaces when profiling shows a material benefit;
- a budget increase should be deliberate and reviewed alongside the feature that needs it.

`npm run build` produces `dist/` and immediately runs `npm run validate:bundle`, so the same guard applies to normal CI and Android sync/build preparation.
