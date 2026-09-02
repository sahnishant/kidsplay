import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildEditorialPacket,
  collectReviewedLemmas
} from '../scripts/lexicon/prepare-primary-vocabulary-editorial-packet.mjs';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(path), 'utf8'));

const profileTargets = (grade: number) => grade === 1
  ? ['CBSE_INDIA_CLASS1', 'CISCE_INDIA_CLASS1']
  : ['CBSE_INDIA_CLASS2', 'CISCE_INDIA_CLASS2', 'SOF_INDIA_CLASS2'];

const rankedLemmas = (slice: any) => [...slice.items]
  .sort((left: any, right: any) => Number(right.priorityScore ?? 0) - Number(left.priorityScore ?? 0)
    || String(left.lemma ?? '').trim().localeCompare(String(right.lemma ?? '').trim(), 'en'))
  .map((item: any) => String(item.lemma ?? '').trim().toLowerCase());

describe('primary vocabulary editorial batch 002 preparation', () => {
  it('deterministically selects the next 16 Grade 1/2 words after terminal human-reviewed decisions', () => {
    for (const grade of [1, 2]) {
      const slicePath = `content/lexicon/open/curator-slices/grade-${grade}-meaning-review.json`;
      const reviewPath = `content/lexicon/reviews/grade-${grade}-batch-001.json`;
      const slice = readJson(slicePath);
      const review = readJson(reviewPath);
      const excluded = collectReviewedLemmas([review], grade);
      const reviewed = new Set(review.decisions.map((decision: any) => String(decision.lemma).toLowerCase()));

      expect(excluded).toHaveLength(8);
      expect(excluded).toEqual([...reviewed].sort((left, right) => left.localeCompare(right, 'en')));

      const options = {
        batchId: `grade-${grade}-batch-002`,
        limit: 16,
        profileReviewTargets: profileTargets(grade),
        excludeLemmas: excluded,
        excludedReviewRefs: [reviewPath]
      };
      const packet = buildEditorialPacket(slice, options);
      const repeated = buildEditorialPacket(slice, options);
      const expected = rankedLemmas(slice).filter((lemma) => !reviewed.has(lemma)).slice(0, 16);

      expect(packet).toEqual(repeated);
      expect(packet.batchId).toBe(`grade-${grade}-batch-002`);
      expect(packet.items.map((item: any) => item.lemma)).toEqual(expected);
      expect(packet.summary).toMatchObject({
        words: 16,
        excludedPriorReview: 8,
        reviewed: 0,
        accepted: 0,
        rejected: 0
      });
      expect(packet.selection).toEqual({
        requestedLimit: 16,
        excludedPriorReviewLemmas: excluded,
        excludedReviewRefs: [reviewPath]
      });
      expect(packet.items.some((item: any) => reviewed.has(item.lemma))).toBe(false);
      expect(packet.items.every((item: any) => item.editorial.status === 'draft')).toBe(true);
      expect(packet.items.every((item: any) => item.editorial.reviewAuthority === null)).toBe(true);
      expect(packet.items.every((item: any) => item.profilePlacement.status === 'unreviewed')).toBe(true);
      expect(packet.items.every((item: any) => item.profilePlacement.approvedProfileRefs.length === 0)).toBe(true);
    }
  });

  it('fails closed if exclusion input is not an authentic terminal human-review handoff', () => {
    const review = readJson('content/lexicon/reviews/grade-1-batch-001.json');

    const wrongAuthority = structuredClone(review);
    wrongAuthority.decisions[0].reviewAuthority = 'ai';
    expect(() => collectReviewedLemmas([wrongAuthority], 1)).toThrow(/exclusion requires human_editor review authority/);

    const pendingDecision = structuredClone(review);
    pendingDecision.decisions[0].status = 'pending';
    expect(() => collectReviewedLemmas([pendingDecision], 1)).toThrow(/terminal reviewed accept\/reject decision/);

    expect(() => collectReviewedLemmas([review], 2)).toThrow(/does not match curator grade/);
  });
});
