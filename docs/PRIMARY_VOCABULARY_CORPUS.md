# Primary vocabulary corpus

## Purpose

Kidsplay should have a large vocabulary candidate pool without turning an external dictionary into unquestioned child-facing content. The corpus lane therefore separates **candidate selection signals** from **reviewed meanings and curriculum placement**.

## Data layers

1. **Open grade-candidate corpus** — `content/lexicon/open/primary-grade-corpus.json`. CC BY-SA 4.0, isolated open data. Supplies lemma, grade estimate, frequency and curriculum/source signals.
2. **Sense-review queue** — curated wordlists passed through the Open English WordNet extractor. Supplies candidate senses and upstream identifiers under CC BY 4.0.
3. **Kidsplay knowledge rows** — reviewed child definitions, examples and semantic relationships. These are the actual mastery/evidence rows used by activities.
4. **Profile membership** — CBSE/CISCE/SOF/class placement. Imported grade estimates never create profile membership automatically.

## Primary open source

The first large candidate source is `cstr/grundwortschatz-voc-en` (WortUniversum English Vocabulary Database), CC BY-SA 4.0. Its published `words` split contains 11,539 English lemmas with source grade levels 1–6 and signals from frequency lists, CEFR-J, Cambridge YLE and UK DfE spelling lists.

We intentionally do **not** copy the source's Wiktionary definitions, source examples, pronunciations or enrichment payload into the Kidsplay grade snapshot. Those fields are not required for grade selection and would blur the license/editorial boundary.

## Grade semantics

`grade` means the source dataset's primary-school estimate. It is useful as a prior, not an official Indian grade mapping. A candidate can move earlier/later or be excluded when Kidsplay reviews it for a specific profile.

Recommended interpretation:

| Source grade | Kidsplay starting interpretation |
| --- | --- |
| 1 | foundation/high-frequency candidate |
| 2 | early-primary candidate |
| 3 | developing-primary candidate |
| 4 | middle-primary/stretch candidate |
| 5 | upper-primary candidate |
| 6 | upper-primary/challenge candidate |

Curriculum anchors such as UK statutory spelling or Cambridge YLE can raise confidence that a word belongs somewhere in primary learning, but they do not prove CBSE/SOF placement.

## Reproducible sync

`scripts/lexicon/sync-primary-grade-corpus.mjs` fetches the public Hugging Face Dataset Viewer `words` split and writes a deterministic reduced snapshot. The source repository revision SHA is stored in the output.

The branch workflow `.github/workflows/sync-primary-vocabulary.yml` runs that sync on `content/primary-vocabulary-corpus`, runs the existing full Kidsplay check, and commits only the generated corpus snapshot when it changes. This exists so the large public source can be fetched by GitHub Actions without adding Parquet tooling or bundling the original 35 MB dataset.

## Commercial-safe source policy

- **Allowed/open data:** Open English WordNet (CC BY 4.0), CSTR/WortUniversum candidate corpus (CC BY-SA 4.0, isolated), released `concepticon/norare-cldf` data (CC BY 4.0 when/if used).
- **Research-only / do not import:** repositories or datasets whose terms are non-commercial, including the `norare-data` curation repository and VXGL's CC BY-NC release.
- **Wiktionary/Kaikki:** optional separately traceable CC BY-SA/GFDL enrichment only; not silently copied into Kidsplay editorial definitions.

## Curation target

The full 11k+ pool is not the runtime pack. Curators should select a manageable tranche per grade/profile using:

- source grade
- frequency/familiarity
- concrete vs abstract meaning where a commercial-safe norm is available
- spelling/morphological complexity
- curriculum anchors
- semantic ambiguity/polysemy
- visual teachability
- learner mastery history

Selected words then go through OEWN sense review and child-definition review before meaning-based activities. Spelling-only activities may use a lighter review path, but still require profile placement before shipping.
