import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildEditorialPacket,
  collectTerminalEditorialLemmas
} from '../scripts/lexicon/prepare-primary-vocabulary-editorial-packet.mjs';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(path), 'utf8'));

const profileTargets = (grade: number) => grade === 1
  ? ['CBSE_INDIA_CLASS1', 'CISCE_INDIA_CLASS1']
  : ['CBSE_INDIA_CLASS2', 'CISCE_INDIA_CLASS2', 'SOF_INDIA_CLASS2'];

const rankedLemmas = (slice: any) => [...slice.items]
  .sort((left: any, right: any) => Number(right.priorityScore ?? 0) - Number(left.priorityScore ?? 0)
    || String(left.lemma ?? '').trim().localeCompare(String(right.lemma ?? '').trim(), 'en'))
  .map((item: any) => String(item.lemma ?? '').trim().toLowerCase());

const terminalLemmas = (handoffs: any[]) => new Set(handoffs.flatMap((handoff) => [
  ...(handoff.decisions ?? []).map((decision: any) => String(decision.lemma).toLowerCase()),
  ...(handoff.unresolvedItems ?? []).map((item: any) => String(item.lemma).toLowerCase())
]));

describe('primary vocabulary editorial batch 003 preparation', () => {
  it('selects the next 16 words per grade after accepted, rejected and human-held prior editorial outcomes', () => {
    for (const grade of [1, 2]) {
      const slice = readJson(`content/lexicon/open/curator-slices/grade-${grade}-meaning-review.json`);
      const reviewPaths = [
        `content/lexicon/reviews/grade-${grade}-batch-001.json`,
        `content/lexicon/reviews/grade-${grade}-batch-002.json`
      ];
      const handoffs = reviewPaths.map(readJson);
      const excluded = collectTerminalEditorialLemmas(handoffs, grade);
      const terminal = terminalLemmas(handoffs);
      const expected = rankedLemmas(slice).filter((lemma) => !terminal.has(lemma)).slice(0, 16);
      const packet = buildEditorialPacket(slice, {
        batchId: `grade-${grade}-batch-003`,
        limit: 16,
        profileReviewTargets: profileTargets(grade),
        excludeLemmas: excluded,
        excludedReviewRefs: reviewPaths
      });
      const repeated = buildEditorialPacket(slice, {
        batchId: `grade-${grade}-batch-003`,
        limit: 16,
        profileReviewTargets: profileTargets(grade),
        excludeLemmas: excluded,
        excludedReviewRefs: reviewPaths
      });

      expect(excluded).toHaveLength(24);
      expect(packet).toEqual(repeated);
      expect(packet.items.map((item: any) => item.lemma)).toEqual(expected);
      expect(packet.summary).toMatchObject({ words: 16, excludedPriorReview: 24, reviewed: 0, accepted: 0, rejected: 0 });
      expect(packet.selection.excludedReviewRefs).toEqual(reviewPaths);
      expect(packet.items.every((item: any) => item.editorial.status === 'draft')).toBe(true);
      expect(packet.items.every((item: any) => item.editorial.reviewAuthority === null)).toBe(true);
      expect(packet.items.every((item: any) => item.profilePlacement.status === 'unreviewed')).toBe(true);
      expect(packet.items.every((item: any) => !terminal.has(item.lemma))).toBe(true);
    }
  });

  it('keeps the two genuine batch-002 holds terminal for reselection without making them runtime decisions', () => {
    const grade1 = readJson('content/lexicon/reviews/grade-1-batch-002.json');
    const grade2 = readJson('content/lexicon/reviews/grade-2-batch-002.json');
    expect(collectTerminalEditorialLemmas([grade1], 1)).toContain('great');
    expect(collectTerminalEditorialLemmas([grade2], 2)).toContain('opposite');
    expect(grade1.decisions.some((decision: any) => decision.lemma === 'great')).toBe(false);
    expect(grade2.decisions.some((decision: any) => decision.lemma === 'opposite')).toBe(false);
    expect(grade1.unresolvedItems.map((item: any) => item.lemma)).toEqual(['great']);
    expect(grade2.unresolvedItems.map((item: any) => item.lemma)).toEqual(['opposite']);
  });

  it('fails closed when a terminal hold lacks authentic human authority or correction guards', () => {
    const review = readJson('content/lexicon/reviews/grade-1-batch-002.json');
    const unresolvedAi = structuredClone(review);
    unresolvedAi.unresolvedItems[0].reviewAuthority = 'ai';
    expect(() => collectTerminalEditorialLemmas([unresolvedAi], 1)).toThrow(/hold exclusion requires human_editor review authority/);

    const mismatch = structuredClone(review);
    mismatch.unresolvedItems.push({
      lemma: 'synthetic-pointer-mismatch',
      status: 'blocked_candidate_pointer_mismatch',
      decision: 'hold',
      approvedCandidateId: 'synthetic#n#1',
      proposedCorrectedCandidateId: 'synthetic#n#2',
      candidateCorrectionRequiresExplicitApproval: true,
      reasonCode: 'candidate_pointer_mismatch',
      humanWordingApproval: {
        reviewAuthority: 'human_editor',
        reviewer: 'sahnishant',
        reviewedAt: '2026-09-02'
      }
    });
    const mismatchAi = structuredClone(mismatch);
    mismatchAi.unresolvedItems.at(-1).humanWordingApproval.reviewAuthority = 'ai';
    expect(() => collectTerminalEditorialLemmas([mismatchAi], 1)).toThrow(/candidate-mismatch hold exclusion requires human_editor review authority/);
    const noCorrectionGuard = structuredClone(mismatch);
    noCorrectionGuard.unresolvedItems.at(-1).candidateCorrectionRequiresExplicitApproval = false;
    expect(() => collectTerminalEditorialLemmas([noCorrectionGuard], 1)).toThrow(/must require explicit candidate correction approval/);
  });
});
