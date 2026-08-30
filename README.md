# Kidsplay

A lightweight, reusable learning game for children. Android is the shipping target; routine development is browser/Node first with Svelte + Capacitor.

## Start

```powershell
npm ci
npm run dev
```

## Validate

```powershell
npm run check
```

`npm run check` compiles and validates content, engines, scenes, story, profiles/alignment, assessment blueprints, traceability, product rules, semantic visuals and admitted third-party assets; runs Svelte/type checks, production build, bundle-budget validation and behavior tests.

Browser child journeys are covered separately by Playwright in the Browser Smoke workflow. Android CI builds a debug APK through Capacitor + Gradle.

## Architecture

```text
canonical knowledge
→ profile/planner
→ formatter/question bank
→ reusable interaction engine
→ evaluator
→ persisted local progress
```

Story and presentation sit above that pipeline and do not own answer truth:

```text
story mission / semantic visual
→ existing reusable questions / visual registry
→ engine + evaluator / OSS-or-Kidsplay artwork
```

Do not add another question/evaluation architecture, heavy game framework or broad runtime dependency without a demonstrated failing use case.

## Current project state

Use these durable sources rather than old chat context or intermediate checkpoints:

- GitHub issue **#1** — canonical live execution tracker.
- `docs/WORK_TARGETS.md` — detailed current product/technical state and remaining work.
- `docs/SOF_EVIDENCE_STATUS.md` — exact official-evidence checkpoint.
- GitHub issue **#33** — real-device Android beta acceptance.

Broad foundational learning is intended to remain free; structured goal programmes, diagnostics, adaptation and mocks are the primary paid-value layer rather than duplicated fact content.
