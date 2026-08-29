# Levels, profiles and cross-datatype selection

Kidsplay keeps reusable knowledge independent from the curriculum/exam collections that use it.

## Separation

```text
knowledge row
  ├─ intrinsic metadata: rowId, knowledgeLevel, skills
  │
  └──── referenced by ────> profile membership collections
                              │
                              └─ profileRef: country / curriculum-or-goal / grade
```

Do not put CBSE/ICSE/SOF/China profile lists directly on knowledge rows.

## Intrinsic knowledge level

Rows may use:

```text
foundation → very basic/familiar
basic
intermediate
advanced
specialist
```

This is editorial content familiarity, not generated-question difficulty. The same basic fact can be asked through an easy recall item or a difficult reasoning item.

## Skills

Rows also carry cross-datatype skills such as:

```json
"skills": ["vocabulary", "classification", "recall", "reasoning"]
```

These live with the knowledge row because they describe what the knowledge can teach/practice irrespective of country or exam.

## Learning profiles

`content/learning-profiles/registry.json` defines stable profile identity and dimensions. IDs include:

```text
CBSE_INDIA_CLASS1
CBSE_INDIA_CLASS2
SOF_INDIA_CLASS2
CLASS_III_CHINA
```

Profile IDs are not parsed for business logic. Country, pathway, curriculum/assessment, grade and later subject/version metadata are explicit fields.

## Stable profile membership

`content/profile-memberships/*.json` owns the many-to-many mapping using stable global `rowId` values:

```json
{
  "profileRef": "SOF_INDIA_CLASS2",
  "provenance": {
    "status": "prototype_unverified",
    "sourceRefs": ["sof.iso.class2.syllabus.current"],
    "versionLabel": "SOF ISO 2026-27 scope; row placement prototype",
    "academicYear": "2026-27",
    "effectiveFrom": null,
    "effectiveTo": null,
    "reviewedAt": null,
    "placementBasis": "editorial_within_reviewed_scope"
  },
  "members": [
    { "rowId": "kr.animals.camel.ship-of-desert", "fit": "core" },
    { "rowId": "kr.animals.mammoth.extinct", "fit": "challenge" }
  ]
}
```

`fit` is contextual to one profile: `review`, `core`, `stretch`, or `challenge`.

A knowledge row can be present in zero, one or many profiles. Moving or reorganizing its storage file does not change profile identity because membership references `rowId`, not `(file,row)` coordinates.

## Alignment sources and review status

`content/alignment-sources/registry.json` is the source-of-truth registry for profile and membership provenance.

Supported source roles currently include:

- `editorial_prototype` — internal targeting only; cannot support an official claim.
- `official_syllabus` — official syllabus/scope source.
- `official_assessment` — official exam/assessment specification.
- `official_reference` — official supporting reference such as a current edition/catalog page.

A source marked `reviewed` must have an HTTPS URL, authority, version label and retrieval date.

### Profile scope vs row placement

These are deliberately separate review decisions.

Example: `SOF_INDIA_CLASS2` can have a **reviewed profile scope** for SOF ISO 2026-27 because the official current Class 2 syllabus and 2026-27 workbook were reviewed. That does **not** automatically prove that every individual fact should be `core`, `review`, `stretch` or `challenge`.

Therefore the current SOF profile has:

```text
profile alignmentStatus = reviewed
membership provenance.status = prototype_unverified
```

until the exact row placements are reviewed.

This prevents a broad syllabus heading such as `Animals` from being misrepresented as proof for every detailed fact or difficulty placement beneath it.

## Reviewed-alignment gate

`scripts/validate-alignment.mjs` prevents accidental official claims.

A profile cannot use `alignmentStatus: reviewed` unless it has:

1. at least one reviewed official alignment source;
2. a version label;
3. a review date; and
4. version applicability expressed as an academic year or explicit effective date range.

A membership collection cannot use `provenance.status: reviewed` unless it independently meets the same evidence/applicability standard.

Prototype profiles and memberships still require provenance, but may reference the internal editorial prototype source and keep review/effective fields null.

## Current SOF Class 2 scope

The reviewed source registry currently records the official Science Olympiad Foundation Class 2 International Science Olympiad scope and a 2026-27 official workbook reference. The current syllabus scope includes the broad areas Plants, Animals, Human Body, Food, Housing and Clothing, Family and Festivals, Good Habits and Safety Rules, Transport and Communication, Air/Water/Rocks, and Earth and Universe, with logical reasoning and higher-order sections.

This establishes the target **scope/version**, not complete row-level alignment. The actual knowledge bank still needs substantially more reviewed content before Kidsplay should present itself as comprehensive SOF preparation.

## Cross-datatype query

Build-time indexing joins knowledge rows to profile collections. Therefore:

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

The JSON files are the authoring proof. In a database this becomes naturally:

```text
knowledge_row
profile
alignment_source
profile_alignment_source
profile_membership
membership_source
```

with `profile_membership(profile_id, row_id, fit, provenance...)` as the join model.

This avoids separate knowledge databases for every country/board/exam and avoids repeating profile IDs on every content row.
