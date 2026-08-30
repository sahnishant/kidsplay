# Kidsplay architecture status — compact resume checkpoint

Use `docs/WORK_TARGETS.md` and GitHub issue #1 as the canonical current project state.

## Status

The data/normalizer/profile/planner/formatter/question/engine/evaluator architecture is complete and production-protected. This file intentionally no longer duplicates old intermediate counts or obsolete branch guidance.

Canonical learning flow:

```text
stored data
→ datatype normalizer
→ canonical knowledge rows
→ profile/index selector + planner
→ formatter + optional compiler
→ reusable questions with knowledgeRefs
→ runtime selector
→ Svelte interaction engine
→ evaluator
→ persisted local progress/mastery
```

Assessment remains an independent data layer:

```text
canonical knowledge
→ profile / membership
→ assessment blueprint
→ reusable question bank + engines
→ structured mock / diagnostics
```

Presentation is also independent:

```text
canonical row / question
→ semanticRef / visualRef
→ visual registry
→ admitted OSS asset or Kidsplay SVG fallback
→ lightweight CSS/SVG motion
```

## Current branch contract

- Canonical development branch: `kidsplay`.
- Stable branch: `main`.
- Do not reopen the completed interaction architecture without a demonstrated failing content/use case.
- Android remains the shipping target; browser/Node remains the normal development path.
- Broad foundation content remains free; paid value comes from goal structure, diagnostics, adaptation and mocks rather than duplicated facts.
- External art is presentation-only and cannot alter question/evaluator truth.
- Exact SOF provenance remains deliberately conservative; do not turn syllabus scope, near-matches or mirrors into row-level evidence.

For exact current counts, CI runs, visual coverage, story-world state, SOF evidence status and remaining work, see `docs/WORK_TARGETS.md`.
