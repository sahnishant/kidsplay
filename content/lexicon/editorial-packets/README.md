# Primary vocabulary editorial packets

This directory is a **production-review workspace**, not runtime knowledge.

The open corpus and OEWN candidate glosses remain reference material. A packet may contain OEWN definitions/examples so an editor can choose the intended sense, but that source prose is never child-facing content automatically.

## Workflow

1. Prepare a prioritized packet from a curator slice:

   ```bash
   npm run lexicon:prepare:editorial:grade1
   npm run lexicon:prepare:editorial:grade2
   ```

   The packet starts with `publicationState: "blocked_pending_editorial_review"`. Every item starts with `editorial.status: "draft"`, no selected sense, no child definition, no reviewer, no review authority, and no approved profile placement.

   When continuing production after an earlier human-reviewed handoff, use the same generic packet builder with `--exclude-reviews`. It excludes only lemmas that already have terminal `human_editor` accept/reject decisions in the supplied checked-in review handoff; it does not infer profile placement or treat a grade signal as approval. For example:

   ```bash
   npm run lexicon:prepare:editorial -- \
     --slice content/lexicon/open/curator-slices/grade-1-meaning-review.json \
     --output content/lexicon/editorial-packets/grade-1-batch-002.json \
     --batch-id grade-1-batch-002 \
     --limit 16 \
     --exclude-reviews content/lexicon/reviews/grade-1-batch-001.json \
     --profile-targets CBSE_INDIA_CLASS1,CISCE_INDIA_CLASS1

   npm run lexicon:prepare:editorial -- \
     --slice content/lexicon/open/curator-slices/grade-2-meaning-review.json \
     --output content/lexicon/editorial-packets/grade-2-batch-002.json \
     --batch-id grade-2-batch-002 \
     --limit 16 \
     --exclude-reviews content/lexicon/reviews/grade-2-batch-001.json \
     --profile-targets CBSE_INDIA_CLASS2,CISCE_INDIA_CLASS2,SOF_INDIA_CLASS2
   ```

   `selection.excludedPriorReviewLemmas` and `selection.excludedReviewRefs` make that de-duplication auditable and deterministic. A malformed, wrong-grade, pending, non-human, or reviewer-less decision fails closed instead of silently skipping content.

2. Optionally attach the bounded checked-in AI draft overlay:

   ```bash
   npm run lexicon:ai-draft:grade1
   npm run lexicon:ai-draft:grade2
   ```

   This produces `grade-*-batch-001.ai-draft.json` for editorial convenience. Suggestions live under `item.aiDraft`; they do **not** populate `editorial.selectedCandidateId`, acceptance state, `reviewAuthority`, reviewer/date, or profile placement. The finalizer therefore still sees zero reviewed decisions until a human editor acts.

   The overlay applicator rejects unknown candidate IDs, human-review fields supplied by AI, application to already reviewed items, verbatim selected-OEWN-gloss/example reuse, and overlays larger than the bounded 20-item batch. Source overlays live in `content/lexicon/ai-draft-overlays/`.

3. Editorially review each item.

   - Choose an exact `selectedCandidateId` from that item's OEWN candidate list. An `aiDraft.proposedCandidateId` is only a suggestion.
   - Write or explicitly approve/rewrite a Kidsplay child definition independently. Do not copy the OEWN gloss.
   - AI wording may be used only as a draft for an editor to review; it never supplies review authority.
   - Only a real editorial review may set `editorial.status: "reviewed"` together with `reviewAuthority: "human_editor"`, `decision: "accept"` or `"reject"`, `reviewer`, and ISO `reviewedAt`.
   - The finalizer rejects a reviewed item whose `reviewAuthority` is anything other than `human_editor`.
   - Profile placement is separate and requires its own `reviewAuthority: "human_editor"`. Corpus grade, packet targets and AI suggestions are only review cues; they never imply CBSE/CISCE/SOF membership.

4. Finalize the packet into the review-handoff format:

   ```bash
   npm run lexicon:finalize:editorial -- \
     --packet content/lexicon/editorial-packets/grade-1-batch-001.ai-draft.json \
     --output content/lexicon/reviews/grade-1-batch-001.json
   ```

   The finalizer fails closed when a reviewed item has non-human review authority, an unknown candidate, missing reviewer/date, malformed decision, or a child definition that copies the selected OEWN gloss verbatim. AI-draft-only items are ignored as unreviewed.

5. Import accepted reviewed decisions through the existing guarded importer:

   ```bash
   npm run lexicon:import:reviews
   npm run test:vocabulary-corpus
   npm run check
   ```

   Never hand-edit `content/knowledge/english-vocabulary-primary-reviewed.json`; it is generated from reviewed decisions.

## Packet versus runtime content

- `content/lexicon/open/`: licensed source/review corpus and OEWN reference material.
- `content/lexicon/ai-draft-overlays/`: bounded unreviewed AI editorial suggestions; never review authority.
- `content/lexicon/editorial-packets/`: blocked production work packets; may include reference glosses and attached AI drafts.
- `content/lexicon/reviews/`: explicit human-reviewed decisions and review handoff records.
- `content/knowledge/english-vocabulary-primary-reviewed.json`: generated child-facing knowledge from accepted reviewed decisions only.

Profile-placement records emitted by the packet finalizer are **review records only**. They do not mutate profile memberships automatically; membership changes must be made explicitly through normal Kidsplay profile data and its existing validation gates.
