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
  const grade1Placement = readJson('content/lexicon/reviews/grade-1-batch-001-profile-placements.json');
  const grade2Placement = readJson('content/lexicon/reviews/grade-2-batch-001-profile-placements.json');
  const grade1Slice = readJson('content/lexicon/open/curator-slices/grade-1-meaning-review.json');
  const grade2Slice = readJson('content/lexicon/open/curator-slices/grade-2-meaning-review.json');
  const grade1Overlay = readJson('content/lexicon/ai-draft-overlays/grade-1-batch-001-ai-draft-001.json');
  const grade2Overlay = readJson('content/lexicon/ai-draft-overlays/grade-2-batch-001-ai-draft-001.json');
  const checkedInKnowledge = readJson('content/knowledge/english-vocabulary-primary-reviewed.json');

  it('records 16 explicit human accept decisions without inferring placement from meaning review', () => {
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

  it('passes the guarded importer and exactly matches checked-in batch-001 knowledge', () => {
    const candidates = candidateIndex([grade1Slice, grade2Slice]);
    const decisions = [...grade1Review.decisions, ...grade2Review.decisions].map((decision: any) => ({
      ...decision,
      decisionFile: 'human-review-batch-001'
    }));

    const knowledge = buildReviewedKnowledge(decisions, candidates, { batchKey: '001' });
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

  it('applies the later explicit human profile-placement handoffs without changing board provenance', () => {
    const expectedProfilesByGrade: Record<number, string[]> = {
      1: ['CBSE_INDIA_CLASS1', 'CISCE_INDIA_CLASS1'],
      2: ['CBSE_INDIA_CLASS2', 'CISCE_INDIA_CLASS2', 'SOF_INDIA_CLASS2']
    };

    for (const [review, placement] of [[grade1Review, grade1Placement], [grade2Review, grade2Placement]] as const) {
      expect(placement.kind).toBe('primary_vocabulary_profile_placement_review_handoff');
      expect(placement.policy).toMatchObject({
        requiredReviewAuthority: 'human_editor',
        profilePlacementIsEditorialNotOfficialBoardEvidence: true,
        mayInferFromGradeOrCorpus: false
      });
      expect(placement.profilePlacements).toHaveLength(8);
      expect(placement.summary.approvedMemberships).toBe(review.grade === 1 ? 16 : 24);

      const decisionByLemma = new Map(review.decisions.map((decision: any) => [decision.lemma, decision]));
      for (const item of placement.profilePlacements) {
        expect(decisionByLemma.has(item.lemma)).toBe(true);
        expect(item).toMatchObject({
          status: 'reviewed',
          reviewAuthority: 'human_editor',
          reviewer: 'sahnishant',
          reviewedAt: '2026-09-02'
        });
        expect(item.approvedProfileRefs).toEqual(expectedProfilesByGrade[review.grade]);
        for (const profileRef of item.approvedProfileRefs) {
          const membership = readJson(`content/profile-memberships/${profileRef}.json`);
          expect(membership.provenance.status).toBe('prototype_unverified');
          expect(membership.members).toContainEqual({ rowId: item.rowId, fit: 'core' });
        }
      }
    }

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
