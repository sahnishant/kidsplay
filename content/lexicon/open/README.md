# Open lexicon data

This directory contains **review and curation artifacts**, not an automatically published child-facing dictionary.

## Primary ranked corpus

`primary-grade-corpus.json` is built from the CC BY-SA 4.0 `cstr/grundwortschatz-voc-en` dataset pinned at:

```text
004977ae2c475fcf12f8b73a02dbb9552e3b6577
```

The committed ranked corpus contains exactly **10,000 globally unique normalized lemmas**:

```text
Grade 1   800
Grade 2  1500
Grade 3  1700
Grade 4  1800
Grade 5  1900
Grade 6  2300
```

`grade` is a Kidsplay frequency-led review band. `sourceGrade` preserves the upstream estimate. Neither is a board/exam alignment claim.

Every row is runtime-inactive, carries source id/revision/license provenance, and contains no imported definitions/examples. Semantic candidates use `needs_sense_review`; closed-class/grammar items that remain useful for spelling/recognition use `spelling_only`.

## Review wordlists

`review-wordlists/` contains deterministic by-grade selections:

- `*-meaning.json`: semantic candidates only; `spelling_only` rows are excluded.
- `*-spelling.json`: spelling/recognition candidates; `spelling_only` rows are allowed.

The automated lanes target 400 selected items per grade.

## OEWN sense review

`sense-review/` contains isolated Open English WordNet 2025 candidate-sense material under CC BY 4.0. Source glosses/examples may appear there **only for curator reference**.

Current automated resolution produces 400 OEWN-resolvable meaning words for every grade, with up to three candidate senses per selected word.

No OEWN definition is automatically published as Kidsplay runtime content.

## Curator slices

`curator-slices/` contains practical 40-word human-review packets for Grades 1-6. A slice carries:

- lemma and Kidsplay grade;
- preserved upstream source grade;
- POS and frequency/priority metadata;
- candidate OEWN sense IDs and review-only glosses;
- blank explicit human decision fields.

Accepted semantic decisions are stored separately under `content/lexicon/reviews/` and must supply an independently authored Kidsplay child definition. `scripts/lexicon/import-primary-vocabulary-reviews.mjs` validates the decision and converts it into normal reviewed Kidsplay knowledge.

## Profile slices

`profile-slices/` are **curation-review only**. They never mutate knowledge or profile membership and never claim CBSE/CISCE/SOF alignment merely because a ranked word is shown in a profile slice.

## Rebuild commands

```bash
npm run lexicon:reband:primary
npm run validate:lexicon-corpus
npm run lexicon:select:primary -- --per-grade 400 --mode introduced --purpose spelling
npm run lexicon:resolve:primary -- --input <OEWN_JSON_DIR> --source-version 2025 --max-senses 3 --mode introduced --target-per-grade 400 --overscan-per-grade 1200
npm run lexicon:export:review-slice -- --sense-review <sense-file> --wordlist <wordlist-file> --limit 40 --output <slice-file>
npm run lexicon:import:reviews
npm run test:vocabulary-corpus
```

For source pins, license boundaries, workflow behavior and the publication contract, see `docs/PRIMARY_VOCABULARY_CORPUS.md`.
