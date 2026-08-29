# Levels, profiles and cross-datatype selection

Kidsplay keeps the reusable fact independent from the curriculum/exam collections that use it.

## Separation

```text
knowledge row
  ├─ intrinsic metadata: knowledgeLevel, skills
  │
  └──── referenced by ────> profile membership collections
                              │
                              └─ profileRef: country / board-or-goal / class
```

Do not put CBSE/ICSE/SOF/China profile lists directly on every knowledge row.

## Intrinsic knowledge level

Rows may use:

```text
foundation → very basic, e.g. Dog
basic      → familiar but slightly broader, e.g. Centipede
intermediate
advanced   → uncommon/specialized for young learners, e.g. Vaquita
specialist
```

This is editorial content familiarity, not generated-question difficulty. The same basic fact can be asked through an easy recall item or a difficult reasoning item.

## Skills

Rows also carry cross-datatype skills such as:

```json
"skills": ["vocabulary", "classification", "recall", "reasoning"]
```

These live with the row because they describe what the knowledge can teach/practice irrespective of country or exam.

## Learning profiles

`content/learning-profiles/registry.json` defines profile identity and dimensions. IDs are stable collection names such as:

```text
CBSE_INDIA_CLASS1
CBSE_INDIA_CLASS2
SOF_INDIA_CLASS2
CLASS_III_CHINA
```

Profile metadata can evolve to add subject, official-version, effective dates or provenance without changing knowledge rows.

## Profile membership collections

`content/profile-memberships/*.json` owns the many-to-many mapping.

```json
{
  "profileRef": "SOF_INDIA_CLASS2",
  "members": [
    {
      "dataRef": "knowledge.animals.associations.001",
      "rowRef": "camel-ship-desert",
      "fit": "core"
    },
    {
      "dataRef": "knowledge.animals.associations.001",
      "rowRef": "mammoth-extinct",
      "fit": "challenge"
    }
  ]
}
```

`fit` is contextual to that profile: `review`, `core`, `stretch`, or `challenge`.

One row can be present in zero, one or many profiles. Updating a curriculum/exam collection changes only the membership collection, not the underlying fact.

## Cross-datatype query

Build-time indexing joins knowledge rows to profile collections. Therefore this query:

```bash
npm run query:content -- --country=IN --grade=1 --skill=vocabulary
```

can return rows from `association_set@1`, `choice_item@1`, and later `passage@1`, `entity_table@1`, diagrams, etc.

Specific profile:

```bash
npm run query:content -- --profile=SOF_INDIA_CLASS2 --skill=vocabulary
```

Advanced content in a profile:

```bash
npm run query:content -- --profile=SOF_INDIA_CLASS2 --level=advanced
```

## Database representation later

The JSON files are the authoring proof. In a database this should naturally become:

```text
knowledge_row
profile
profile_membership
```

with `profile_membership(profile_id, data_ref, row_ref, fit, provenance...)` as a join table/index.

This avoids separate animal databases for every country/board/exam and avoids repeating profile IDs on every content row.

## Provenance caution

These profile mappings are Kidsplay editorial targeting until backed by a cited syllabus/standard/exam source. Later add source/version/effective-date metadata to profile memberships before presenting them as official alignment.
