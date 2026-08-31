# Primary vocabulary editorial reviews

This directory is the human/editorial boundary between the open review corpus under `content/lexicon/open/` and child-facing Kidsplay knowledge.

Review documents are JSON files with a top-level `decisions` array. An accepted decision must provide the exact OEWN `candidateId`, matching lemma, `status: "reviewed"`, `decision: "accept"`, an independently authored `childDefinition`, reviewer identity, and an ISO review date.

Example shape:

```json
{
  "schemaVersion": 1,
  "decisions": [
    {
      "lemma": "example",
      "candidateId": "example#n#1",
      "status": "reviewed",
      "decision": "accept",
      "childDefinition": "A short child-friendly definition written by a Kidsplay editor.",
      "reviewer": "kidsplay-editorial",
      "reviewedAt": "2026-08-31"
    }
  ]
}
```

Run `npm run lexicon:import:reviews` after editorial review. The importer validates candidate identity and provenance and rejects verbatim OEWN gloss reuse. It emits reviewed Kidsplay knowledge to `content/knowledge/english-vocabulary-primary-reviewed.json` only when accepted decisions exist.

Do not place raw OEWN definitions or examples here as child-facing copy, and do not treat corpus grade bands as board/SOF alignment claims.
