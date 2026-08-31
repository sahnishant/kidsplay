import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readText = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const readJson = (path: string) => JSON.parse(readText(path));
const gitBlobSha = (text: string) => createHash('sha1')
  .update(`blob ${Buffer.byteLength(text)}\0`)
  .update(text)
  .digest('hex');

describe('SOF Class 2 terminal provenance review', () => {
  it('keeps exact evidence separate from terminal no-exact dispositions', () => {
    const membershipText = readText('content/profile-memberships/SOF_INDIA_CLASS2.json');
    const exactReviewText = readText('content/alignment-reviews/SOF_INDIA_CLASS2.json');
    const recoveryText = readText('content/alignment-recovery/SOF_INDIA_CLASS2.json');
    const membership = JSON.parse(membershipText);
    const exactReview = JSON.parse(exactReviewText);
    const recovery = JSON.parse(recoveryText);
    const terminal = readJson('content/alignment-terminal-reviews/SOF_INDIA_CLASS2.json');

    const memberIds = membership.members.map((member: { rowId: string }) => member.rowId);
    const exactIds = new Set<string>(exactReview.rowEvidence.map((entry: { rowId: string }) => entry.rowId));
    const resolved = memberIds.map((rowId: string) => exactIds.has(rowId)
      ? 'exact_official_anchor'
      : 'reviewed_no_exact_public_anchor');

    expect(memberIds).toHaveLength(182);
    expect(new Set(memberIds).size).toBe(182);
    expect(exactIds.size).toBe(27);
    expect(resolved.filter((value: string) => value === 'exact_official_anchor')).toHaveLength(27);
    expect(resolved.filter((value: string) => value === 'reviewed_no_exact_public_anchor')).toHaveLength(155);
    expect(resolved).not.toContain('pending');

    expect(terminal).toMatchObject({
      profileRef: 'SOF_INDIA_CLASS2',
      status: 'completed',
      membershipSnapshot: {
        directRowCount: 182,
        exactOfficialAnchorCount: 27,
        terminalRowCount: 182,
        membershipBlobSha: gitBlobSha(membershipText),
        exactReviewBlobSha: gitBlobSha(exactReviewText),
        recoveryBlobSha: gitBlobSha(recoveryText)
      },
      resolutionPolicy: {
        exactOfficialAnchor: { disposition: 'exact_official_anchor' },
        otherwise: { disposition: 'reviewed_no_exact_public_anchor' }
      }
    });

    expect(new Set(terminal.sourceAudit.recoveryLeadRefs)).toEqual(new Set(recovery.leads.map((lead: { id: string }) => lead.id)));
    for (const lead of recovery.leads) expect(lead.evidenceEligible).toBe(false);
    expect(terminal.sourceAudit.terminalMeaning).toContain('does not claim');
  });
});
