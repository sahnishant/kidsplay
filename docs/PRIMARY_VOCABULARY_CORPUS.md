# Primary English vocabulary corpus

This lane builds a large, grade-aware English vocabulary review corpus without turning third-party dictionary prose into child-facing runtime content.

## License and publication boundary

The source lanes are deliberately separated:

- `grundwortschatz-voc-en` is the primary word/frequency/grade-evidence source and is **CC BY-SA 4.0**. Its data stays under `content/lexicon/open/` with explicit source revision and license provenance on every ranked row.
- Open English WordNet (OEWN) 2025 is **CC BY 4.0** and is used only to resolve candidate senses for human review. OEWN definitions/examples remain in the isolated review artifacts.
- A source gloss is **never** promoted automatically to runtime knowledge. An accepted word needs an explicit human decision and a separately authored Kidsplay child definition.
- Research/reference sources marked `do_not_import_product_data` remain blocked from product-data ingestion.

The review/import boundary is enforced by scripts and tests, not just by convention.

## Pinned sources

### Primary corpus

- Dataset: `cstr/grundwortschatz-voc-en`
- Config/split: `default` / `words`
- Pinned revision: `004977ae2c475fcf12f8b73a02dbb9552e3b6577`
- License: `CC-BY-SA-4.0`

A manual live refresh fails if upstream has moved beyond the pinned revision, forcing an explicit source-review step before the pin can change.

### Open English WordNet

- Release: English WordNet 2025 JSON archive
- License: `CC-BY-4.0`
- Pinned archive SHA-256: `7d749f6e2c39e6970e4997839dcf6e42fd281f3c2fae0171d2192bae8cfa4b51`

The resolver checks the archive checksum before using its lexical-entry and synset shards.

## Ranked corpus contract

`content/lexicon/open/primary-grade-corpus.json` is a **review corpus**, not a runtime dictionary.

The committed corpus contains exactly **10,000 globally unique normalized lemmas** with these Kidsplay primary bands:

| Kidsplay band | Entries |
| --- | ---: |
| Grade 1 | 800 |
| Grade 2 | 1,500 |
| Grade 3 | 1,700 |
| Grade 4 | 1,800 |
| Grade 5 | 1,900 |
| Grade 6 | 2,300 |
| **Total** | **10,000** |

Important semantics:

- `grade` is the Kidsplay frequency-led review band produced by `frequency_proxy_v1`.
- `sourceGrade` preserves the upstream source estimate.
- Neither field is a CBSE, CISCE, SOF, or other board/exam alignment claim.
- Rows are NFKC-normalized, lowercase, globally deduplicated, and carry row-level `{ sourceId, sourceRevision, license }` provenance.
- Imported rows are `runtimeActive: false`.
- The corpus contains no imported definitions or imported examples.

Current review-state split after filtering and rebanding:

- `needs_sense_review`: **9,849**
- `spelling_only`: **151**
- `clean`: **0**

`spelling_only` rows may be used for spelling/recognition review but are excluded from semantic meaning queues.

## Repository artifact policy

The pinned 10,000-row corpus and generated review artifacts are committed deliberately so corpus selection, OEWN resolution and curator queues remain reproducible and reviewable without depending on a mutable live service during ordinary development.

These files are **repository/curation artifacts, not app runtime assets**. They live only under `content/lexicon/open/`; the runtime/compiler does not publish that directory as child-facing knowledge. Only explicitly accepted editorial decisions may produce normal Kidsplay knowledge rows through `lexicon:import:reviews`.

Generated artifacts are refreshed only by the dedicated branch workflows after validation. The full source corpus is never loaded into the shipped Vocabulary Playground by default.

## Semantic filtering and ranking

The deterministic rebander:

1. normalizes lemmas;
2. removes malformed/symbolic/numeral junk;
3. blocks obvious abbreviations/proper-name markers and the maintained adult/profanity list;
4. globally deduplicates normalized lemmas;
5. classifies closed-class/grammar vocabulary as `spelling_only`;
6. ranks remaining terms primarily by frequency, with small curriculum-evidence tie/priority signals;
7. takes exactly the six grade quotas above while retaining the upstream grade separately.

Run locally:

```bash
npm run lexicon:reband:primary
npm run validate:lexicon-corpus
npm run report:lexicon-corpus
```

## Meaning and spelling queues

