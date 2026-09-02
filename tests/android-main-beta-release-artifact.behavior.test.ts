import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflowPath = resolve('.github/workflows/android-debug.yml');
const workflow = readFileSync(workflowPath, 'utf8').replace(/\r\n?/g, '\n');

describe('Android #33 beta release candidate workflow', () => {
  it('builds Android automatically for pushes to current main as well as kidsplay', () => {
    const pushBlock = workflow.match(/\n  push:\n([\s\S]*?)\n  pull_request:/)?.[1] ?? '';

    expect(pushBlock).toMatch(/branches:\s*\[[^\]]*\bmain\b[^\]]*\]/);
    expect(pushBlock).toMatch(/branches:\s*\[[^\]]*\bkidsplay\b[^\]]*\]/);
  });

  it('publishes one machine-readable APK identity only after packaged smoke succeeds', () => {
    expect(workflow).toContain('id: apk-hash');
    expect(workflow).toContain('sha256sum "$APK_PATH"');
    expect(workflow).toContain('id: upload-debug-apk');
    expect(workflow).toContain('${{ steps.upload-debug-apk.outputs.artifact-id }}');
    expect(workflow).toContain("commitSha = process.env.GITHUB_SHA");
    expect(workflow).toContain('workflowRunId = Number(process.env.GITHUB_RUN_ID)');
    expect(workflow).toContain("appPackage: 'com.kidsplay.app'");
    expect(workflow).toContain('android-beta-release-identity.json');
    expect(workflow).toContain('name: kidsplay-android-beta-release-identity');

    const smoke = workflow.indexOf('- name: Packaged offline relaunch and rotation smoke');
    const hash = workflow.indexOf('- name: Hash debug APK');
    const uploadApk = workflow.indexOf('- name: Upload debug APK');
    const writeIdentity = workflow.indexOf('- name: Write Android beta release identity');
    const uploadIdentity = workflow.indexOf('- name: Upload Android beta release identity');

    expect(smoke).toBeGreaterThanOrEqual(0);
    expect(hash).toBeGreaterThan(smoke);
    expect(uploadApk).toBeGreaterThan(hash);
    expect(writeIdentity).toBeGreaterThan(uploadApk);
    expect(uploadIdentity).toBeGreaterThan(writeIdentity);
  });

  it('keeps release identity separate from human physical-device acceptance evidence', () => {
    expect(workflow).not.toContain('qa/android-beta-acceptance/evidence/');
    expect(workflow).not.toContain('directPhysicalObservation');
  });
});
