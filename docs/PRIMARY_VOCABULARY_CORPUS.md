# Primary vocabulary corpus

## Purpose

Kidsplay should have a large vocabulary candidate pool without turning an external dictionary into unquestioned child-facing content. The corpus lane therefore separates **candidate selection signals** from **reviewed meanings and curriculum placement**.

## Data layers

1. **Open grade-candidate corpus** — `content/lexicon/open/primary-grade-corpus.json`. CC BY-SA 4.0, isolated open data. Supplies lemma, grade estimate, frequency and curriculum/source signals.
2. **Meaning-review queue** — grade-ranked candidates filtered/backfilled through Open English WordNet (OEWN). Supplies resolvable candidate senses and upstream identifiers under CC BY 4.0.
3. **Kidsplay knowledge rows** — reviewed child definitions, examples and semantic relationships. These are the actual mastery/evidence rows used by activities.
4. **Profile membership** — CBSE/CISCE/SOF/class placement. Imported grade estimates never create profile membership automatically.

## Primary open source

The first large candidate source is `cstr/grundwortschatz-voc-en` (WortUniversum English Vocabulary Database), CC BY-SA 4.0. The pinned `words` split currently contains 11,539 unique English candidates with source grade levels 1–6 and signals from frequency lists, CEFR-J, Cambridge YLE and UK DfE spelling lists.

We intentionally do **not** copy the source's Wiktionary definitions, source examples, pronunciations or enrichment payload into the Kidsplay grade snapshot. Those fields are not required for grade selection and would blur the license/editorial boundary.

## Grade semantics

`grade` means the source dataset's primary-school estimate. It is useful as a prior, not an official Indian grade mapping. A candidate can move earlier/later or be excluded when Kidsplay reviews it for a specific profile.

| Source grade | Kidsplay starting interpretation |
| --- | --- |
| 1 | foundation/high-frequency candidate |
| 2 | early-primary candidate |
| 3 | developing-primary candidate |
| 4 | middle-primary/stretch candidate |
| 5 | upper-primary candidate |
| 6 | upper-primary/challenge candidate |

Curriculum anchors such as UK statutory spelling or Cambridge YLE can raise confidence that a word belongs somewhere in primary learning, but they do not prove CBSE/SOF placement. Grade 6 in particular is a noisy source-estimate band because the upstream grading logic can fall back to frequency when stronger curriculum/CEFR signals are absent. Kidsplay therefore does not force a fixed Grade 6 meaning count when OEWN cannot resolve the ranked candidates safely.

## Reproducible source sync

`scripts/lexicon/sync-primary-grade-corpus.mjs` fetches the public Hugging Face Dataset Viewer `words` split and writes a deterministic reduced snapshot. The source repository revision SHA is stored in the output. Because the Viewer rows endpoint has no revision selector, the sync checks the repository revision immediately before and after the paged fetch and fails if it changes instead of labeling a moving fetch with one SHA.

`.github/workflows/sync-primary-vocabulary.yml` owns the **source corpus and spelling/recognition queues**. On branch pushes it validates the committed corpus, rebuilds spelling queues, runs vocabulary acceptance tests and then the repository-wide regression check. A manual `workflow_dispatch` additionally performs a live source refresh first.

`.github/workflows/resolve-primary-vocabulary-senses.yml` owns the **meaning queues, OEWN sense-review output and generated profile-slice review artifacts**. It downloads the checksum-pinned official OEWN 2025 JSON release, loads its sharded `entries-*` plus POS-synset layout, rebuilds OEWN-resolvable meaning queues, validates provenance, generates profile slices from those finalized meaning queues, runs vocabulary acceptance tests and then the repository-wide regression check.

The two workflows use separate concurrency groups so the latest corpus/spelling proof and the latest meaning/OEWN proof can run independently without cancelling each other. Deterministic corpus/queue/sense/profile artifacts are committed to this working branch only after their lane-specific validators and vocabulary acceptance tests pass. The repository-wide `npm run check` remains a later **merge gate**: an unrelated integration failure can block PR/merge without discarding already-validated branch artifacts.

## Meaning-queue backfill policy

Meaning instruction needs a semantic source; spelling recognition does not. For that reason the two queue types deliberately diverge:

- **Spelling/recognition:** ranked directly from the source-grade corpus. A word can remain useful for spelling review even if OEWN has no matching lexical sense.
- **Meaning:** `scripts/lexicon/build-grade-sense-review.mjs` overscans the ranked source-grade candidates and selects only candidates that OEWN can resolve by normalized lemma and compatible part of speech. WordNet adjective satellites (`s`) are accepted for adjective (`a`) requests.
- Unresolved candidates are skipped for the meaning queue, not deleted from the source corpus.
- OEWN definitions/examples remain **review references only**. They are never promoted automatically into Kidsplay child-facing knowledge or profile membership.

