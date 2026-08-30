import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

type ProfileMaturity = {
  profileRef: string;
  membershipRows: number;
  runnableProfileQuestions: number;
  coveredProfileRows: number;
  freeCoveredProfileRows: number;
  reusedAcrossProfilesRows: number;
  exclusiveToProfileRows: number;
  gradeSpecificSourceRows: number;
  sharedCanonicalSourceRows: number;
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

  it('turns Class 3 seeds into fully free/runnable rows while exposing remaining mock-depth gaps', () => {
    const summary = report('SOF_INDIA_CLASS3');
    const blueprint = summary.assessmentBlueprints[0];
    const science = blueprint?.sections.find((section) => section.id === 'science');
    const achievers = blueprint?.sections.find((section) => section.id === 'achievers');

    expect(summary.profileRef).toBe('SOF_INDIA_CLASS3');
    expect(summary.membershipRows).toBeGreaterThan(0);
    expect(summary.coveredProfileRows).toBe(summary.membershipRows);
    expect(summary.freeCoveredProfileRows).toBe(summary.membershipRows);
    expect(summary.gaps.uncoveredRows).toEqual([]);
    expect(summary.gaps.freeUncoveredRows).toEqual([]);

    expect(summary.reusedAcrossProfilesRows).toBeGreaterThan(0);
    expect(summary.exclusiveToProfileRows).toBeGreaterThan(0);
    expect(summary.gradeSpecificSourceRows).toBeGreaterThan(0);
    expect(summary.sharedCanonicalSourceRows).toBeGreaterThan(0);
    expect(summary.multiFormatRows).toBeGreaterThan(0);
    expect(summary.runnableProfileQuestions).toBeGreaterThan(summary.membershipRows);

    expect(science?.availableQuestions).toBeGreaterThanOrEqual(science?.requiredQuestions ?? 25);
    expect(science?.ready).toBe(true);
    expect(achievers?.ready).toBe(false);
    expect(blueprint?.ready).toBe(false);
  });
});
