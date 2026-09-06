# Canonical graph authoring metadata and shipped runtime data

PR #266 / issue #265. The first full application build at `9d8e2ae` passed content validation, Svelte typechecking (zero errors/warnings) and Vite compilation, but failed the existing Bicycle JSON budget: 48.1 KiB raw versus the unchanged 48.0 KiB cap. Unit migration tests had not exercised this bundle gate.

The corrected boundary keeps `semanticTarget` in authored questions for claim/predicate/revision/qualifier/answer and wording validation. The existing Vite build-time runtime JSON exporter removes only that build-only audit object from question assets. It does not strip knowledgeRefs, revision, authoring status, evidencePolicy, prompts, feedback, answers or interaction data. No budget or warning limit is raised.

`projectRuntimeQuestionJson` is restricted to existing question-directory paths, supports Windows separators, and leaves unrelated data/pack/membership files unchanged. Audit-bearing exports must retain the current draft/practice_only guards. Invalid guards fail rather than silently enabling mastery. Normal content compilation validates the authored graph/targets before export.

The source and emitted question are evaluated against the same existing central evaluator in regression tests. All eight candidate questions retain identical correct-answer evaluation with no knowledge/mastery evidence. The six Bicycle runtime JSON files are checked together against 48 KiB raw. Tests also check byte-preservation for unaffected data, source immutability, idempotence and malformed records.

Serve/Vitest continues reading full authored data; the production exporter alone drops the audit payload. Human semantic approval and a future approved-release projection are separate work, not inferred from this optimization.
