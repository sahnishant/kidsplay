import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { buildReviewedKnowledge } from '../scripts/lexicon/import-primary-vocabulary-reviews.mjs';

type Json = Record<string, any>;

const readJson = (path: string): Json => JSON.parse(readFileSync(resolve(path), 'utf8'));

function candidateIndex(slices: Json[]) {
  const index = new Map<string, any>();
  for (const slice of slices) {
    for (const item of slice.items ?? []) {
      for (const candidate of item.candidateSenses ?? []) {
        if (index.has(candidate.candidateId)) throw new Error(`Duplicate candidate ${candidate.candidateId}`);
        index.set(candidate.candidateId, { item, candidate, slice, file: 'test-fixture' });
      }
    }
  }
  return index;
}

describe('primary vocabulary human review batch 001', () => {
  const grade1Review = readJson('content/lexicon/reviews/grade-1-batch-001.json');
  const grade2Review = readJson('content/lexicon/reviews/grade-2-batch-001.json');
  const grade1Slice = readJson('content/lexicon/open/curator-slices/grade-1-meaning-review.json');
  const grade2Slice = readJson('content/lexicon/open/curator-slices/grade-2-meaning-review.json');
  const grade1Overlay = readJson('content/lexicon/ai-draft-overlays/grade-1-batch-001-ai-draft-001.json');
  const grade2Overlay = readJson('content/lexicon/ai-draft-overlays/grade-2-batch-001-ai-draft-001.json');
  const checkedInKnowledge = readJson('content/knowledge/english-vocabulary-primary-reviewed.json');

  it('records 16 explicit human accept decisions without profile-placement inference', () => {
    for (const review of [grade1Review, grade2Review]) {
      expect(review.kind).toBe('primary_vocabulary_editorial_review_handoff');
      expect(review.policy.requiredReviewAuthority).toBe('human_editor');
      expect(review.summary.reviewedDecisions).toBe(8);
      expect(review.summary.accepted).toBe(8);
      expect(review.summary.rejected).toBe(0);
      expect(review.summary.reviewedProfilePlacements).toBe(0);
      expect(review.profilePlacements).toEqual([]);
      expect(review.decisions).toHaveLength(8);

      for (const decision of review.decisions) {
        expect(decision.status).toBe('reviewed');
        expect(decision.decision).toBe('accept');
        expect(decision.reviewAuthority).toBe('human_editor');
        expect(decision.reviewer).toBe('sahnishant');
        expect(decision.reviewedAt).toBe('2026-08-31');
        expect(decision.childDefinition.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('accepts exactly the bounded AI suggestions the human approved', () => {
    const expectedByLemma = new Map(
      [...grade1Overlay.suggestions, ...grade2Overlay.suggestions].map((suggestion: any) => [suggestion.lemma, suggestion])
    );
    const decisions = [...grade1Review.decisions, ...grade2Review.decisions];

    expect(expectedByLemma.size).toBe(16);
    expect(decisions).toHaveLength(16);

    for (const decision of decisions) {
      const suggestion = expectedByLemma.get(decision.lemma);
      expect(suggestion).toBeTruthy();
      expect(decision.candidateId).toBe(suggestion.proposedCandidateId);
      expect(decision.childDefinition).toBe(suggestion.proposedChildDefinition);
      expect(decision.childExample).toBe(suggestion.proposedChildExample);
    }
  });

  it('passes the guarded importer and exactly matches the checked-in generated knowledge', () => {
    const candidates = candidateIndex([grade1Slice, grade2Slice]);
    const decisions = [...grade1Review.decisions, ...grade2Review.decisions].map((decision: any) => ({
      ...decision,
      decisionFile: 'human-review-batch-001'
    }));

    const knowledge = buildReviewedKnowledge(decisions, candidates);
    expect(knowledge).toEqual(checkedInKnowledge);
    expect(knowledge).toHaveLength(1);
    expect(knowledge[0].entries).toHaveLength(16);

    const lemmas = knowledge[0].entries.map((entry: any) => entry.subject.label);
    expect(new Set(lemmas).size).toBe(16);
    expect(lemmas).toEqual([...lemmas].sort((left, right) => left.localeCompare(right, 'en')));
    expect(knowledge[0].entries.filter((entry: any) => entry.meta.primaryVocabularyGrade === 1)).toHaveLength(8);
    expect(knowledge[0].entries.filter((entry: any) => entry.meta.primaryVocabularyGrade === 2)).toHaveLength(8);

    for (const entry of knowledge[0].entries) {
      expect(entry.meta.curation.status).toBe('reviewed');
      expect(entry.meta.curation.reviewer).toBe('sahnishant');
      expect(entry.meta.curation.reviewedAt).toBe('2026-08-31');
      expect(entry.meta.curation.sourceId).toBe('open-english-wordnet');
      expect(entry.meta.curation.sourceLicense).toBe('CC-BY-4.0');
      expect(entry.meta.curation.sourceGlossCopied).toBe(false);
    }
  });

  it('keeps all 16 candidate profile placements fail-closed inside the canonical handoffs', () => {
    const reviewedEntries = checkedInKnowledge[0].entries;
    const reviewedByRowId = new Map(reviewedEntries.map((entry: any) => [entry.rowId, entry]));
    const expectedProfilesByGrade: Record<number, string[]> = {
      1: ['CBSE_INDIA_CLASS1', 'CISCE_INDIA_CLASS1'],
      2: ['CBSE_INDIA_CLASS2', 'CISCE_INDIA_CLASS2', 'SOF_INDIA_CLASS2']
    };

    for (const review of [grade1Review, grade2Review]) {
      const queue = review.profilePlacementReviewQueue;
      expect(review.policy.pendingPlacementCandidatesAreNonAuthoritative).toBe(true);
      expect(review.summary.reviewedProfilePlacements).toBe(0);
      expect(review.profilePlacements).toEqual([]);
      expect(queue).toMatchObject({
        status: 'pending_human_editorial_review',
        requiredReviewAuthority: 'human_editor',
        candidateOnly: true,
        mayMutateProfileMembership: false,
        mayInferFromGradeOrCorpus: false,
        mayClaimBoardOrExamAlignment: false
      });
      expect(queue.items).toHaveLength(8);

      const decisionByLemma = new Map(review.decisions.map((decision: any) => [decision.lemma, decision]));
      for (const item of queue.items) {
        const entry = reviewedByRowId.get(item.rowId);
        const decision = decisionByLemma.get(item.lemma);
        expect(entry).toBeTruthy();
        expect(decision).toBeTruthy();
        expect(item.lemma).toBe(entry.subject.label);
        expect(item.selectedCandidateId).toBe(entry.meta.curation.candidateId);
        expect(item.selectedCandidateId).toBe(decision.candidateId);
        expect(item.status).toBe('pending_human_editorial_review');
        expect(item).not.toHaveProperty('reviewAuthority');
        expect(item).not.toHaveProperty('reviewer');
        expect(item).not.toHaveProperty('reviewedAt');

        expect(item.candidatePlacements.map((placement: any) => placement.profileRef)).toEqual(
          expectedProfilesByGrade[review.grade]
        );

        for (const placement of item.candidatePlacements) {
          expect(placement.rationale).toContain('explicit human placement approval is still required');
          const evidenceSlice = readJson(placement.evidenceRef);
          expect(evidenceSlice.profileRef).toBe(placement.profileRef);
          expect(evidenceSlice.status).toBe('curation_review_only');
          expect(evidenceSlice.policy).toMatchObject({
            runtimeContent: false,
            mutatesKnowledge: false,
            mutatesProfileMembership: false,
            boardAlignmentClaimed: false,
            profilePlacementRequiresEditorialReview: true
          });

          const evidenceItems = [
            ...(evidenceSlice.readyForProfileReview ?? []),
            ...(evidenceSlice.pendingEditorialReview ?? [])
          ];
          expect(evidenceItems.some((candidate: any) => candidate.lemma === item.lemma)).toBe(true);

          const membership = readJson(`content/profile-memberships/${placement.profileRef}.json`);
          expect(membership.profileRef).toBe(placement.profileRef);
          expect(membership.members.some((member: any) => member.rowId === item.rowId)).toBe(false);
        }
      }
    }

    expect(
      [...grade1Review.profilePlacementReviewQueue.items, ...grade2Review.profilePlacementReviewQueue.items]
        .map((item: any) => item.rowId)
        .sort()
    ).toEqual(reviewedEntries.map((entry: any) => entry.rowId).sort());

    for (const overlay of [grade1Overlay, grade2Overlay]) {
      expect(overlay.policy).toMatchObject({
        mayCountAsHumanReview: false,
        maySetHumanReviewMetadata: false,
        mayApproveProfilePlacement: false,
        sourceGlossesReferenceOnly: true
      });
    }
  });
});
