import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readText = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const readJson = (path: string) => JSON.parse(readText(path));
const gitBlobSha = (text: string) => {
  const canonical = text.replace(/\r\n/g, '\n');
  return createHash('sha1')
    .update(`blob ${Buffer.byteLength(canonical)}\0`)
    .update(canonical)
    .digest('hex');
};

const reviewedPlacementRowIds = (review: any) => review.profilePlacements
  .filter((entry: { approvedProfileRefs: string[] }) => entry.approvedProfileRefs.includes('SOF_INDIA_CLASS2'))
  .map((entry: { lemma: string; rowId?: string }) => {
    if (entry.rowId) return entry.rowId;
    const decision = review.decisions.find((item: { lemma: string }) => item.lemma === entry.lemma);
    return `kr.vocab.primary.meaning.${entry.lemma}.${decision.candidateId.replaceAll('#', '-')}`;
  });

describe('SOF Class 2 terminal provenance review', () => {
  it('keeps exact evidence, historical no-exact review and later editorial placement separate', () => {
    const membershipText = readText('content/profile-memberships/SOF_INDIA_CLASS2.json');
    const exactReviewText = readText('content/alignment-reviews/SOF_INDIA_CLASS2.json');
    const recoveryText = readText('content/alignment-recovery/SOF_INDIA_CLASS2.json');
    const membership = JSON.parse(membershipText);
    const exactReview = JSON.parse(exactReviewText);
    const recovery = JSON.parse(recoveryText);
    const terminal = readJson('content/alignment-terminal-reviews/SOF_INDIA_CLASS2.json');
    const batch1Placements = readJson('content/lexicon/reviews/grade-2-batch-001-profile-placements.json');
    const batch2Review = readJson('content/lexicon/reviews/grade-2-batch-002.json');
    const batch3Review = readJson('content/lexicon/reviews/grade-2-batch-003.json');
    const batch4Review = readJson('content/lexicon/reviews/grade-2-batch-004.json');
    const batch5Review = readJson('content/lexicon/reviews/grade-2-batch-005.json');

    const memberIds = membership.members.map((member: { rowId: string }) => member.rowId);
    const exactIds = new Set<string>(exactReview.rowEvidence.map((entry: { rowId: string }) => entry.rowId));
    const editorialIds = new Set<string>([
      ...reviewedPlacementRowIds(batch1Placements),
      ...reviewedPlacementRowIds(batch2Review),
      ...reviewedPlacementRowIds(batch3Review),
      ...reviewedPlacementRowIds(batch4Review),
      ...reviewedPlacementRowIds(batch5Review)
    ]);
    const auditedMemberIds = memberIds.filter((rowId: string) => !editorialIds.has(rowId));
    const auditedResolved = auditedMemberIds.map((rowId: string) => exactIds.has(rowId)
      ? 'exact_official_anchor'
      : 'reviewed_no_exact_public_anchor');

    expect(memberIds).toHaveLength(249);
    expect(new Set(memberIds).size).toBe(249);
    expect(editorialIds.size).toBe(67);
    expect(auditedMemberIds).toHaveLength(182);
    expect(exactIds.size).toBe(27);
    expect(auditedResolved.filter((value: string) => value === 'exact_official_anchor')).toHaveLength(27);
    expect(auditedResolved.filter((value: string) => value === 'reviewed_no_exact_public_anchor')).toHaveLength(155);
    expect(auditedResolved).not.toContain('pending');

    expect(terminal).toMatchObject({
      profileRef: 'SOF_INDIA_CLASS2',
      status: 'completed',
      membershipSnapshot: {
        directRowCount: 249,
        exactOfficialAnchorCount: 27,
        reviewedNoExactPublicAnchorCount: 155,
        humanEditorialPlacementCount: 67,
        terminalRowCount: 249,
        membershipBlobSha: gitBlobSha(membershipText),
        exactReviewBlobSha: gitBlobSha(exactReviewText),
        recoveryBlobSha: gitBlobSha(recoveryText)
      },
      resolutionPolicy: {
        exactOfficialAnchor: { disposition: 'exact_official_anchor' },
        humanEditorialPlacement: { disposition: 'human_editorial_placement_no_official_anchor_claim' },
        otherwise: { disposition: 'reviewed_no_exact_public_anchor' }
      },
      editorialPlacementReview: {
        status: 'completed',
        reviewAuthority: 'human_editor',
        reviewer: 'sahnishant',
        reviewedAt: '2026-09-03',
        reviewedDirectRows: 67,
        disposition: 'human_editorial_placement_no_official_anchor_claim'
      },
      sourceAudit: {
        auditedDirectRowCount: 182,
        auditedMembershipBlobSha: '6fe76aa5edfb97b6906bf254f9af06241966482d'
      }
    });

    expect(terminal.editorialPlacementReview.handoffRefs).toContain('content/lexicon/reviews/grade-2-batch-003.json');
    expect(terminal.editorialPlacementReview.handoffRefs).toContain('content/lexicon/reviews/grade-2-batch-004.json');
    expect(terminal.editorialPlacementReview.handoffRefs).toContain('content/lexicon/reviews/grade-2-batch-005.json');
    expect(new Set(terminal.sourceAudit.recoveryLeadRefs)).toEqual(new Set(recovery.leads.map((lead: { id: string }) => lead.id)));
    for (const lead of recovery.leads) expect(lead.evidenceEligible).toBe(false);
    expect(terminal.sourceAudit.terminalMeaning).toContain('does not claim');
    expect(terminal.editorialPlacementReview.meaning).toContain('does not claim');
  });
});
