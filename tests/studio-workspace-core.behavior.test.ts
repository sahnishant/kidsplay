import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('studio workspace admission and runtime-owned persistence', () => {
  it('runs the dependency-free adversarial matrix against the production modules', () => {
    const output = execFileSync(process.execPath, [resolve('scripts/test-studio-workspace.mjs')], { encoding: 'utf8' });
    const result = JSON.parse(output.trim().split('\n').at(-1)!);
    expect(result.status).toBe('passed');
    expect(result.checks).toBe(57);
  });
});
