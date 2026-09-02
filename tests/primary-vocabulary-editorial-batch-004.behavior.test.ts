import { readFileSync } from 'node:fs';
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

const expectedWords = new Map<number, string[]>([
  [1, ['answer', 'door', 'difficult', 'earth', 'century', 'eye', 'often', 'new', 'good', 'first', 'well', 'believe', 'work', 'move', 'best', 'long']],
  [2, ['region', 'sort', 'speed', 'quick', 'clean', 'computer', 'sun', 'subject', 'hotel', 'beach', 'color', 'shop', 'camera', 'lake', 'adult', 'window']]
]);
const intentionallyUndrafted = new Map<number, string[]>([
  [1, ['earth', 'well', 'move', 'long']],
  [2, ['region', 'sun', 'subject']]
]);
const expectedSuggestionCount = new Map([[1, 12], [2, 13]]);

const reviewPaths = (grade: number) => [1, 2, 3].map((batch) =>
  `content/lexicon/reviews/grade-${grade}-batch-${String(batch).padStart(3, '0')}.json`
);

describe('primary vocabulary editorial batch 004 preparation', () => {
  it('extends the deterministic curator window without changing the certified first 40 rows', () => {
    for (const grade of [1, 2]) {
      const original = readJson(`content/lexicon/open/curator-slices/grade-${grade}-meaning-review.json`);
      const extended = readJson(`content/lexicon/open/curator-slices/grade-${grade}-meaning-review-080.json`);
      expect(original.items).toHaveLength(40);
      expect(extended.items).toHaveLength(80);
      expect(extended.items.slice(0, 40)).toEqual(original.items);
    }
  });

  it('selects exactly 16 fresh rows per grade after all 40 batch 001-003 terminal outcomes', () => {
    for (const grade of [1, 2]) {
      const slice = readJson(`content/lexicon/open/curator-slices/grade-${grade}-meaning-review-080.json`);
      const paths = reviewPaths(grade);
      const handoffs = paths.map(readJson);
      const excluded = collectTerminalEditorialLemmas(handoffs, grade);
      const packet = buildEditorialPacket(slice, {
        batchId: `grade-${grade}-batch-004`,
        limit: 16,
        profileReviewTargets: profileTargets(grade),
        excludeLemmas: excluded,
        excludedReviewRefs: paths
      });
      const checkedIn = readJson(`content/lexicon/editorial-packets/grade-${grade}-batch-004.json`);

      expect(excluded).toHaveLength(40);
      expect(packet).toEqual(checkedIn);
      expect(packet.items.map((item: any) => item.lemma)).toEqual(expectedWords.get(grade));
      expect(packet.summary).toMatchObject({ words: 16, excludedPriorReview: 40, reviewed: 0, accepted: 0, rejected: 0 });
      expect(packet.policy.publicationState).toBe('blocked_pending_editorial_review');
      expect(packet.items.every((item: any) =>
        item.editorial.status === 'draft' &&
        item.editorial.decision === null &&
        item.editorial.selectedCandidateId === null &&
        item.editorial.reviewAuthority === null &&
        item.profilePlacement.status === 'unreviewed' &&
        item.profilePlacement.approvedProfileRefs.length === 0 &&
        item.profilePlacement.reviewAuthority === null
      )).toBe(true);
    }
  });

  it('attaches only bounded candidate-valid AI review aids and leaves ambiguous or misaligned rows undrafted', () => {
    for (const grade of [1, 2]) {
      const packet = readJson(`content/lexicon/editorial-packets/grade-${grade}-batch-004.json`);
      const overlay = readJson(`content/lexicon/ai-draft-overlays/grade-${grade}-batch-004-ai-draft-001.json`);
      const overlaid = applyAiDraftOverlay(packet, overlay);
      const undrafted = new Set(intentionallyUndrafted.get(grade));

      expect(overlaid.aiDraftOverlay).toMatchObject({
        status: 'suggestions_attached_review_required',
        suggestionsApplied: expectedSuggestionCount.get(grade),
        publicationState: 'blocked_pending_editorial_review'
      });
      expect(overlaid.items.filter((item: any) => item.aiDraft)).toHaveLength(expectedSuggestionCount.get(grade));
      for (const item of overlaid.items) {
        if (undrafted.has(item.lemma)) expect(item.aiDraft).toBeUndefined();
        if (item.aiDraft) {
          expect(item.candidateSenses.map((candidate: any) => candidate.candidateId)).toContain(item.aiDraft.proposedCandidateId);
          expect(item.aiDraft).toMatchObject({
            status: 'suggestion_only_unreviewed',
            mayCountAsReviewed: false,
            humanReviewRequired: true,
            profilePlacementApproved: false
          });
        }
        expect(item.editorial).toMatchObject({
          status: 'draft', decision: null, selectedCandidateId: null,
          reviewAuthority: null, reviewer: null, reviewedAt: null
        });
        expect(item.profilePlacement).toMatchObject({
          status: 'unreviewed', approvedProfileRefs: [],
          reviewAuthority: null, reviewer: null, reviewedAt: null
        });
      }

      const handoff = finalizeEditorialPacket(overlaid);
      expect(handoff.summary.reviewedDecisions).toBe(0);
      expect(handoff.summary.reviewedProfilePlacements).toBe(0);
      expect(handoff.decisions).toEqual([]);
      expect(handoff.profilePlacements).toEqual([]);
    }
  });

  it('surfaces the strongest candidate/POS coverage defects instead of guessing', () => {
    const grade1 = readJson('content/lexicon/editorial-packets/grade-1-batch-004.json');
    const grade2 = readJson('content/lexicon/editorial-packets/grade-2-batch-004.json');
    const earth = grade1.items.find((item: any) => item.lemma === 'earth');
    const sun = grade2.items.find((item: any) => item.lemma === 'sun');
    const subject = grade2.items.find((item: any) => item.lemma === 'subject');

    expect(earth.candidateSenses.map((candidate: any) => candidate.candidateId)).toEqual(['earth#n#1', 'earth#n#2', 'earth#n#3']);
    expect(earth.candidateSenses.some((candidate: any) => /planet/i.test(candidate.sourceSense.definition))).toBe(false);
    expect(sun.candidateSenses.map((candidate: any) => candidate.candidateId)).toEqual(['sun#n#1', 'sun#n#2', 'sun#n#3']);
    expect(sun.candidateSenses.some((candidate: any) => /star/i.test(candidate.sourceSense.definition))).toBe(false);
    expect(subject.partOfSpeech).toBe('adjective');
    expect(subject.candidateSenses.every((candidate: any) => candidate.partOfSpeech === 'a')).toBe(true);

    for (const [grade, lemma] of [[1, 'earth'], [2, 'sun'], [2, 'subject']] as const) {
      const overlay = readJson(`content/lexicon/ai-draft-overlays/grade-${grade}-batch-004-ai-draft-001.json`);
      expect(overlay.suggestions.some((suggestion: any) => suggestion.lemma === lemma)).toBe(false);
    }
  });
});
