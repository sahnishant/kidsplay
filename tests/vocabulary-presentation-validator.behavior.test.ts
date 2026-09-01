import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('vocabulary presentation permanent scale gate', () => {
  it('validates bounded projection, authority split, import isolation and 24 x 5 determinism', () => {
    const output = execFileSync(process.execPath, ['scripts/validate-vocabulary-presentation.mjs'], {
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    expect(output).toContain('Vocabulary presentation validation passed.');
    expect(output).toContain('deterministic request-order rebuild: yes');
    expect(output).toContain('bounded runtime sense slice:');
    expect(output).toContain('source V1+ strategy records:');
    expect(output).toContain('runtime V3+ semantic senses:');
    expect(output).toContain('runtime V5+ semantic senses:');
    expect(output).toContain('source unresolved senses:');
    expect(output).toContain('source textual-only senses:');
    expect(output).toContain('compact slice payload:');
    expect(output).toContain('maximum requested senses per slice:');
    expect(output).toContain('transitive browser presentation dependencies checked:');
    expect(output).toContain('24 x 5 stress matrix: 120/120 checks passed');
  });
});
