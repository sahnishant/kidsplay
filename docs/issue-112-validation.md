# #112 validation

Run from repository root:

```bash
npm ci --no-audit --no-fund
npm run validate:animations
npm run report:semantic-animation
npx vitest run tests/semantic-animation-safety.behavior.test.ts tests/semantic-animation-science-expansion.behavior.test.ts
npm run check
git diff --check origin/main...HEAD
```

Expected semantic-animation report after this branch:

- authored semantic compositions: 18
- composed child-facing scenes: 17
- used compositions: 17/18
- semantic identities: 12
- multi-state identities: 2
- static/reduced-motion meaningful compositions: 18/18
- total safety/reference failures: 0

GitHub exact-head certification should include Windows Check, Browser Smoke / Playwright, and Android Debug APK when those workflows trigger.