Meaning and spelling are separate lanes.

### Spelling/recognition

```bash
npm run lexicon:select:primary -- --per-grade 400 --mode introduced --purpose spelling
```

This lane may include `spelling_only` rows and makes no semantic or curriculum-placement claim.

### Meaning/sense review

The OEWN resolver builds finalized, OEWN-resolvable meaning queues. The CI lane targets **400 resolvable words per grade** and overscans the ranked corpus rather than accepting unresolved fillers.

The current acceptance run produced 400/400 resolvable words for every grade, with zero missing words in every finalized queue.

OEWN candidate files live under:

```text
content/lexicon/open/sense-review/
```

They are review-only CC BY 4.0 artifacts and may contain source glosses/examples for curator reference.

## Curator slices

Large sense files are reduced to practical human-review packets with:

```bash
npm run lexicon:export:review-slice -- \
  --sense-review content/lexicon/open/sense-review/grade-2-introduced-meaning-oewn.json \
  --wordlist content/lexicon/open/review-wordlists/grade-2-introduced-meaning.json \
  --limit 40 \
  --output content/lexicon/open/curator-slices/grade-2-meaning-review.json
```

Each curator item includes the lemma, grade, upstream grade, POS, frequency, priority score, candidate sense IDs/glosses with OEWN provenance, and a blank explicit review decision area.

The automated lane emits **40-word curator slices for Grades 1-6**.

## Human review and runtime import

Human decisions belong under:

```text
content/lexicon/reviews/
```

An accepted decision must include:

- the exact OEWN `candidateId`;
- `status: "reviewed"`;
- `decision: "accept"`;
- an independently authored `childDefinition`;
- reviewer identity and review date.

The directory contains a README with the exact editorial handoff format. Then run:

```bash
npm run lexicon:import:reviews
```

The importer rejects unknown/mismatched candidate IDs, missing review metadata, duplicate accepted senses for the same lemma, and a child definition that copies the OEWN gloss verbatim.

Accepted rows are emitted as ordinary reviewed Kidsplay `means` associations in:

```text
content/knowledge/english-vocabulary-primary-reviewed.json
```

Only source identifiers/provenance are retained in curation metadata; the OEWN source gloss itself is not copied into the runtime knowledge row.

## Profile bridge

Profile slices are review aids only. They do not mutate knowledge or profile membership and do not claim board alignment.

Examples:

```bash
npm run lexicon:profile-slice:primary -- \
  --profile CBSE_INDIA_CLASS2 \
  --grade 2 \
  --limit 100 \
  --wordlist content/lexicon/open/review-wordlists/grade-2-introduced-meaning.json
```

The CI lane produces slices for CBSE/CISCE Classes 1-2 and SOF Classes 2-6. A word becomes runtime/profile content only through the normal reviewed Kidsplay knowledge and membership mechanisms.

## Automated refresh gates

Two branch workflows enforce the mandate.

### `Curate Primary Vocabulary Corpus`

On branch pushes it:

1. re-applies deterministic grade bands;
2. validates exact distribution, dedupe, review states and row provenance;
3. regenerates spelling queues;
4. runs the focused vocabulary tests;
5. runs the repository-wide `npm run check` gate;
6. commits generated corpus/spelling artifacts only after all gates pass and only when the branch head has not moved.

A manual dispatch additionally performs the pinned live source refresh.

### `Resolve Primary Vocabulary Senses`

It:

1. validates the ranked corpus;
2. downloads/checks the pinned OEWN 2025 archive;
3. resolves 400 meaning words per grade;
4. validates OEWN provenance;
5. emits 40-word curator slices;
6. imports any explicit reviewed decisions;
7. rebuilds review-only profile slices;
8. runs focused vocabulary tests and full `npm run check`;
9. commits generated artifacts only after all gates pass and only if the branch head is unchanged.

## Acceptance checks

Primary mandate checks are covered by:

```text
tests/lexicon-import.behavior.test.ts
tests/primary-vocabulary-corpus.behavior.test.ts
tests/primary-vocabulary-mandate.behavior.test.ts
tests/vocabulary-delivery.behavior.test.ts
```

Use:

```bash
npm run test:vocabulary-corpus
npm run check
```

The merge gate requires both the focused corpus tests and the repository-wide build/typecheck/test suite to pass on the current `kidsplay` ancestry before merge.
