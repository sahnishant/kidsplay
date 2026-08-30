import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

type ScopeReport = {
  profileRef: string;
  directMembershipRows: number;
  effectiveMembershipRows: number;
  includedProfileRefs: string[];
  sections: Array<{
    section: string;
    currentClassRepresentedFamilies: number;
    totalFamilies: number;
    missingCurrentClassFamilies: string[];
    familiesWithIncludedPreviousClassRows: number;
  }>;
  missingCurrentClassFamilies: Array<{
    section: string;
    id: string;
  }>;
};

function report(): ScopeReport {
  const output = execFileSync(
    process.execPath,
    ['scripts/report-profile-scope.mjs', '--profile=SOF_INDIA_CLASS3', '--json'],
    { cwd: process.cwd(), encoding: 'utf8' }
  );
  return JSON.parse(output) as ScopeReport;
}

describe('SOF Class 3 scope breadth', () => {
  it('represents every declared current/shared topic family while preserving previous-class composition separately', () => {
    const summary = report();
    const science = summary.sections.find((section) => section.section === 'science');
    const reasoning = summary.sections.find((section) => section.section === 'logical_reasoning');

    expect(summary.profileRef).toBe('SOF_INDIA_CLASS3');
    expect(summary.includedProfileRefs).toContain('SOF_INDIA_CLASS2');
    expect(summary.effectiveMembershipRows).toBeGreaterThan(summary.directMembershipRows);

    expect(science?.currentClassRepresentedFamilies).toBe(science?.totalFamilies);
    expect(science?.missingCurrentClassFamilies).toEqual([]);
    expect(science?.familiesWithIncludedPreviousClassRows).toBeGreaterThan(0);

    expect(reasoning?.currentClassRepresentedFamilies).toBe(reasoning?.totalFamilies);
    expect(reasoning?.missingCurrentClassFamilies).toEqual([]);
    expect(summary.missingCurrentClassFamilies).toEqual([]);
  });
});
