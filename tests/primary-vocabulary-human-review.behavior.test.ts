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
  const placementHandoff = readJson('content/lexicon/reviews/reviewed-profile-placement-batch-001.json');

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

  it('keeps all 16 candidate profile placements fail-closed pending explicit human editorial approval', () => {
    const reviewedEntries = checkedInKnowledge[0].entries;
    const reviewedByRowId = new Map(reviewedEntries.map((entry: any) => [entry.rowId, entry]));

    expect(placementHandoff).toMatchObject({
      kind: 'primary_vocabulary_profile_placement_review_handoff',
      batchId: 'reviewed-primary-meanings-001',
      sourceKnowledgeRef: 'knowledge.english.vocabulary.primary-reviewed.001',
      status: 'pending_human_editorial_approval',
      policy: {
        requiredApprovalAuthority: 'human_editor',
        candidateOnly: true,
        profileMembershipMutationAllowed: false,
        boardAlignmentClaimed: false,
        examAlignmentClaimed: false,
        approvedPlacements: []
      }
    });
    expect(placementHandoff.items).toHaveLength(16);
    expect(new Set(placementHandoff.items.map((item: any) => item.rowId))).toEqual(
      new Set(reviewedEntries.map((entry: any) => entry.rowId))
    );

    for (const item of placementHandoff.items) {
      const entry = reviewedByRowId.get(item.rowId);
      expect(entry).toBeTruthy();
      expect(item.lemma).toBe(entry.subject.label);
      expect(item.primaryVocabularyGrade).toBe(entry.meta.primaryVocabularyGrade);
      expect(item.placementStatus).toBe('pending_human_editorial_approval');

      expect(item.candidateSetRef).toBe(`grade${item.primaryVocabularyGrade}`);
      const expectedCandidates = placementHandoff.candidateSets[item.candidateSetRef];
      expect(expectedCandidates.length).toBeGreaterThan(0);

      for (const profileRef of expectedCandidates) {
        const evidencePath = placementHandoff.profileEvidence[profileRef];
        expect(typeof evidencePath).toBe('string');
        const evidenceSlice = readJson(evidencePath);
        expect(evidenceSlice.profileRef).toBe(profileRef);
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

        const membership = readJson(`content/profile-memberships/${profileRef}.json`);
        expect(membership.profileRef).toBe(profileRef);
        expect(membership.members.some((member: any) => member.rowId === item.rowId)).toBe(false);
      }
    }
  });
});
