import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildEditorialPacket } from '../scripts/lexicon/prepare-primary-vocabulary-editorial-packet.mjs';
import { applyAiDraftOverlay } from '../scripts/lexicon/apply-primary-vocabulary-ai-draft-overlay.mjs';
import { finalizeEditorialPacket } from '../scripts/lexicon/finalize-primary-vocabulary-editorial-packet.mjs';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(path), 'utf8'));
const packetForGrade = (grade: number) => buildEditorialPacket(
  readJson(`content/lexicon/open/curator-slices/grade-${grade}-meaning-review.json`),
  {
    batchId: `grade-${grade}-batch-001`,
    profileReviewTargets: grade === 1
      ? ['CBSE_INDIA_CLASS1', 'CISCE_INDIA_CLASS1']
      : ['CBSE_INDIA_CLASS2', 'CISCE_INDIA_CLASS2', 'SOF_INDIA_CLASS2']
  }
);
const overlayForGrade = (grade: number) => readJson(`content/lexicon/ai-draft-overlays/grade-${grade}-batch-001-ai-draft-001.json`);

describe('primary vocabulary AI draft overlays', () => {
  it('attaches bounded real Grade 1/2 suggestions without changing human review or profile approval state', () => {
    for (const grade of [1, 2]) {
      const packet = packetForGrade(grade);
      const overlaid = applyAiDraftOverlay(packet, overlayForGrade(grade));
      expect(overlaid.summary.words).toBe(40);
      expect(overlaid.summary.aiDraftSuggestions).toBe(8);
      expect(overlaid.aiDraftOverlay).toMatchObject({
        status: 'suggestions_attached_review_required',
        suggestionsApplied: 8,
        publicationState: 'blocked_pending_editorial_review'
      });

      const suggested = overlaid.items.filter((item) => item.aiDraft);
      expect(suggested).toHaveLength(8);
      for (const item of suggested) {
        expect(item.aiDraft).toMatchObject({
          status: 'suggestion_only_unreviewed',
          mayCountAsReviewed: false,
          humanReviewRequired: true,
          profilePlacementApproved: false
        });
        expect(item.candidateSenses.map((candidate) => candidate.candidateId)).toContain(item.aiDraft.proposedCandidateId);
        expect(item.editorial).toMatchObject({
          status: 'draft',
          decision: null,
          selectedCandidateId: null,
          reviewAuthority: null,
          reviewer: null,
          reviewedAt: null
        });
        expect(item.profilePlacement).toMatchObject({
          status: 'unreviewed',
          approvedProfileRefs: [],
          reviewAuthority: null,
          reviewer: null,
          reviewedAt: null
        });
      }

      const handoff = finalizeEditorialPacket(overlaid);
      expect(handoff.summary.reviewedDecisions).toBe(0);
      expect(handoff.summary.reviewedProfilePlacements).toBe(0);
      expect(handoff.decisions).toEqual([]);
      expect(handoff.profilePlacements).toEqual([]);
    }
  });

  it('rejects AI overlays that try to inject human review fields or unknown candidate senses', () => {
    const packet = packetForGrade(1);
    const badHumanField = structuredClone(overlayForGrade(1));
    badHumanField.suggestions[0].selectedCandidateId = badHumanField.suggestions[0].proposedCandidateId;
    expect(() => applyAiDraftOverlay(structuredClone(packet), badHumanField)).toThrow(/may not set human review field selectedCandidateId/);

    const badCandidate = structuredClone(overlayForGrade(1));
    badCandidate.suggestions[0].proposedCandidateId = 'old#a#999';
    expect(() => applyAiDraftOverlay(structuredClone(packet), badCandidate)).toThrow(/must reference a candidate sense in the packet/);
  });

  it('rejects copied OEWN wording, over-large overlays and overlays applied after editorial review', () => {
    const packet = packetForGrade(1);
    const copied = structuredClone(overlayForGrade(1));
    const old = packet.items.find((item) => item.lemma === 'old');
    const selected = old.candidateSenses.find((candidate) => candidate.candidateId === copied.suggestions[0].proposedCandidateId);
    copied.suggestions[0].proposedChildDefinition = selected.sourceSense.definition;
    expect(() => applyAiDraftOverlay(structuredClone(packet), copied)).toThrow(/must not copy the selected OEWN gloss verbatim/);

    const tooLarge = structuredClone(overlayForGrade(1));
    tooLarge.suggestions = Array.from({ length: 21 }, (_, index) => ({
      lemma: `fake-${index}`,
      proposedCandidateId: 'fake#n#1',
      proposedChildDefinition: 'A draft definition.',
      proposedChildExample: null
    }));
    expect(() => applyAiDraftOverlay(structuredClone(packet), tooLarge)).toThrow(/at most 20 suggestions/);

    const afterReview = packetForGrade(1);
    const oldItem = afterReview.items.find((item) => item.lemma === 'old');
    oldItem.editorial.status = 'reviewed';
    oldItem.editorial.decision = 'reject';
    oldItem.editorial.selectedCandidateId = 'old#a#2';
    oldItem.editorial.reviewAuthority = 'human_editor';
    oldItem.editorial.reviewer = 'editor-a';
    oldItem.editorial.reviewedAt = '2026-08-31';
    expect(() => applyAiDraftOverlay(afterReview, overlayForGrade(1))).toThrow(/only attach to an untouched draft editorial item/);
  });
});
