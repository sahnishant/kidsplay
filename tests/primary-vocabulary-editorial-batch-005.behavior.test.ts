import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildEditorialPacket,
  collectTerminalEditorialLemmas
} from '../scripts/lexicon/prepare-primary-vocabulary-editorial-packet.mjs';
import { applyAiDraftOverlay } from '../scripts/lexicon/apply-primary-vocabulary-ai-draft-overlay.mjs';
import { finalizeEditorialPacket } from '../scripts/lexicon/finalize-primary-vocabulary-editorial-packet.mjs';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(path), 'utf8'));
const profileTargets = (grade: number) => grade === 1
  ? ['CBSE_INDIA_CLASS1', 'CISCE_INDIA_CLASS1']
  : ['CBSE_INDIA_CLASS2', 'CISCE_INDIA_CLASS2', 'SOF_INDIA_CLASS2'];
const reviewPaths = (grade: number) => [1, 2, 3, 4].map((batch) =>
  `content/lexicon/reviews/grade-${grade}-batch-${String(batch).padStart(3, '0')}.json`
);

const expectedWords = new Map<number, string[]>([
  [1, ['use', 'better', 'help', 'little', 'break', 'big', 'continue', 'build', 'small', 'white', 'consider', 'open', 'black', 'like', 'light', 'red']],
  [2, ['map', 'fly', 'warm', 'email', 'holiday', 'laugh', 'document', 'join', 'hurt', 'drink', 'grow', 'sit', 'carry', 'ride', 'draw', 'jump']]
]);
const expectedCandidateCounts = new Map([[1, 48], [2, 46]]);
const nonFirstSenseChoices = new Map<number, Map<string, string>>([
  [1, new Map([
    ['use', 'use#n#2'], ['break', 'break#v#2'], ['consider', 'consider#v#2'],
    ['like', 'like#v#2'], ['light', 'light#n#2']
  ])],
  [2, new Map([
    ['email', 'email#n#2'], ['holiday', 'holiday#n#2'], ['grow', 'grow#v#3'],
    ['ride', 'ride#v#2'], ['draw', 'draw#v#3']
  ])]
]);

function buildBatch005(grade: number) {
  const slice = readJson(`content/lexicon/open/curator-slices/grade-${grade}-meaning-review-080.json`);
  const paths = reviewPaths(grade);
  const handoffs = paths.map(readJson);
  const excluded = collectTerminalEditorialLemmas(handoffs, grade);
  const packet = buildEditorialPacket(slice, {
    batchId: `grade-${grade}-batch-005`,
    limit: 16,
    profileReviewTargets: profileTargets(grade),
    excludeLemmas: excluded,
    excludedReviewRefs: paths
  });
  return { packet, excluded, handoffs };
}

function reviewedRuntimeCount() {
  return [
    'content/knowledge/english-vocabulary-primary-reviewed.json',
    'content/knowledge/english-vocabulary-primary-reviewed-batch-002.json',
    'content/knowledge/english-vocabulary-primary-reviewed-batch-003.json',
    'content/knowledge/english-vocabulary-primary-reviewed-batch-004.json'
  ].reduce((total, path) => total + (readJson(path)[0]?.entries?.length ?? 0), 0);
}