Every finalized meaning queue records `selection.semanticResolution` with the requested target, eligible source pool, overscan size, resolvable count, unresolved/skipped count, selected resolved count, target shortfall, whether the requested target was filled, and whether the eligible pool was exhausted. This makes underfill explicit instead of silently padding a grade with unsupported words.

For the current pinned corpus + OEWN 2025 proof with a target of 400 per introduction grade:

| Grade | Final resolvable meaning words | Missing in final queue | Notes |
| --- | ---: | ---: | --- |
| 1 | 37 | 0 | only 37 eligible meaning candidates after selection policy |
| 2 | 400 | 0 | target filled |
| 3 | 400 | 0 | target filled |
| 4 | 400 | 0 | target filled |
| 5 | 400 | 0 | target filled |
| 6 | 280 | 0 | resolvable reservoir exhausted; 120-word target shortfall is preserved honestly |

A future corpus/OEWN revision may change these counts. The invariant is that a finalized meaning queue has no unresolved members; it is not that every grade must be padded to 400.

## Commercial-safe source policy

- **Allowed/open data:** Open English WordNet (CC BY 4.0), CSTR/WortUniversum candidate corpus (CC BY-SA 4.0, isolated), released `concepticon/norare-cldf` data (CC BY 4.0 when/if used).
- **Research-only / do not import:** repositories or datasets whose terms are non-commercial, including the `norare-data` curation repository and VXGL's CC BY-NC release.
- **Wiktionary/Kaikki:** optional separately traceable CC BY-SA/GFDL enrichment only; not silently copied into Kidsplay editorial definitions.

## Curation target

The full 11k+ pool is not the runtime pack. Curators should select a manageable tranche per grade/profile using source grade, familiarity/frequency, spelling complexity, curriculum anchors, semantic ambiguity, visual teachability and learner mastery history. Selected meaning words then go through OEWN sense review and Kidsplay child-definition review before meaning-based activities. Spelling-only activities may use a lighter review path, but still require profile placement before shipping.

## Profile-slice bridge

Pass 5 deliberately uses a **review bridge**, not an importer. `scripts/lexicon/build-primary-vocabulary-profile-slice.mjs` takes a grade selection and a target Kidsplay profile, then matches candidates only against `authoring.status: reviewed` Kidsplay knowledge rows whose relation is `means`.

The bridge can select directly from the source corpus for ad-hoc review, or accept `--wordlist` so production curation can consume the finalized OEWN-resolvable meaning queue. When a supplied wordlist is used, the bridge rejects grade/mode/purpose mismatches and stale source-corpus revisions, and carries the queue's `semanticResolution` metadata into the slice.

Example using the finalized Grade 2 meaning queue:

```bash
npm run lexicon:profile-slice:primary -- \
  --profile CBSE_INDIA_CLASS2 \
  --grade 2 \
  --limit 100 \
  --wordlist content/lexicon/open/review-wordlists/grade-2-introduced-meaning.json
```

By default this writes `content/lexicon/open/profile-slices/CBSE_INDIA_CLASS2-grade-2-introduced-meaning.json`. The artifact is explicitly `curation_review_only` and contains candidate/source identifiers, source grade signals, matching reviewed Kidsplay row IDs, and any existing profile membership fit. It does **not** include dictionary glosses, child-definition text, examples or source prose.

Candidates without an already-reviewed Kidsplay meaning row are emitted under `pendingEditorialReview`. Matching a word does not add it to the profile: `mutatesKnowledge` and `mutatesProfileMembership` are both false, and `boardAlignmentClaimed` is false. A curator still has to approve the Kidsplay child definition and profile placement through the normal content/profile files.

The OEWN workflow currently generates review slices for every primary profile that exists in the repository and has a matching grade queue: CBSE Class 1–2, CISCE Class 1–2, and SOF Class 2–6. The workflow validates all nine generated files as non-runtime, non-mutating, no-source-prose review artifacts before the broader regression gate.

## Acceptance checks

The branch-specific acceptance command is:

```bash
npm run test:vocabulary-corpus
```

It compiles current Kidsplay content and runs:

- OEWN import/shard/backfill behavior tests
- primary corpus, grade selection and profile-bridge behavior tests
- existing Vocabulary Playground delivery regression tests

The vocabulary workflows run this focused gate before the global `npm run check`, so corpus/delivery regressions are distinguishable from unrelated repository-wide blockers.
