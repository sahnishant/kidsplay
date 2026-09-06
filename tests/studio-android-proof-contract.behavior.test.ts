import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('packaged studio proof is wired to the existing offline emulator', () => {
  it('runs a separate studio proof after, not instead of, the Stories journey', () => {
    const parent = readFileSync(resolve('qa/android-stories-offline-smoke.sh'), 'utf8');
    const child = readFileSync(resolve('qa/android-studios-offline-smoke.sh'), 'utf8');
    expect(parent).toContain('Packaged Stories airplane-mode process-relaunch proof passed.');
    expect(parent).toContain('source "$(dirname "${BASH_SOURCE[0]}")/android-studios-offline-smoke.sh"');
    expect(child).toContain('adb shell am force-stop "$PACKAGE"');
    expect(child).toContain('test "$studio_first_pid" != "$studio_second_pid"');
    expect(child).toContain('assert_disabled_studio_control "Next step"');
    expect(child).toContain('assert_label "Part 1: Gold"');
    expect(child).toContain('assert_label "Part 2: empty"');
    expect(child).toContain('adb shell input keyevent 4');
    expect(child).toContain('user_rotation 1');
    expect(child).toContain('airplane_mode_on');
    expect(child).not.toContain('localStorage.setItem');
    expect(child).not.toContain('emulator -avd');
  });

  it('requires Home readiness before input and retains diagnostics on a failed launch', () => {
    const child = readFileSync(resolve('qa/android-studios-offline-smoke.sh'), 'utf8').replaceAll('\r\n', '\n');
    const navigation = child.match(/^open_fraction_studio_from_home\(\) \{\n([\s\S]*?)^\}/m)?.[1];
    expect(navigation).toBeDefined();
    const body = navigation!;
    const readiness = body.indexOf('assert_label "Open child navigation" || {');
    const firstInput = body.indexOf('tap_label "Open child navigation"\n');
    expect(readiness).toBeGreaterThanOrEqual(0);
    expect(firstInput).toBeGreaterThan(readiness);
    expect(body.slice(0, readiness)).not.toMatch(/adb shell input|tap_label/);
    expect(body.slice(readiness, firstInput)).toContain('return 1');
    expect(body).toContain('timeout 15s adb logcat');
    expect(body).toContain('timeout 15s adb shell dumpsys activity lastanr');
    expect(body).toContain('timeout 15s adb shell dumpsys input');
    expect(body).not.toMatch(/aerr_wait|aerr_close|launch_app|am force-stop/);
    expect(child.match(/^open_fraction_studio_from_home$/gm)).toHaveLength(2);
  });
});