describe('primary vocabulary editorial batch 005 preparation', () => {
  it('selects the next deterministic 16 + 16 only after all terminal batch 001-004 outcomes', () => {
    for (const grade of [1, 2]) {
      const first = buildBatch005(grade);
      const second = buildBatch005(grade);
      const checkedIn = readJson(`content/lexicon/editorial-packets/grade-${grade}-batch-005.json`);

      expect(first.excluded).toHaveLength(56);
      expect(second.excluded).toEqual(first.excluded);
      expect(first.packet).toEqual(second.packet);
      expect(first.packet).toEqual(checkedIn);
      expect(first.packet.items.map((item: any) => item.lemma)).toEqual(expectedWords.get(grade));
      expect(first.packet.summary).toMatchObject({
        words: 16,
        candidateSenses: expectedCandidateCounts.get(grade),
        excludedPriorReview: 56,
        reviewed: 0,
        accepted: 0,
        rejected: 0
      });
      expect(first.packet.policy.publicationState).toBe('blocked_pending_editorial_review');

      const selected = new Set(first.packet.items.map((item: any) => item.lemma));
      const terminalHolds = first.handoffs.flatMap((handoff: any) => handoff.unresolvedItems ?? [])
        .filter((item: any) => item.reviewAuthority === 'human_editor' && item.decision === 'hold')
        .map((item: any) => item.lemma);
      expect(terminalHolds.length).toBeGreaterThan(0);
      for (const lemma of terminalHolds) {
        expect(first.excluded).toContain(lemma);
        expect(selected.has(lemma)).toBe(false);
      }

      expect(first.packet.items.every((item: any) =>
        item.editorial.status === 'draft' &&
        item.editorial.decision === null &&
        item.editorial.selectedCandidateId === null &&
        item.editorial.reviewAuthority === null &&
        item.editorial.reviewer === null &&
        item.editorial.reviewedAt === null &&
        item.profilePlacement.status === 'unreviewed' &&
        item.profilePlacement.approvedProfileRefs.length === 0 &&
        item.profilePlacement.reviewAuthority === null &&
        item.profilePlacement.reviewer === null &&
        item.profilePlacement.reviewedAt === null
      )).toBe(true);
    }
  });

  it('attaches one bounded evidence-aware AI review aid per candidate without granting authority', () => {
    for (const grade of [1, 2]) {
      const { packet } = buildBatch005(grade);
      const overlay = readJson(`content/lexicon/ai-draft-overlays/grade-${grade}-batch-005-ai-draft-001.json`);
      const overlaid = applyAiDraftOverlay(packet, overlay);

      expect(overlay.suggestions).toHaveLength(16);
      expect(overlaid.aiDraftOverlay).toMatchObject({
        status: 'suggestions_attached_review_required',
        suggestionsApplied: 16,
        publicationState: 'blocked_pending_editorial_review'
      });
      expect(overlaid.items.filter((item: any) => item.aiDraft)).toHaveLength(16);

      for (const item of overlaid.items) {
        expect(item.candidateSenses.map((candidate: any) => candidate.candidateId)).toContain(item.aiDraft.proposedCandidateId);
        expect(item.aiDraft).toMatchObject({
          status: 'suggestion_only_unreviewed',
          mayCountAsReviewed: false,
          humanReviewRequired: true,
          profilePlacementApproved: false
        });
        expect(['low', 'medium', 'hold_recommended']).toContain(item.aiDraft.ambiguityWarning.level);
        expect(item.aiDraft.profilePlacementRationale).toMatch(/Editorial cue only:/);
        expect(item.aiDraft.profilePlacementRationale).toMatch(/not official/i);
        expect(item.editorial).toMatchObject({
          status: 'draft', decision: null, selectedCandidateId: null,
          reviewAuthority: null, reviewer: null, reviewedAt: null
        });
        expect(item.profilePlacement).toMatchObject({
          status: 'unreviewed', approvedProfileRefs: [],
          reviewAuthority: null, reviewer: null, reviewedAt: null
        });
      }

      for (const [lemma, candidateId] of nonFirstSenseChoices.get(grade) ?? []) {
        expect(overlaid.items.find((item: any) => item.lemma === lemma)?.aiDraft?.proposedCandidateId).toBe(candidateId);
      }

      const handoff = finalizeEditorialPacket(overlaid);
      expect(handoff.summary.reviewedDecisions).toBe(0);
      expect(handoff.summary.reviewedProfilePlacements).toBe(0);
      expect(handoff.decisions).toEqual([]);
      expect(handoff.profilePlacements).toEqual([]);
    }
  });

  it('rejects AI attempts to manufacture editorial or profile authority', () => {
    const { packet } = buildBatch005(1);
    const overlay = readJson('content/lexicon/ai-draft-overlays/grade-1-batch-005-ai-draft-001.json');

    for (const [field, value] of [
      ['reviewAuthority', 'human_editor'],
      ['reviewer', 'fake-reviewer'],
      ['reviewedAt', '2026-09-03'],
      ['selectedCandidateId', 'use#n#2'],
      ['approvedProfileRefs', ['CBSE_INDIA_CLASS1']],
      ['profilePlacement', { status: 'reviewed' }]
    ] as const) {
      const bad = structuredClone(overlay);
      bad.suggestions[0][field] = value;
      expect(() => applyAiDraftOverlay(structuredClone(packet), bad)).toThrow(/may not set human review field/);
    }
  });

  it('keeps the reviewed runtime and launch cardinalities unchanged before human approval', () => {
    expect(reviewedRuntimeCount()).toBe(103);
    const freeVocabularyPack = readJson('content/packs/free-vocabulary.json');
    const reviewedLaunchRefs = (freeVocabularyPack.questionRefs ?? [])
      .filter((ref: string) => ref.startsWith('vocab.primary.reviewed.'));
    expect(reviewedLaunchRefs).toHaveLength(389);
    expect(new Set(reviewedLaunchRefs).size).toBe(389);

    expect(existsSync(resolve('content/knowledge/english-vocabulary-primary-reviewed-batch-005.json'))).toBe(false);
    expect(existsSync(resolve('content/learnables/primary-vocabulary-reviewed-batch-005.json'))).toBe(false);
    expect(existsSync(resolve('content/recipes/primary-vocabulary-reviewed-delivery-batch-005.json'))).toBe(false);
  });
});
