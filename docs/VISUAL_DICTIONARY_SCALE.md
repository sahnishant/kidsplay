# Visual Dictionary at 10,000-word scale

Tracker: #114, child lane of #76.

## Decision

Kidsplay does **not** build a separate picture dictionary and does not author one visual layout or animation per word.

The canonical unit remains the reviewed/reviewable **sense**. The existing #76 visual strategy remains semantic authority. Dictionary presentation is a derived, replaceable projection:

```text
lexeme / surface forms
        ↓
reviewed or explicitly blocked sense
        ↓
#76 visual teaching strategy + maturity/authority
        ↓
derived presentation mode
        ↓
bounded runtime projection
        ↓
existing VocabularySemanticScene / VisualEntity
        ↓
VisualMeaningPresenter
```

The 10,000-row primary corpus is curation data. It is not a browser dictionary bundle.

## Two taxonomies with different jobs

`content/vocabulary-visuals/registry.json` remains the semantic teaching taxonomy. It answers **how this exact sense should be taught** and preserves distinctions such as `spatial_relation`, `process_scene`, `attribute_contrast`, `person_role`, and `sense_unresolved`.

`content/vocabulary-visuals/presentation-modes.json` is deliberately smaller and derived. It answers only **which bounded rendering primitive can carry the already-reviewed strategy**:

| Derived mode | Existing strategy families |
| --- | --- |
| `asset` | direct entity |
| `compose` | place, spatial relation, part/whole, diagram, symbol |
| `compare` | attribute, quantity, controlled comparison |
| `transition` | action, sequence, process, cause/effect |
| `scene` | person role, visible state, expression |
| `text` | textual-only and unresolved fail-closed states |

A derived mode creates no sense, definition, profile, V-level, asset, or runtime authority.

## Authority is separate from renderability

Three distinct states matter:

1. **Candidate** — a reviewed strategy may imply a derived mode, but no runtime proof exists.
2. **Renderer proven** — a V3/V4 template proof demonstrates that the existing renderer can represent the strategy. This is still not child-facing authority.
3. **Child-facing** — an admitted `knowledge_reinforcement` runtime plan with V5/V6 proof may render in `VisualMeaningPresenter`.

Therefore:

```text
village#settlement
strategy: place_scene
mode: compose
maturity: V3 template proof
Dictionary delivery: TEXT FALLBACK
```

while an exact proof-backed sense such as `enormous#very-large-size` can render its existing semantic comparison scene.

This prevents visual maturity inflation.

## Deterministic presentation identity

The generic compiler assigns:

```text
visual-meaning:v<compilerVersion>:<senseKey>
```

The same sense therefore has one stable presentation identity across dictionary, explanation, matching, story, or later vocabulary surfaces. Delivery engines do not select random artwork at runtime.

Changing a semantic strategy remains an editorial/control-plane event. Changing renderer implementation can happen behind the presentation contract without rewriting vocabulary knowledge.

## Knowledge mappings are not sense identities

A semantic sense may legitimately support more than one canonical knowledge row. For example, a single reviewed meaning can appear in a direct meaning relation and an antonym relation without becoming two different visual meanings.

The presentation compiler therefore treats runtime mappings as many-to-one:

```text
knowledge row A ─┐
                 ├── exact sense ── one presentation identity
knowledge row B ─┘
```

Equivalent same-sense runtime mappings are collapsed deterministically for presentation and their mapping count is retained for accounting. If two runtime mappings for one exact sense disagree on strategy, maturity, answer safety, template, visual reference, or semantic parameters, compilation fails closed rather than choosing one.

Metrics must consequently report **knowledge/runtime mappings** separately from **unique semantic senses**.

## Bounded slice compilation

`scripts/vocabulary-visuals/presentation-compiler.mjs` accepts:

- existing strategy items;
- a requested set of exact sense keys;
- the generic presentation-mode contract;
- optional existing runtime proofs.

It emits only the requested canonical slice, sorted deterministically by sense key. It does not read or ship the 10,000-row primary corpus by itself.

The compiler fails closed on:

- duplicate source sense keys;
- duplicate requested sense keys;
- conflicting same-sense runtime mappings;
- runtime projection drift from source strategy/template/parameters;
- unresolved senses;
- missing senses;
- unknown presentation strategies.

`textual_only`, `sense_unresolved`, missing runtime proof, and renderer-only proof never become an approximate child visual.

## Browser boundary

`src/presentation/vocabularyPresentation.ts` imports only:

- the six-mode presentation contract; and
- the existing bounded `__generated-runtime-plans.json` projection through `vocabularyVisualRegistry.ts`.

It does not import:

- `primary-grade-corpus.json`;
- review batches;
- OEWN sense-review files.

This is the main scaling boundary. Repository-side editorial accounting may grow to 10,000+ senses without making the application carry the full review corpus.

## VisualMeaningPresenter

`src/presentation/VisualMeaningPresenter.svelte` is a thin consumer, not a renderer.

It has three presentation densities:

- `glance` — word + proven compact visual;
- `learn` — word + caller-supplied reviewed child meaning + proven visual;
- `explore` — learn state plus caller-supplied reviewed example.

The presenter never sources definitions/examples from OEWN. The caller owns child-authored text authority.

The presenter also carries an explicit presentation phase. Dictionary/explanation use is the default. If a future caller invokes the component during `assessment_pre_answer`, any visual whose existing #76 `answerSafety` is not `neutral_safe` is suppressed to text even when the sense already has V5/V6 child-facing proof. This makes answer safety an API invariant rather than a convention left to every future caller.

If no V5/V6 child-facing visual proof exists, the same component remains useful as a text meaning card and exposes the reason through presentation metadata for testing/debugging.

## Why this scales

Growth should primarily add:

- reviewed senses;
- reusable semantic assets/primitives;
- existing-strategy parameters;
- sparse exceptional overrides inside the existing #76 authority model;
- proof-backed runtime slices.

Growth should **not** primarily add:

- renderer classes;
- per-word Svelte components;
- per-word animation scripts;
- duplicated dictionary JSON layouts;
- a second semantic ontology;
- arbitrary lemma→image mappings.

The number of semantic records can grow by orders of magnitude while the presentation primitive vocabulary remains small.

## Permanent gate

`scripts/validate-vocabulary-presentation.mjs`, exercised by the Vitest suite, checks:

- every current #76 strategy maps exactly once to a derived presentation mode;
- blocked strategies map only to `text`;
- every runtime plan still has a source strategy item;
- equivalent many-to-one runtime mappings remain representable while conflicts fail;
- runtime projection cannot mutate semantic parameters;
- V3/V4 renderer proof remains separate from V5/V6 child-facing proof;
- request-order-independent deterministic slice output;
- browser resolver does not import full-corpus/review artifacts;
- bounded runtime sense count, mapping count and serialized payload size are reported.

Focused presentation tests additionally prove that pre-answer use suppresses non-neutral visuals.

Existing bundle, offline, reduced-motion, answer-safety, provenance, Windows, Browser and Android gates remain authoritative.

## Explicit non-goals for #114

- resolving additional OEWN senses;
- editing child definitions or profile placement;
- producing new animation science content owned by #112;
- creating a new asset/provenance pipeline;
- making all 10,000 rows child-facing;
- treating V1 terminal/resolved accounting as visual maturity.
