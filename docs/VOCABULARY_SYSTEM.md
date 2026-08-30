# Vocabulary system

Vocabulary is a content domain, not a single question type. Kidsplay stores lexical knowledge once and delivers that knowledge through reusable engines.

## Current model

The existing `association_set@1` datatype already fits most vocabulary relationships:

- word `means` child-friendly definition
- word `synonym_of` word
- word `antonym_of` word
- word `homophone_of` word

A stable knowledge row remains the mastery/evidence unit. Activity recipes select rows and format them into runtime questions; packs decide free/paid placement. Do not copy the same vocabulary fact into engine-specific question banks.

## Delivery matrix

| Learning action | Engine | Example | Status |
| --- | --- | --- | --- |
| Meaning -> choose word | `single_choice@1` | “Which word means very large?” | supported |
| Word -> choose meaning | `single_choice@1` | “What does enormous mean?” | supported by direction recipe |
| Word <-> meaning match | `drag_to_target@1` | enormous -> very large | supported |
| Recall pairs | `memory_pairs@1` | word card + meaning card | supported |
| Definition fill | `word_bank_fill@1` | enormous — ___ | supported |
| Find spelling | `word_search@1` | locate ENORMOUS | supported |
| Definition crossword | `crossword@1` | clue -> word | supported |
| Unscramble letters | `letter_unscramble@1` | MROOUSNE -> ENORMOUS | vocabulary expansion |
| Physical revision | `print_cards@1` | definition front / word back | supported |

The same pattern applies to synonyms, antonyms and homophones. Later engines such as missing-letter, syllable-build, audio spelling and contextual cloze should consume the same lexical rows rather than introduce a new vocabulary database.

## Lexical record direction

For large-scale vocabulary, retain a curated learning row with stable provenance rather than shipping an external dictionary dump directly. A future enriched lexical row may carry fields such as:

```json
{
  "rowId": "kr.vocab.meaning.enormous.very-large",
  "lemma": "enormous",
  "partOfSpeech": "adjective",
  "relation": "means",
  "childDefinition": "very large",
  "example": "An elephant is enormous beside a mouse.",
  "sourceRefs": ["oewn:..."],
  "sourceLicense": "CC-BY-4.0",
  "definitionMode": "kidsplay_editorial"
}
```

External lexical sources provide candidate senses, lemmas, parts of speech and semantic relations. Kidsplay should normally author the short child-facing explanation itself, preserving the source sense reference used for fact checking. Imported verbatim fields must keep their own source and license metadata.

## Source policy

The machine-readable registry is `content/lexicon/sources.json`.

### Preferred semantic backbone: Open English WordNet

Use Open English WordNet as the first-choice structured English lexical source. It is actively maintained, derived from Princeton WordNet and published under CC BY 4.0. Import only the selected senses/relations needed by curated learning lists. Preserve attribution and upstream IDs.

### Secondary source: Princeton WordNet

Princeton WordNet can be used as a fallback/reference source under its own permissive WordNet license. Preserve the required copyright/license notices when redistributing derived database material.

### Optional enrichment: Wiktionary / Kaikki

Kaikki provides convenient machine-readable Wiktionary extraction. Wiktionary text is CC BY-SA 4.0 and GFDL. Treat imported Wiktionary/Kaikki text as a separately traceable source; do not silently mix verbatim/adapted BY-SA definitions into Kidsplay-authored proprietary editorial fields. If those fields are redistributed, satisfy the relevant attribution/share-alike terms.

## Collection pipeline

Do not bundle a 100k+ entry dictionary into the child app.

1. Build or import a candidate lemma/sense catalogue offline.
2. Select words for a learning profile using curriculum relevance, frequency, semantic complexity, orthographic complexity and age appropriateness.
3. Resolve the intended sense; a word can have several meanings and therefore several learnable rows.
4. Author/review a concise child-facing definition and example.
5. Add relationships such as synonym, antonym, homophone and morphology only when pedagogically useful.
6. Attach provenance/license metadata to sourced facts or copied fields.
7. Compile the selected knowledge rows through activity recipes.
8. Ship only the rows/questions needed by the installed/free/goal-based packs.

## Difficulty and profiles

Dictionary membership is not grade placement. Grade/class/exam placement belongs in Kidsplay learning profiles and profile memberships. Vocabulary difficulty should be derived from signals such as:

- word/sense frequency and familiarity
- word length and spelling pattern complexity
- concrete vs abstract meaning
- morphology (prefixes, suffixes, inflections)
- number of confusable senses
- curriculum/exam evidence
- learner mastery history

Avoid assigning every vocabulary word to every class merely because the dictionary contains it.

## Engine design rules

- Engines own interaction mechanics, not vocabulary facts.
- Formatters may change direction/presentation but must retain `knowledgeRefs` to the tested row.
- Randomization used to generate a puzzle should be deterministic from the recipe seed whenever possible.
- Word games must remain usable on touch screens without requiring precise drag gestures or extensive typing.
- A puzzle must never accidentally reveal the answer through an unrelated semantic image.
- Pack access policy remains outside questions and engines.

## Near-term expansion

After `letter_unscramble@1`, the next high-value vocabulary formats are contextual cloze, missing-letter spelling, category/odd-one-out and audio-to-word. Prefer adding them only when they introduce a genuinely different learning action; otherwise reuse the existing engines with new recipes.