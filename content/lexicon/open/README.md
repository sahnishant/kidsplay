# Open primary vocabulary data

Files in this directory are intentionally kept separate from Kidsplay-authored learning content.

## `primary-grade-corpus.json`

This file is a reduced redistribution/derivative of the **WortUniversum English Vocabulary Database** published as `cstr/grundwortschatz-voc-en` on Hugging Face under **Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)**.

Upstream: https://huggingface.co/datasets/cstr/grundwortschatz-voc-en

The source dataset combines multiple upstream signals. See its dataset card for complete attribution. Kidsplay's reduced snapshot retains only fields needed for vocabulary curation: stable source ID, word/lemma, source POS token, grade estimate, frequency summary, compact curriculum/source tags, and review status.

### Changes made by Kidsplay

- Removed Wiktionary/OEWN definitions and all source example sentences from this snapshot.
- Removed pronunciation, inflection, learner-error, translation and large enrichment payloads.
- Normalized the frequency summary into `zipf`, `perMillion` and `band`.
- Normalized selected grade evidence into `reason`, `cefrLevel`, `yleLevel` and compact tags.
- Sorted deterministically by grade, lemma, POS and source ID.
- Marked every row `reviewStatus: candidate`.

This open-data snapshot remains CC BY-SA 4.0. Its license does **not** change the license of application code or independently authored Kidsplay content, but redistributed derivative data from this file must comply with CC BY-SA 4.0.

## Pedagogy boundary

The source `grade` is a useful primary-school estimate, not a claim that a word is approved for a particular Indian board, class, SOF exam, or learner. Profile membership remains a Kidsplay curation decision.

This snapshot deliberately contains **no child-facing definitions**. Meaning instruction is created only after sense resolution (normally with Open English WordNet) and editorial review. Imported dictionary prose must keep its own provenance/license if ever used verbatim or adapted.
