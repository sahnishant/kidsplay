import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

const script = fileURLToPath(new URL('../scripts/validate-android-beta-evidence.mjs', import.meta.url));
const tempRoots: string[] = [];

function makeTempDir() {
  const root = mkdtempSync(join(tmpdir(), 'kidsplay-beta-evidence-'));
  tempRoots.push(root);
  return root;
}

function baseRecord() {
  return {
    schemaVersion: 1,
    issue: 33,
    release: {
      commitSha: '1'.repeat(40),
      appPackage: 'com.kidsplay.app',
      apk: {
        workflowRunId: 33462320942,
        artifactId: 123456789,
        sha256: '2'.repeat(64)
      }
    },
    tester: {
      name: 'beta-tester',
      testedAt: '2026-09-01'
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

function run(args: string[]) {
  return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
}

function writeRecord(directory: string, name: string, record: unknown) {
  const path = join(directory, name);
  writeFileSync(path, `${JSON.stringify(record, null, 2)}\n`);
  return path;
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('Android real-device beta acceptance evidence', () => {
  it('accepts a complete physical-device suite covering all roles and journeys', () => {
    const directory = makeTempDir();
    const small = baseRecord();
    const large = baseRecord();
    large.device.model = 'Large Physical Tablet';
    large.device.screenPx = { width: 1600, height: 2560 };
    large.device.effectivePortraitCssWidth = 600;
    large.device.coverageRoles = ['large_phone_or_tablet'];
    large.environment.networkDisabledBeforeLaunch = false;
    large.environment.reducedMotionOrAnimationsReduced = false;
    large.environment.rotationExercised = true;
    large.journeys = [{
      id: 'G',
      status: 'pass',
      observations: ['Observed portrait, physical rotation and layout stress directly on the large device.']
    }];

    writeRecord(directory, 'small-phone.json', small);
    writeRecord(directory, 'large-device.json', large);

    const result = run(['--dir', directory, '--require-complete-suite']);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Android beta acceptance suite OK');
  });

  it('rejects emulator evidence even when the rest of the record looks complete', () => {
    const directory = makeTempDir();
    const record = baseRecord();
    record.device.physicalDevice = false;
    const path = writeRecord(directory, 'emulator.json', record);

    const result = run(['--file', path]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('emulator evidence cannot satisfy #33');
  });

  it('rejects an incomplete suite that omits required device roles or journeys', () => {
    const directory = makeTempDir();
    writeRecord(directory, 'small-phone.json', baseRecord());

    const result = run(['--dir', directory, '--require-complete-suite']);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('missing required device coverage role large_phone_or_tablet');
    expect(result.stderr).toContain('journey G has no passing physical-device observation');
  });

  it('rejects unresolved blocker or major defects', () => {
    const directory = makeTempDir();
    const record = baseRecord();
    record.defects = [{
      id: 'B-001',
      severity: 'major',
      journey: 'B',
      reproducibility: 'always',
      status: 'open',
      expected: 'Answer controls remain tappable and readable.',
      actual: 'Primary answer control is clipped on the physical phone.',
      trackingIssue: 999,
      evidenceRefs: ['issue-999-attachment']
    }];
    const path = writeRecord(directory, 'major-open.json', record);

    const result = run(['--file', path]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('unresolved major defect B-001 blocks beta acceptance');
  });
});
