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

Browser child journeys are covered separately by Playwright in the Browser Smoke workflow. Android CI builds a debug APK through Capacitor + Gradle and exercises packaged/offline behavior.

## Architecture

```text
canonical knowledge
-> profile/planner
-> formatter/question bank
-> reusable interaction engine
-> evaluator
-> persisted local progress
```

Story and presentation sit above that pipeline and do not own answer truth:

```text
story mission / semantic visual
-> existing reusable questions / visual registry
-> engine + evaluator / OSS-or-Kidsplay artwork
```

Do not add another question/evaluation architecture, progress store, story graph, audio runtime, heavy game framework or broad runtime dependency without a demonstrated failing use case and explicit orchestration decision.

## Current project state

Use these durable sources rather than old chat context or intermediate checkpoints:

- GitHub issue **#1** — canonical live execution/orchestration tracker;
- GitHub issue **#174** — child game-feel/product laws;
- GitHub issue **#210** — operational **132-pass gameplay execution programme**;
- `docs/GAMEPLAY_ROADMAP.md` — repo-local gameplay sequence, ownership matrix and branch rules;
- `docs/WORK_TARGETS.md` — repo-local current integrated checkpoint and remaining programme;
- `docs/SOF_EVIDENCE_STATUS.md` — exact official-evidence checkpoint;
- GitHub issue **#33** — real-device Android beta acceptance.

### Freshness law

GitHub is the control plane. Repo-local roadmap/status documents are mirrors for orientation, not independent authorities.

Before creating or continuing a branch:
1. fetch current `main`;
2. inspect open PRs and surviving branches for overlapping ownership;
3. read #1 and #174 plus the reconciled #210 pass body/latest execution checkpoint;
4. if an older checkbox/status paragraph conflicts with a newer merged PR/checkpoint, reconcile it instead of reopening duplicate work.

Canonical integrated development happens on `main`. Active implementation branches are temporary work surfaces controlled by #1; planning issues do not automatically authorize branches. Keep `engineering complete`, `integrated`, `HUMAN accepted`, `audio accepted` and `editorially authoritative` as separate states.

As of the 2026-09-04 production reconciliation, First Play/visual-choice engineering, Learn About V1, Forest L2/L3, bundled voice V1 and Stories V1 are already merged. The next major cross-cutting engineering vertical is #235 adaptive experience routing; pending real-child/editorial gates remain explicit in #1/#210.

Broad foundational learning is intended to remain free; structured goal programmes, diagnostics, adaptation and mocks are the primary paid-value layer rather than duplicated fact content.
