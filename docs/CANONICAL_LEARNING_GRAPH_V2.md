# Canonical Learning Graph V2 — bounded Bicycle migration

Orchestrator: #265, linked to #210 and #264. Branch: `refactor/canonical-learning-graph-v2`, stacked on `feat/reusable-learning-studios-v1` at `42f13aa5f81460ad3959f28d9f67f03e371e27f8`. No merge, release or human approval is implied.

## Authority chain

Canonical localized nodes and typed claims -> canonical objectives / capabilities -> curriculum placements -> generated legacy compatibility records -> existing activities and central evaluator -> existing progress services.

Modules import canonical node/claim files; they no longer author `label` nodes and `from/relation/to` edges. Every claim has an ID, revision, endpoints, typed predicate, polarity, scope, authority, qualifiers, provenance, review and objective bindings. `authority.kind: canonical` means intended shared semantics, never human approval; `review.status` and `review.publishable` remain separate. All newly modelled claims and targets are editorial candidates.

The migrated graph contains 93 nodes and 88 claims, preserving all original 79 node IDs and 64 claim IDs. There are 34 canonical objectives and 11 capability definitions. All 34 existing progress IDs survive as compatibility IDs. Existing graphics and the twenty studio activities are not rewritten by this refactor.

## Changes corresponding to the supplied review

| Review | Implemented boundary |
|---|---|
| 1 | One Node/Claim shape; canonical loader; no inline module nodes/edges/defaults. |
| 2 | Reciprocal claim/objective references. Runtime compatibility mappings are generated, not added by the runtime projection. |
| 3–5, 7 | Explicit candidate functions and properties, including pedal operation, wheel/rolling support, two wheels, propulsion context, braking, steering, signalling, carrying and visibility. |
| 6 | Wheel subparts, conditional inner-tube relationship, handlebar grip and drivetrain membership. |
| 8 | Three scoped `drives` claims in the conventional chain-driven bicycle; conservative relations elsewhere remain deliberate. |
| 9–10 | `instance_of` for entity/class, transitive acyclic `subclass_of` for classes, and `contextual_instance_of` for chapter instances. Historical IDs remain; changed predicates/conditions have revision records. |
| 11–12 | One capability authority, including two capabilities formerly represented only in reading learnables. Grade expectation is placement metadata. Legacy capability learnables are generated output. |
| 13, 20 | Cognitive operation and candidate default depth on objectives; subject/grade metadata in placements. Old node depth bands remain contextual discovery hints, not intrinsic node difficulty. |
| 14 | `helps_protect` plus required proper-fit condition for the helmet claim; qualifications survive runtime projection metadata. |
| 15–16 | Explicit per-claim provenance and review, separate from truth scope. No new reference is described as external scientific verification. |
| 17–18 | Shared structural validator, distinct Bicycle acceptance checks, predicate-specific cycle checks and explicit reasoned orphan exemptions. |
| 19 | Eight typed single-choice targets checked for claim revision, predicate, fixed endpoint, qualifiers, answer mapping, objective binding and pinned prompt/feedback. This is not unrestricted natural-language entailment. |
| Versioning | Four guarded migration stages, source hashes and preserved IDs; no device data is cleared or silently recast as new learning. |

## Authoring and generated output

Author these records:
- `content/learning-graph/nodes/*.json` and `claims/*.json` for knowledge;
- `objectives/bicycle-workshop.json` and `capabilities/english-class2-my-bicycle.json` for objectives/capabilities;
- `placements/bicycle-workshop.json` for contextual subject, grade and discovery placement;
- `projections/bicycle-workshop.json` for compatibility layout, presentation aliases and output membership, not predicates or concept mappings.

The two Bicycle learnable files and `content/knowledge/bicycle-workshop-runtime-projection.json` are generated compatibility outputs. Regenerate explicitly with `node scripts/learning-graph/objective-projection.mjs --write`. Normal content compilation runs the compiler in check mode and rejects drift. Source IDs, qualified canonical endpoints, revisions and objective bindings remain available in each projection row's canonical metadata. Old subject/object labels are presentation aliases, not a second assertion authority.

The compatibility projection contains 40 admitted rows. Its historic `reviewed` authoring flag is legacy delivery metadata, not human acceptance of the graph. Revised typed questions are explicitly draft/practice-only and produce no knowledge/mastery evidence.

## Assessment examples and limitations

The pedal question now cites `claim.bicycle.pedal.operated-by.rider-foot`, rather than relying only on membership. Tests reject substituting `claim.bicycle.typically-has-part.pedal` as its semantic target.

The wheel pilot now has an explicit wheel/rolling relationship with a normal-rolling-contact condition. Its final wording still requires editorial entailment review: a generic `helps_enable` relationship is not a proof of every causal/necessity assertion in prose. The validator intentionally reports `naturalLanguageEntailmentCertified: false`.

The helmet target retains its condition when mapped to a question. Removing that condition, changing the answer, citing an unrelated objective, or editing pinned wording fails validation. Approved question publication and a formal approval record loader are not implemented by setting a boolean.

Nine additional claims are candidate chapter-supporting placements; visibility of lights/reflectors is explicitly enrichment and remains excluded from the chapter forms. All previous chapter-context/source-rights exclusions remain. Existing unrelated capability/word/reading evidence policies are unchanged.

## Verification

The migration checkout passed 977 unit tests across 190 files before adding the separate context-isolation regression. Dedicated scripts exercise 18 canonical-record mutations, 14 objective/projection mutations and 16 semantic/condition/cycle/orphan mutations. The context fixture changes English/Science/EVS placement without changing claims/objectives/capabilities; it does not create or certify new curriculum alignment.

Run `npm run check` for the existing full validation, build, typecheck, budgets and tests. Run `npm run test:e2e:ci` for existing browser journeys. The stacked PR admits the existing Windows, Browser and Android Stories Offline workflows on its exact parent branch; the Android workflow builds an APK and exercises emulator offline/relaunch behavior. The standalone Android Debug workflow's branch filters are not changed.

The temporary write-capable migration workbench is removed after materializing data. The replacement invariant workflow is read-only, preserves no Git credentials, checks invalid mutations and proves re-running the migrations leaves the current checkout unchanged. Source transformations in the numbered migrations were executed at their documented historical branch stages; they are not an automatic production data-upgrade service.

## Still required before wider curriculum scaling

1. Editorial review of all new facts, qualifier sufficiency, objective depths and wording-to-claim entailment. The supplied review/current lesson content motivated model corrections; it is not external subject-matter verification.
2. Semantic-target coverage for the remaining 24 Bicycle questions and other interaction types. Existing reference presence does not certify arbitrary prose or distractor uniqueness.
3. Version-aware interpretation of older mastery evidence when claim semantics change. IDs are retained, but this branch does not reinterpret old counters as evidence for the new claims. Broader claim-revision quarantine/migration and rollback rehearsal remain release gates.
4. Further normalization of historical node discovery hints and generic wording in capability descriptions, plus an actual second chapter/module consuming the canonical system. Context fixtures are not a second production vertical.
5. A verified human-review authority/approval loader and explicit release projection; no candidate becomes published automatically. Physical-device and real-child acceptance, final graphics and narration approval remain separate.

Keep #265 open. This is a substantial implemented migration, not completion of every semantic review finding or a claim that hundreds of chapters are ready to ingest.
