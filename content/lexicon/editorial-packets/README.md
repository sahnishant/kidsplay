# Primary vocabulary editorial packets

This directory is a **production-review workspace**, not runtime knowledge.

The open corpus and OEWN candidate glosses remain reference material. A packet may contain OEWN definitions/examples so an editor can choose the intended sense, but that source prose is never child-facing content automatically.

## Workflow

1. Prepare a prioritized packet from a curator slice:

   ```bash
   npm run lexicon:prepare:editorial:grade1
   npm run lexicon:prepare:editorial:grade2
   ```

   The packet starts with `publicationState: "blocked_pending_editorial_review"`. Every item starts with `editorial.status: "draft"`, no selected sense, no child definition, no reviewer, and no approved profile placement.

2. Editorially review each item.

   - Choose an exact `selectedCandidateId` from that item's OEWN candidate list.
   - Write a Kidsplay child definition independently. Do not copy the OEWN gloss.
   - AI wording may be used only as a draft for an editor to review; an AI draft is **not** a reviewed decision.
   - Set `editorial.status: "reviewed"`, `decision: "accept"` or `"reject"`, `reviewer`, and ISO `reviewedAt` only after the editorial decision is actually made.
   - Profile placement is separate. Corpus grade and packet profile targets are only review cues; they never imply CBSE/CISCE/SOF membership.

3. Finalize the packet into the review-handoff format:

   ```bash
   npm run lexicon:finalize:editorial -- \
     --packet content/lexicon/editorial-packets/grade-1-batch-001.json \
     --output content/lexicon/reviews/grade-1-batch-001.json
   ```

   The finalizer fails closed when a reviewed item has an unknown candidate, missing reviewer/date, malformed decision, or a child definition that copies the selected OEWN gloss verbatim.

4. Import accepted reviewed decisions through the existing guarded importer:

   ```bash
   npm run lexicon:import:reviews
   npm run test:vocabulary-corpus
   npm run check
   ```

   Never hand-edit `content/knowledge/english-vocabulary-primary-reviewed.json`; it is generated from reviewed decisions.

## Packet versus runtime content

- `content/lexicon/open/`: licensed source/review corpus and OEWN reference material.
- `content/lexicon/editorial-packets/`: blocked production work packets; may include reference glosses.
- `content/lexicon/reviews/`: explicit reviewed decisions and review handoff records.
- `content/knowledge/english-vocabulary-primary-reviewed.json`: generated child-facing knowledge from accepted reviewed decisions only.

Profile-placement records emitted by the packet finalizer are **review records only**. They do not mutate profile memberships automatically; membership changes must be made explicitly through normal Kidsplay profile data and its existing validation gates.
