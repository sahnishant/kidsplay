import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

const script = join(process.cwd(), 'scripts', 'validate-android-beta-release-binding.mjs');
const tempRoots: string[] = [];
const APK_FIXTURE = 'kidsplay exact beta apk fixture';
const APK_SHA256 = createHash('sha256').update(APK_FIXTURE).digest('hex');

function makeTempDir() {
  const root = mkdtempSync(join(tmpdir(), 'kidsplay-beta-release-binding-'));
  tempRoots.push(root);
  return root;
}

function releaseIdentity() {
  return {
    schemaVersion: 1,
    issue: 33,
    release: {
      commitSha: '1'.repeat(40),
      appPackage: 'com.kidsplay.app',
      apk: {
        workflowRunId: 33462320942,
        artifactId: 123456789,
        sha256: APK_SHA256
      }
    }
  };
}

function baseRecord() {
  return {
    schemaVersion: 1,
    issue: 33,
    release: structuredClone(releaseIdentity().release),
    tester: {
      name: 'beta-tester',
      testedAt: '2026-09-02'
    },
    device: {
      manufacturer: 'Example',
      model: 'Physical Phone',
      androidVersion: '15',
      apiLevel: 35,
      physicalDevice: true,
      screenPx: { width: 1080, height: 2400 },
      effectivePortraitCssWidth: 390,
      coverageRoles: ['small_phone', 'low_mid_range', 'offline']
    },
    environment: {
      networkDisabledBeforeLaunch: true,
      reducedMotionOrAnimationsReduced: true,
      reducedMotionSettingSupported: true,
      rotationExercised: false,
      portraitExercised: true
    },
    journeys: ['A', 'B', 'C', 'D', 'E', 'F'].map((id) => ({
      id,
      status: 'pass',
      observations: [`Observed journey ${id} directly on physical hardware.`]
    })),
    defects: [] as Array<Record<string, unknown>>,
    attestation: {
      directPhysicalObservation: true,
      notes: 'Direct physical-device observation; no child personal data stored.'
    }
  };
}

function largeDeviceRecord() {
  const record = baseRecord();
  record.device.model = 'Large Physical Tablet';
  record.device.screenPx = { width: 1600, height: 2560 };
  record.device.effectivePortraitCssWidth = 600;
  record.device.coverageRoles = ['large_phone_or_tablet'];
  record.environment.networkDisabledBeforeLaunch = false;
  record.environment.reducedMotionOrAnimationsReduced = false;
  record.environment.rotationExercised = true;
  record.journeys = [{
    id: 'G',
    status: 'pass',
    observations: ['Observed portrait, physical rotation and layout stress directly on the large device.']
  }];
  return record;
}

function writeJson(directory: string, name: string, value: unknown) {
  const path = join(directory, name);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
  return path;
}

function writeApk(directory: string, contents = APK_FIXTURE) {
  const path = join(directory, 'app-debug.apk');
  writeFileSync(path, contents);
  return path;
}

function run(args: string[]) {
  return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('Android beta workflow release binding', () => {
  it('accepts a complete physical-device suite only when every record and the downloaded APK match the generated identity', () => {
    const directory = makeTempDir();
    writeJson(directory, 'small-phone.json', baseRecord());
    writeJson(directory, 'large-device.json', largeDeviceRecord());
    const identityPath = writeJson(directory, 'release-identity.txt.json', releaseIdentity());
    const apkPath = writeApk(directory);

    const result = run([
      '--dir', directory,
      '--release-identity', identityPath,
      '--apk', apkPath,
      '--require-complete-suite'
    ]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Android beta release binding OK');
  });

  it('rejects a self-consistent evidence suite when it points at a different APK identity', () => {
    const directory = makeTempDir();
    const small = baseRecord();
    const large = largeDeviceRecord();
    small.release.apk.artifactId = 987654321;
    large.release.apk.artifactId = 987654321;
    writeJson(directory, 'small-phone.json', small);
    writeJson(directory, 'large-device.json', large);
    const identityPath = writeJson(directory, 'release-identity.txt.json', releaseIdentity());
    const apkPath = writeApk(directory);

    const result = run([
      '--dir', directory,
      '--release-identity', identityPath,
      '--apk', apkPath,
      '--require-complete-suite'
    ]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('release must exactly match the workflow-generated Android beta release identity');
  });

  it('rejects a downloaded APK whose bytes do not match the generated identity hash', () => {
    const directory = makeTempDir();
    writeJson(directory, 'small-phone.json', baseRecord());
    writeJson(directory, 'large-device.json', largeDeviceRecord());
    const identityPath = writeJson(directory, 'release-identity.txt.json', releaseIdentity());
    const apkPath = writeApk(directory, 'different apk bytes');

    const result = run([
      '--dir', directory,
      '--release-identity', identityPath,
      '--apk', apkPath,
      '--require-complete-suite'
    ]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('downloaded APK SHA-256 does not match the workflow-generated Android beta release identity');
  });

  it('rejects an identity artifact that is not explicitly for issue 33', () => {
    const directory = makeTempDir();
    const recordPath = writeJson(directory, 'phone.json', baseRecord());
    const identity = releaseIdentity();
    identity.issue = 76;
    const identityPath = writeJson(directory, 'release-identity.txt.json', identity);
    const apkPath = writeApk(directory);

    const result = run(['--file', recordPath, '--release-identity', identityPath, '--apk', apkPath]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('issue must be 33');
  });
});
