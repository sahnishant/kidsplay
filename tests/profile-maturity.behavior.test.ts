import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

type ProfileMaturity = {
  profileRef: string;
  membershipRows: number;
  coveredProfileRows: number;
  freeCoveredProfileRows: number;
  reusedAcrossProfilesRows: number;
  multiFormatRows: number;
  assessmentBlueprints: Array<{
    id: string;
    ready: boolean;
    sections: Array<{
      id: string;
      requiredQuestions: number;
      availableQuestions: number;
      ready: boolean;
    }>;
  }>;
  gaps: {
    uncoveredRows: Array<{ rowId: string }>;
    freeUncoveredRows: Array<{ rowId: string }>;
    shallowRunnableRows: Array<{ rowId: string }>;
  };
};

function report(profileRef: string): ProfileMaturity {
  const output = execFileSync(
    process.execPath,
    ['scripts/report-learning-coverage.mjs', `--profile=${profileRef}`, '--json'],
    { cwd: process.cwd(), encoding: 'utf8' }
  );
  return JSON.parse(output) as ProfileMaturity;
}

describe('profile maturity reporting', () => {
  it('preserves the mature Class 2 runnable baseline while reporting reusable maturity dimensions', () => {
    const summary = report('SOF_INDIA_CLASS2');

    expect(summary.profileRef).toBe('SOF_INDIA_CLASS2');
    expect(summary.membershipRows).toBeGreaterThan(0);
    expect(summary.coveredProfileRows).toBe(summary.membershipRows);
    expect(summary.gaps.uncoveredRows).toEqual([]);
    expect(summary.multiFormatRows).toBeGreaterThan(0);
    expect(summary.assessmentBlueprints.length).toBeGreaterThan(0);
  });

  it('reports Class 3 as a real profile with reuse, explicit free/depth gaps and blueprint readiness evidence', () => {
    const summary = report('SOF_INDIA_CLASS3');

    expect(summary.profileRef).toBe('SOF_INDIA_CLASS3');
    expect(summary.membershipRows).toBeGreaterThan(0);
    expect(summary.reusedAcrossProfilesRows).toBeGreaterThan(0);
    expect(summary.freeCoveredProfileRows).toBeLessThanOrEqual(summary.membershipRows);
    expect(Array.isArray(summary.gaps.freeUncoveredRows)).toBe(true);
    expect(Array.isArray(summary.gaps.shallowRunnableRows)).toBe(true);
    expect(summary.assessmentBlueprints.some((blueprint) =>
      blueprint.sections.some((section) => section.requiredQuestions > 0)
    )).toBe(true);
  });
});
