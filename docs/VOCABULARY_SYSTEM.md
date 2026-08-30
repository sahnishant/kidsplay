# Vocabulary system

Vocabulary is a content domain, not a single question type. Kidsplay stores lexical knowledge once and delivers that knowledge through reusable engines.

## Current model

The existing `association_set@1` datatype fits most vocabulary relationships:

- word `means` child-friendly definition
- word `synonym_of` word
- word `antonym_of` word
- word `homophone_of` word

A stable knowledge row remains the mastery/evidence unit. Activity recipes select rows and format them into runtime questions; packs decide free/paid placement. Do not copy the same vocabulary fact into engine-specific question banks.

## Student delivery path

Vocabulary is a real free student mode, not only a content file:

1. `content/knowledge/english-vocabulary-foundation.json` stores reusable lexical rows.
2. Activity recipes compile those rows into several question mechanics.
3. `content/packs/free-vocabulary.json` selects the activities in the free Vocabulary Playground.
4. `src/content.ts` exposes that pack in the home catalog as `Play words` and builds short mixed vocabulary sessions.
5. The normal `Session` runtime dispatches each question to its generic engine and records mastery against the original `knowledgeRefs`.

This keeps content growth independent of UI growth: adding 500 reviewed words does not require 500 hand-authored Svelte questions, and adding a genuinely new interaction engine does not require restructuring the dictionary.

## Delivery matrix

| Learning action | Engine | Example | Status |
| --- | --- | --- | --- |
| Meaning -> choose word | `single_choice@1` | “Which word means very large?” | supported |
| Word -> choose meaning | `single_choice@1` | “What does enormous mean?” | supported via `choiceDirection` |
| Word <-> meaning match | `drag_to_target@1` | enormous -> very large | supported |
| Recall pairs | `memory_pairs@1` | word card + meaning card | supported |
| Definition fill | `word_bank_fill@1` | enormous means ___ | supported |
| Find spelling | `word_search@1` | locate ENORMOUS | supported |
| Definition crossword | `crossword@1` | clue -> word | supported |
| Unscramble letters | `sequence_order@1` | MROOUSNE -> ENORMOUS | supported via `subject_letters` recipe |
| Physical revision | `print_cards@1` | definition front / word back | supported |

The same pattern applies to synonyms, antonyms and homophones. An anagram is deliberately a vocabulary formatting mode on the existing sequence mechanic rather than a separate runtime engine. Later mechanics such as missing-letter, syllable-build, audio spelling and contextual cloze should consume the same lexical rows rather than introduce another vocabulary database.

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

Use Open English WordNet as the first-choice structured English lexical source. It is maintained separately from the app, derived from Princeton WordNet and published under CC BY 4.0. Import only the selected senses/relations needed by curated learning lists. Preserve attribution and upstream IDs.

### Secondary source: Princeton WordNet

Princeton WordNet can be used as a fallback/reference source under its own WordNet license. Preserve the required copyright/license notices when redistributing covered database material.

### Optional enrichment: Wiktionary / Kaikki

Kaikki provides convenient machine-readable Wiktionary extraction. Wiktionary text is CC BY-SA 4.0 and GFDL. Treat imported Wiktionary/Kaikki text as a separately traceable source; do not silently mix verbatim/adapted BY-SA definitions into Kidsplay-authored editorial fields. If those fields are redistributed, satisfy the relevant attribution/share-alike terms.

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

## Next high-value formats

After the current choice, match, memory, fill, search, crossword and letter-ordering modes, the highest-value additions are contextual cloze, missing-letter spelling, category/odd-one-out and audio-to-word. Prefer a new engine only when it introduces a genuinely different learning action; otherwise add a formatter/recipe on an existing mechanic.
