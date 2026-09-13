# NAV100 technical proof

This file describes the certification matrix for the consolidated `kidsplay` branch / PR #302. Exact-head workflow results are recorded on PR #302 and issue #292 so the evidence can name the tested commit without requiring another code change merely to update this file.

## Scope and invariants

The prototype remains opt-in through `?nav100=1`. The normal `/` entry still mounts the existing `App.svelte`. The discovery layer is read-only and reuses existing canonical IDs, launch owners, progress/evidence stores and gameplay surfaces.

No second mastery store, answer bank, router, audio engine, story runtime or session runtime is introduced.

## Automated coverage added for NAV100

### Projection / scale

- `tests/nav100-experience-discovery.behavior.test.ts`
  - six real audited IDs;
  - canonical identity collapse for shared studios;
  - truthful resume capability metadata;
  - stale references;
  - stable ordering / no input mutation;
  - segregated synthetic sizes `0 / 1 / 150 / 1000`;
  - no synthetic IDs in the real projection.
- `tests/nav100-current-discovery.behavior.test.ts`
  - current canonical owners project lazily;
  - six real pilots remain discoverable;
  - deterministic order;
  - no test-only identities.

### Browser / actual UI

- `e2e/nav100-navigation.spec.ts`
  - prototype OFF -> ON -> OFF;
  - 360×640 and 390×844 phone layouts;
  - five stable child lanes plus Browse all;
  - Bicycle find-by-name and browser Back;
  - Escape return paths;
  - direct Earth topic launch;
  - direct Moonlit story launch;
  - existing Lab studio and Sound Trail runtimes;
  - Creek world-action discovery through Browse;
  - horizontal-overflow check;
  - reduced-motion run.

Existing Bicycle, Learn About, Learning Studio, Sound Trail, Stories, world-action, child-journey, touch-target and navigation regressions remain part of the repository's normal check/browser workflows.

## Matrix

| Area | Evidence | Status before final exact-head CI |
| --- | --- | --- |
| Prototype OFF / ON / OFF | `e2e/nav100-navigation.spec.ts` | IMPLEMENTED; CI result recorded separately |
| Browse/find + non-home content | NAV100 browser + projection tests | IMPLEMENTED; CI result recorded separately |
| Browser Back + Escape | NAV100 browser test + existing app-navigation tests | IMPLEMENTED; CI result recorded separately |
| Six real pilots | projection tests + actual UI launches | IMPLEMENTED; CI result recorded separately |
| Resume truth | projection assertions; Story/Studio keep their existing persistence owners | IMPLEMENTED; no universal resume claim |
| Evidence safety | existing evaluator/progress tests; studios remain `practice_only`; stories retain no mastery writes | EXISTING REGRESSION COVERAGE |
| 0/1/150/1000 scale | unit fixture only | IMPLEMENTED; fixtures are not production games |
| Small phone / reduced motion | Playwright | IMPLEMENTED; CI result recorded separately |
| Windows full check | GitHub Windows Check | PENDING FINAL HEAD |
| Browser suite | GitHub Browser Smoke | PENDING FINAL HEAD |
| Android debug build | GitHub Android Debug APK | PENDING FINAL HEAD |
| Android Stories offline workflow | GitHub Android Stories Offline | PENDING FINAL HEAD |
| Real-device child usability | owner/product test | NOT RUN / G3 PENDING |

## Known limits kept truthful

- Bicycle guided position does not have exact durable resume.
- Learn About does not claim exact section resume.
- Sound Trail does not claim exact stage resume.
- Incomplete world-action steps do not claim exact resume; completion uses the existing story-progress owner.
- Story beat resume and Studio workspace resume continue to use their existing stores.
- Browse renders a bounded first 80 matches and asks the user to search when the result set is larger.
- Synthetic 150/1000 descriptors are tests only; they are not produced games.
- The prototype does not become production-default without separate owner acceptance and G4 authorisation.

## Required final commands / workflows

Local/manual verification when desired:

```text
npm ci
npm run typecheck
npm run test:run -- tests/nav100-experience-discovery.behavior.test.ts tests/nav100-current-discovery.behavior.test.ts
npm run check
npm run test:e2e
```

GitHub exact-head evidence should include Windows Check, Browser Smoke, Android Debug APK and Android Stories Offline. Any unavailable native/device proof is recorded as NOT RUN or PENDING, never converted into a pass.
