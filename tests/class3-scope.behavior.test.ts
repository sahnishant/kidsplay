import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

type ScopeReport = {
  profileRef: string;
  directMembershipRows: number;
  effectiveMembershipRows: number;
  inheritedProfileRefs: string[];
  sections: Array<{
    section: string;
    currentClassRepresentedFamilies: number;
    totalFamilies: number;
    representedGroups: number;
    totalGroups: number;
    missingCurrentClassFamilies: string[];
    missingCurrentGroups: string[];
  }>;
  missingCurrentClassFamilies: Array<{ section: string; id: string }>;
  missingCurrentGroups: Array<{ section: string; familyId: string; id: string }>;
};

function report(): ScopeReport {
  const output = execFileSync(
    process.execPath,
    ['scripts/report-profile-scope.mjs', '--profile=SOF_INDIA_CLASS3', '--json'],
    { cwd: process.cwd(), encoding: 'utf8' }
  );
  return JSON.parse(output) as ScopeReport;
}

describe('SOF Class 3 explicit scope breadth', () => {
  it('represents every declared current/shared topic family without letting inheritance hide gaps', () => {
    const summary = report();
    const science = summary.sections.find((section) => section.section === 'science');
    const reasoning = summary.sections.find((section) => section.section === 'logical_reasoning');

    expect(summary.profileRef).toBe('SOF_INDIA_CLASS3');
    expect(summary.inheritedProfileRefs).toContain('SOF_INDIA_CLASS2');
    expect(summary.effectiveMembershipRows).toBeGreaterThan(summary.directMembershipRows);

    expect(science?.currentClassRepresentedFamilies).toBe(science?.totalFamilies);
    expect(science?.representedGroups).toBe(science?.totalGroups);
    expect(science?.missingCurrentClassFamilies).toEqual([]);
    expect(science?.missingCurrentGroups).toEqual([]);

    expect(reasoning?.currentClassRepresentedFamilies).toBe(reasoning?.totalFamilies);
    expect(reasoning?.representedGroups).toBe(reasoning?.totalGroups);
    expect(reasoning?.missingCurrentClassFamilies).toEqual([]);
    expect(reasoning?.missingCurrentGroups).toEqual([]);

    expect(summary.missingCurrentClassFamilies).toEqual([]);
    expect(summary.missingCurrentGroups).toEqual([]);
  });
});
