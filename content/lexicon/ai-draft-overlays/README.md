# Primary vocabulary AI draft overlays

This directory contains **unreviewed editorial suggestions**, not runtime vocabulary and not human review decisions.

Each overlay is deliberately separate from the editorial packet. It may propose one candidate sense plus independently worded child-definition/example drafts for a bounded set of packet items. It cannot select a sense on behalf of an editor, accept/reject an item, set reviewer metadata, or approve a profile placement.

## Current bounded pass

- Grade 1 batch 001: 8 suggestions.
- Grade 2 batch 001: 8 suggestions.
- Each suggestion references an actual candidate ID already present in its corresponding 40-word editorial packet.
- The applicator rejects verbatim reuse of the selected OEWN gloss or source example.
- Each overlay is capped at 20 suggestions so AI assistance remains a reviewable editorial batch rather than an auto-publishing pipeline.

## Generate reviewable AI-draft packets

```bash
npm run lexicon:ai-draft:grade1
npm run lexicon:ai-draft:grade2
```

These commands first prepare the normal deterministic editorial packet, then attach the checked-in overlay to produce `grade-*-batch-001.ai-draft.json` inside `content/lexicon/editorial-packets/`.

The generated file remains `blocked_pending_editorial_review`. The AI suggestion is stored under `item.aiDraft`; all human fields under `item.editorial` and `item.profilePlacement` remain untouched.

## Human handoff

An editor may use, rewrite or reject an AI suggestion. Human review still has to explicitly:

1. choose `editorial.selectedCandidateId` from the packet's actual candidate senses;
2. author/approve the child definition and optional example;
3. set `editorial.status: "reviewed"`, an accept/reject decision, `reviewAuthority: "human_editor"`, reviewer identity and review date;
4. separately review any profile placement with `reviewAuthority: "human_editor"`.

There is intentionally no command that promotes `item.aiDraft` into those human fields automatically.

## Safety boundary

`scripts/lexicon/apply-primary-vocabulary-ai-draft-overlay.mjs` fails closed if an overlay tries to provide human review fields, references an unknown packet item or candidate ID, targets an already reviewed item, copies a selected OEWN gloss/example verbatim, exceeds the bounded batch size, or attempts to run against a packet whose policy no longer requires human review.

After an overlay is applied, the existing finalizer still emits **zero reviewed decisions and zero reviewed profile placements** unless a human editor has explicitly changed the editorial records.
