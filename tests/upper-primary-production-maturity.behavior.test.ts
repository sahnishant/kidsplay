import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
const readItems = (directory: string) => readdirSync(resolve(process.cwd(), directory))
  .filter((name) => name.endsWith('.json'))
  .sort()
  .flatMap((name) => {
    const value = readJson(`${directory}/${name}`);
    return Array.isArray(value) ? value : [value];
  });
const report = (script: string, args: string[]) => JSON.parse(execFileSync(
  process.execPath,
  [script, ...args, '--json'],
  { cwd: process.cwd(), encoding: 'utf8' }
));

const questions = readItems('content/questions');
const blueprints = readItems('content/assessment-blueprints');

describe('SOF Classes 4-6 production maturity', () => {
  for (const grade of [4, 5, 6]) {
    const profileRef = `SOF_INDIA_CLASS${grade}`;
    const previousProfileRef = `SOF_INDIA_CLASS${grade - 1}`;

    it(`${profileRef} closes runtime, free, scope, assessment and isolation contracts`, () => {
      const rawMembership = readJson(`content/profile-memberships/${profileRef}.json`);
      const directRows = new Set<string>(rawMembership.members.map((member: { rowId: string }) => member.rowId));
      const coverage = report('scripts/report-learning-coverage.mjs', [`--profile=${profileRef}`]);
      const scope = report('scripts/report-profile-scope.mjs', [`--profile=${profileRef}`]);
      const blueprint = blueprints.find((item) => item.profileRef === profileRef);
      const achieverSection = blueprint.sections.find((section: { selector: string }) => section.selector === 'achiever_hots');

      expect(rawMembership.inherits).toEqual(expect.arrayContaining([
        expect.objectContaining({ profileRef: previousProfileRef, memberScope: 'direct', fit: 'review' })
      ]));
      expect(coverage.includedProfileRefs).toContain(previousProfileRef);
      expect(coverage.directMembershipRows).toBe(rawMembership.members.length);
      expect(coverage.includedMembershipRows).toBeGreaterThan(0);
      expect(coverage.coveredProfileRows).toBe(coverage.membershipRows);
      expect(coverage.freeCoveredProfileRows).toBe(coverage.membershipRows);
      expect(coverage.gaps.uncoveredRows).toEqual([]);
      expect(coverage.gaps.freeUncoveredRows).toEqual([]);

      expect(scope.missingCurrentClassFamilies).toEqual([]);
      expect(scope.missingCurrentGroups).toEqual([]);
      expect(scope.level1Mix).toMatchObject({
        currentClassPercent: 60,
        previousClassPercent: 40,
        achieversCurrentClassOnly: true
      });

      expect(blueprint.selectionPolicy).toMatchObject({ achieversCurrentClassOnly: true });
      const scienceSection = blueprint.sections.find((section: { selector: string }) => section.selector === 'science_core');
      expect(blueprint.selectionPolicy.currentClassScienceCount + blueprint.selectionPolicy.previousClassScienceCount)
        .toBe(scienceSection.count);
      expect(blueprint.selectionPolicy.currentClassScienceCount * 100).toBe(scienceSection.count * 60);
      expect(blueprint.selectionPolicy.previousClassScienceCount * 100).toBe(scienceSection.count * 40);

      const currentClassHots = questions.filter((question) => {
        const refs: string[] = question.knowledgeRefs ?? [];
        return question.authoring?.source === 'kidsplay-editorial-hots'
          && refs.length > 0
          && refs.every((rowId) => directRows.has(rowId))
          && refs.some((rowId) => rowId.startsWith(`kr.sof${grade}.`));
      });
      expect(currentClassHots.length).toBeGreaterThanOrEqual(achieverSection.count);

      const copiedForeignScience = rawMembership.members
        .map((member: { rowId: string }) => member.rowId)
        .filter((rowId: string) => /^kr\.sof\d+\./.test(rowId) && !rowId.startsWith(`kr.sof${grade}.`));
      expect(copiedForeignScience).toEqual([]);
    });
  }
});
