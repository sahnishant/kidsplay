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

   When continuing production after earlier human-reviewed handoffs, use the same generic packet builder with `--exclude-reviews`. It excludes terminal `human_editor` outcomes from the supplied checked-in handoffs: reviewed accept/reject decisions and explicit terminal HOLD records such as `sense_unresolved` or a blocked candidate-pointer mismatch. Pending/non-human rows are not silently treated as reviewed, and a terminal HOLD stays excluded unless a dedicated revisit mechanism explicitly calls it back. The builder never infers profile placement or treats a grade signal as approval. For example:

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

   `selection.excludedPriorReviewLemmas` and `selection.excludedReviewRefs` make that de-duplication auditable and deterministic. A malformed, wrong-grade, non-human, reviewer-less, or otherwise invalid terminal outcome fails closed instead of silently skipping content.

2. Optionally attach a bounded checked-in AI draft overlay:

   ```bash
   npm run lexicon:apply:ai-draft -- \
     --packet content/lexicon/editorial-packets/grade-1-batch-005.json \
     --overlay content/lexicon/ai-draft-overlays/grade-1-batch-005-ai-draft-001.json \
     --output content/lexicon/editorial-packets/grade-1-batch-005.ai-draft.json
   ```

   Suggestions live under `item.aiDraft`; they do **not** populate `editorial.selectedCandidateId`, acceptance state, `reviewAuthority`, reviewer/date, or profile placement. The finalizer therefore still sees zero reviewed decisions until a human editor acts.

   A review aid may include an `ambiguityWarning` (`low`, `medium`, or `hold_recommended`) and a `profilePlacementRationale`. These are convenience notes only. A HOLD warning does not create a terminal HOLD record, and a profile-placement rationale is not approval or official CBSE/CISCE/SOF evidence.

   The overlay applicator rejects unknown candidate IDs, human-review fields supplied by AI, application to already reviewed items, verbatim selected-OEWN-gloss/example reuse, and overlays larger than the bounded 20-item batch. Source overlays live in `content/lexicon/ai-draft-overlays/`.

3. Editorially review each item in one bounded pass.

   - Inspect all candidate senses, not merely candidate 1.
   - Choose an exact `selectedCandidateId` only when the intended sense is defensible; otherwise record the existing explicit HOLD/unresolved outcome.
   - Write or explicitly approve/rewrite a Kidsplay child definition independently. Do not copy the OEWN gloss.
   - Treat `aiDraft.proposedCandidateId`, wording, ambiguity warning, and placement rationale as suggestions only.
   - Only a real editorial review may set `editorial.status: "reviewed"` together with `reviewAuthority: "human_editor"`, `decision: "accept"` or `"reject"`, `reviewer`, and ISO `reviewedAt`.
   - The finalizer rejects a reviewed item whose `reviewAuthority` is anything other than `human_editor`.
   - Profile placement is separate and requires its own `reviewAuthority: "human_editor"`. Corpus grade, packet targets and AI suggestions are only review cues; they never imply CBSE/CISCE/SOF membership or official provenance.

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
