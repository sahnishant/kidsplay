# Open English WordNet sense-review outputs

Files in this directory are **editorial review material**, not student-facing vocabulary content.

They are generated from the official Open English WordNet 2025 JSON release, licensed **CC BY 4.0**, using the grade-aware `*-meaning.json` wordlists in `../review-wordlists/`.

For each selected lemma, the generator stores up to three candidate senses with:

- Open English WordNet entry/sense/synset identifiers
- upstream definition and examples for editorial reference
- same-synset lexical members as synonym candidates
- explicit CC BY 4.0 provenance
- `review.status: pending`
- empty `childDefinition` and `childExample`

An upstream dictionary gloss is never treated as an approved Kidsplay definition merely because it appears here. A reviewer must select the intended sense and create/review the concise child-facing wording before the word becomes a meaning-learning knowledge row.

Official release used by the generation workflow:

- release: Open English WordNet 2025
- asset: `english-wordnet-2025-json.zip`
- expected SHA-256: `7d749f6e2c39e6970e4997839dcf6e42fd281f3c2fae0171d2192bae8cfa4b51`
