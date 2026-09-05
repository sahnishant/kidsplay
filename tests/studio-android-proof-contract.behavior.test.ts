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
});
