import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('vocabulary presentation permanent scale gate', () => {
  it('validates the derived mode contract, bounded runtime slice, authority split and determinism', () => {
    const output = execFileSync(process.execPath, ['scripts/validate-vocabulary-presentation.mjs'], {
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    expect(output).toContain('Vocabulary presentation validation passed.');
    expect(output).toContain('deterministic request-order rebuild: yes');
    expect(output).toContain('bounded runtime sense slice:');
    expect(output).toContain('compact slice payload:');
  });
});
